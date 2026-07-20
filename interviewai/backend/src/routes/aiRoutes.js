const express = require('express');
const { protect } = require('../middleware/auth');
const { getRoadmap, getRecommendations } = require('../controllers/aiController');

const router = express.Router();

router.use(protect);
router.post('/roadmap', getRoadmap);
router.get('/recommendations', getRecommendations);

module.exports = router;
