const mongoose = require('mongoose')

const Event = require('../modals/Event');
const College = require('../modals/College');
const Registration = require('../modals/Registration');
const uploadPoster = require('../utils/uploadPoster');
const sendEmail = require('../utils/sendEmail');


exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      venue,
      collegeId,
      registrationDeadline,
      category,
      eventType,
      minTeamSize,
      maxTeamSize
    } = req.body;

    const user = req.user;
    if (user.role === "organizer" && user.isApproved !== true) {
      return res.status(403).json({
        message: "Organizer not approved by admin"
      });
    }
    if (
      user.role === "organizer" &&
      String(collegeId) !== String(user.collegeId)
    ) {
      return res.status(403).json({
        message: "You can create events only for your own college"
      });
    }

    // Validate college existence
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    // Validate team event requirements
    if (eventType === 'team') {
      if (!minTeamSize && !maxTeamSize) {
        return res.status(400).json({
          message: "Team events must specify minimum and/or maximum team size"
        });
      }
      if (minTeamSize && maxTeamSize && minTeamSize > maxTeamSize) {
        return res.status(400).json({
          message: "Minimum team size cannot be greater than maximum team size"
        });
      }
    }
    let posterUrl = null;

    if (req.file) {
      const uploadResult = await uploadPoster(req.file.buffer);
      posterUrl = uploadResult.secure_url;
    }

    // Create event
    const newEvent = await Event.create({
      title,
      description,
      date,
      venue,
      collegeId,
      deadline: registrationDeadline,
      category,
      poster: posterUrl || null,
      eventType: eventType || 'solo',
      minTeamSize: eventType === 'team' ? minTeamSize : undefined,
      maxTeamSize: eventType === 'team' ? maxTeamSize : undefined,
      createdBy: user.Id,

      // 🔐 Admin events auto-approved, organizer events need approval
      isApproved: user.role === "admin"
    });

    // Send email notification to organizer if event is pending approval
    if (user.role === "organizer") {
      try {
        const populatedEvent = await Event.findById(newEvent._id).populate('collegeId', 'name');
        const emailSubject = "Event Submitted - Pending Admin Approval ⏳";
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin-bottom: 20px;">Event Submitted Successfully! ⏳</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Your event has been submitted and is now waiting for admin approval.</p>
              
              <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #1e40af; font-weight: bold; margin-bottom: 10px;">Event Details:</p>
                <ul style="color: #1e3a8a; line-height: 1.8; list-style: none; padding: 0;">
                  <li><strong>Title:</strong> ${title}</li>
                  <li><strong>Date:</strong> ${new Date(date).toLocaleDateString('en-GB')}</li>
                  <li><strong>Venue:</strong> ${venue}</li>
                  <li><strong>College:</strong> ${populatedEvent.collegeId.name}</li>
                  <li><strong>Category:</strong> ${category}</li>
                </ul>
              </div>
              
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; font-weight: bold; margin-bottom: 10px;">⏳ Pending Approval</p>
                <p style="color: #78350f; line-height: 1.6;">Your event is currently under review by our admin team. You'll receive a notification once it's approved and published.</p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Best regards,<br/>
                <strong>The CollegeSphere Team</strong>
              </p>
            </div>
          </div>
        `;

        // Get organizer email from user object or fetch from database
        const User = require('../modals/User');
        const organizer = await User.findById(user.Id);
        if (organizer && organizer.email) {
          await sendEmail(organizer.email, emailSubject, emailHtml);
        }
      } catch (emailError) {
        console.error('Failed to send event creation email:', emailError.message);
      }
    }

    res.status(201).json({
      message:
        user.role === "admin"
          ? "Event created successfully"
          : "Event created successfully, waiting for admin approval",
      event: newEvent
    });
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find({ isApproved: true })
      .populate('collegeId', 'name location')
      .populate('createdBy', 'name email')
      .sort({ date: 1 });

    // Transform events to match frontend expectations
    const transformedEvents = events.map(event => ({
      _id: event._id,
      name: event.title,
      title: event.title,
      description: event.description,
      date: event.date,
      venue: event.venue,
      deadline: event.deadline,
      category: event.category,
      poster: event.poster,
      eventType: event.eventType,
      minTeamSize: event.minTeamSize,
      maxTeamSize: event.maxTeamSize,
      collegeId: event.collegeId._id,
      collegeName: event.collegeId.name,
      createdBy: event.createdBy,
      isApproved: event.isApproved,
      timestamps: event.timestamps
    }));

    res.status(200).json({
      count: transformedEvents.length,
      events: transformedEvents
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
// controllers/event.controller.js
exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user.Id })
      .populate('collegeId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ events });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch organizer events' });
  }
};

exports.getEventsByCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
      return res.status(400).json({ message: 'Invalid college ID' });
    }
    const events = await Event.find({ collegeId, isApproved: true })
      .populate('collegeId', 'name location')
      .populate('createdBy', 'name email')
      .sort({ date: 1 });

    // Transform events to match frontend expectations
    const transformedEvents = events.map(event => ({
      _id: event._id,
      name: event.title,
      title: event.title,
      description: event.description,
      date: event.date,
      venue: event.venue,
      deadline: event.deadline,
      category: event.category,
      poster: event.poster,
      eventType: event.eventType,
      minTeamSize: event.minTeamSize,
      maxTeamSize: event.maxTeamSize,
      collegeId: event.collegeId._id,
      collegeName: event.collegeId.name,
      createdBy: event.createdBy,
      isApproved: event.isApproved,
      timestamps: event.timestamps
    }));

    res.status(200).json({
      count: transformedEvents.length,
      events: transformedEvents
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    // event already fetched earlier

    const incomingDate =
      req.body.date ? new Date(req.body.date) : event.date;

    const incomingDeadline =
      req.body.deadline ? new Date(req.body.deadline) : event.deadline;

    if (incomingDeadline >= incomingDate) {
      return res.status(400).json({
        message: "Registration deadline must be BEFORE event date"
      });
    }

    if (user.role === "organizer" && user.isApproved !== true) {
      return res.status(403).json({
        message: "Organizer not approved by admin"
      });
    }

    if (user.role === "organizer") {
      if (String(event.createdBy) !== String(user.Id)) {
        return res.status(403).json({
          message: "You are not allowed to update this event"
        });
      }
    }

    const allowedUpdates = [
      "title",
      "description",
      "date",
      "venue",
      "deadline",
      "category",
      "poster",
      "eventType",
      "minTeamSize",
      "maxTeamSize"
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (user.role === "organizer") {
      updates.isApproved = false;
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message:
        user.role === "admin"
          ? "Event updated successfully"
          : "Event updated successfully, waiting for admin approval",
      event: updatedEvent
    });
  } catch (err) {
    console.error("Error updating event:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    // 1️⃣ Fetch event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 2️⃣ Organizer approval check
    if (user.role === "organizer" && user.isApproved !== true) {
      return res.status(403).json({
        message: "Organizer not approved by admin"
      });
    }

    // 3️⃣ Ownership check (CRITICAL)
    if (user.role === "organizer") {
      if (String(event.createdBy) !== String(user.Id)) {
        return res.status(403).json({
          message: "You are not allowed to delete this event"
        });
      }
    }

    // 4️⃣ Optional safety: block delete if students registered
    const registrationCount = await Registration.countDocuments({
      event: eventId
    });

    if (registrationCount > 0) {
      return res.status(400).json({
        message:
          "Cannot delete event with active registrations. Cancel registrations first."
      });
    }

    // 5️⃣ Delete event
    await Event.findByIdAndDelete(eventId);

    res.status(200).json({
      message: "Event deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ error: err.message });
  }
};
