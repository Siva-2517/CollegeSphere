const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const College = require('../models/College');
const { connectTestDB, disconnectTestDB, clearTestDB, generateToken } = require('./testHelper');

describe('Role Guards & Permission Enforcement Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  test('Missing or invalid Authorization token returns 401', async () => {
    const res = await request(app)
      .get('/api/admin/organizers/pending');

    expect(res.status).toBe(401);
    expect(res.body.msg).toMatch(/no token provided|authorization denied/i);
  });

  test('Student role is forbidden from creating events (403)', async () => {
    const college = await College.create({ name: 'Role Test College', isVerified: true });
    const student = await User.create({
      name: 'Sneaky Student',
      email: 'sneaky@college.edu',
      password: 'password123',
      role: 'student',
      collegeId: college._id
    });

    const token = generateToken(student);

    const res = await request(app)
      .post('/api/event/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Unauthorized Event',
        description: 'Should fail',
        date: new Date(Date.now() + 86400000),
        venue: 'Room 1',
        collegeId: college._id,
        registrationDeadline: new Date(Date.now() + 43200000),
        category: 'Technical'
      });

    expect(res.status).toBe(403);
    expect(res.body.msg).toMatch(/user role not authorized/i);
  });

  test('Unapproved organizer is blocked with 403', async () => {
    const college = await College.create({ name: 'Pending College', isVerified: true });
    const unapprovedOrganizer = await User.create({
      name: 'Pending Org',
      email: 'pending.org@college.edu',
      password: 'password123',
      role: 'organizer',
      isApproved: false,
      collegeId: college._id
    });

    const token = generateToken(unapprovedOrganizer);

    const res = await request(app)
      .post('/api/event/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Blocked Event',
        description: 'Should be rejected',
        date: new Date(Date.now() + 86400000),
        venue: 'Hall A',
        collegeId: college._id,
        registrationDeadline: new Date(Date.now() + 43200000),
        category: 'Cultural'
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admin approval pending/i);
  });

  test('Organizer cannot create events for another college (403)', async () => {
    const collegeA = await College.create({ name: 'College A', isVerified: true });
    const collegeB = await College.create({ name: 'College B', isVerified: true });

    const organizerA = await User.create({
      name: 'Organizer A',
      email: 'org.a@collegea.edu',
      password: 'password123',
      role: 'organizer',
      isApproved: true,
      collegeId: collegeA._id
    });

    const token = generateToken(organizerA);

    const res = await request(app)
      .post('/api/event/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Cross College Event',
        description: 'Cross college event should fail',
        date: new Date(Date.now() + 86400000),
        venue: 'College B Arena',
        collegeId: collegeB._id, // Mismatched college
        registrationDeadline: new Date(Date.now() + 43200000),
        category: 'Sports'
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/only for your own college/i);
  });
});
