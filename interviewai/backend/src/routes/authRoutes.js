const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  signup,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
} = require('../controllers/authController');

const router = express.Router();

router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  signup
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  login
);

router.post('/google', googleLogin);

router.post('/forgot-password', [body('email').isEmail()], validate, forgotPassword);
router.post(
  '/reset-password/:token',
  [body('password').isLength({ min: 8 })],
  validate,
  resetPassword
);

router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
