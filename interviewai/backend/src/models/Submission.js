const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },

    language: {
      type: String,
      enum: ['cpp', 'java', 'python', 'javascript'],
      required: true,
    },
    code: { type: String, required: true },

    mode: { type: String, enum: ['run', 'submit'], default: 'submit' },

    status: {
      type: String,
      enum: [
        'Pending',
        'Accepted',
        'Wrong Answer',
        'Time Limit Exceeded',
        'Memory Limit Exceeded',
        'Runtime Error',
        'Compilation Error',
      ],
      default: 'Pending',
    },

    runtimeMs: { type: Number, default: null },
    memoryKb: { type: Number, default: null },

    // Per-test-case results returned from Judge0
    testResults: [
      {
        passed: Boolean,
        input: String,
        expectedOutput: String,
        actualOutput: String,
        stderr: String,
        runtimeMs: Number,
      },
    ],

    judge0Tokens: [{ type: String }], // raw Judge0 submission tokens for traceability
  },
  { timestamps: true }
);

SubmissionSchema.index({ user: 1, problem: 1, createdAt: -1 });

module.exports = mongoose.model('Submission', SubmissionSchema);
