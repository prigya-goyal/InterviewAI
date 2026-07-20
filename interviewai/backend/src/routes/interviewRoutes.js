const express = require('express');
const { protect } = require('../middleware/auth');
const {
  startInterview,
  postMessage,
  endInterview,
  listMyInterviews,
  getInterview,
} = require('../controllers/interviewController');

const router = express.Router();

router.use(protect);
router.get('/', listMyInterviews);
router.post('/start', startInterview);
router.get('/:id', getInterview);
router.post('/:id/message', postMessage);
router.post('/:id/end', endInterview);

module.exports = router;
