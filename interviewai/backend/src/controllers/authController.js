const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');
const { GOOGLE_CLIENT_ID, JWT_COOKIE_EXPIRES_DAYS, NODE_ENV, CLIENT_URL } = require('../config/env');
const { sendEmail } = require('../utils/mailer');

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function sendAuthResponse(res, user, statusCode = 200) {
  const token = generateToken(user._id);

  res.cookie('token', token, {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(Date.now() + JWT_COOKIE_EXPIRES_DAYS * 24 * 60 * 60 * 1000),
  });

  res.status(statusCode).json({
    success: true,
    token, // also returned in body for clients that prefer Authorization headers (e.g. mobile)
    user: user.toSafeObject(),
  });
}

// POST /api/auth/signup
const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  const isFirstUser = (await User.countDocuments()) === 0;
  const user = await User.create({
    name,
    email,
    password,
    authProvider: 'local',
    role: isFirstUser ? 'admin' : 'user',
  });
  sendAuthResponse(res, user, 201);
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  sendAuthResponse(res, user);
});

// POST /api/auth/google
const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) throw new ApiError(400, 'Missing Google idToken.');

  const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();

  let user = await User.findOne({ email: payload.email });

  if (!user) {
    user = await User.create({
      name: payload.name,
      email: payload.email,
      avatar: payload.picture,
      authProvider: 'google',
      googleId: payload.sub,
      isEmailVerified: true,
    });
  }

  sendAuthResponse(res, user);
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond success to avoid leaking which emails are registered.
  if (!user) {
    return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  await user.save({ validateBeforeSave: false });

  // Send resetToken via mailer service
  const resetLink = `${CLIENT_URL}/reset-password/${resetToken}`;
  console.log(`[auth] Password reset token for ${email}: ${resetToken}`);
  await sendEmail({
    to: email,
    subject: 'InterviewAI - Password Reset Request',
    text: `You are receiving this email because you (or someone else) requested a password reset. Please click on the following link or paste it into your browser to complete the process:\n\n${resetLink}\n\nThis link is valid for 30 minutes.\n\nIf you did not request this, please ignore this email.`,
    html: `<p>You are receiving this email because you (or someone else) requested a password reset.</p>
           <p>Please click on the link below to complete the process:</p>
           <p><a href="${resetLink}" target="_blank">${resetLink}</a></p>
           <p>This link is valid for 30 minutes.</p>
           <p>If you did not request this, please ignore this email.</p>`
  });

  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

// POST /api/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) throw new ApiError(400, 'Reset token is invalid or has expired.');

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendAuthResponse(res, user);
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out.' });
});

module.exports = { signup, login, googleLogin, forgotPassword, resetPassword, getMe, logout };
