import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index.js';
import User from '../models/User.js';
import DonorProfile from '../models/DonorProfile.js';
import BloodRequest from '../models/BloodRequest.js';
import {
  checkRequestVisibility,
  getCompatibleRecipientTypes,
  getVisibleRequestsForDonor
} from '../services/requestVisibilityService.js';

describe('Request Visibility Controls Tests', () => {
  let recipientToken;
  let donorToken;
  let adminToken;
  let donorId;
  let recipientId;
  let testRequestId;

  // Test data for location-based tests
  const dhakaLocation = { type: 'Point', coordinates: [90.4125, 23.8103] }; // Dhaka
  const chittagongLocation = { type: 'Point', coordinates: [91.8325, 22.3569] }; // Chittagong (~250km away)
  const nearDhakaLocation = { type: 'Point', coordinates: [90.4200, 23.8150] }; // Very close to Dhaka (~1km)

  beforeAll(async () => {
    const testDbUri = process.env.TEST_DB_URI || 'mongodb://localhost:27017/bloodlink_test';
    await mongoose.connect(testDbUri);

    // Clean up before tests
    await User.deleteMany({});
    await BloodRequest.deleteMany({});

    // Create recipient (needs A+ blood)
    const recipientRes = await request(app).post('/api/auth/register').send({
      email: 'recipient.visibility@test.com',
      password: 'Test@123',
      role: 'recipient',
      name: 'Test Recipient',
      phone: '01712345700',
      dateOfBirth: '1990-01-01',
      gender: 'female',
      bloodType: 'A+',
      address: { city: 'Dhaka', street: '123 Test St', state: 'Dhaka', country: 'Bangladesh' },
      location: dhakaLocation,
      medicalDataConsent: true,
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '01712345701',
        relationship: 'Spouse'
      }
    });
    recipientToken = recipientRes.body.data?.token;
    recipientId = recipientRes.body.data?.user?._id;

    // Create donor (O- universal donor, located in Dhaka)
    const donorRes = await request(app).post('/api/auth/register').send({
      email: 'donor.visibility@test.com',
      password: 'Test@123',
      role: 'donor',
      name: 'Test Donor O-',
      phone: '01712345702',
      dateOfBirth: '1992-01-01',
      gender: 'male',
      bloodType: 'O-',
      address: { city: 'Dhaka', street: '456 Test St', state: 'Dhaka', country: 'Bangladesh' },
      location: dhakaLocation,
      medicalDataConsent: true
    });
    donorToken = donorRes.body.data?.token;
    donorId = donorRes.body.data?.user?._id;

    // Create admin
    const adminRes = await request(app).post('/api/auth/register').send({
      email: 'admin.visibility@test.com',
      password: 'Test@123',
      role: 'admin',
      name: 'Test Admin',
      phone: '01712345703',
      dateOfBirth: '1985-01-01',
      gender: 'male',
      bloodType: 'AB+',
      address: { city: 'Dhaka' },
      location: dhakaLocation,
      medicalDataConsent: true
    });
    adminToken = adminRes.body.data?.token;

    // Manually verify the donor to allow them in searches
    if (donorId) {
      await DonorProfile.findByIdAndUpdate(donorId, {
        verificationStatus: 'verified',
        isAvailable: true,
        availabilityRadius: 50 // 50km radius
      });
    }
  });

  afterAll(async () => {
    await User.deleteMany({});
    await BloodRequest.deleteMany({});
    await mongoose.connection.close();
  });

  // ========================================
  // Unit Tests for Visibility Service
  // ========================================

  describe('Blood Type Compatibility (getCompatibleRecipientTypes)', () => {
    it('O- can donate to all blood types (universal donor)', () => {
      const compatible = getCompatibleRecipientTypes('O-');
      expect(compatible).toEqual(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']);
    });

    it('O+ can donate to O+, A+, B+, AB+', () => {
      const compatible = getCompatibleRecipientTypes('O+');
      expect(compatible).toEqual(['O+', 'A+', 'B+', 'AB+']);
    });

    it('A- can donate to A-, A+, AB-, AB+', () => {
      const compatible = getCompatibleRecipientTypes('A-');
      expect(compatible).toEqual(['A-', 'A+', 'AB-', 'AB+']);
    });

    it('A+ can donate to A+, AB+', () => {
      const compatible = getCompatibleRecipientTypes('A+');
      expect(compatible).toEqual(['A+', 'AB+']);
    });

    it('B- can donate to B-, B+, AB-, AB+', () => {
      const compatible = getCompatibleRecipientTypes('B-');
      expect(compatible).toEqual(['B-', 'B+', 'AB-', 'AB+']);
    });

    it('B+ can donate to B+, AB+', () => {
      const compatible = getCompatibleRecipientTypes('B+');
      expect(compatible).toEqual(['B+', 'AB+']);
    });

    it('AB- can donate to AB-, AB+', () => {
      const compatible = getCompatibleRecipientTypes('AB-');
      expect(compatible).toEqual(['AB-', 'AB+']);
    });

    it('AB+ can only donate to AB+ (universal recipient)', () => {
      const compatible = getCompatibleRecipientTypes('AB+');
      expect(compatible).toEqual(['AB+']);
    });

    it('Invalid blood type returns empty array', () => {
      const compatible = getCompatibleRecipientTypes('X+');
      expect(compatible).toEqual([]);
    });
  });

  describe('Visibility Check (checkRequestVisibility)', () => {
    const mockDonor = {
      _id: new mongoose.Types.ObjectId(),
      bloodType: 'O-',
      location: { coordinates: [90.4125, 23.8103] }, // Dhaka
      availabilityRadius: 50
    };

    it('should allow visibility for compatible blood type within radius', () => {
      const mockRequest = {
        _id: new mongoose.Types.ObjectId(),
        bloodType: 'A+', // O- can donate to A+
        hospital: { location: { coordinates: [90.4200, 23.8150] } }, // ~1km away
        urgency: 'normal',
        matchedDonors: []
      };

      const result = checkRequestVisibility(mockRequest, mockDonor);
      expect(result.visible).toBe(true);
      expect(result.reason).toBe('within_criteria');
    });

    it('should hide request for incompatible blood type', () => {
      const mockRequest = {
        _id: new mongoose.Types.ObjectId(),
        bloodType: 'A+',
        hospital: { location: { coordinates: [90.4200, 23.8150] } },
        urgency: 'normal',
        matchedDonors: []
      };

      const abPlusDonor = {
        ...mockDonor,
        bloodType: 'AB+' // AB+ cannot donate to A+
      };

      const result = checkRequestVisibility(mockRequest, abPlusDonor);
      expect(result.visible).toBe(false);
      expect(result.reason).toBe('blood_type_incompatible');
    });

    it('should hide request outside donor radius', () => {
      const mockRequest = {
        _id: new mongoose.Types.ObjectId(),
        bloodType: 'A+',
        hospital: { location: { coordinates: [91.8325, 22.3569] } }, // Chittagong (~250km away)
        urgency: 'normal',
        matchedDonors: []
      };

      const result = checkRequestVisibility(mockRequest, mockDonor);
      expect(result.visible).toBe(false);
      expect(result.reason).toBe('outside_radius');
    });

    it('should show critical request even if outside radius', () => {
      const mockRequest = {
        _id: new mongoose.Types.ObjectId(),
        bloodType: 'A+',
        hospital: { location: { coordinates: [91.8325, 22.3569] } }, // Chittagong
        urgency: 'critical',
        matchedDonors: []
      };

      const result = checkRequestVisibility(mockRequest, mockDonor);
      expect(result.visible).toBe(true);
      expect(result.reason).toBe('critical_urgent_bypass');
    });

    it('should show urgent request even if outside radius', () => {
      const mockRequest = {
        _id: new mongoose.Types.ObjectId(),
        bloodType: 'A+',
        hospital: { location: { coordinates: [91.8325, 22.3569] } }, // Chittagong
        urgency: 'urgent',
        matchedDonors: []
      };

      const result = checkRequestVisibility(mockRequest, mockDonor);
      expect(result.visible).toBe(true);
      expect(result.reason).toBe('critical_urgent_bypass');
    });

    it('should always show request if donor is already matched', () => {
      const mockRequest = {
        _id: new mongoose.Types.ObjectId(),
        bloodType: 'AB+', // Not compatible with O-
        hospital: { location: { coordinates: [91.8325, 22.3569] } }, // Far away
        urgency: 'normal',
        matchedDonors: [{ donor: mockDonor._id }] // Donor is matched
      };

      // Even though AB+ is not compatible with O- donor, they're matched
      const result = checkRequestVisibility(mockRequest, mockDonor);
      expect(result.visible).toBe(true);
      expect(result.reason).toBe('already_matched');
    });
  });

  // ========================================
  // Integration Tests for API Endpoints
  // ========================================

  describe('GET /api/requests (Donor visibility filtering)', () => {
    beforeAll(async () => {
      // Skip if registration failed
      if (!recipientToken) {
        console.log('Skipping - recipient registration failed');
        return;
      }

      // Create a blood request for testing
      const requestData = {
        patientName: 'Visibility Test Patient',
        bloodType: 'A+', // O- donor can donate to A+
        unitsRequired: 2,
        urgency: 'normal',
        hospital: {
          name: 'Dhaka Medical College',
          address: 'Dhaka',
          contactNumber: '01712345693',
          location: nearDhakaLocation
        },
        requiredBy: new Date(Date.now() + 24 * 60 * 60 * 1000),
        medicalReason: 'Surgery'
      };

      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${recipientToken}`)
        .send(requestData);

      if (res.body.data?._id) {
        testRequestId = res.body.data._id;
      }
    });

    it('should return visibility info for donors', async () => {
      if (!donorToken) {
        console.log('Skipping - donor registration failed');
        return;
      }

      const res = await request(app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.donorInfo).toBeDefined();
      expect(res.body.donorInfo.bloodType).toBe('O-');
      expect(res.body.donorInfo.compatibleBloodTypes).toContain('A+');
      expect(res.body.visibility).toBeDefined();
    });

    it('should not include donorInfo for recipients', async () => {
      if (!recipientToken) {
        console.log('Skipping - recipient registration failed');
        return;
      }

      const res = await request(app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.donorInfo).toBeUndefined();
    });
  });

  describe('GET /api/requests/donor/visibility-info', () => {
    it('should return donor visibility information', async () => {
      if (!donorToken) {
        console.log('Skipping - donor registration failed');
        return;
      }

      const res = await request(app)
        .get('/api/requests/donor/visibility-info')
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.bloodType).toBe('O-');
      expect(res.body.data.compatibleBloodTypes).toEqual(
        expect.arrayContaining(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'])
      );
      expect(res.body.data.availabilityRadius).toBe(50);
    });

    it('should reject access for non-donors', async () => {
      if (!recipientToken) {
        console.log('Skipping - recipient registration failed');
        return;
      }

      const res = await request(app)
        .get('/api/requests/donor/visibility-info')
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/requests/donor/matched', () => {
    it('should return matched requests for donor', async () => {
      if (!donorToken) {
        console.log('Skipping - donor registration failed');
        return;
      }

      const res = await request(app)
        .get('/api/requests/donor/matched')
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject access for non-donors', async () => {
      if (!recipientToken) {
        console.log('Skipping - recipient registration failed');
        return;
      }

      const res = await request(app)
        .get('/api/requests/donor/matched')
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/requests/donor/update-radius', () => {
    it('should update donor availability radius', async () => {
      if (!donorToken) {
        console.log('Skipping - donor registration failed');
        return;
      }

      const res = await request(app)
        .put('/api/requests/donor/update-radius')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ radius: 100 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.availabilityRadius).toBe(100);
    });

    it('should reject invalid radius (too small)', async () => {
      if (!donorToken) {
        console.log('Skipping - donor registration failed');
        return;
      }

      const res = await request(app)
        .put('/api/requests/donor/update-radius')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ radius: 0 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject invalid radius (too large)', async () => {
      if (!donorToken) {
        console.log('Skipping - donor registration failed');
        return;
      }

      const res = await request(app)
        .put('/api/requests/donor/update-radius')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ radius: 500 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject access for non-donors', async () => {
      if (!recipientToken) {
        console.log('Skipping - recipient registration failed');
        return;
      }

      const res = await request(app)
        .put('/api/requests/donor/update-radius')
        .set('Authorization', `Bearer ${recipientToken}`)
        .send({ radius: 100 })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/requests/visibility/stats (Admin only)', () => {
    it('should return visibility statistics for admin', async () => {
      if (!adminToken) {
        console.log('Skipping - admin registration failed');
        return;
      }

      const res = await request(app)
        .get('/api/requests/visibility/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('activeRequests');
      expect(res.body.data).toHaveProperty('criticalRequests');
      expect(res.body.data).toHaveProperty('urgentRequests');
      expect(res.body.data).toHaveProperty('activeDonors');
    });

    it('should reject access for non-admins', async () => {
      if (!donorToken) {
        console.log('Skipping - donor registration failed');
        return;
      }

      const res = await request(app)
        .get('/api/requests/visibility/stats')
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });
});
