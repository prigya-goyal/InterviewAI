const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

// GET /api/leaderboard?scope=global|college|friends&limit=50
const getLeaderboard = asyncHandler(async (req, res) => {
  const { scope = 'global', limit = 50 } = req.query;
  const user = req.user;

  let filter = { isActive: true };

  if (scope === 'college') {
    filter.college = user.college;
  } else if (scope === 'friends') {
    // Simplified "friends" = users the current user follows; extend User model
    // with a `following` array if you want a real social graph.
    filter._id = { $in: user.following || [] };
  }

  const users = await User.find(filter)
    .select('name avatar college xp level problemsSolved streak')
    .sort('-xp')
    .limit(Number(limit));

  const ranked = users.map((u, i) => ({ rank: i + 1, ...u.toObject() }));

  res.json({ success: true, scope, leaderboard: ranked });
});

module.exports = { getLeaderboard };
