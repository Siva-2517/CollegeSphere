const express = require('express');
const router = express.Router();
const {
  getSystemOverviewStats,
  getAllUsers,
  updateUserRole,
  createCollege,
  toggleCollegeVerification,
  deleteCollege,
  getSoftDeletedEvents,
  restoreEvent,
  permanentDeleteEvent
} = require('../controllers/superadmin.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes are strictly protected for superadmin role
router.use(protect(['superadmin']));

// System Stats
router.get('/stats', getSystemOverviewStats);

// User & Role Management
router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);

// College Management
router.post('/colleges', createCollege);
router.put('/colleges/:collegeId/verify', toggleCollegeVerification);
router.delete('/colleges/:collegeId', deleteCollege);

// Trash Bin (Soft-Deleted Events Management)
router.get('/events/deleted', getSoftDeletedEvents);
router.put('/events/:eventId/restore', restoreEvent);
router.delete('/events/:eventId/permanent', permanentDeleteEvent);

module.exports = router;

