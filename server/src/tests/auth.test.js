import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index.js';
import User from '../models/User.js';

const API_URL = '/api/auth';

describe('Authentication Tests', () => {
  beforeAll(async () => {
    const testDbUri = process.env.TEST_DB_URI || 'mongodb://localhost:27017/bloodlink_test';
    await mongoose.connect(testDbUri);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new donor successfully', async () => {
      const userData = {
        email: 'donor@test.com',
        password: 'Test@123',
        role: 'donor',
        name: 'Test Donor',
        phone: '01712345678',
        dateOfBirth: '1995-01-01',
        gender: 'male',
        bloodType: 'A+',
        address: {
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        location: {
          type: 'Point',
          coordinates: [90.4125, 23.8103]
        }
      };

      const res = await request(app)
        .post(`${API_URL}/register`)
        .send(userData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(userData.email);
      expect(res.body.data.token).toBeDefined();
    });

    it('should not register with duplicate email', async () => {
      const userData = {
        email: 'duplicate@test.com',
        password: 'Test@123',
        role: 'donor',
        name: 'Test User',
        phone: '01712345679',
        dateOfBirth: '1995-01-01',
        gender: 'male',
        bloodType: 'B+',
        address: { city: 'Dhaka' },
        location: { type: 'Point', coordinates: [90.4125, 23.8103] }
      };

      await request(app).post(`${API_URL}/register`).send(userData);

      const res = await request(app)
        .post(`${API_URL}/register`)
        .send(userData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post(`${API_URL}/register`)
        .send({
          email: 'incomplete@test.com',
          password: 'Test@123'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post(`${API_URL}/register`).send({
        email: 'login@test.com',
        password: 'Test@123',
        role: 'donor',
        name: 'Login Test',
        phone: '01712345680',
        dateOfBirth: '1995-01-01',
        gender: 'male',
        bloodType: 'O+',
        address: { city: 'Dhaka' },
        location: { type: 'Point', coordinates: [90.4125, 23.8103] }
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post(`${API_URL}/login`)
        .send({
          email: 'login@test.com',
          password: 'Test@123'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('login@test.com');
    });

    it('should not login with invalid password', async () => {
      const res = await request(app)
        .post(`${API_URL}/login`)
        .send({
          email: 'login@test.com',
          password: 'WrongPassword'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post(`${API_URL}/login`)
        .send({
          email: 'nonexistent@test.com',
          password: 'Test@123'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app).post(`${API_URL}/register`).send({
        email: 'profile@test.com',
        password: 'Test@123',
        role: 'donor',
        name: 'Profile Test',
        phone: '01712345681',
        dateOfBirth: '1995-01-01',
        gender: 'male',
        bloodType: 'AB+',
        address: { city: 'Dhaka' },
        location: { type: 'Point', coordinates: [90.4125, 23.8103] }
      });

      token = res.body.data.token;
    });

    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get(`${API_URL}/profile`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('profile@test.com');
    });

    it('should not get profile without token', async () => {
      const res = await request(app)
        .get(`${API_URL}/profile`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
