const express = require('express');
const router = express.Router();

const { createEvent, getAllEvents, getEventsByCollege, updateEvent, deleteEvent } = require('../controllers/event.controllers');
const { getMyEvents } = require('../controllers/event.controllers');
const { protect } = require('../middleware/auth.middleware');

router.post('/create', protect(['admin', 'organizer']), createEvent);
router.put('/:eventId', protect(['admin', 'organizer']), updateEvent);
router.delete('/:eventId', protect(['admin', 'organizer']), deleteEvent);

router.get('/AllEvents', getAllEvents);
router.get('/my-events', protect(['organizer']), getMyEvents);

router.get('/college/:collegeId', getEventsByCollege);
module.exports = router;