const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth.middleware');

// Protected route for AI chat interaction (accessible by student, organizer, admin)
router.post('/chat', protect(['student', 'organizer', 'admin']), chatWithAI);

module.exports = router;
