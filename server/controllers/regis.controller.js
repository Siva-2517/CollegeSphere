const Registration = require('../modals/Registration');
const Event = require('../modals/Event');
const mongoose = require('mongoose');
const sendEmail = require('../utils/sendEmail');

exports.registerForEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { teamName, participants } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.deadline) {
      return res.status(500).json({
        message: "Event registration deadline not configured"
      });
    }

    if (new Date() > new Date(event.deadline)) {
      return res.status(400).json({
        message: "Registration deadline has passed"
      });
    }

    const existingRegistration = await Registration.findOne({
      user: req.user.Id,
      event: eventId
    });

    if (existingRegistration) {
      return res.status(400).json({
        message: 'You have already registered for this event'
      });
    }

    // Handle team event registration
    if (event.eventType === 'team') {
      if (!teamName || !teamName.trim()) {
        return res.status(400).json({
          message: 'Team name is required for team events'
        });
      }

      if (!participants || !Array.isArray(participants) || participants.length === 0) {
        return res.status(400).json({
          message: 'Team participants are required for team events'
        });
      }

      // Validate team size
      const teamSize = participants.length;
      if (event.minTeamSize && teamSize < event.minTeamSize) {
        return res.status(400).json({
          message: `Team size must be at least ${event.minTeamSize} members`
        });
      }

      if (event.maxTeamSize && teamSize > event.maxTeamSize) {
        return res.status(400).json({
          message: `Team size cannot exceed ${event.maxTeamSize} members`
        });
      }

      // Validate participant details
      for (const participant of participants) {
        if (!participant.name || !participant.name.trim()) {
          return res.status(400).json({
            message: 'All participant names are required'
          });
        }

        if (!participant.email || !participant.email.trim()) {
          return res.status(400).json({
            message: 'All participant emails are required'
          });
        }

        // Basic email validation
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(participant.email)) {
          return res.status(400).json({
            message: `Invalid email format: ${participant.email}`
          });
        }
      }

      // Create team registration
      const newRegis = await Registration.create({
        user: req.user.Id,
        event: eventId,
        isTeamRegistration: true,
        teamName: teamName.trim(),
        participants: participants.map(p => ({
          name: p.name.trim(),
          email: p.email.trim().toLowerCase()
        }))
      });

      await newRegis.populate({
        path: 'event',
        select: 'title date venue category eventType minTeamSize maxTeamSize',
        populate: {
          path: 'collegeId',
          select: 'name location'
        }
      });

      // Send registration confirmation email to team leader
      try {
        const User = require('../modals/User');
        const student = await User.findById(req.user.Id);

        if (student && student.email) {
          const participantList = participants.map((p, i) =>
            `<li>${i + 1}. ${p.name} (${p.email})</li>`
          ).join('');

          const emailSubject = `Team Registration Confirmed - ${newRegis.event.title} ✅`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
              <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #1f2937; margin-bottom: 20px;">Team Registration Successful! ✅</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${student.name}, your team "${teamName}" has been successfully registered for the following event:</p>
                
                <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                  <p style="color: #065f46; font-weight: bold; margin-bottom: 10px;">✅ Confirmed</p>
                  <p style="color: #047857; line-height: 1.6;">Your team's spot has been reserved!</p>
                </div>
                
                <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #1e40af; font-weight: bold; margin-bottom: 10px;">Event Details:</p>
                  <ul style="color: #1e3a8a; line-height: 1.8; list-style: none; padding: 0;">
                    <li><strong>🎯 Title:</strong> ${newRegis.event.title}</li>
                    <li><strong>📅 Date:</strong> ${new Date(newRegis.event.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
                    <li><strong>📍 Venue:</strong> ${newRegis.event.venue}</li>
                    <li><strong>🏫 College:</strong> ${newRegis.event.collegeId.name}</li>
                    <li><strong>🏷️ Category:</strong> ${newRegis.event.category}</li>
                  </ul>
                </div>

                <div style="background-color: #f3e8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #6b21a8; font-weight: bold; margin-bottom: 10px;">👥 Team Details:</p>
                  <p style="color: #7c3aed;"><strong>Team Name:</strong> ${teamName}</p>
                  <p style="color: #7c3aed; margin-top: 10px;"><strong>Team Members:</strong></p>
                  <ul style="color: #7c3aed; line-height: 1.8;">
                    ${participantList}
                  </ul>
                </div>
                
                <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #92400e; font-size: 14px; line-height: 1.6;">
                    <strong>📌 Important:</strong> Please save this email for your records. Make sure all team members arrive on time and bring any required materials.
                  </p>
                </div>
                
                <p style="color: #4b5563; font-size: 16px; margin-top: 20px;">See you at the event!</p>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  Best regards,<br/>
                  <strong>The CollegeSphere Team</strong>
                </p>
              </div>
            </div>
          `;

          await sendEmail(student.email, emailSubject, emailHtml);
        }
      } catch (emailError) {
        console.error('Failed to send team registration confirmation email:', emailError.message);
      }

      return res.status(201).json({
        message: 'Team registration successful',
        registration: newRegis
      });
    }

    // Handle solo event registration (existing logic)
    const newRegis = await Registration.create({
      user: req.user.Id,
      event: eventId,
      isTeamRegistration: false
    });

    await newRegis.populate({
      path: 'event',
      select: 'title date venue category eventType',
      populate: {
        path: 'collegeId',
        select: 'name location'
      }
    });

    // Send registration confirmation email to student
    try {
      const User = require('../modals/User');
      const student = await User.findById(req.user.Id);

      if (student && student.email) {
        const emailSubject = `Registration Confirmed - ${newRegis.event.title} ✅`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin-bottom: 20px;">Registration Successful! ✅</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${student.name}, you've successfully registered for the following event:</p>
              
              <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <p style="color: #065f46; font-weight: bold; margin-bottom: 10px;">✅ Confirmed</p>
                <p style="color: #047857; line-height: 1.6;">Your spot has been reserved!</p>
              </div>
              
              <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #1e40af; font-weight: bold; margin-bottom: 10px;">Event Details:</p>
                <ul style="color: #1e3a8a; line-height: 1.8; list-style: none; padding: 0;">
                  <li><strong>🎯 Title:</strong> ${newRegis.event.title}</li>
                  <li><strong>📅 Date:</strong> ${new Date(newRegis.event.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
                  <li><strong>📍 Venue:</strong> ${newRegis.event.venue}</li>
                  <li><strong>🏫 College:</strong> ${newRegis.event.collegeId.name}</li>
                  <li><strong>🏷️ Category:</strong> ${newRegis.event.category}</li>
                </ul>
              </div>
              
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>📌 Important:</strong> Please save this email for your records. Make sure to arrive on time and bring any required materials.
                </p>
              </div>
              
              <p style="color: #4b5563; font-size: 16px; margin-top: 20px;">See you at the event!</p>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Best regards,<br/>
                <strong>The CollegeSphere Team</strong>
              </p>
            </div>
          </div>
        `;

        await sendEmail(student.email, emailSubject, emailHtml);
      }
    } catch (emailError) {
      console.error('Failed to send registration confirmation email:', emailError.message);
    }

    res.status(201).json({
      message: 'Registration successful',
      registration: newRegis
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: 'You have already registered for this event'
      });
    }

    res.status(500).json({ error: err.message });
  }
};

exports.getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ user: req.user.Id })
      .populate({
        path: 'event',
        select: 'title date venue collegeId deadline',
        populate: {
          path: 'collegeId',
          select: 'name location'
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Registrations retrieved successfully',
      count: registrations.length,
      registrations
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getRegistrationsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    const registrations = await Registration.find({ event: eventId })
      .populate({
        path: 'user',
        select: 'name email collegeId',
        populate: {
          path: 'collegeId',
          select: 'name location'
        }
      })
      .sort({ createdAt: -1 });
    res.status(200).json({
      message: 'Registrations for the event retrieved successfully',
      count: registrations.length,
      registrations
    });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cancelRegistration = async (req, res) => {
  try {
    const userId = req.user.Id;
    const registrationId = req.params.registrationId; console.log("userId:", userId);

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(registrationId)) {
      return res.status(400).json({ message: 'Invalid user ID or registration ID' });
    }
    const registration = await Registration.findOneAndDelete({ user: userId, _id: registrationId });
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    res.status(200).json({ message: 'Registration cancelled successfully' });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
};