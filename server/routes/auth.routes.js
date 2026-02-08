const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controllers')
const { protect } = require('../middleware/auth.middleware')

router.post('/send-otp', authController.sendOTP)
router.post('/register', authController.register)
router.post('/login', authController.login)
router.put('/profile', protect(['student', 'organizer', 'admin']), authController.updateProfile)
router.put('/password', protect(['student', 'organizer', 'admin']), authController.updatePassword)

module.exports = router;
