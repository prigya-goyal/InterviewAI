const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const User = require('../models/User');
const { runAgainstTestCases } = require('../services/judge0Service');
const { explainSubmission } = require('../services/openaiService');
const { xpForDifficulty, levelForXp } = require('../utils/xp');
const { awardBadgesAndAchievements } = require('../services/gamificationService');
const { recomputeParticipantScore } = require('./contestController');

// GET /api/problems?difficulty=Easy&tags=Array,DP&search=two+sum&page=1&limit=20
const listProblems = asyncHandler(async (req, res) => {
  const { difficulty, tags, search, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (difficulty) filter.difficulty = difficulty;
  if (tags) filter.tags = { $in: tags.split(',') };
  if (search) filter.$text = { $search: search };

  const problems = await Problem.find(filter)
    .select('title slug difficulty tags stats isDailyChallenge isWeeklyChallenge')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Problem.countDocuments(filter);

  res.json({ success: true, problems, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// GET /api/problems/:slug
const getProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.findOne({ slug: req.params.slug }).populate('companies', 'name slug logoUrl');
  if (!problem) throw new ApiError(404, 'Problem not found.');

  // Only expose visible test cases to the client; hidden ones stay server-side.
  const safeProblem = problem.toObject();
  safeProblem.testCases = problem.testCases.filter((tc) => !tc.isHidden);

  // Attach the requester's saved note/bookmark state if authenticated.
  if (req.user) {
    safeProblem.isBookmarked = req.user.bookmarkedProblems.some((id) => id.toString() === problem._id.toString());
    safeProblem.myNote = req.user.notes.find((n) => n.problem.toString() === problem._id.toString())?.content || '';

    req.user.recentlyViewed = [problem._id, ...req.user.recentlyViewed.filter((id) => id.toString() !== problem._id.toString())].slice(0, 20);
    await req.user.save();
  }

  res.json({ success: true, problem: safeProblem });
});

// POST /api/problems/:slug/run   { language, code }
// Executes against VISIBLE test cases only — used by the "Run Code" button.
const runProblemCode = asyncHandler(async (req, res) => {
  const problem = await Problem.findOne({ slug: req.params.slug });
  if (!problem) throw new ApiError(404, 'Problem not found.');

  const { language, code } = req.body;
  const visibleCases = problem.testCases.filter((tc) => !tc.isHidden);

  const result = await runAgainstTestCases({ language, code, testCases: visibleCases, slug: problem.slug });
  res.json({ success: true, mode: 'run', ...result });
});

// POST /api/problems/:slug/submit   { language, code }
// Executes against ALL test cases, persists a Submission, and updates XP/streak.
const submitProblemCode = asyncHandler(async (req, res) => {
  const problem = await Problem.findOne({ slug: req.params.slug });
  if (!problem) throw new ApiError(404, 'Problem not found.');

  const { language, code, contestId } = req.body;
  const result = await runAgainstTestCases({ language, code, testCases: problem.testCases, slug: problem.slug });

  const submission = await Submission.create({
    user: req.user._id,
    problem: problem._id,
    language,
    code,
    mode: 'submit',
    status: result.overallStatus,
    runtimeMs: result.runtimeMs,
    testResults: result.results,
  });

  // Update problem stats
  problem.stats.totalSubmissions += 1;
  if (result.overallStatus === 'Accepted') problem.stats.acceptedSubmissions += 1;
  problem.recomputeAcceptanceRate();
  await problem.save();

  let unlocked = { unlockedBadges: [], unlockedAchievements: [] };

  // Update user XP / streak / problemsSolved on first-ever acceptance of this problem
  if (result.overallStatus === 'Accepted') {
    const alreadySolved = await Submission.exists({
      user: req.user._id,
      problem: problem._id,
      status: 'Accepted',
      _id: { $ne: submission._id },
    });

    const user = req.user;
    if (!alreadySolved) {
      user.problemsSolved += 1;
      user.xp += xpForDifficulty(problem.difficulty);
      user.level = levelForXp(user.xp);
    }

    const today = new Date().toDateString();
    const lastActive = user.streak.lastActiveDate ? new Date(user.streak.lastActiveDate).toDateString() : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (lastActive !== today) {
      user.streak.current = lastActive === yesterday ? user.streak.current + 1 : 1;
      user.streak.longest = Math.max(user.streak.longest, user.streak.current);
      user.streak.lastActiveDate = new Date();
    }

    await user.save();

    // Recompute badges and achievements
    unlocked = await awardBadgesAndAchievements(user._id);
  }

  // If this submission is part of a contest, recompute contest stats
  if (contestId) {
    await recomputeParticipantScore({ contestId, userId: req.user._id });
  }

  res.json({ success: true, mode: 'submit', submission, unlocked, ...result });
});

// GET /api/problems/:slug/submissions  — the requesting user's submission history for a problem
const getMySubmissions = asyncHandler(async (req, res) => {
  const problem = await Problem.findOne({ slug: req.params.slug });
  if (!problem) throw new ApiError(404, 'Problem not found.');

  const submissions = await Submission.find({ user: req.user._id, problem: problem._id }).sort('-createdAt');
  res.json({ success: true, submissions });
});

// POST /api/problems/:slug/explain/:submissionId — AI explanation of a submission
const explainMySubmission = asyncHandler(async (req, res) => {
  const problem = await Problem.findOne({ slug: req.params.slug });
  const submission = await Submission.findOne({ _id: req.params.submissionId, user: req.user._id });
  if (!problem || !submission) throw new ApiError(404, 'Not found.');

  const explanation = await explainSubmission({
    problemStatement: problem.statement,
    code: submission.code,
    language: submission.language,
    status: submission.status,
  });

  res.json({ success: true, explanation });
});

module.exports = {
  listProblems,
  getProblem,
  runProblemCode,
  submitProblemCode,
  getMySubmissions,
  explainMySubmission,
};
