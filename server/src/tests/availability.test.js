/**
 * @fileoverview Tests for Scheduled Availability Slots
 * @module tests/integration/availability
 * @requires supertest
 * @requires mongoose
 *
 * Tests cover:
 * - Weekly recurring slots
 * - Custom date-specific availability
 * - Availability checking logic
 * - Timezone handling
 * - Integration with matching algorithm
 * - CRUD operations for slots
 *
 * @see server/src/models/DonorProfile.js
 * @see server/src/controllers/availabilityController.js
 * @see server/src/services/matchingService.js
 */

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index.js';
import User from '../models/User.js';
import Donor from '../models/Donor.js';
import DonorProfile from '../models/DonorProfile.js';

describe('Scheduled Availability Slots', () => {
  let donorToken;
  let donorUser;
  let donorProfile;

  beforeAll(async () => {
    const testDbUri = process.env.TEST_DB_URI || 'mongodb://localhost:27017/bloodlink_test';
    await mongoose.connect(testDbUri);

    // Create donor user
    donorUser = await Donor.create({
      email: 'donor@test.com',
      password: 'password123',
      role: 'donor',
      name: 'Test Donor',
      phone: '+8801700000000',
      dateOfBirth: new Date('1995-01-01'),
      gender: 'male',
      bloodType: 'A+',
      address: {
        city: 'Dhaka',
        country: 'Bangladesh'
      },
      location: {
        type: 'Point',
        coordinates: [90.3563, 23.6850]
      }
    });

    // Get or create donor profile
    donorProfile = await DonorProfile.findOne({ user: donorUser._id });
    if (!donorProfile) {
      donorProfile = await DonorProfile.create({
        user: donorUser._id,
        isAvailable: true
      });
    }

    // Login donor
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'donor@test.com',
        password: 'password123'
      });

    donorToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await DonorProfile.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    // Reset donor profile availability settings
    await DonorProfile.updateOne(
      { user: donorUser._id },
      {
        $set: {
          'availabilitySchedule.enabled': false,
          'availabilitySchedule.weeklySlots': [],
          'availabilitySchedule.customAvailability': []
        }
      }
    );
  });

  describe('GET /api/availability - Get Own Availability Schedule', () => {
    it('should return donor availability schedule', async () => {
      const res = await request(app)
        .get('/api/availability')
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.availabilitySchedule).toBeDefined();
      expect(res.body.data.availabilitySchedule.enabled).toBe(false); // Default
      expect(res.body.data.availabilitySchedule.weeklySlots).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/availability')
        .expect(401);
    });
  });

  describe('PUT /api/availability/toggle - Toggle Scheduled Availability', () => {
    it('should enable scheduled availability', async () => {
      const res = await request(app)
        .put('/api/availability/toggle')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ enabled: true })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.donorProfile.availabilitySchedule.enabled).toBe(true);
    });

    it('should disable scheduled availability', async () => {
      const res = await request(app)
        .put('/api/availability/toggle')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ enabled: false })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.donorProfile.availabilitySchedule.enabled).toBe(false);
    });

    it('should validate enabled field type', async () => {
      const res = await request(app)
        .put('/api/availability/toggle')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ enabled: 'invalid' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/availability/weekly - Add Weekly Slot', () => {
    it('should add weekly availability slot', async () => {
      const slotData = {
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00'
      };

      const res = await request(app)
        .post('/api/availability/weekly')
        .set('Authorization', `Bearer ${donorToken}`)
        .send(slotData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.donorProfile.availabilitySchedule.weeklySlots).toHaveLength(1);
      expect(res.body.data.donorProfile.availabilitySchedule.weeklySlots[0].dayOfWeek).toBe(1);
      expect(res.body.data.donorProfile.availabilitySchedule.weeklySlots[0].startTime).toBe('09:00');
    });

    it('should validate dayOfWeek range (0-6)', async () => {
      const slotData = {
        dayOfWeek: 7, // Invalid: must be 0-6
        startTime: '09:00',
        endTime: '17:00'
      };

      const res = await request(app)
        .post('/api/availability/weekly')
        .set('Authorization', `Bearer ${donorToken}`)
        .send(slotData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should validate time format (HH:MM)', async () => {
      const slotData = {
        dayOfWeek: 1,
        startTime: '9:00', // Invalid format (should be 09:00)
        endTime: '17:00'
      };

      const res = await request(app)
        .post('/api/availability/weekly')
        .set('Authorization', `Bearer ${donorToken}`)
        .send(slotData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should allow adding multiple slots', async () => {
      // Add Monday slot
      await request(app)
        .post('/api/availability/weekly')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00'
        });

      // Add Friday slot
      const res = await request(app)
        .post('/api/availability/weekly')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          dayOfWeek: 5,
          startTime: '14:00',
          endTime: '20:00'
        })
        .expect(201);

      expect(res.body.data.donorProfile.availabilitySchedule.weeklySlots).toHaveLength(2);
    });

    it('should allow midnight-crossing slots', async () => {
      const slotData = {
        dayOfWeek: 5, // Friday night to Saturday morning
        startTime: '23:00',
        endTime: '01:00' // Crosses midnight
      };

      const res = await request(app)
        .post('/api/availability/weekly')
        .set('Authorization', `Bearer ${donorToken}`)
        .send(slotData)
        .expect(201);

      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/availability/weekly/:slotId - Update Weekly Slot', () => {
    let slotId;

    beforeEach(async () => {
      // Create a slot first
      const res = await request(app)
        .post('/api/availability/weekly')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00'
        });

      slotId = res.body.data.donorProfile.availabilitySchedule.weeklySlots[0]._id;
    });

    it('should update weekly slot', async () => {
      const updates = {
        startTime: '10:00',
        endTime: '18:00'
      };

      const res = await request(app)
        .put(`/api/availability/weekly/${slotId}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send(updates)
        .expect(200);

      expect(res.body.success).toBe(true);
      const updatedSlot = res.body.data.donorProfile.availabilitySchedule.weeklySlots
        .find(slot => slot._id.toString() === slotId.toString());
      expect(updatedSlot.startTime).toBe('10:00');
      expect(updatedSlot.endTime).toBe('18:00');
    });

    it('should toggle slot active status', async () => {
      const res = await request(app)
        .put(`/api/availability/weekly/${slotId}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(res.body.success).toBe(true);
      const updatedSlot = res.body.data.donorProfile.availabilitySchedule.weeklySlots
        .find(slot => slot._id.toString() === slotId.toString());
      expect(updatedSlot.isActive).toBe(false);
    });

    it('should return 404 for non-existent slot', async () => {
      const fakeSlotId = new mongoose.Types.ObjectId();

      await request(app)
        .put(`/api/availability/weekly/${fakeSlotId}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ startTime: '10:00' })
        .expect(404);
    });
  });

  describe('DELETE /api/availability/weekly/:slotId - Delete Weekly Slot', () => {
    let slotId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/availability/weekly')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00'
        });

      slotId = res.body.data.donorProfile.availabilitySchedule.weeklySlots[0]._id;
    });

    it('should delete weekly slot', async () => {
      const res = await request(app)
        .delete(`/api/availability/weekly/${slotId}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.donorProfile.availabilitySchedule.weeklySlots).toHaveLength(0);
    });

    it('should return 404 for non-existent slot', async () => {
      const fakeSlotId = new mongoose.Types.ObjectId();

      await request(app)
        .delete(`/api/availability/weekly/${fakeSlotId}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(404);
    });
  });

  describe('POST /api/availability/custom - Add Custom Availability', () => {
    it('should add custom availability', async () => {
      const customData = {
        startDate: new Date('2025-12-25'),
        endDate: new Date('2025-12-31'),
        startTime: '10:00',
        endTime: '16:00',
        isAvailable: true,
        reason: 'Holiday availability'
      };

      const res = await request(app)
        .post('/api/availability/custom')
        .set('Authorization', `Bearer ${donorToken}`)
        .send(customData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.donorProfile.availabilitySchedule.customAvailability).toHaveLength(1);
      expect(res.body.data.donorProfile.availabilitySchedule.customAvailability[0].reason).toBe('Holiday availability');
    });

    it('should add vacation/unavailability period', async () => {
      const customData = {
        startDate: new Date('2025-12-25'),
        endDate: new Date('2025-12-31'),
        isAvailable: false,
        reason: 'On vacation'
      };

      const res = await request(app)
        .post('/api/availability/custom')
        .set('Authorization', `Bearer ${donorToken}`)
        .send(customData)
        .expect(201);

      expect(res.body.success).toBe(true);
      const custom = res.body.data.donorProfile.availabilitySchedule.customAvailability[0];
      expect(custom.isAvailable).toBe(false);
      expect(custom.reason).toBe('On vacation');
    });

    it('should validate endDate after startDate', async () => {
      const customData = {
        startDate: new Date('2025-12-31'),
        endDate: new Date('2025-12-25'), // Before start date
        isAvailable: true,
        reason: 'Invalid date range'
      };

      const res = await request(app)
        .post('/api/availability/custom')
        .set('Authorization', `Bearer ${donorToken}`)
        .send(customData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should allow all-day custom availability (no times)', async () => {
      const customData = {
        startDate: new Date('2025-12-25'),
        endDate: new Date('2025-12-25'),
        isAvailable: true,
        reason: 'Available all day Christmas'
        // No startTime or endTime
      };

      const res = await request(app)
        .post('/api/availability/custom')
        .set('Authorization', `Bearer ${donorToken}`)
        .send(customData)
        .expect(201);

      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/availability/custom/:customId - Update Custom Availability', () => {
    let customId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/availability/custom')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          startDate: new Date('2025-12-25'),
          endDate: new Date('2025-12-31'),
          isAvailable: true,
          reason: 'Original reason'
        });

      customId = res.body.data.donorProfile.availabilitySchedule.customAvailability[0]._id;
    });

    it('should update custom availability', async () => {
      const updates = {
        reason: 'Updated reason',
        isAvailable: false
      };

      const res = await request(app)
        .put(`/api/availability/custom/${customId}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send(updates)
        .expect(200);

      expect(res.body.success).toBe(true);
      const updated = res.body.data.donorProfile.availabilitySchedule.customAvailability
        .find(c => c._id.toString() === customId.toString());
      expect(updated.reason).toBe('Updated reason');
      expect(updated.isAvailable).toBe(false);
    });

    it('should return 404 for non-existent custom availability', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .put(`/api/availability/custom/${fakeId}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ reason: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /api/availability/custom/:customId - Delete Custom Availability', () => {
    let customId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/availability/custom')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          startDate: new Date('2025-12-25'),
          endDate: new Date('2025-12-31'),
          isAvailable: true,
          reason: 'To be deleted'
        });

      customId = res.body.data.donorProfile.availabilitySchedule.customAvailability[0]._id;
    });

    it('should delete custom availability', async () => {
      const res = await request(app)
        .delete(`/api/availability/custom/${customId}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.donorProfile.availabilitySchedule.customAvailability).toHaveLength(0);
    });
  });

  describe('POST /api/availability/check - Check Availability at Time', () => {
    beforeEach(async () => {
      // Enable scheduled availability
      await request(app)
        .put('/api/availability/toggle')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ enabled: true });

      // Add Monday 9-5 slot
      await request(app)
        .post('/api/availability/weekly')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          dayOfWeek: 1, // Monday
          startTime: '09:00',
          endTime: '17:00'
        });
    });

    it('should check availability at specific time', async () => {
      // Create a Monday at 10:00
      const checkTime = new Date('2025-12-29T10:00:00+06:00'); // Monday in Bangladesh timezone

      const res = await request(app)
        .post('/api/availability/check')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ dateTime: checkTime })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isAvailable).toBe(true);
      expect(res.body.data.reason).toContain('Weekly schedule');
    });

    it('should return false when outside scheduled hours', async () => {
      // Create a Monday at 20:00 (8 PM)
      const checkTime = new Date('2025-12-29T20:00:00+06:00');

      const res = await request(app)
        .post('/api/availability/check')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ dateTime: checkTime })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isAvailable).toBe(false);
    });

    it('should prioritize custom availability over weekly schedule', async () => {
      // Add vacation for next Monday
      await request(app)
        .post('/api/availability/custom')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          startDate: new Date('2025-12-29'),
          endDate: new Date('2025-12-29'),
          isAvailable: false,
          reason: 'On leave'
        });

      // Check Monday at 10:00 (would normally be available)
      const checkTime = new Date('2025-12-29T10:00:00+06:00');

      const res = await request(app)
        .post('/api/availability/check')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ dateTime: checkTime })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isAvailable).toBe(false);
      expect(res.body.data.reason).toContain('Custom availability');
    });
  });

  describe('GET /api/availability/donor/:donorId - Get Donor Availability (Public)', () => {
    it('should return donor availability schedule (public endpoint)', async () => {
      const res = await request(app)
        .get(`/api/availability/donor/${donorUser._id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.availabilitySchedule).toBeDefined();
      expect(res.body.data.isAvailable).toBeDefined();
    });

    it('should return 404 for non-existent donor', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .get(`/api/availability/donor/${fakeId}`)
        .expect(404);
    });
  });

  describe('Availability Logic - Model Methods', () => {
    beforeEach(async () => {
      // Enable scheduled availability
      donorProfile.availabilitySchedule.enabled = true;

      // Add Monday 9-5 slot
      donorProfile.availabilitySchedule.weeklySlots.push({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        isActive: true
      });

      await donorProfile.save();
    });

    it('should check availability at specific time using model method', async () => {
      // Monday at 10:00
      const testTime = new Date('2025-12-29T10:00:00+06:00');

      const isAvailable = await donorProfile.isAvailableAt(testTime);

      expect(isAvailable).toBe(true);
    });

    it('should handle disabled weekly slot', async () => {
      // Disable the slot
      donorProfile.availabilitySchedule.weeklySlots[0].isActive = false;
      await donorProfile.save();

      const testTime = new Date('2025-12-29T10:00:00+06:00');
      const isAvailable = await donorProfile.isAvailableAt(testTime);

      expect(isAvailable).toBe(false);
    });

    it('should fall back to isAvailable flag when scheduled availability disabled', async () => {
      donorProfile.availabilitySchedule.enabled = false;
      donorProfile.isAvailable = true;
      await donorProfile.save();

      const testTime = new Date('2025-12-29T10:00:00+06:00');
      const isAvailable = await donorProfile.isAvailableAt(testTime);

      expect(isAvailable).toBe(true);
    });
  });
});
