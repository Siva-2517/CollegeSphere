const Registration = require('../modals/Registration');
const Event = require('../modals/Event');
const mongoose = require('mongoose');

exports.registerForEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;

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

    const newRegis = await Registration.create({
      user: req.user.Id,
      event: eventId
    });

    await newRegis.populate({
        path: 'event',
        select: 'title date venue'
    });

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
        select: 'title date venue college',
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


exports.getRegistrationsByEvent = async(req, res)=>{
  try{
    const {eventId} = req.params;
    if(!mongoose.Types.ObjectId.isValid(eventId)){
      return res.status(400).json({message:'Invalid event ID'});
    }
    const registrations = await Registration.find({event: eventId})
      .populate({
        path:'user',
        select:'name email'
      })
      .sort({createdAt:-1});
    res.status(200).json({
      message:'Registrations for the event retrieved successfully',
      count: registrations.length,
      registrations
    });
  }
  catch(err){
    res.status(500).json({error: err.message});
  }
};

exports.cancelRegistration = async(req, res)=>{
  try{
    const userId = req.user.Id;
 const registrationId = req.params.registrationId;    console.log("userId:", userId);
    console.log("registrationId:", registrationId);

    if(!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(registrationId)){
      return res.status(400).json({message:'Invalid user ID or registration ID'});
    }
    const registration = await Registration.findOneAndDelete({user: userId, _id: registrationId});
    if(!registration){
      return res.status(404).json({message:'Registration not found'});
    }
    res.status(200).json({message:'Registration cancelled successfully'});
  }
  catch(err){
    res.status(500).json({error: err.message});
  }
};