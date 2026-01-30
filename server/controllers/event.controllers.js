const mongoose = require('mongoose')

const Event = require('../modals/Event');
const College = require('../modals/College');


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
      poster
    } = req.body;

    const user = req.user; 
    if (user.role === "organizer" && user.isApproved !== true) {
      return res.status(403).json({
        message: "Organizer not approved by admin"
      });
    }
    console.log("organizer creating event for collegeId:", collegeId);
    console.log("organizer's own collegeId:", user.collegeId);
    console.log("organizer's user info:", user);
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

    // Create event
    const newEvent = await Event.create({
      title,
      description,
      date,
      venue,
      collegeId,
      deadline: registrationDeadline,
      category,
      poster: poster || null,
      createdBy: user.Id,

      // 🔐 Admin events auto-approved, organizer events need approval
      isApproved: user.role === "admin"
    });

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
      "poster"
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
