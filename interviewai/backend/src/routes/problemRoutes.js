const express = require('express');
const { protect } = require('../middleware/auth');
const {
  listProblems,
  getProblem,
  runProblemCode,
  submitProblemCode,
  getMySubmissions,
  explainMySubmission,
} = require('../controllers/problemController');

const router = express.Router();

// Optional-auth wrapper: attaches req.user if a valid token is present,
// but doesn't reject the request otherwise (problem browsing is public).
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization?.startsWith('Bearer ') || req.cookies?.token) {
    return protect(req, res, next);
  }
  next();
};

router.get('/', listProblems);
router.get('/:slug', optionalAuth, getProblem);
router.post('/:slug/run', protect, runProblemCode);
router.post('/:slug/submit', protect, submitProblemCode);
router.get('/:slug/submissions', protect, getMySubmissions);
router.post('/:slug/explain/:submissionId', protect, explainMySubmission);

module.exports = router;
