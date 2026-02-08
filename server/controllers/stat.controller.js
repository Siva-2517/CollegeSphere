const User = require('../modals/User');
const College = require('../modals/College');
const Event = require('../modals/Event');
const Registration = require('../modals/Registration');

const getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalColleges = await College.countDocuments();
        const totalEvents = await Event.countDocuments();
        const totalRegistrations = await Registration.countDocuments();
        const totalOrganizers = await User.countDocuments({ role: 'organizer' });
        const pendingApprovals = await User.countDocuments({ role: 'organizer', isApproved: false });

        res.status(200).json({
            success: true,
            data: {
                totalColleges,
                totalOrganizers,
                pendingApprovals,
                totalEvents,
                totalUsers,
                totalRegistrations
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};

// Public stats endpoint - no authentication required
const getPublicStats = async (req, res) => {
    try {
        const totalColleges = await College.countDocuments();
        const totalEvents = await Event.countDocuments({ isApproved: true });
        const totalStudents = await User.countDocuments({ role: 'student' });

        res.status(200).json({
            success: true,
            totalColleges,
            totalEvents,
            totalStudents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching public statistics',
            error: error.message
        });
    }
};

module.exports = { getStats, getPublicStats };