const express = require('express');
const router = express.Router();

const { registerForEvent, getMyRegistrations, getRegistrationsByEvent } = require('../controllers/regis.controller');
const { cancelRegistration } = require('../controllers/regis.controller');
const { protect } = require('../middleware/auth.middleware');


router.post('/register/:eventId', protect(['student']), registerForEvent);
router.get('/my-registrations', protect(['student']), getMyRegistrations);
router.get('/event/:eventId', protect(['organizer', 'admin']), getRegistrationsByEvent);
router.delete('/cancel/:registrationId', protect(['student']), cancelRegistration);

module.exports = router;