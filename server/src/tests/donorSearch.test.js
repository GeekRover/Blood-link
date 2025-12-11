import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index.js';
import User from '../models/User.js';

describe('Donor Search Tests', () => {
  let token;

  beforeAll(async () => {
    const testDbUri = process.env.TEST_DB_URI || 'mongodb://localhost:27017/bloodlink_test';
    await mongoose.connect(testDbUri);

    // Create authenticated user
    const res = await request(app).post('/api/auth/register').send({
      email: 'searchuser@test.com',
      password: 'Test@123',
      role: 'recipient',
      name: 'Search User',
      phone: '01712345700',
      dateOfBirth: '1990-01-01',
      gender: 'female',
      bloodType: 'O+',
      address: { city: 'Dhaka' },
      location: { type: 'Point', coordinates: [90.4125, 23.8103] },
      emergencyContact: {
        name: 'Emergency',
        phone: '01712345701',
        relationship: 'Friend'
      }
    });
    token = res.body.data.token;

    // Create test donors
    await request(app).post('/api/auth/register').send({
      email: 'donor1@test.com',
      password: 'Test@123',
      role: 'donor',
      name: 'Donor One',
      phone: '01712345702',
      dateOfBirth: '1992-01-01',
      gender: 'male',
      bloodType: 'A+',
      address: { city: 'Dhaka' },
      location: { type: 'Point', coordinates: [90.4125, 23.8103] }
    });

    await request(app).post('/api/auth/register').send({
      email: 'donor2@test.com',
      password: 'Test@123',
      role: 'donor',
      name: 'Donor Two',
      phone: '01712345703',
      dateOfBirth: '1993-01-01',
      gender: 'male',
      bloodType: 'O+',
      address: { city: 'Dhaka' },
      location: { type: 'Point', coordinates: [90.4126, 23.8104] }
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/donors/search', () => {
    it('should search donors by blood type and location', async () => {
      const res = await request(app)
        .get('/api/donors/search')
        .query({
          bloodType: 'O+',
          latitude: 23.8103,
          longitude: 90.4125,
          radius: 10
        })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should require blood type and coordinates', async () => {
      const res = await request(app)
        .get('/api/donors/search')
        .query({ bloodType: 'A+' })
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/donors/search')
        .query({
          bloodType: 'A+',
          latitude: 23.8103,
          longitude: 90.4125
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
