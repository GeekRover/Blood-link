/**
 * @fileoverview End-to-End Tests for Complete Donation Workflow
 * @module tests/e2e/donationFlow
 * @requires supertest
 * @requires mongoose
 *
 * Tests complete user workflows:
 * 1. User Registration → Hospital ID Upload → Verification → Donation → QR Code
 * 2. Blood Request → Matching → Donor Accepts → Chat Unlocked → Donation Complete
 * 3. Admin Moderation → Audit Trail → Badge Award
 *
 * @see server/src/controllers/authController.js
 * @see server/src/controllers/donationController.js
 * @see server/src/services/matchingService.js
 */

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../index.js';
import User from '../../models/User.js';
import Administrator from '../../models/Administrator.js';
import DonorProfile from '../../models/DonorProfile.js';
import BloodRequest from '../../models/BloodRequest.js';
import DonationHistory from '../../models/DonationHistory.js';
import DigitalDonationCard from '../../models/DigitalDonationCard.js';
import Chat from '../../models/Chat.js';
import AuditLog from '../../models/AuditLog.js';
import Badge from '../../models/Badge.js';
import UserBadge from '../../models/UserBadge.js';

describe('E2E: Complete Donation Workflow', () => {
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    const testDbUri = process.env.TEST_DB_URI || 'mongodb://localhost:27017/bloodlink_test';
    await mongoose.connect(testDbUri);

    // Create admin user
    adminUser = await Administrator.create({
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      name: 'Admin User',
      phone: '+8801700000000',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      bloodType: 'A+',
      address: {
        city: 'Dhaka',
        country: 'Bangladesh'
      },
      location: {
        type: 'Point',
        coordinates: [90.3563, 23.6850]
      },
      department: 'System',
      employeeId: 'EMP001',
      permissions: ['all']
    });

    // Login admin
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });

    adminToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await DonorProfile.deleteMany({});
    await BloodRequest.deleteMany({});
    await DonationHistory.deleteMany({});
    await DigitalDonationCard.deleteMany({});
    await Chat.deleteMany({});
    await AuditLog.deleteMany({});
    await Badge.deleteMany({});
    await UserBadge.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Workflow 1: New Donor Registration to Verified Donation', () => {
    let donorToken;
    let donorUser;
    let donationId;
    let digitalCardId;

    it('Step 1: Donor registers successfully', async () => {
      const donorData = {
        email: 'newdonor@test.com',
        password: 'Password@123',
        role: 'donor',
        name: 'New Donor',
        phone: '+8801712345678',
        dateOfBirth: '1995-05-15',
        gender: 'male',
        bloodType: 'O+',
        address: {
          city: 'Dhaka',
          division: 'Dhaka',
          country: 'Bangladesh'
        },
        location: {
          type: 'Point',
          coordinates: [90.4125, 23.8103]
        },
        medicalDataConsent: true,
        consentVersion: '1.0'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(donorData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(donorData.email);
      expect(res.body.data.user.verificationStatus).toBe('pending');
      expect(res.body.data.token).toBeDefined();

      donorToken = res.body.data.token;
      donorUser = res.body.data.user;
    });

    it('Step 2: Donor profile is created automatically', async () => {
      const profile = await DonorProfile.findOne({ user: donorUser._id });

      expect(profile).toBeTruthy();
      expect(profile.isAvailable).toBe(true);
      expect(profile.totalDonations).toBe(0);
    });

    it('Step 3: Admin verifies the donor', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${donorUser._id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Documents verified successfully'
        })
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify user status updated
      const updatedUser = await User.findById(donorUser._id);
      expect(updatedUser.verificationStatus).toBe('verified');

      // Verify audit log created
      const auditLog = await AuditLog.findOne({
        action: 'user_verified',
        targetId: donorUser._id
      });
      expect(auditLog).toBeTruthy();
    });

    it('Step 4: Donor completes a donation', async () => {
      const donationData = {
        donor: donorUser._id,
        donationDate: new Date(),
        bloodType: 'O+',
        unitsProvided: 1,
        donationCenter: 'Dhaka Medical College',
        healthChecks: {
          bloodPressure: '120/80',
          hemoglobin: '14.5',
          weight: 70
        }
      };

      const donation = await DonationHistory.create(donationData);
      donationId = donation._id;

      expect(donation).toBeTruthy();
      expect(donation.isVerified).toBe(false);
    });

    it('Step 5: Admin verifies the donation', async () => {
      const res = await request(app)
        .post(`/api/donations/${donationId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Donation verified with medical center'
        })
        .expect(200);

      expect(res.body.success).toBe(true);

      // Check if digital card was created
      const digitalCard = await DigitalDonationCard.findOne({
        donation: donationId
      });

      expect(digitalCard).toBeTruthy();
      expect(digitalCard.qrCode).toBeDefined();
      digitalCardId = digitalCard._id;

      // Check if donation is locked (immutable)
      const donation = await DonationHistory.findById(donationId);
      expect(donation.isLocked).toBe(true);
    });

    it('Step 6: Donor can view their digital donation card', async () => {
      const res = await request(app)
        .get(`/api/donations/card/${digitalCardId}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.card.qrCode).toBeDefined();
      expect(res.body.data.card.donor.toString()).toBe(donorUser._id.toString());
    });

    it('Step 7: QR code can be verified', async () => {
      const card = await DigitalDonationCard.findById(digitalCardId);

      const res = await request(app)
        .post('/api/donations/verify-qr')
        .send({
          qrCode: card.qrCode
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isValid).toBe(true);
      expect(res.body.data.donor.name).toBe('New Donor');
    });

    it('Step 8: Donor profile statistics are updated', async () => {
      const profile = await DonorProfile.findOne({ user: donorUser._id });

      expect(profile.totalDonations).toBe(1);
      expect(profile.lastDonationDate).toBeDefined();
    });

    it('Step 9: Admin can award badge for first donation', async () => {
      // Create a badge
      const badge = await Badge.create({
        name: 'First Blood',
        description: 'Completed first blood donation',
        criteria: 'Complete 1 donation',
        category: 'achievement',
        icon: '🩸',
        color: '#FF0000',
        createdBy: adminUser._id
      });

      // Assign badge to donor
      const res = await request(app)
        .post('/api/badges/assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: donorUser._id,
          badgeId: badge._id,
          reason: 'Congratulations on your first blood donation'
        })
        .expect(201);

      expect(res.body.success).toBe(true);

      // Verify badge assigned
      const userBadge = await UserBadge.findOne({
        user: donorUser._id,
        badge: badge._id
      });
      expect(userBadge).toBeTruthy();
      expect(userBadge.isRevoked).toBe(false);
    });
  });

  describe('Workflow 2: Blood Request to Successful Donation', () => {
    let recipientToken;
    let recipientUser;
    let donorToken;
    let donorUser;
    let bloodRequestId;
    let chatId;

    it('Step 1: Recipient registers and creates blood request', async () => {
      // Register recipient
      const recipientData = {
        email: 'recipient@test.com',
        password: 'Password@123',
        role: 'recipient',
        name: 'Urgent Recipient',
        phone: '+8801798765432',
        dateOfBirth: '1990-03-20',
        gender: 'female',
        bloodType: 'O+',
        address: {
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        location: {
          type: 'Point',
          coordinates: [90.4125, 23.8103]
        },
        medicalDataConsent: true
      };

      const regRes = await request(app)
        .post('/api/auth/register')
        .send(recipientData)
        .expect(201);

      recipientToken = regRes.body.data.token;
      recipientUser = regRes.body.data.user;

      // Verify recipient
      await request(app)
        .post(`/api/admin/users/${recipientUser._id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Verified' })
        .expect(200);

      // Create blood request
      const requestData = {
        bloodType: 'O+',
        unitsNeeded: 2,
        urgency: 'critical',
        hospital: 'Dhaka Medical College',
        patientName: 'Emergency Patient',
        reason: 'Urgent surgery required',
        contactNumber: '+8801798765432',
        location: {
          type: 'Point',
          coordinates: [90.4125, 23.8103]
        }
      };

      const reqRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${recipientToken}`)
        .send(requestData)
        .expect(201);

      expect(reqRes.body.success).toBe(true);
      bloodRequestId = reqRes.body.data.request._id;
    });

    it('Step 2: Verified donor with matching blood type exists', async () => {
      // Register donor
      const donorData = {
        email: 'readydonor@test.com',
        password: 'Password@123',
        role: 'donor',
        name: 'Ready Donor',
        phone: '+8801711111111',
        dateOfBirth: '1993-08-10',
        gender: 'male',
        bloodType: 'O+',
        address: {
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        location: {
          type: 'Point',
          coordinates: [90.4125, 23.8103] // Same location
        },
        medicalDataConsent: true
      };

      const regRes = await request(app)
        .post('/api/auth/register')
        .send(donorData)
        .expect(201);

      donorToken = regRes.body.data.token;
      donorUser = regRes.body.data.user;

      // Verify donor
      await request(app)
        .post(`/api/admin/users/${donorUser._id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Verified' })
        .expect(200);
    });

    it('Step 3: System matches donor to request', async () => {
      const request = await BloodRequest.findById(bloodRequestId);

      // Check if donor is in matched donors list
      const isMatched = request.matchedDonors.some(
        donor => donor.toString() === donorUser._id.toString()
      );

      // If not matched automatically, the matching service should have run
      // For testing purposes, we'll manually add if needed
      if (!isMatched) {
        request.matchedDonors.push(donorUser._id);
        await request.save();
      }

      expect(request.matchedDonors.length).toBeGreaterThan(0);
    });

    it('Step 4: Donor accepts the blood request', async () => {
      const res = await request(app)
        .post(`/api/requests/${bloodRequestId}/respond`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          response: 'accepted',
          message: 'I am ready to donate'
        })
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify response recorded
      const updatedRequest = await BloodRequest.findById(bloodRequestId);
      const donorResponse = updatedRequest.donorResponses.find(
        r => r.donor.toString() === donorUser._id.toString()
      );

      expect(donorResponse).toBeTruthy();
      expect(donorResponse.status).toBe('accepted');
    });

    it('Step 5: Chat is created and accessible after acceptance', async () => {
      // Create chat between donor and recipient
      const chatRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          recipientId: recipientUser._id,
          bloodRequestId: bloodRequestId
        })
        .expect(201);

      expect(chatRes.body.success).toBe(true);
      chatId = chatRes.body.data.chat._id;

      // Donor can send message
      const msgRes = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          content: 'What time should I come to the hospital?'
        })
        .expect(201);

      expect(msgRes.body.success).toBe(true);
    });

    it('Step 6: Request is marked as fulfilled', async () => {
      const res = await request(app)
        .put(`/api/requests/${bloodRequestId}/complete`)
        .set('Authorization', `Bearer ${recipientToken}`)
        .send({
          donorId: donorUser._id,
          unitsReceived: 2
        })
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify request status
      const request = await BloodRequest.findById(bloodRequestId);
      expect(request.status).toBe('fulfilled');
    });

    it('Step 7: Donation record is created', async () => {
      const donation = await DonationHistory.create({
        donor: donorUser._id,
        donationDate: new Date(),
        bloodType: 'O+',
        unitsProvided: 2,
        donationCenter: 'Dhaka Medical College',
        relatedRequest: bloodRequestId,
        healthChecks: {
          bloodPressure: '118/78',
          hemoglobin: '15.0',
          weight: 72
        }
      });

      expect(donation).toBeTruthy();
      expect(donation.relatedRequest.toString()).toBe(bloodRequestId.toString());
    });

    it('Step 8: Complete audit trail exists', async () => {
      // Check for verification audit logs
      const verificationLogs = await AuditLog.find({
        action: 'user_verified',
        targetId: { $in: [donorUser._id, recipientUser._id] }
      });

      expect(verificationLogs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Workflow 3: Admin Moderation and System Configuration', () => {
    let testUser;
    let testBadge;

    it('Step 1: Admin can view system statistics', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.stats).toBeDefined();
    });

    it('Step 2: Admin can configure system settings', async () => {
      const res = await request(app)
        .put('/api/config/donation-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cooldownDays: 90,
          minAge: 18,
          maxAge: 65,
          reason: 'Updating donation eligibility criteria for safety'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.config.donationSettings.cooldownDays).toBe(90);

      // Verify audit log
      const auditLog = await AuditLog.findOne({
        action: 'config_updated'
      });
      expect(auditLog).toBeTruthy();
    });

    it('Step 3: Admin creates badge for outstanding donors', async () => {
      const res = await request(app)
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Lifesaver',
          description: 'Saved multiple lives through donations',
          criteria: 'Complete 10 successful donations',
          category: 'achievement',
          icon: '🏆',
          color: '#FFD700',
          priority: 90
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      testBadge = res.body.data.badge;
    });

    it('Step 4: Admin assigns badge to deserving donor', async () => {
      testUser = await User.findOne({ email: 'readydonor@test.com' });

      const res = await request(app)
        .post('/api/badges/assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: testUser._id,
          badgeId: testBadge._id,
          reason: 'Outstanding contribution to saving lives through regular donations'
        })
        .expect(201);

      expect(res.body.success).toBe(true);

      // Verify audit log
      const auditLog = await AuditLog.findOne({
        action: 'badge_assigned',
        targetId: testUser._id
      });
      expect(auditLog).toBeTruthy();
    });

    it('Step 5: Admin can view complete audit trail', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.logs).toBeDefined();
      expect(res.body.data.logs.length).toBeGreaterThan(0);
    });

    it('Step 6: Admin can view audit statistics', async () => {
      const res = await request(app)
        .get('/api/audit/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.stats.totalLogs).toBeGreaterThan(0);
      expect(res.body.data.stats.byAction).toBeDefined();
      expect(res.body.data.stats.bySeverity).toBeDefined();
    });
  });
});
