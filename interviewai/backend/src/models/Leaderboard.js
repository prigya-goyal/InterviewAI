const mongoose = require('mongoose');

// A denormalized, periodically-recomputed ranking table so leaderboard reads
// don't require aggregating the full Users collection on every request.
const LeaderboardEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scope: { type: String, enum: ['global', 'college', 'friends'], default: 'global', index: true },
    scopeKey: { type: String, default: null }, // e.g. college name, used when scope === 'college'

    rank: { type: Number, required: true },
    xp: { type: Number, required: true },
    problemsSolved: { type: Number, required: true },

    period: { type: String, enum: ['all_time', 'monthly', 'weekly'], default: 'all_time' },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

LeaderboardEntrySchema.index({ scope: 1, scopeKey: 1, period: 1, rank: 1 });

module.exports = mongoose.model('Leaderboard', LeaderboardEntrySchema);
