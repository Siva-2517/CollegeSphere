const User = require('../models/User');
const College = require('../models/College');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const mongoose = require('mongoose');

// @desc    Get system-wide health and metric overview for Super Admin
// @route   GET /api/superadmin/stats
// @access  Private (superadmin)
exports.getSystemOverviewStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalOrganizers = await User.countDocuments({ role: 'organizer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const pendingOrganizers = await User.countDocuments({ role: 'organizer', isApproved: false });

    const totalColleges = await College.countDocuments();
    const totalEvents = await Event.countDocuments({ isDeleted: { $ne: true } });
    const approvedEvents = await Event.countDocuments({ isApproved: true, isDeleted: { $ne: true } });
    const pendingEvents = await Event.countDocuments({ isApproved: false, isDeleted: { $ne: true } });
    const totalRegistrations = await Registration.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          students: totalStudents,
          organizers: totalOrganizers,
          admins: totalAdmins,
          pendingOrganizers
        },
        colleges: {
          total: totalColleges
        },
        events: {
          total: totalEvents,
          approved: approvedEvents,
          pending: pendingEvents
        },
        registrations: {
          total: totalRegistrations
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching system stats', error: error.message });
  }
};

// @desc    Get all users across the system with role filtering
// @route   GET /api/superadmin/users
// @access  Private (superadmin)
exports.getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};

    if (role && ['student', 'organizer', 'admin', 'superadmin'].includes(role)) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const users = await User.find(filter)
      .populate('collegeId', 'name location')
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching system users', error: error.message });
  }
};

// @desc    Update a user's role or college assignment (Super Admin Power)
// @route   PUT /api/superadmin/users/:userId/role
// @access  Private (superadmin)
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, collegeId, isApproved } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const allowedRoles = ['student', 'organizer', 'admin', 'superadmin'];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (role) user.role = role;
    if (collegeId !== undefined) user.collegeId = collegeId || null;
    if (isApproved !== undefined) user.isApproved = isApproved;

    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} updated successfully to role "${user.role}"`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        collegeId: user.collegeId
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user role', error: error.message });
  }
};

// @desc    Create a new college institution
// @route   POST /api/superadmin/colleges
// @access  Private (superadmin)
exports.createCollege = async (req, res) => {
  try {
    const { name, location, emailDomain, isVerified } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'College name is required' });
    }

    const existing = await College.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'College with this name already exists' });
    }

    const college = await College.create({
      name: name.trim(),
      location: location || '',
      emailDomain: emailDomain || '',
      isVerified: isVerified !== undefined ? isVerified : true
    });

    res.status(201).json({
      success: true,
      message: 'College institution created successfully',
      college
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating college', error: error.message });
  }
};

// @desc    Verify or toggle college status
// @route   PUT /api/superadmin/colleges/:collegeId/verify
// @access  Private (superadmin)
exports.toggleCollegeVerification = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const { isVerified } = req.body;

    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
      return res.status(400).json({ success: false, message: 'Invalid college ID' });
    }

    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    college.isVerified = isVerified !== undefined ? isVerified : !college.isVerified;
    await college.save();

    res.status(200).json({
      success: true,
      message: `College "${college.name}" verification set to ${college.isVerified}`,
      college
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error verifying college', error: error.message });
  }
};

// @desc    Delete a college institution
// @route   DELETE /api/superadmin/colleges/:collegeId
// @access  Private (superadmin)
exports.deleteCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
      return res.status(400).json({ success: false, message: 'Invalid college ID' });
    }

    const college = await College.findByIdAndDelete(collegeId);
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    res.status(200).json({
      success: true,
      message: `College "${college.name}" deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting college', error: error.message });
  }
};

// @desc    Get all soft-deleted events (Trash Bin)
// @route   GET /api/superadmin/events/deleted
// @access  Private (superadmin)
exports.getSoftDeletedEvents = async (req, res) => {
  try {
    const deletedEvents = await Event.find({ isDeleted: true })
      .populate('collegeId', 'name location')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: deletedEvents.length,
      events: deletedEvents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching deleted events', error: error.message });
  }
};

// @desc    Restore a soft-deleted event
// @route   PUT /api/superadmin/events/:eventId/restore
// @access  Private (superadmin)
exports.restoreEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const event = await Event.findByIdAndUpdate(
      eventId,
      { isDeleted: false },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({
      success: true,
      message: `Event "${event.title}" restored successfully!`,
      event
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error restoring event', error: error.message });
  }
};

// @desc    Permanently delete an event
// @route   DELETE /api/superadmin/events/:eventId/permanent
// @access  Private (superadmin)
exports.permanentDeleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const event = await Event.findByIdAndDelete(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({
      success: true,
      message: `Event "${event.title}" permanently deleted from database.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error permanently deleting event', error: error.message });
  }
};

