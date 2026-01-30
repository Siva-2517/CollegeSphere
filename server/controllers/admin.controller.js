const User = require('../modals/User');
const Event = require('../modals/Event');

const getPendingOrganizers = async (req, res) => {
    try {
        const pendingOrganizers = await User.find({ 
            role: 'organizer', 
            isApproved: false 
        }).populate('collegeId', 'name').select('-password');
        const organizersWithCollegeName = pendingOrganizers.map(organizer => ({
            ...organizer.toObject(),
            collegeName: organizer.collegeId?.name || 'N/A'
        }));

        res.status(200).json({
            success: true,
            data: organizersWithCollegeName
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching pending organizers',
            error: error.message
        });
    }
};

const getApprovedOrganizers = async (req, res) => {
    try {
        const approvedOrganizers = await User.find({ 
            role: 'organizer', 
            isApproved: true 
        }).populate('collegeId', 'name').select('-password');

        const organizersWithEventCount = await Promise.all(
            approvedOrganizers.map(async (organizer) => {
                const eventsCount = await Event.countDocuments({ createdBy: organizer._id });
                return {
                    ...organizer.toObject(),
                    collegeName: organizer.collegeId?.name || 'N/A',
                    eventsCount: eventsCount
                };
            })
        );

        res.status(200).json({
            success: true,
            data: organizersWithEventCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching approved organizers',
            error: error.message
        });
    }
};

const approveOrganizer = async (req, res) => {
    try {
        const { organizerId } = req.params;
        const organizer = await User.findByIdAndUpdate(
            organizerId,
            { isApproved: true },
            { new: true }
        ).select('-password');
        if (!organizer) {
            return res.status(404).json({
                success: false,
                message: 'Organizer not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Organizer approved successfully',
            data: organizer
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error approving organizer',
            error: error.message
        });
    }
};

// Reject organizer
const rejectOrganizer = async (req, res) => {
    try {
        const { organizerId } = req.params;

        const organizer = await User.findByIdAndUpdate(
            organizerId,
            { isApproved: false },
            { new: true }
        ).select('-password');

        if (!organizer) {
            return res.status(404).json({
                success: false,
                message: 'Organizer not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Organizer rejected',
            data: organizer
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error rejecting organizer',
            error: error.message
        });
    }
};

// Get pending events
const getPendingEvents = async (req, res) => {
    try {
        const pendingEvents = await Event.find({ 
            isApproved: false 
        }).populate('collegeId', 'name').populate('createdBy', 'name email');

        res.status(200).json({
            success: true,
            data: pendingEvents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching pending events',
            error: error.message
        });
    }
};

// Get approved events
const getApprovedEvents = async (req, res) => {
    try {
        const approvedEvents = await Event.find({ 
            isApproved: true 
        }).populate('collegeId', 'name').populate('createdBy', 'name email');

        res.status(200).json({
            success: true,
            data: approvedEvents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching approved events',
            error: error.message
        });
    }
};

// Approve event
const approveEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findByIdAndUpdate(
            eventId,
            { isApproved: true },
            { new: true }
        ).populate('collegeId', 'name').populate('createdBy', 'name email');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Event approved successfully',
            data: event
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error approving event',
            error: error.message
        });
    }
};

// Reject event
const rejectEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findByIdAndUpdate(
            eventId,
            { isApproved: false },
            { new: true }
        ).populate('collegeId', 'name').populate('createdBy', 'name email');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Event rejected',
            data: event
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error rejecting event',
            error: error.message
        });
    }
};

// Delete event
const deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findByIdAndDelete(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting event',
            error: error.message
        });
    }
};

module.exports = {
    getPendingOrganizers,
    getApprovedOrganizers,
    approveOrganizer,
    rejectOrganizer,
    getPendingEvents,
    getApprovedEvents,
    approveEvent,
    rejectEvent,
    deleteEvent
};
