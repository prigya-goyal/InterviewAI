const asyncHandler = require('../utils/asyncHandler');
const Submission = require('../models/Submission');
const { generateRoadmap, recommendNextProblems } = require('../services/openaiService');

// POST /api/ai/roadmap   { year, targetCompany, monthsRemaining }
const getRoadmap = asyncHandler(async (req, res) => {
  const { year, targetCompany, monthsRemaining } = req.body;
  const milestones = await generateRoadmap({ year, targetCompany, monthsRemaining });
  res.json({ success: true, milestones });
});

// GET /api/ai/recommendations
const getRecommendations = asyncHandler(async (req, res) => {
  const recentSubmissions = await Submission.find({ user: req.user._id })
    .sort('-createdAt')
    .limit(20)
    .populate('problem', 'title tags difficulty');

  // Derive weak topics: tags that show up disproportionately in non-Accepted submissions.
  const tagFailures = {};
  recentSubmissions.forEach((s) => {
    if (s.status !== 'Accepted') {
      (s.problem?.tags || []).forEach((tag) => {
        tagFailures[tag] = (tagFailures[tag] || 0) + 1;
      });
    }
  });
  const weakTopics = Object.entries(tagFailures)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  const recommendations = await recommendNextProblems({
    recentSubmissions: recentSubmissions.map((s) => ({
      problem: s.problem?.title,
      difficulty: s.problem?.difficulty,
      status: s.status,
    })),
    weakTopics,
    targetCompany: req.query.targetCompany || null,
  });

  res.json({ success: true, weakTopics, recommendations });
});

module.exports = { getRoadmap, getRecommendations };
