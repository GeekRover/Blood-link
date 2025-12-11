import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index.js';
import User from '../models/User.js';
import BloodRequest from '../models/BloodRequest.js';

describe('Blood Request Tests', () => {
  let recipientToken;
  let donorToken;

  beforeAll(async () => {
    const testDbUri = process.env.TEST_DB_URI || 'mongodb://localhost:27017/bloodlink_test';
    await mongoose.connect(testDbUri);

    // Create recipient
    const recipientRes = await request(app).post('/api/auth/register').send({
      email: 'recipient@test.com',
      password: 'Test@123',
      role: 'recipient',
      name: 'Test Recipient',
      phone: '01712345690',
      dateOfBirth: '1990-01-01',
      gender: 'female',
      bloodType: 'A+',
      address: { city: 'Dhaka' },
      location: { type: 'Point', coordinates: [90.4125, 23.8103] },
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '01712345691',
        relationship: 'Spouse'
      }
    });
    recipientToken = recipientRes.body.data.token;

    // Create donor
    const donorRes = await request(app).post('/api/auth/register').send({
      email: 'donor@test.com',
      password: 'Test@123',
      role: 'donor',
      name: 'Test Donor',
      phone: '01712345692',
      dateOfBirth: '1992-01-01',
      gender: 'male',
      bloodType: 'A+',
      address: { city: 'Dhaka' },
      location: { type: 'Point', coordinates: [90.4125, 23.8103] }
    });
    donorToken = donorRes.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await BloodRequest.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/requests', () => {
    it('should create blood request as recipient', async () => {
      const requestData = {
        patientName: 'John Doe',
        bloodType: 'A+',
        unitsRequired: 2,
        urgency: 'urgent',
        hospital: {
          name: 'Dhaka Medical College',
          address: 'Dhaka',
          contactNumber: '01712345693',
          location: {
            type: 'Point',
            coordinates: [90.4125, 23.8103]
          }
        },
        requiredBy: new Date(Date.now() + 24 * 60 * 60 * 1000),
        medicalReason: 'Surgery'
      };

      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${recipientToken}`)
        .send(requestData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.patientName).toBe('John Doe');
    });

    it('should not create request as donor', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          patientName: 'Jane Doe',
          bloodType: 'B+',
          unitsRequired: 1,
          urgency: 'normal',
          hospital: {
            name: 'Test Hospital',
            location: { type: 'Point', coordinates: [90.4125, 23.8103] }
          },
          requiredBy: new Date(Date.now() + 24 * 60 * 60 * 1000),
          medicalReason: 'Emergency'
        })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/requests', () => {
    it('should get all blood requests', async () => {
      const res = await request(app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
