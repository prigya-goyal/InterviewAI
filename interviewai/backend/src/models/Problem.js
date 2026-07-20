const mongoose = require('mongoose');

const ExampleSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const TestCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: true }, // hidden test cases used for Submit, visible ones for Run
  },
  { _id: false }
);

const ProblemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    tags: [{ type: String, index: true }], // e.g. "Array", "DP", "Graph"
    companies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }],

    statement: { type: String, required: true }, // markdown
    constraints: [{ type: String }],
    examples: [ExampleSchema],
    hints: [{ type: String }],
    editorial: { type: String, default: '' }, // markdown, optional

    starterCode: {
      cpp: { type: String, default: '' },
      java: { type: String, default: '' },
      python: { type: String, default: '' },
      javascript: { type: String, default: '' },
    },

    testCases: [TestCaseSchema],

    // For AI recommendation + roadmap features
    conceptTags: [{ type: String }], // e.g. "two-pointers", "sliding-window"

    stats: {
      totalSubmissions: { type: Number, default: 0 },
      acceptedSubmissions: { type: Number, default: 0 },
      acceptanceRate: { type: Number, default: 0 }, // recomputed on write
    },

    isDailyChallenge: { type: Boolean, default: false },
    isWeeklyChallenge: { type: Boolean, default: false },
    scheduledFor: { type: Date }, // for daily/weekly challenge scheduling

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ProblemSchema.index({ title: 'text', tags: 1, difficulty: 1 });

ProblemSchema.methods.recomputeAcceptanceRate = function () {
  const { totalSubmissions, acceptedSubmissions } = this.stats;
  this.stats.acceptanceRate = totalSubmissions === 0 ? 0 : Number(((acceptedSubmissions / totalSubmissions) * 100).toFixed(2));
};

module.exports = mongoose.model('Problem', ProblemSchema);
