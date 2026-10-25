const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Event = require('../models/Event');
const College = require('../models/College');
const Registration = require('../models/Registration');
const { connectTestDB, disconnectTestDB, clearTestDB, generateToken } = require('./testHelper');

describe('Registration & Cancellation Lifecycle Tests', () => {
  let college, organizer, student, event;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    college = await College.create({ name: 'Registration Test College', isVerified: true });

    organizer = await User.create({
      name: 'Event Organizer',
      email: 'event.org@college.edu',
      password: 'password123',
      role: 'organizer',
      isApproved: true,
      collegeId: college._id
    });

    student = await User.create({
      name: 'Alice Student',
      email: 'alice.student@college.edu',
      password: 'password123',
      role: 'student',
      isApproved: true,
      collegeId: college._id
    });

    event = await Event.create({
      title: 'Solo Workshop',
      description: 'Hands on AI Workshop',
      date: new Date(Date.now() + 86400000 * 5),
      deadline: new Date(Date.now() + 86400000 * 2),
      venue: 'Auditorium A',
      category: 'Workshop',
      eventType: 'solo',
      maxSlots: 10,
      registeredCount: 0,
      isApproved: true,
      collegeId: college._id,
      createdBy: organizer._id
    });
  });

  test('Solo registration succeeds and increments registeredCount', async () => {
    const token = generateToken(student);

    const res = await request(app)
      .post(`/api/registration/register/${event._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.registration).toBeDefined();

    const updatedEvent = await Event.findById(event._id);
    expect(updatedEvent.registeredCount).toBe(1);

    const regInDb = await Registration.findOne({ user: student._id, event: event._id });
    expect(regInDb).toBeDefined();
    expect(regInDb.isTeamRegistration).toBe(false);
  });

  test('Duplicate registration by the same student is rejected and does not increment registeredCount', async () => {
    const token = generateToken(student);

    // First registration
    const firstRes = await request(app)
      .post(`/api/registration/register/${event._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(firstRes.status).toBe(201);

    // Second registration attempt
    const secondRes = await request(app)
      .post(`/api/registration/register/${event._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(secondRes.status).toBe(400);
    expect(secondRes.body.message).toMatch(/already registered/i);

    const eventAfter = await Event.findById(event._id);
    expect(eventAfter.registeredCount).toBe(1); // Still 1, rollback preserved
  });

  test('Team registration validates requirements and increments registeredCount', async () => {
    const teamEvent = await Event.create({
      title: 'Hackathon 2026',
      description: 'Team Hackathon',
      date: new Date(Date.now() + 86400000 * 6),
      deadline: new Date(Date.now() + 86400000 * 3),
      venue: 'Innovation Hub',
      category: 'Hackathon',
      eventType: 'team',
      minTeamSize: 2,
      maxTeamSize: 4,
      maxSlots: 10,
      registeredCount: 0,
      isApproved: true,
      collegeId: college._id,
      createdBy: organizer._id
    });

    const token = generateToken(student);

    // Valid team registration
    const res = await request(app)
      .post(`/api/registration/register/${teamEvent._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        teamName: 'CyberKnights',
        participants: [
          { name: 'Alice Student', email: 'alice.student@college.edu' },
          { name: 'Bob Partner', email: 'bob.partner@college.edu' }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/team registration successful/i);

    const updatedTeamEvent = await Event.findById(teamEvent._id);
    expect(updatedTeamEvent.registeredCount).toBe(1);
  });

  test('Cancelling a registration deletes record and decrements registeredCount', async () => {
    const token = generateToken(student);

    // Register first
    const regRes = await request(app)
      .post(`/api/registration/register/${event._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(regRes.status).toBe(201);

    const registrationId = regRes.body.registration._id;
    const eventBeforeCancel = await Event.findById(event._id);
    expect(eventBeforeCancel.registeredCount).toBe(1);

    // Cancel registration
    const cancelRes = await request(app)
      .delete(`/api/registration/cancel/${registrationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.message).toMatch(/registration cancelled successfully/i);

    // Verify decrement
    const eventAfterCancel = await Event.findById(event._id);
    expect(eventAfterCancel.registeredCount).toBe(0);

    const regInDb = await Registration.findById(registrationId);
    expect(regInDb).toBeNull();
  });
});
