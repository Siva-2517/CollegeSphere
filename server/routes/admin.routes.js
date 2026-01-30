const express = require('express')
const router = express.Router()

const {getStats} = require('../controllers/stat.controller')
const {
    getPendingOrganizers,
    getApprovedOrganizers,
    approveOrganizer,
    rejectOrganizer,
    getPendingEvents,
    getApprovedEvents,
    approveEvent,
    rejectEvent,
    deleteEvent
} = require('../controllers/admin.controller')
const {protect}=require('../middleware/auth.middleware')

// Stats
router.get('/stats', protect(['admin']), getStats);

// Organizers
router.get('/organizers/pending', protect(['admin']), getPendingOrganizers);
router.get('/organizers/approved', protect(['admin']), getApprovedOrganizers);
router.put('/organizers/:organizerId/approve', protect(['admin']), approveOrganizer);
router.put('/organizers/:organizerId/reject', protect(['admin']), rejectOrganizer);

// Events
router.get('/events/pending', protect(['admin']), getPendingEvents);
router.get('/events/approved', protect(['admin']), getApprovedEvents);
router.put('/events/:eventId/approve', protect(['admin']), approveEvent);
router.put('/events/:eventId/reject', protect(['admin']), rejectEvent);
router.delete('/events/:eventId', protect(['admin']), deleteEvent);

module.exports = router;