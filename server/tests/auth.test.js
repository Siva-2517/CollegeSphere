const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const OTP = require('../models/OTP');
const College = require('../models/College');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('./testHelper');

describe('Auth & User Onboarding Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  test('POST /api/auth/send-otp generates a valid 6-digit OTP', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ email: 'newstudent@college.edu' });

    expect(res.status).toBe(200);
    expect(res.body.msg).toMatch(/otp sent successfully/i);

    const savedOtp = await OTP.findOne({ email: 'newstudent@college.edu' });
    expect(savedOtp).toBeDefined();
    expect(savedOtp.otp).toHaveLength(6);
  });

  test('POST /api/auth/register creates user with valid OTP', async () => {
    const college = await College.create({
      name: 'Auth Test University',
      location: 'Main Campus',
      isVerified: true
    });

    await OTP.create({ email: 'register.test@college.edu', otp: '123456' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Builder',
        email: 'register.test@college.edu',
        password: 'securepassword123',
        role: 'student',
        collegeId: college._id,
        otp: '123456'
      });

    expect(res.status).toBe(201);
    expect(res.body.msg).toMatch(/user registered successfully/i);
    expect(res.body.user.email).toBe('register.test@college.edu');

    const createdUser = await User.findOne({ email: 'register.test@college.edu' });
    expect(createdUser).toBeDefined();
    expect(createdUser.role).toBe('student');
  });

  test('POST /api/auth/register rejects duplicate email', async () => {
    const college = await College.create({
      name: 'Duplicate University',
      isVerified: true
    });

    await User.create({
      name: 'Existing User',
      email: 'duplicate@college.edu',
      password: 'password123',
      role: 'student',
      collegeId: college._id
    });

    await OTP.create({ email: 'duplicate@college.edu', otp: '654321' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Existing User 2',
        email: 'duplicate@college.edu',
        password: 'password123',
        role: 'student',
        collegeId: college._id,
        otp: '654321'
      });

    expect(res.status).toBe(400);
    expect(res.body.msg).toMatch(/user with this email already exists|user already exists/i);
  });

  test('POST /api/auth/login returns JWT on valid credentials and rejects invalid password', async () => {
    const college = await College.create({
      name: 'Login University',
      isVerified: true
    });

    await User.create({
      name: 'Login User',
      email: 'login@college.edu',
      password: 'mypassword123',
      role: 'student',
      collegeId: college._id
    });

    // Valid login
    const validRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@college.edu',
        password: 'mypassword123'
      });

    expect(validRes.status).toBe(200);
    expect(validRes.body.token).toBeDefined();
    expect(validRes.body.user.email).toBe('login@college.edu');

    // Invalid login
    const invalidRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@college.edu',
        password: 'wrongpassword'
      });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.msg).toMatch(/invalid email or password/i);
  });
});
