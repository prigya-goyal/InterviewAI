const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      minlength: 8,
      select: false, // never returned by default
      required: function () {
        // Not required for OAuth (Google) accounts
        return this.authProvider === 'local';
      },
    },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, select: false },

    avatar: { type: String, default: '' },
    bio: { type: String, maxlength: 300, default: '' },
    college: { type: String, default: '' },
    skills: [{ type: String }],

    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // Gamification
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActiveDate: { type: Date, default: null },
    },
    badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
    achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' }],

    // Progress
    problemsSolved: { type: Number, default: 0 },
    bookmarkedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
    notes: [
      {
        problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' },
        content: { type: String, maxlength: 5000 },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    recentlyViewed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],

    resume: {
      fileUrl: { type: String, default: '' },
      extractedSkills: [{ type: String }],
      missingSkills: [{ type: String }],
      recommendedTopics: [{ type: String }],
      analyzedAt: { type: Date },
    },

    // Auth flow helpers
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ xp: -1 });

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

// Strip sensitive fields whenever a user doc is serialized
UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.emailVerificationToken;
  delete obj.googleId;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
