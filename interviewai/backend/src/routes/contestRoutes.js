const express = require('express');
const { protect, requireRole } = require('../middleware/auth');
const {
  listContests,
  getContest,
  registerForContest,
  getContestLeaderboard,
  createContest,
} = require('../controllers/contestController');

const router = express.Router();

router.get('/', listContests);
router.get('/:slug', getContest);
router.get('/:slug/leaderboard', getContestLeaderboard);
router.post('/:slug/register', protect, registerForContest);
router.post('/', protect, requireRole('admin'), createContest);

module.exports = router;
