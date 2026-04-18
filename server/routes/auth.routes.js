const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/auth.controllers')
const { protect } = require('../middleware/auth.middleware')

router.post('/send-otp', authController.sendOTP)
router.post('/register', authController.register)
router.post('/login', authController.login)
router.put('/profile', protect(['student', 'organizer', 'admin']), authController.updateProfile)
router.put('/password', protect(['student', 'organizer', 'admin']), authController.updatePassword)

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_auth_failed`,
        session: false
    }),
    authController.googleCallback
);

// Complete profile route (for Google OAuth users to select role & college)
router.put('/complete-profile', protect(['student', 'organizer', 'admin']), authController.completeProfile)

module.exports = router;
