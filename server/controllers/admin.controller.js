const User = require('../modals/User');
const Event = require('../modals/Event');
const sendEmail = require('../utils/sendEmail');

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

        // Send approval email to organizer
        try {
            const emailSubject = "🎉 Your CollegeSphere Organizer Account is Approved!";
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #1f2937; margin-bottom: 20px;">Congratulations, ${organizer.name}! 🎉</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Great news! Your organizer account has been approved by our admin team.</p>
                        
                        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                            <p style="color: #065f46; font-weight: bold; margin-bottom: 10px;">✅ Account Activated</p>
                            <p style="color: #047857; line-height: 1.6;">You now have full access to all organizer features!</p>
                        </div>
                        
                        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="color: #1e40af; font-weight: bold; margin-bottom: 10px;">What you can do now:</p>
                            <ul style="color: #1e3a8a; line-height: 1.8;">
                                <li>Create and publish college events</li>
                                <li>Manage your event listings</li>
                                <li>Track student registrations</li>
                                <li>View participant details and analytics</li>
                                <li>Update event information anytime</li>
                            </ul>
                        </div>
                        
                        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="color: #92400e; font-size: 14px; line-height: 1.6;">
                                <strong>💡 Pro Tip:</strong> Make sure to add engaging event descriptions and attractive posters to get more student registrations!
                            </p>
                        </div>
                        
                        <p style="color: #4b5563; font-size: 16px; margin-top: 20px;">Ready to create your first event? Log in to your dashboard and get started!</p>
                        
                        <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                            Best regards,<br/>
                            <strong>The CollegeSphere Team</strong>
                        </p>
                    </div>
                </div>
            `;

            await sendEmail(organizer.email, emailSubject, emailHtml);
        } catch (emailError) {
            console.error('Failed to send approval email:', emailError.message);
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

        // Send approval email to organizer
        try {
            const emailSubject = "🎉 Your Event Has Been Approved!";
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #1f2937; margin-bottom: 20px;">Congratulations! 🎉</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Great news! Your event has been approved and is now live on CollegeSphere.</p>
                        
                        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                            <p style="color: #065f46; font-weight: bold; margin-bottom: 10px;">✅ Event Published</p>
                            <p style="color: #047857; line-height: 1.6;">Students can now browse and register for your event!</p>
                        </div>
                        
                        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="color: #1e40af; font-weight: bold; margin-bottom: 10px;">Event Details:</p>
                            <ul style="color: #1e3a8a; line-height: 1.8; list-style: none; padding: 0;">
                                <li><strong>Title:</strong> ${event.title}</li>
                                <li><strong>Date:</strong> ${new Date(event.date).toLocaleDateString('en-GB')}</li>
                                <li><strong>Venue:</strong> ${event.venue}</li>
                                <li><strong>College:</strong> ${event.collegeId.name}</li>
                                <li><strong>Category:</strong> ${event.category}</li>
                            </ul>
                        </div>
                        
                        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="color: #92400e; font-size: 14px; line-height: 1.6;">
                                <strong>📊 Next Steps:</strong> Monitor your dashboard to track student registrations and manage your event.
                            </p>
                        </div>
                        
                        <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                            Best regards,<br/>
                            <strong>The CollegeSphere Team</strong>
                        </p>
                    </div>
                </div>
            `;

            if (event.createdBy && event.createdBy.email) {
                await sendEmail(event.createdBy.email, emailSubject, emailHtml);
            }
        } catch (emailError) {
            console.error('Failed to send event approval email:', emailError.message);
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

        // Delete the event instead of just setting isApproved to false
        const event = await Event.findByIdAndDelete(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Event rejected and deleted successfully',
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
