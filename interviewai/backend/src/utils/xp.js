// Shared XP / leveling rules used by problem submissions, interviews, and contests.
const XP_TABLE = { Easy: 10, Medium: 25, Hard: 50 };

function xpForDifficulty(difficulty) {
  return XP_TABLE[difficulty] ?? 10;
}

// Simple curve: level N requires N * 100 cumulative XP.
function levelForXp(xp) {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

module.exports = { xpForDifficulty, levelForXp };
