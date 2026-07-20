const User = require('../models/User');
const Badge = require('../models/Badge');
const Achievement = require('../models/Achievement');
const Interview = require('../models/Interview');
const { levelForXp } = require('../utils/xp');

/**
 * Checks all locked badges and achievements for a user.
 * If they meet the criteria, awards them, adds the XP reward,
 * re-evaluates the user's level, and persists the updates.
 *
 * @param {string} userId - The database ID of the user.
 * @returns {Promise<{unlockedBadges: Array, unlockedAchievements: Array}>} Newly unlocked rewards.
 */
async function awardBadgesAndAchievements(userId) {
  const user = await User.findById(userId)
    .populate('badges')
    .populate('achievements');

  if (!user) {
    return { unlockedBadges: [], unlockedAchievements: [] };
  }

  // Fetch all available badges/achievements and the user's total completed interviews
  const [allBadges, allAchievements, interviewsCount] = await Promise.all([
    Badge.find(),
    Achievement.find(),
    Interview.countDocuments({ user: userId, status: 'completed' }),
  ]);

  const unlockedBadges = [];
  const unlockedAchievements = [];

  const existingBadgeKeys = new Set(user.badges.map((b) => b.key));
  const existingAchKeys = new Set(user.achievements.map((a) => a.key));

  // 1. Evaluate Badges
  for (const badge of allBadges) {
    if (existingBadgeKeys.has(badge.key)) continue;

    let qualifies = false;
    if (badge.key === 'first_solve' && user.problemsSolved >= 1) {
      qualifies = true;
    } else if (badge.key === 'streak_7' && user.streak.current >= 7) {
      qualifies = true;
    } else if (badge.key === 'century' && user.problemsSolved >= 100) {
      qualifies = true;
    }

    if (qualifies) {
      user.badges.push(badge._id);
      unlockedBadges.push(badge);
    }
  }

  // 2. Evaluate Achievements
  for (const ach of allAchievements) {
    if (existingAchKeys.has(ach.key)) continue;

    let qualifies = false;
    const { type, threshold } = ach.criteria;

    if (type === 'problems_solved' && user.problemsSolved >= threshold) {
      qualifies = true;
    } else if (type === 'streak' && user.streak.current >= threshold) {
      qualifies = true;
    } else if (type === 'interviews_completed' && interviewsCount >= threshold) {
      qualifies = true;
    }

    if (qualifies) {
      user.achievements.push(ach._id);
      user.xp += ach.xpReward;
      user.level = levelForXp(user.xp);
      unlockedAchievements.push(ach);
    }
  }

  // Save changes if anything was unlocked
  if (unlockedBadges.length > 0 || unlockedAchievements.length > 0) {
    await user.save();
  }

  return { unlockedBadges, unlockedAchievements };
}

module.exports = { awardBadgesAndAchievements };
