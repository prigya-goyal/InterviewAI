const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    logoUrl: { type: String, default: '' },
    description: { type: String, default: '' },

    frequentProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],

    hrQuestions: [
      {
        question: { type: String, required: true },
        category: { type: String, default: 'general' }, // e.g. behavioral, leadership
      },
    ],

    systemDesignQuestions: [
      {
        question: { type: String, required: true },
        difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
      },
    ],

    difficultyProfile: {
      easyPct: { type: Number, default: 30 },
      mediumPct: { type: Number, default: 50 },
      hardPct: { type: Number, default: 20 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', CompanySchema);
