const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const {
  getProfile,
  updateProfile,
  getDashboard,
  toggleBookmark,
  upsertNote,
  uploadResume,
} = require('../controllers/userController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Extracts text from the uploaded PDF before it reaches the controller,
// so uploadResume only ever deals with plain text.
const extractResumeText = asyncHandler(async (req, res, next) => {
  if (req.file) {
    const parsed = await pdfParse(req.file.buffer);
    req.resumeText = parsed.text;
  }
  next();
});

router.get('/me/dashboard', protect, getDashboard);
router.patch('/me', protect, updateProfile);
router.post('/me/resume', protect, upload.single('resume'), extractResumeText, uploadResume);
router.post('/me/bookmarks/:problemId', protect, toggleBookmark);
router.put('/me/notes/:problemId', protect, upsertNote);

router.get('/:id/profile', getProfile);

module.exports = router;
