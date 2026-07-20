const mongoose = require('mongoose');

const ContestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },

    problems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],

    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },

    isVirtual: { type: Boolean, default: false }, // virtual contests can be taken any time after endTime

    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        score: { type: Number, default: 0 },
        problemsSolved: { type: Number, default: 0 },
        finishTime: { type: Date },
        penaltyMinutes: { type: Number, default: 0 },
      },
    ],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ContestSchema.virtual('status').get(function () {
  const now = new Date();
  if (now < this.startTime) return 'upcoming';
  if (now >= this.startTime && now <= this.endTime) return 'live';
  return 'ended';
});
ContestSchema.set('toJSON', { virtuals: true });
ContestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Contest', ContestSchema);
