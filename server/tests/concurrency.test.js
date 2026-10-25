const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Event = require('../models/Event');
const College = require('../models/College');
const Registration = require('../models/Registration');
const { connectTestDB, disconnectTestDB, clearTestDB, generateToken } = require('./testHelper');

describe('Concurrency & Seat Race Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  test('20 simultaneous registrations on an event with 5 seats: exactly 5 succeed and 15 reject', async () => {
    // 1. Create College
    const college = await College.create({
      name: 'Concurrency Tech Institute',
      location: 'Tech Park',
      isVerified: true
    });

    // 2. Create Organizer
    const organizer = await User.create({
      name: 'Organizer Alice',
      email: 'organizer.concurrency@test.com',
      password: 'password123',
      role: 'organizer',
      isApproved: true,
      collegeId: college._id
    });

    // 3. Create Event with exactly 5 slots and registeredCount initialized to 0
    const event = await Event.create({
      title: 'High-Concurrency Coding Cup',
      description: 'Exclusive 5-seat hackathon round',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days in future
      venue: 'Lab 404',
      category: 'Technical',
      eventType: 'solo',
      maxSlots: 5,
      registeredCount: 0,
      isApproved: true,
      collegeId: college._id,
      createdBy: organizer._id
    });

    // 4. Create 20 unique students and generate their JWT tokens
    const studentCount = 20;
    const students = [];
    const tokens = [];

    for (let i = 1; i <= studentCount; i++) {
      const student = await User.create({
        name: `Student Concurrency ${i}`,
        email: `student.concurrency.${i}@test.com`,
        password: 'password123',
        role: 'student',
        isApproved: true,
        collegeId: college._id
      });
      students.push(student);
      tokens.push(generateToken(student));
    }

    // 5. Fire 20 simultaneous registrations using Promise.all
    const registrationRequests = tokens.map((token) =>
      request(app)
        .post(`/api/registration/register/${event._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({})
    );

    const responses = await Promise.all(registrationRequests);

    // 6. Assertions
    const successfulResponses = responses.filter((res) => res.status === 201);
    const rejectedResponses = responses.filter((res) => res.status === 400);

    // EXACTLY 5 must succeed, and 15 must be rejected
    expect(successfulResponses.length).toBe(5);
    expect(rejectedResponses.length).toBe(15);

    // Verify all 15 rejected responses returned the capacity message
    rejectedResponses.forEach((res) => {
      expect(res.body.message).toMatch(/maximum capacity|no remaining slots/i);
    });

    // 7. Verify atomic persistence in MongoDB
    const updatedEvent = await Event.findById(event._id);
    expect(updatedEvent.registeredCount).toBe(5);

    const totalRegistrationsInDB = await Registration.countDocuments({ event: event._id });
    expect(totalRegistrationsInDB).toBe(5);
  });
});
