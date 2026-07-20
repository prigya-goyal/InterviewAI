const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Interview = require('../models/Interview');
const { analyzeResume } = require('../services/openaiService');

// GET /api/users/:id/profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('badges')
    .populate('achievements');
  if (!user) throw new ApiError(404, 'User not found.');
  res.json({ success: true, user: user.toSafeObject() });
});

// PATCH /api/users/me
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'bio', 'avatar', 'college', 'skills'];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, user: user.toSafeObject() });
});

// GET /api/users/me/dashboard
// Aggregates everything the Dashboard page needs in one call.
const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [totalInterviews, recentInterviews, submissionStats, weeklyActivity] = await Promise.all([
    Interview.countDocuments({ user: userId, status: 'completed' }),
    Interview.find({ user: userId }).sort('-createdAt').limit(5).populate('problems', 'title difficulty'),
    Submission.aggregate([
      { $match: { user: userId, mode: 'submit' } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Submission.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          submissions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const accepted = submissionStats.find((s) => s._id === 'Accepted')?.count || 0;
  const totalJudged = submissionStats.reduce((sum, s) => sum + s.count, 0);
  const accuracy = totalJudged === 0 ? 0 : Number(((accepted / totalJudged) * 100).toFixed(1));

  res.json({
    success: true,
    dashboard: {
      totalInterviews,
      problemsSolved: req.user.problemsSolved,
      accuracy,
      streak: req.user.streak,
      weeklyActivity, // feeds the Recharts weekly progress chart
      recentInterviews,
      xp: req.user.xp,
      level: req.user.level,
    },
  });
});

// POST /api/users/me/bookmarks/:problemId
const toggleBookmark = asyncHandler(async (req, res) => {
  const { problemId } = req.params;
  const user = req.user;
  const idx = user.bookmarkedProblems.findIndex((id) => id.toString() === problemId);

  if (idx >= 0) user.bookmarkedProblems.splice(idx, 1);
  else user.bookmarkedProblems.push(problemId);

  await user.save();
  res.json({ success: true, bookmarked: idx < 0, bookmarkedProblems: user.bookmarkedProblems });
});

// PUT /api/users/me/notes/:problemId
const upsertNote = asyncHandler(async (req, res) => {
  const { problemId } = req.params;
  const { content } = req.body;
  const user = req.user;

  const existing = user.notes.find((n) => n.problem.toString() === problemId);
  if (existing) {
    existing.content = content;
    existing.updatedAt = new Date();
  } else {
    user.notes.push({ problem: problemId, content });
  }

  await user.save();
  res.json({ success: true, notes: user.notes });
});

// POST /api/users/me/resume  (multipart file upload, parsed upstream by multer + pdf-parse)
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No resume file uploaded.');

  // req.resumeText is expected to be set by an upstream middleware that runs
  // pdf-parse on req.file.buffer (see routes/userRoutes.js for wiring).
  const analysis = await analyzeResume({
    resumeText: req.resumeText,
    targetCompany: req.body.targetCompany || null,
  });

  req.user.resume = {
    fileUrl: `/uploads/resumes/${req.file.filename || 'resume.pdf'}`,
    extractedSkills: analysis.extractedSkills,
    missingSkills: analysis.missingSkills,
    recommendedTopics: analysis.recommendedTopics,
    analyzedAt: new Date(),
  };
  await req.user.save();

  res.json({ success: true, resume: req.user.resume, suggestedQuestions: analysis.suggestedQuestions });
});

module.exports = { getProfile, updateProfile, getDashboard, toggleBookmark, upsertNote, uploadResume };
