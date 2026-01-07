/**
 * @fileoverview Tests for System Configuration Panel
 * @module tests/integration/systemConfig
 * @requires supertest
 * @requires mongoose
 *
 * Tests cover:
 * - Configuration retrieval (public and admin)
 * - Configuration updates with validation
 * - Change history tracking
 * - Authorization checks
 * - Audit logging integration
 * - Singleton pattern enforcement
 *
 * @see server/src/models/SystemConfig.js
 * @see server/src/controllers/configController.js
 */

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index.js';
import User from '../models/User.js';
import Administrator from '../models/Administrator.js';
import SystemConfig from '../models/SystemConfig.js';
import AuditLog from '../models/AuditLog.js';

describe('System Configuration Panel', () => {
  let adminToken;
  let adminUser;
  let userToken;
  let normalUser;

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

    // Create normal user
    normalUser = await User.create({
      email: 'user@test.com',
      password: 'password123',
      role: 'donor',
      name: 'Normal User',
      phone: '+8801700000001',
      dateOfBirth: new Date('1995-01-01'),
      gender: 'male',
      bloodType: 'B+',
      address: {
        city: 'Dhaka',
        country: 'Bangladesh'
      },
      location: {
        type: 'Point',
        coordinates: [90.3563, 23.6850]
      }
    });

    // Login admin
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });
    adminToken = adminLoginRes.body.data.token;

    // Login normal user
    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'password123'
      });
    userToken = userLoginRes.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await SystemConfig.deleteMany({});
    await AuditLog.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await SystemConfig.deleteMany({});
    await AuditLog.deleteMany({});
  });

  describe('GET /api/config/public - Get Public Configuration', () => {
    it('should return public configuration without authentication', async () => {
      // Create default config
      await SystemConfig.getOrCreateConfig();

      const res = await request(app)
        .get('/api/config/public')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.config).toBeDefined();
      expect(res.body.data.config.donationSettings).toBeDefined();
      expect(res.body.data.config.matchingSettings).toBeDefined();
      // Security settings should not be exposed
      expect(res.body.data.config.securitySettings).toBeUndefined();
    });

    it('should work even without existing config (auto-create)', async () => {
      const res = await request(app)
        .get('/api/config/public')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.config).toBeDefined();
    });
  });

  describe('GET /api/config - Get Full Configuration', () => {
    it('should return full configuration for admin', async () => {
      await SystemConfig.getOrCreateConfig();

      const res = await request(app)
        .get('/api/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.config).toBeDefined();
      expect(res.body.data.config.securitySettings).toBeDefined();
      expect(res.body.data.config.maintenanceMode).toBeDefined();
    });

    it('should deny access to non-admin users', async () => {
      await request(app)
        .get('/api/config')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/config')
        .expect(401);
    });
  });

  describe('PUT /api/config - Update Full Configuration', () => {
    beforeEach(async () => {
      await SystemConfig.getOrCreateConfig();
    });

    it('should update configuration successfully', async () => {
      const updates = {
        donationSettings: {
          cooldownDays: 120
        },
        reason: 'Updating cooldown period for safety'
      };

      const res = await request(app)
        .put('/api/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.config.donationSettings.cooldownDays).toBe(120);

      // Verify audit log created
      const auditLog = await AuditLog.findOne({
        action: 'config_updated'
      });
      expect(auditLog).toBeTruthy();
      expect(auditLog.performedBy.toString()).toBe(adminUser._id.toString());
    });

    it('should require reason for updates', async () => {
      const updates = {
        donationSettings: {
          cooldownDays: 100
        }
        // Missing reason
      };

      const res = await request(app)
        .put('/api/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('reason');
    });

    it('should validate reason length (minimum 10 characters)', async () => {
      const updates = {
        donationSettings: {
          cooldownDays: 100
        },
        reason: 'Short' // Less than 10 characters
      };

      const res = await request(app)
        .put('/api/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('10 characters');
    });

    it('should validate cooldown days range (30-365)', async () => {
      const updates = {
        donationSettings: {
          cooldownDays: 20 // Below minimum
        },
        reason: 'Testing validation with invalid value'
      };

      const res = await request(app)
        .put('/api/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should validate default radius range (10-500)', async () => {
      const updates = {
        matchingSettings: {
          defaultRadiusKm: 600 // Above maximum
        },
        reason: 'Testing validation with invalid radius'
      };

      const res = await request(app)
        .put('/api/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should track change history', async () => {
      const updates = {
        donationSettings: {
          cooldownDays: 150
        },
        reason: 'First update for testing change history'
      };

      await request(app)
        .put('/api/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      const config = await SystemConfig.findOne({});
      expect(config.changeHistory).toHaveLength(1);
      expect(config.changeHistory[0].changedBy.toString()).toBe(adminUser._id.toString());
      expect(config.changeHistory[0].reason).toBe(updates.reason);
    });

    it('should deny access to non-admin users', async () => {
      const updates = {
        donationSettings: {
          cooldownDays: 100
        },
        reason: 'Unauthorized update attempt'
      };

      await request(app)
        .put('/api/config')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updates)
        .expect(403);
    });
  });

  describe('PUT /api/config/donation-settings - Update Donation Settings', () => {
    beforeEach(async () => {
      await SystemConfig.getOrCreateConfig();
    });

    it('should update donation settings', async () => {
      const updates = {
        cooldownDays: 100,
        minAge: 18,
        maxAge: 65,
        reason: 'Adjusting donation eligibility criteria'
      };

      const res = await request(app)
        .put('/api/config/donation-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.config.donationSettings.cooldownDays).toBe(100);
      expect(res.body.data.config.donationSettings.minAge).toBe(18);
      expect(res.body.data.config.donationSettings.maxAge).toBe(65);
    });

    it('should validate age range (minAge < maxAge)', async () => {
      const updates = {
        minAge: 65,
        maxAge: 18, // Invalid: min > max
        reason: 'Testing age validation'
      };

      const res = await request(app)
        .put('/api/config/donation-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/config/matching-settings - Update Matching Settings', () => {
    beforeEach(async () => {
      await SystemConfig.getOrCreateConfig();
    });

    it('should update matching settings', async () => {
      const updates = {
        defaultRadiusKm: 75,
        maxRadiusKm: 300,
        expandedRadiusKm: 150,
        reason: 'Expanding search radius for better matches'
      };

      const res = await request(app)
        .put('/api/config/matching-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.config.matchingSettings.defaultRadiusKm).toBe(75);
    });

    it('should validate radius progression (default < expanded < max)', async () => {
      const updates = {
        defaultRadiusKm: 100,
        expandedRadiusKm: 80, // Invalid: expanded < default
        maxRadiusKm: 200,
        reason: 'Testing radius validation'
      };

      const res = await request(app)
        .put('/api/config/matching-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/config/fallback-settings - Update Fallback Settings', () => {
    beforeEach(async () => {
      await SystemConfig.getOrCreateConfig();
    });

    it('should update fallback settings', async () => {
      const updates = {
        unmatchedThresholdHours: 12,
        autoRunEnabled: true,
        autoRunIntervalHours: 6,
        reason: 'Optimizing fallback system triggers'
      };

      const res = await request(app)
        .put('/api/config/fallback-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.config.fallbackSettings.unmatchedThresholdHours).toBe(12);
      expect(res.body.data.config.fallbackSettings.autoRunEnabled).toBe(true);
    });

    it('should validate threshold hours range (1-72)', async () => {
      const updates = {
        unmatchedThresholdHours: 80, // Above maximum
        reason: 'Testing threshold validation'
      };

      const res = await request(app)
        .put('/api/config/fallback-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/config/points-settings - Update Points Settings', () => {
    beforeEach(async () => {
      await SystemConfig.getOrCreateConfig();
    });

    it('should update points settings', async () => {
      const updates = {
        perDonation: 150,
        urgentBonus: 75,
        criticalBonus: 150,
        reviewBonus: 15,
        firstDonationBonus: 100,
        reason: 'Increasing rewards for donations'
      };

      const res = await request(app)
        .put('/api/config/points-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.config.pointsSettings.perDonation).toBe(150);
      expect(res.body.data.config.pointsSettings.urgentBonus).toBe(75);
    });

    it('should validate points are non-negative', async () => {
      const updates = {
        perDonation: -10, // Invalid: negative
        reason: 'Testing points validation'
      };

      const res = await request(app)
        .put('/api/config/points-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/config/maintenance-mode - Toggle Maintenance Mode', () => {
    beforeEach(async () => {
      await SystemConfig.getOrCreateConfig();
    });

    it('should enable maintenance mode', async () => {
      const updates = {
        enabled: true,
        message: 'System maintenance in progress. We will be back shortly.',
        allowAdminAccess: true,
        reason: 'Scheduled maintenance for database upgrade'
      };

      const res = await request(app)
        .put('/api/config/maintenance-mode')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.config.maintenanceMode.enabled).toBe(true);
      expect(res.body.data.config.maintenanceMode.message).toBe(updates.message);
    });

    it('should disable maintenance mode', async () => {
      const updates = {
        enabled: false,
        reason: 'Maintenance completed successfully'
      };

      const res = await request(app)
        .put('/api/config/maintenance-mode')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.config.maintenanceMode.enabled).toBe(false);
    });

    it('should require custom message when enabling maintenance', async () => {
      const updates = {
        enabled: true,
        // Missing message
        reason: 'Enabling maintenance mode'
      };

      const res = await request(app)
        .put('/api/config/maintenance-mode')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/config/history - Get Change History', () => {
    beforeEach(async () => {
      await SystemConfig.getOrCreateConfig();

      // Create some history
      await request(app)
        .put('/api/config/donation-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cooldownDays: 100,
          reason: 'First change for testing history'
        });

      await request(app)
        .put('/api/config/matching-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          defaultRadiusKm: 75,
          reason: 'Second change for testing history'
        });
    });

    it('should return change history for admin', async () => {
      const res = await request(app)
        .get('/api/config/history')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.history).toHaveLength(2);
      expect(res.body.data.history[0].reason).toBe('Second change for testing history'); // Latest first
      expect(res.body.data.history[1].reason).toBe('First change for testing history');
    });

    it('should deny access to non-admin users', async () => {
      await request(app)
        .get('/api/config/history')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should limit history to last 10 changes', async () => {
      // Create 15 changes
      for (let i = 0; i < 15; i++) {
        await request(app)
          .put('/api/config/donation-settings')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            cooldownDays: 90 + i,
            reason: `Change number ${i + 1} for history limit test`
          });
      }

      const res = await request(app)
        .get('/api/config/history')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.history.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Singleton Pattern Enforcement', () => {
    it('should maintain only one config document', async () => {
      // Create multiple configs
      await SystemConfig.getOrCreateConfig();
      await SystemConfig.getOrCreateConfig();
      await SystemConfig.getOrCreateConfig();

      const count = await SystemConfig.countDocuments({});
      expect(count).toBe(1); // Only one config should exist
    });

    it('should return same config instance', async () => {
      const config1 = await SystemConfig.getOrCreateConfig();
      const config2 = await SystemConfig.getOrCreateConfig();

      expect(config1._id.toString()).toBe(config2._id.toString());
    });
  });
});
