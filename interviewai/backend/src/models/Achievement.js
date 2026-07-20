const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // e.g. "first_blood", "century_solver"
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: '' },
    xpReward: { type: Number, default: 0 },
    criteria: {
      type: { type: String, enum: ['problems_solved', 'streak', 'contest_rank', 'interviews_completed'], required: true },
      threshold: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Achievement', AchievementSchema);
