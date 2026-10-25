const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

let mongoServer;

const connectTestDB = async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

const disconnectTestDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';
  return jwt.sign(
    {
      Id: user._id || user.id,
      role: user.role || 'student',
      isApproved: user.isApproved !== undefined ? user.isApproved : true,
      collegeId: user.collegeId || null
    },
    secret,
    { expiresIn: '3h' }
  );
};

module.exports = {
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
  generateToken
};
