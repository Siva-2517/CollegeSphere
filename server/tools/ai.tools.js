const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const College = require('../models/College');
const sendEmail = require('../utils/sendEmail');

// ==========================================
// TOOL SCHEMAS FOR LLM FUNCTION CALLING
// ==========================================

const STUDENT_TOOLS = [
  {
    name: 'searchEvents',
    description: 'Search for approved college events by keyword, category, date range, college, or event type.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term for event title or description' },
        category: { type: 'string', description: 'Event category (e.g., Coding, Cultural, Sports, Technical, Workshop)' },
        eventType: { type: 'string', description: 'Solo or team event: "solo" or "team"' },
        collegeId: { type: 'string', description: 'College ID to filter events by college' },
        beforeDate: { type: 'string', description: 'ISO date string (YYYY-MM-DD) to filter events occurring before this date' }
      }
    }
  },
  {
    name: 'getEventDetails',
    description: 'Get full details for a specific event by its ID.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'The MongoDB ObjectId of the event' }
      },
      required: ['eventId']
    }
  },
  {
    name: 'getStudentRegistrations',
    description: 'Retrieve all event registrations for the currently authenticated student.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'registerForEvent',
    description: 'Register the student for an event. Requires user confirmation if unconfirmed.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'Event ID to register for' },
        teamName: { type: 'string', description: 'Name of the team (required for team events)' },
        participants: {
          type: 'array',
          description: 'Array of participant objects for team events (each containing name and email)',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' }
            }
          }
        }
      },
      required: ['eventId']
    }
  },
  {
    name: 'cancelRegistration',
    description: 'Cancel an existing event registration for the student. Requires user confirmation if unconfirmed.',
    parameters: {
      type: 'object',
      properties: {
        registrationId: { type: 'string', description: 'The registration ID to cancel' }
      },
      required: ['registrationId']
    }
  }
];

const ORGANIZER_TOOLS = [
  {
    name: 'getOrganizerEvents',
    description: 'Get all events created by the logged-in organizer.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'getRegistrationStats',
    description: 'Get participant registrations and roster for a specific event owned by the organizer.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'The event ID to get registration statistics for' }
      },
      required: ['eventId']
    }
  },
  {
    name: 'createEvent',
    description: 'Create a new college event draft or publication request. Requires user confirmation if unconfirmed.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the event' },
        description: { type: 'string', description: 'Full description and details of the event' },
        date: { type: 'string', description: 'Event date (YYYY-MM-DD or ISO string)' },
        venue: { type: 'string', description: 'Location or venue' },
        deadline: { type: 'string', description: 'Registration deadline date (must be before event date)' },
        category: { type: 'string', description: 'Category (e.g. Technical, Cultural, Hackathon, Workshop, Sports)' },
        eventType: { type: 'string', description: '"solo" or "team"' },
        minTeamSize: { type: 'number', description: 'Minimum members for team event' },
        maxTeamSize: { type: 'number', description: 'Maximum members for team event' }
      },
      required: ['title', 'description', 'date', 'venue', 'deadline', 'category']
    }
  },
  {
    name: 'generateEventContent',
    description: 'AI utility to generate compelling event descriptions, rules, and schedules based on event title and topic.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title or topic of the event' },
        category: { type: 'string', description: 'Category of the event' }
      },
      required: ['title']
    }
  }
];

const ADMIN_TOOLS = [
  {
    name: 'getAdminAnalytics',
    description: 'Retrieve overall platform analytics including total users, events, registrations, pending approvals, and low-registration events.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'getPendingOrganizers',
    description: 'Get all pending organizer registration requests awaiting admin approval.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'getPendingEvents',
    description: 'Get all events submitted by organizers awaiting admin approval.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'approveOrganizer',
    description: 'Approve a pending organizer account. Requires user confirmation if unconfirmed.',
    parameters: {
      type: 'object',
      properties: {
        organizerId: { type: 'string', description: 'User ID of the organizer to approve' }
      },
      required: ['organizerId']
    }
  },
  {
    name: 'rejectOrganizer',
    description: 'Reject a pending organizer account. Requires user confirmation if unconfirmed.',
    parameters: {
      type: 'object',
      properties: {
        organizerId: { type: 'string', description: 'User ID of the organizer to reject' }
      },
      required: ['organizerId']
    }
  },
  {
    name: 'approveEvent',
    description: 'Approve a pending event so it is published to students. Requires user confirmation if unconfirmed.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'Event ID to approve' }
      },
      required: ['eventId']
    }
  },
  {
    name: 'rejectEvent',
    description: 'Reject a pending event. Requires user confirmation if unconfirmed.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'Event ID to reject' }
      },
      required: ['eventId']
    }
  }
];


const SUPERADMIN_TOOLS = [
  {
    name: 'getSuperAdminSystemStats',
    description: 'Retrieve global system overview statistics across all colleges, users, events, and registrations.',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'getAllSystemUsers',
    description: 'List all users in the system with optional role filtering.',
    parameters: {
      type: 'object',
      properties: {
        role: { type: 'string', description: 'Filter by role: student, organizer, admin, superadmin' },
        search: { type: 'string', description: 'Search name or email' }
      }
    }
  },
  {
    name: 'updateUserRole',
    description: 'Change a user\'s role (e.g. promote to admin or superadmin). Requires confirmation.',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Target user ID' },
        role: { type: 'string', description: 'New role: student, organizer, admin, superadmin' }
      },
      required: ['userId', 'role']
    }
  },
  {
    name: 'createCollege',
    description: 'Create a new college institution. Requires confirmation.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the college' },
        location: { type: 'string', description: 'Location/city' }
      },
      required: ['name']
    }
  }
];

// Combine tools by role
const getToolsForRole = (role) => {
  if (role === 'student') return STUDENT_TOOLS;
  if (role === 'organizer') return ORGANIZER_TOOLS;
  if (role === 'admin') return [...ADMIN_TOOLS, ...STUDENT_TOOLS];
  if (role === 'superadmin') return [...SUPERADMIN_TOOLS, ...ADMIN_TOOLS, ...STUDENT_TOOLS];
  return STUDENT_TOOLS;
};


// ==========================================
// TOOL EXECUTORS (BUSINESS LOGIC INTEGRATION)
// ==========================================

const executeTool = async (name, args, userContext, isConfirmed = false) => {
  const { Id: userId, role, isApproved, collegeId } = userContext;

  switch (name) {
    // ------------------------------------------------
    // STUDENT & GENERAL READ TOOLS
    // ------------------------------------------------
    case 'searchEvents': {
      // Auto soft-delete events whose event date has passed
      try {
        await Event.updateMany(
          { date: { $lt: new Date() }, isDeleted: { $ne: true } },
          { $set: { isDeleted: true } }
        );
      } catch (e) {
        console.error('AI Tool Auto Soft-Delete Error:', e.message);
      }

      const filter = { isApproved: true, isDeleted: { $ne: true } };
      if (args.category) filter.category = new RegExp(args.category, 'i');
      if (args.eventType) filter.eventType = args.eventType;
      if (args.collegeId && mongoose.Types.ObjectId.isValid(args.collegeId)) filter.collegeId = args.collegeId;
      if (args.beforeDate) filter.date = { $lte: new Date(args.beforeDate) };
      if (args.query) {
        filter.$or = [
          { title: new RegExp(args.query, 'i') },
          { description: new RegExp(args.query, 'i') },
          { venue: new RegExp(args.query, 'i') }
        ];
      }


      const events = await Event.find(filter)
        .populate('collegeId', 'name location')
        .populate('createdBy', 'name email')
        .sort({ date: 1 })
        .limit(10);

      return {
        count: events.length,
        events: events.map(e => ({
          id: e._id,
          title: e.title,
          description: e.description,
          date: e.date,
          venue: e.venue,
          deadline: e.deadline,
          category: e.category,
          eventType: e.eventType,
          minTeamSize: e.minTeamSize,
          maxTeamSize: e.maxTeamSize,
          collegeName: e.collegeId?.name || 'N/A'
        }))
      };
    }

    case 'getEventDetails': {
      if (!mongoose.Types.ObjectId.isValid(args.eventId)) {
        return { error: 'Invalid Event ID format' };
      }
      const event = await Event.findById(args.eventId)
        .populate('collegeId', 'name location')
        .populate('createdBy', 'name email');

      if (!event) return { error: 'Event not found' };

      const regCount = await Registration.countDocuments({ event: args.eventId });
      return {
        id: event._id,
        title: event.title,
        description: event.description,
        date: event.date,
        venue: event.venue,
        deadline: event.deadline,
        category: event.category,
        eventType: event.eventType,
        minTeamSize: event.minTeamSize,
        maxTeamSize: event.maxTeamSize,
        collegeName: event.collegeId?.name,
        organizerName: event.createdBy?.name,
        isApproved: event.isApproved,
        totalRegistrations: regCount
      };
    }

    case 'getStudentRegistrations': {
      const registrations = await Registration.find({ user: userId })
        .populate({
          path: 'event',
          populate: { path: 'collegeId', select: 'name location' }
        })
        .sort({ registrationAt: -1 });

      return {
        count: registrations.length,
        registrations: registrations.map(r => ({
          registrationId: r._id,
          eventId: r.event?._id,
          eventTitle: r.event?.title || 'Unknown Event',
          date: r.event?.date,
          venue: r.event?.venue,
          collegeName: r.event?.collegeId?.name,
          isTeamRegistration: r.isTeamRegistration,
          teamName: r.teamName,
          participants: r.participants,
          registeredAt: r.registrationAt
        }))
      };
    }

    // ------------------------------------------------
    // STUDENT MUTATING TOOLS (REQUIRE CONFIRMATION)
    // ------------------------------------------------
    case 'registerForEvent': {
      const { eventId, teamName, participants } = args;
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return { error: 'Invalid event ID' };
      }

      const event = await Event.findById(eventId).populate('collegeId', 'name');
      if (!event) return { error: 'Event not found' };

      if (!isConfirmed) {
        return {
          requiresConfirmation: true,
          actionType: 'registerForEvent',
          summary: `Register for "${event.title}" (${event.eventType.toUpperCase()} event on ${new Date(event.date).toLocaleDateString()}) at ${event.collegeId?.name}`,
          payload: { eventId, teamName, participants, eventTitle: event.title }
        };
      }

      // Check deadline
      if (new Date() > new Date(event.deadline)) {
        return { error: 'Registration deadline has already passed for this event.' };
      }

      // Check duplicate
      const existing = await Registration.findOne({ user: userId, event: eventId });
      if (existing) {
        return { error: 'You are already registered for this event.' };
      }

      // Check remaining slots if maxSlots specified
      if (event.maxSlots && event.maxSlots > 0) {
        const currentRegCount = await Registration.countDocuments({ event: eventId });
        if (currentRegCount >= event.maxSlots) {
          return { error: 'Registration failed: This event has reached its maximum seat capacity / no remaining slots.' };
        }
      }


      if (event.eventType === 'team') {
        if (!teamName || !teamName.trim()) return { error: 'Team name is required for team events.' };
        if (!participants || !Array.isArray(participants) || participants.length === 0) {
          return { error: 'Participant list is required for team events.' };
        }
        if (event.minTeamSize && participants.length < event.minTeamSize) {
          return { error: `Team size must be at least ${event.minTeamSize} members.` };
        }
        if (event.maxTeamSize && participants.length > event.maxTeamSize) {
          return { error: `Team size cannot exceed ${event.maxTeamSize} members.` };
        }
      }

      // Atomic update: stop two students taking the last seat at the same time
      let seatReserved = false;
      if (event.maxSlots && event.maxSlots > 0) {
        const updatedEvent = await Event.findOneAndUpdate(
          { _id: eventId, registeredCount: { $lt: event.maxSlots } },
          { $inc: { registeredCount: 1 } },
          { new: true }
        );
        if (!updatedEvent) {
          return { error: 'Registration failed: This event has reached its maximum seat capacity / no remaining slots.' };
        }
        seatReserved = true;
      } else {
        await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });
        seatReserved = true;
      }

      let newRegis;
      try {
        if (event.eventType === 'team') {
          newRegis = await Registration.create({
            user: userId,
            event: eventId,
            isTeamRegistration: true,
            teamName: teamName.trim(),
            participants: participants.map(p => ({ name: p.name.trim(), email: p.email.trim().toLowerCase() }))
          });
        } else {
          newRegis = await Registration.create({
            user: userId,
            event: eventId,
            isTeamRegistration: false
          });
        }
      } catch (createErr) {
        // If Registration.create fails, decrement the count
        if (seatReserved) {
          await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -1 } });
        }
        return { error: `Registration failed: ${createErr.message}` };
      }

      // Send confirmation email
      try {
        const studentUser = await User.findById(userId);
        if (studentUser && studentUser.email) {
          await sendEmail(
            studentUser.email,
            `Registration Confirmed - ${event.title} ✅`,
            `<h2>Registration Confirmed!</h2><p>Hi ${studentUser.name}, your registration for <strong>${event.title}</strong> is successful.</p>`
          );
        }
      } catch (err) {
        console.error('AI registration email error:', err.message);
      }

      return {
        success: true,
        message: `Successfully registered for "${event.title}"! Confirmation email has been sent.`,
        registrationId: newRegis._id
      };
    }

    case 'cancelRegistration': {
      const { registrationId } = args;
      if (!mongoose.Types.ObjectId.isValid(registrationId)) {
        return { error: 'Invalid registration ID' };
      }

      const regis = await Registration.findOne({ _id: registrationId, user: userId }).populate('event', 'title');
      if (!regis) return { error: 'Registration not found or unauthorized' };

      if (!isConfirmed) {
        return {
          requiresConfirmation: true,
          actionType: 'cancelRegistration',
          summary: `Cancel registration for event "${regis.event?.title || 'Event'}"`,
          payload: { registrationId, eventTitle: regis.event?.title }
        };
      }

      await Registration.findByIdAndDelete(registrationId);
      if (regis.event?._id) {
        await Event.findByIdAndUpdate(regis.event._id, { $inc: { registeredCount: -1 } });
      }
      return {
        success: true,
        message: `Successfully canceled registration for "${regis.event?.title || 'Event'}".`
      };
    }

    // ------------------------------------------------
    // ORGANIZER TOOLS
    // ------------------------------------------------
    case 'getOrganizerEvents': {
      if (role !== 'organizer' && role !== 'admin') {
        return { error: 'Unauthorized: Only organizers and admins can access this.' };
      }
      const events = await Event.find({ createdBy: userId }).sort({ createdAt: -1 });
      return {
        count: events.length,
        events: events.map(e => ({
          id: e._id,
          title: e.title,
          date: e.date,
          venue: e.venue,
          deadline: e.deadline,
          category: e.category,
          eventType: e.eventType,
          isApproved: e.isApproved
        }))
      };
    }

    case 'getRegistrationStats': {
      if (role !== 'organizer' && role !== 'admin') {
        return { error: 'Unauthorized: Only organizers and admins can view registration stats.' };
      }
      const event = await Event.findById(args.eventId);
      if (!event) return { error: 'Event not found' };

      const registrations = await Registration.find({ event: args.eventId }).populate('user', 'name email');
      return {
        eventId: event._id,
        eventTitle: event.title,
        totalRegistrations: registrations.length,
        registrations: registrations.map(r => ({
          registrationId: r._id,
          userName: r.user?.name,
          userEmail: r.user?.email,
          isTeamRegistration: r.isTeamRegistration,
          teamName: r.teamName,
          participants: r.participants,
          registeredAt: r.registrationAt
        }))
      };
    }

    case 'createEvent': {
      if (role !== 'organizer' && role !== 'admin' && role !== 'superadmin') {
        return { error: 'Unauthorized: Students are not permitted to create events. Event creation is strictly reserved for approved organizers and admins.' };
      }
      if (role === 'organizer' && !isApproved) {
        return { error: 'Organizer account is pending admin approval. Event creation forbidden.' };
      }


      let userCollegeId = collegeId;
      if (!userCollegeId) {
        const userObj = await User.findById(userId);
        userCollegeId = userObj.collegeId;
      }

      if (!userCollegeId) {
        return { error: 'No college linked to your account. Please complete your profile first.' };
      }

      const collegeObj = await College.findById(userCollegeId);
      const collegeName = collegeObj?.name || 'Your College';

      if (!isConfirmed) {
        return {
          requiresConfirmation: true,
          actionType: 'createEvent',
          summary: `Create event "${args.title}" under ${collegeName} scheduled for ${args.date} (Venue: ${args.venue})`,
          payload: { ...args, collegeId: userCollegeId }
        };
      }

      const newEvent = await Event.create({
        title: args.title,
        description: args.description,
        date: new Date(args.date),
        venue: args.venue,
        collegeId: userCollegeId,
        deadline: new Date(args.deadline),
        category: args.category,
        eventType: args.eventType || 'solo',
        minTeamSize: args.eventType === 'team' ? (args.minTeamSize || 2) : undefined,
        maxTeamSize: args.eventType === 'team' ? (args.maxTeamSize || 5) : undefined,
        createdBy: userId,
        isApproved: role === 'admin'
      });

      return {
        success: true,
        message: role === 'admin' 
          ? `Event "${newEvent.title}" created and published successfully!`
          : `Event "${newEvent.title}" submitted successfully! Waiting for admin approval.`,
        eventId: newEvent._id,
        isApproved: newEvent.isApproved
      };
    }

    case 'generateEventContent': {
      return {
        suggestedDescription: `Join us for ${args.title}, an exciting ${args.category} experience designed to showcase talent, foster innovation, and connect passionate participants across colleges.`,
        suggestedRules: [
          'All participants must bring valid college ID cards.',
          'Registration deadline must be respected strictly.',
          'Decisions of the judges will be final and binding.'
        ]
      };
    }

    // ------------------------------------------------
    // ADMIN TOOLS
    // ------------------------------------------------
    case 'getAdminAnalytics': {
      if (role !== 'admin') return { error: 'Unauthorized: Admin access required.' };

      const totalUsers = await User.countDocuments();
      const totalColleges = await College.countDocuments();
      const totalEvents = await Event.countDocuments();
      const approvedEvents = await Event.countDocuments({ isApproved: true });
      const pendingEventsCount = await Event.countDocuments({ isApproved: false });
      const totalRegistrations = await Registration.countDocuments();
      const pendingOrganizersCount = await User.countDocuments({ role: 'organizer', isApproved: false });

      // Low registration events (approved events with fewer than 3 registrations)
      const eventsWithRegs = await Event.aggregate([
        { $match: { isApproved: true } },
        {
          $lookup: {
            from: 'registrations',
            localField: '_id',
            foreignField: 'event',
            as: 'regs'
          }
        },
        {
          $project: {
            title: 1,
            date: 1,
            regCount: { $size: '$regs' }
          }
        },
        { $match: { regCount: { $lt: 3 } } },
        { $limit: 5 }
      ]);

      return {
        totalUsers,
        totalColleges,
        totalEvents,
        approvedEvents,
        pendingEventsCount,
        totalRegistrations,
        pendingOrganizersCount,
        lowRegistrationEvents: eventsWithRegs
      };
    }

    case 'getPendingOrganizers': {
      if (role !== 'admin') return { error: 'Unauthorized: Admin access required.' };
      const pending = await User.find({ role: 'organizer', isApproved: false })
        .populate('collegeId', 'name')
        .select('-password');
      return {
        count: pending.length,
        organizers: pending.map(o => ({
          id: o._id,
          name: o.name,
          email: o.email,
          collegeName: o.collegeId?.name || 'N/A',
          createdAt: o.createdAt
        }))
      };
    }

    case 'getPendingEvents': {
      if (role !== 'admin') return { error: 'Unauthorized: Admin access required.' };
      const pending = await Event.find({ isApproved: false })
        .populate('collegeId', 'name')
        .populate('createdBy', 'name email');

      return {
        count: pending.length,
        events: pending.map(e => ({
          id: e._id,
          title: e.title,
          category: e.category,
          date: e.date,
          venue: e.venue,
          collegeName: e.collegeId?.name,
          organizerName: e.createdBy?.name,
          organizerEmail: e.createdBy?.email
        }))
      };
    }

    case 'approveOrganizer': {
      if (role !== 'admin') return { error: 'Unauthorized: Admin access required.' };
      const org = await User.findById(args.organizerId);
      if (!org) return { error: 'Organizer not found' };

      if (!isConfirmed) {
        return {
          requiresConfirmation: true,
          actionType: 'approveOrganizer',
          summary: `Approve organizer "${org.name}" (${org.email})`,
          payload: { organizerId: org._id, organizerName: org.name }
        };
      }

      org.isApproved = true;
      await org.save();

      try {
        await sendEmail(
          org.email,
          "🎉 Your CollegeSphere Organizer Account is Approved!",
          `<h2>Congratulations ${org.name}!</h2><p>Your organizer account has been approved by admin.</p>`
        );
      } catch (err) {
        console.error('Email error:', err.message);
      }

      return { success: true, message: `Organizer ${org.name} has been approved.` };
    }

    case 'rejectOrganizer': {
      if (role !== 'admin') return { error: 'Unauthorized: Admin access required.' };
      const org = await User.findById(args.organizerId);
      if (!org) return { error: 'Organizer not found' };

      if (!isConfirmed) {
        return {
          requiresConfirmation: true,
          actionType: 'rejectOrganizer',
          summary: `Reject/suspend organizer "${org.name}" (${org.email})`,
          payload: { organizerId: org._id, organizerName: org.name }
        };
      }

      org.isApproved = false;
      await org.save();
      return { success: true, message: `Organizer ${org.name} rejection updated.` };
    }

    case 'approveEvent': {
      if (role !== 'admin') return { error: 'Unauthorized: Admin access required.' };
      const ev = await Event.findById(args.eventId);
      if (!ev) return { error: 'Event not found' };

      if (!isConfirmed) {
        return {
          requiresConfirmation: true,
          actionType: 'approveEvent',
          summary: `Approve event "${ev.title}" for publication`,
          payload: { eventId: ev._id, eventTitle: ev.title }
        };
      }

      ev.isApproved = true;
      await ev.save();
      return { success: true, message: `Event "${ev.title}" approved and published to students!` };
    }

    case 'rejectEvent': {
      if (role !== 'admin') return { error: 'Unauthorized: Admin access required.' };
      const ev = await Event.findById(args.eventId);
      if (!ev) return { error: 'Event not found' };

      if (!isConfirmed) {
        return {
          requiresConfirmation: true,
          actionType: 'rejectEvent',
          summary: `Reject event "${ev.title}"`,
          payload: { eventId: ev._id, eventTitle: ev.title }
        };
      }

      ev.isApproved = false;
      await ev.save();
      return { success: true, message: `Event "${ev.title}" has been rejected.` };
    }

    // ------------------------------------------------
    // SUPERADMIN TOOLS
    // ------------------------------------------------
    case 'getSuperAdminSystemStats': {
      if (role !== 'superadmin') return { error: 'Unauthorized: Super Admin access required.' };
      const totalUsers = await User.countDocuments();
      const totalColleges = await College.countDocuments();
      const totalEvents = await Event.countDocuments({ isDeleted: { $ne: true } });
      const totalRegistrations = await Registration.countDocuments();
      return { totalUsers, totalColleges, totalEvents, totalRegistrations };
    }

    case 'getAllSystemUsers': {
      if (role !== 'superadmin') return { error: 'Unauthorized: Super Admin access required.' };
      const filter = {};
      if (args.role) filter.role = args.role;
      const users = await User.find(filter).populate('collegeId', 'name').select('-password').limit(20);
      return { count: users.length, users: users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role, collegeName: u.collegeId?.name || 'N/A' })) };
    }

    case 'updateUserRole': {
      if (role !== 'superadmin') return { error: 'Unauthorized: Super Admin access required.' };
      const targetUser = await User.findById(args.userId);
      if (!targetUser) return { error: 'User not found' };

      if (!isConfirmed) {
        return {
          requiresConfirmation: true,
          actionType: 'updateUserRole',
          summary: `Change role of user "${targetUser.name}" (${targetUser.email}) from "${targetUser.role}" to "${args.role}"`,
          payload: { userId: targetUser._id, role: args.role, userName: targetUser.name }
        };
      }

      targetUser.role = args.role;
      await targetUser.save();
      return { success: true, message: `Successfully updated ${targetUser.name}'s role to ${args.role}.` };
    }

    case 'createCollege': {
      if (role !== 'superadmin') return { error: 'Unauthorized: Super Admin access required.' };
      if (!isConfirmed) {
        return {
          requiresConfirmation: true,
          actionType: 'createCollege',
          summary: `Create new college institution "${args.name}" (${args.location || 'N/A'})`,
          payload: { name: args.name, location: args.location }
        };
      }

      const college = await College.create({ name: args.name.trim(), location: args.location || '', isVerified: true });
      return { success: true, message: `College "${college.name}" created successfully!`, collegeId: college._id };
    }

    default:
      return { error: `Tool ${name} not recognized` };
  }
};


module.exports = {
  getToolsForRole,
  executeTool,
  STUDENT_TOOLS,
  ORGANIZER_TOOLS,
  ADMIN_TOOLS
};
