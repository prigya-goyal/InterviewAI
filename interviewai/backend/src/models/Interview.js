const mongoose = require('mongoose');

const TranscriptEntrySchema = new mongoose.Schema(
  {
    speaker: { type: String, enum: ['ai', 'user'], required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['intro', 'question', 'followup', 'hint', 'answer', 'code', 'feedback', 'closing'],
      default: 'question',
    },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const InterviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    type: { type: String, enum: ['dsa', 'hr', 'system_design'], default: 'dsa' },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },

    status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' },

    problems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
    transcript: [TranscriptEntrySchema],

    // Voice mode
    usedVoice: { type: Boolean, default: false },

    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },

    // Final evaluation, populated by the AI at interview end
    evaluation: {
      overallScore: { type: Number, min: 0, max: 100 },
      communicationScore: { type: Number, min: 0, max: 100 },
      codingScore: { type: Number, min: 0, max: 100 },
      problemSolvingScore: { type: Number, min: 0, max: 100 },
      timeManagementScore: { type: Number, min: 0, max: 100 },
      confidenceScore: { type: Number, min: 0, max: 100 },
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      improvementSuggestions: [{ type: String }],
    },
  },
  { timestamps: true }
);

InterviewSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Interview', InterviewSchema);
