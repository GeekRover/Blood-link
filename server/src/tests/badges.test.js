/**
 * @fileoverview Tests for Badge Management System
 * @module tests/integration/badges
 * @requires supertest
 * @requires mongoose
 *
 * Tests cover:
 * - Badge CRUD operations
 * - Badge assignment workflow
 * - Badge revocation workflow
 * - Authorization checks
 * - Audit logging integration
 *
 * @see server/src/models/Badge.js
 * @see server/src/models/UserBadge.js
 * @see server/src/controllers/badgeController.js
 */

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index.js';
import User from '../models/User.js';
import Administrator from '../models/Administrator.js';
import Badge from '../models/Badge.js';
import UserBadge from '../models/UserBadge.js';
import AuditLog from '../models/AuditLog.js';

describe('Badge Management System', () => {
  let adminToken;
  let adminUser;
  let testUser;
  let testBadge;

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

    // Create test user
    testUser = await User.create({
      email: 'testuser@test.com',
      password: 'password123',
      role: 'donor',
      name: 'Test User',
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
      },
      verificationStatus: 'verified'
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Badge.deleteMany({});
    await UserBadge.deleteMany({});
    await AuditLog.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Badge.deleteMany({});
    await UserBadge.deleteMany({});
    await AuditLog.deleteMany({});
  });

  describe('POST /api/badges - Create Badge', () => {
    it('should create badge successfully as admin', async () => {
      const badgeData = {
        name: 'Hero Donor',
        description: 'Donated 10+ times',
        criteria: 'Complete 10 successful donations',
        icon: '🦸',
        color: '#FF6B6B',
        category: 'achievement',
        priority: 80
      };

      const res = await request(app)
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(badgeData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.badge.name).toBe(badgeData.name);
      expect(res.body.data.badge.category).toBe(badgeData.category);
      expect(res.body.data.badge.createdBy.toString()).toBe(adminUser._id.toString());
    });

    it('should validate badge name length', async () => {
      const badgeData = {
        name: 'AB', // Too short (min 3 chars)
        description: 'Test badge',
        criteria: 'Test criteria'
      };

      const res = await request(app)
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(badgeData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should prevent duplicate badge names', async () => {
      const badgeData = {
        name: 'Unique Badge',
        description: 'Test badge',
        criteria: 'Test criteria'
      };

      // Create first badge
      await request(app)
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(badgeData)
        .expect(201);

      // Try to create duplicate
      const res = await request(app)
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(badgeData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already exists');
    });

    it('should reject badge creation without admin token', async () => {
      const badgeData = {
        name: 'Test Badge',
        description: 'Test',
        criteria: 'Test'
      };

      await request(app)
        .post('/api/badges')
        .send(badgeData)
        .expect(401);
    });

    it('should validate color hex code format', async () => {
      const badgeData = {
        name: 'Color Badge',
        description: 'Test badge',
        criteria: 'Test criteria',
        color: 'invalid-color' // Invalid hex code
      };

      const res = await request(app)
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(badgeData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should validate category enum', async () => {
      const badgeData = {
        name: 'Category Badge',
        description: 'Test badge',
        criteria: 'Test criteria',
        category: 'invalid-category' // Invalid category
      };

      const res = await request(app)
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(badgeData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/badges - Get All Badges', () => {
    beforeEach(async () => {
      // Create test badges
      await Badge.create([
        {
          name: 'Active Badge 1',
          description: 'Test 1',
          criteria: 'Criteria 1',
          category: 'achievement',
          isActive: true,
          createdBy: adminUser._id
        },
        {
          name: 'Active Badge 2',
          description: 'Test 2',
          criteria: 'Criteria 2',
          category: 'special',
          isActive: true,
          createdBy: adminUser._id
        },
        {
          name: 'Inactive Badge',
          description: 'Test 3',
          criteria: 'Criteria 3',
          category: 'achievement',
          isActive: false,
          createdBy: adminUser._id
        }
      ]);
    });

    it('should get all active badges by default', async () => {
      const res = await request(app)
        .get('/api/badges')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.badges).toHaveLength(2); // Only active badges
      expect(res.body.data.badges.every(b => b.isActive)).toBe(true);
    });

    it('should filter badges by category', async () => {
      const res = await request(app)
        .get('/api/badges?category=achievement')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.badges).toHaveLength(1); // Only active achievement badges
      expect(res.body.data.badges[0].category).toBe('achievement');
    });

    it('should include inactive badges when requested', async () => {
      const res = await request(app)
        .get('/api/badges?includeInactive=true')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.badges).toHaveLength(3); // All badges
    });
  });

  describe('PUT /api/badges/:id - Update Badge', () => {
    beforeEach(async () => {
      testBadge = await Badge.create({
        name: 'Original Badge',
        description: 'Original description',
        criteria: 'Original criteria',
        category: 'achievement',
        createdBy: adminUser._id
      });
    });

    it('should update badge successfully', async () => {
      const updates = {
        description: 'Updated description',
        priority: 90
      };

      const res = await request(app)
        .put(`/api/badges/${testBadge._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.badge.description).toBe(updates.description);
      expect(res.body.data.badge.priority).toBe(updates.priority);
    });

    it('should not allow updating badge name', async () => {
      const updates = {
        name: 'New Name' // Name should not be updatable
      };

      await request(app)
        .put(`/api/badges/${testBadge._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      const badge = await Badge.findById(testBadge._id);
      expect(badge.name).toBe('Original Badge'); // Name unchanged
    });

    it('should return 404 for non-existent badge', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .put(`/api/badges/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /api/badges/:id - Deactivate Badge', () => {
    beforeEach(async () => {
      testBadge = await Badge.create({
        name: 'Badge to Delete',
        description: 'Test badge',
        criteria: 'Test criteria',
        category: 'achievement',
        createdBy: adminUser._id
      });
    });

    it('should deactivate badge (soft delete)', async () => {
      const res = await request(app)
        .delete(`/api/badges/${testBadge._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify badge still exists but is inactive
      const badge = await Badge.findById(testBadge._id);
      expect(badge).toBeTruthy();
      expect(badge.isActive).toBe(false);
    });
  });

  describe('POST /api/badges/assign - Assign Badge to User', () => {
    beforeEach(async () => {
      testBadge = await Badge.create({
        name: 'Assignment Badge',
        description: 'Test badge',
        criteria: 'Test criteria',
        category: 'special',
        createdBy: adminUser._id
      });
    });

    it('should assign badge to user successfully', async () => {
      const assignmentData = {
        userId: testUser._id,
        badgeId: testBadge._id,
        reason: 'Outstanding contribution to the community'
      };

      const res = await request(app)
        .post('/api/badges/assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignmentData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.userBadge.user.toString()).toBe(testUser._id.toString());
      expect(res.body.data.userBadge.badge.toString()).toBe(testBadge._id.toString());

      // Verify badge assignment count increased
      const badge = await Badge.findById(testBadge._id);
      expect(badge.assignmentCount).toBe(1);

      // Verify audit log created
      const auditLog = await AuditLog.findOne({
        action: 'badge_assigned',
        targetId: testUser._id
      });
      expect(auditLog).toBeTruthy();
      expect(auditLog.performedBy.toString()).toBe(adminUser._id.toString());
    });

    it('should validate reason length', async () => {
      const assignmentData = {
        userId: testUser._id,
        badgeId: testBadge._id,
        reason: 'Short' // Less than 10 characters
      };

      const res = await request(app)
        .post('/api/badges/assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignmentData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('10 characters');
    });

    it('should prevent duplicate badge assignments', async () => {
      const assignmentData = {
        userId: testUser._id,
        badgeId: testBadge._id,
        reason: 'First assignment with valid reason'
      };

      // First assignment
      await request(app)
        .post('/api/badges/assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignmentData)
        .expect(201);

      // Try duplicate assignment
      const res = await request(app)
        .post('/api/badges/assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignmentData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already assigned');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();

      const assignmentData = {
        userId: fakeUserId,
        badgeId: testBadge._id,
        reason: 'Valid reason for assignment'
      };

      await request(app)
        .post('/api/badges/assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignmentData)
        .expect(404);
    });

    it('should return 404 for non-existent badge', async () => {
      const fakeBadgeId = new mongoose.Types.ObjectId();

      const assignmentData = {
        userId: testUser._id,
        badgeId: fakeBadgeId,
        reason: 'Valid reason for assignment'
      };

      await request(app)
        .post('/api/badges/assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignmentData)
        .expect(404);
    });
  });

  describe('POST /api/badges/revoke - Revoke Badge from User', () => {
    let userBadge;

    beforeEach(async () => {
      testBadge = await Badge.create({
        name: 'Revoke Badge',
        description: 'Test badge',
        criteria: 'Test criteria',
        category: 'special',
        assignmentCount: 1,
        createdBy: adminUser._id
      });

      userBadge = await UserBadge.create({
        user: testUser._id,
        badge: testBadge._id,
        assignedBy: adminUser._id,
        assignmentReason: 'Initial assignment reason'
      });
    });

    it('should revoke badge successfully', async () => {
      const revocationData = {
        userId: testUser._id,
        badgeId: testBadge._id,
        reason: 'No longer meets the criteria for this badge'
      };

      const res = await request(app)
        .post('/api/badges/revoke')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(revocationData)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify badge revoked
      const revokedBadge = await UserBadge.findById(userBadge._id);
      expect(revokedBadge.isRevoked).toBe(true);
      expect(revokedBadge.revokedBy.toString()).toBe(adminUser._id.toString());
      expect(revokedBadge.revocationReason).toBe(revocationData.reason);

      // Verify assignment count decreased
      const badge = await Badge.findById(testBadge._id);
      expect(badge.assignmentCount).toBe(0);

      // Verify audit log created
      const auditLog = await AuditLog.findOne({
        action: 'badge_revoked',
        targetId: testUser._id
      });
      expect(auditLog).toBeTruthy();
    });

    it('should validate revocation reason length', async () => {
      const revocationData = {
        userId: testUser._id,
        badgeId: testBadge._id,
        reason: 'Short' // Less than 10 characters
      };

      const res = await request(app)
        .post('/api/badges/revoke')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(revocationData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('10 characters');
    });

    it('should return 404 when badge not assigned to user', async () => {
      const anotherBadge = await Badge.create({
        name: 'Another Badge',
        description: 'Test',
        criteria: 'Test',
        category: 'achievement',
        createdBy: adminUser._id
      });

      const revocationData = {
        userId: testUser._id,
        badgeId: anotherBadge._id,
        reason: 'Valid revocation reason'
      };

      await request(app)
        .post('/api/badges/revoke')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(revocationData)
        .expect(404);
    });

    it('should prevent revoking already revoked badge', async () => {
      // First revocation
      await request(app)
        .post('/api/badges/revoke')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: testUser._id,
          badgeId: testBadge._id,
          reason: 'First revocation with valid reason'
        })
        .expect(200);

      // Try to revoke again
      const res = await request(app)
        .post('/api/badges/revoke')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: testUser._id,
          badgeId: testBadge._id,
          reason: 'Second revocation attempt'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already revoked');
    });
  });

  describe('GET /api/badges/user/:userId - Get User Badges', () => {
    beforeEach(async () => {
      const badge1 = await Badge.create({
        name: 'Badge 1',
        description: 'Test 1',
        criteria: 'Criteria 1',
        category: 'achievement',
        createdBy: adminUser._id
      });

      const badge2 = await Badge.create({
        name: 'Badge 2',
        description: 'Test 2',
        criteria: 'Criteria 2',
        category: 'special',
        createdBy: adminUser._id
      });

      // Assign active badge
      await UserBadge.create({
        user: testUser._id,
        badge: badge1._id,
        assignedBy: adminUser._id,
        assignmentReason: 'Achievement unlocked'
      });

      // Assign and revoke badge
      await UserBadge.create({
        user: testUser._id,
        badge: badge2._id,
        assignedBy: adminUser._id,
        assignmentReason: 'Special recognition',
        isRevoked: true,
        revokedBy: adminUser._id,
        revokedAt: new Date(),
        revocationReason: 'No longer applicable'
      });
    });

    it('should get user badges (active only by default)', async () => {
      const res = await request(app)
        .get(`/api/badges/user/${testUser._id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.badges).toHaveLength(1); // Only active badge
      expect(res.body.data.badges[0].isRevoked).toBe(false);
    });

    it('should include revoked badges when requested', async () => {
      const res = await request(app)
        .get(`/api/badges/user/${testUser._id}?includeRevoked=true`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.badges).toHaveLength(2); // All badges
    });
  });

  describe('GET /api/badges/admin/stats - Get Badge Statistics', () => {
    beforeEach(async () => {
      const badge1 = await Badge.create({
        name: 'Popular Badge',
        description: 'Test',
        criteria: 'Test',
        category: 'achievement',
        assignmentCount: 5,
        createdBy: adminUser._id
      });

      const badge2 = await Badge.create({
        name: 'Rare Badge',
        description: 'Test',
        criteria: 'Test',
        category: 'special',
        assignmentCount: 1,
        createdBy: adminUser._id
      });

      await Badge.create({
        name: 'Inactive Badge',
        description: 'Test',
        criteria: 'Test',
        category: 'community',
        isActive: false,
        createdBy: adminUser._id
      });
    });

    it('should return badge statistics', async () => {
      const res = await request(app)
        .get('/api/badges/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.overview.totalBadges).toBe(3);
      expect(res.body.data.overview.activeBadges).toBe(2);
      expect(res.body.data.overview.inactiveBadges).toBe(1);
      expect(res.body.data.overview.totalAssignments).toBe(6); // 5 + 1
      expect(res.body.data.categoryBreakdown).toBeDefined();
      expect(res.body.data.popularBadges).toBeDefined();
    });

    it('should require admin authorization', async () => {
      await request(app)
        .get('/api/badges/admin/stats')
        .expect(401);
    });
  });

  describe('GET /api/badges/admin/history/:userId - Get Assignment History', () => {
    beforeEach(async () => {
      const badge = await Badge.create({
        name: 'History Badge',
        description: 'Test',
        criteria: 'Test',
        category: 'achievement',
        createdBy: adminUser._id
      });

      await UserBadge.create({
        user: testUser._id,
        badge: badge._id,
        assignedBy: adminUser._id,
        assignmentReason: 'Test assignment',
        isRevoked: true,
        revokedBy: adminUser._id,
        revokedAt: new Date(),
        revocationReason: 'Test revocation'
      });
    });

    it('should return user badge assignment history', async () => {
      const res = await request(app)
        .get(`/api/badges/admin/history/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.history).toHaveLength(1);
      expect(res.body.data.history[0].assignmentReason).toBe('Test assignment');
      expect(res.body.data.history[0].revocationReason).toBe('Test revocation');
    });

    it('should require admin authorization', async () => {
      await request(app)
        .get(`/api/badges/admin/history/${testUser._id}`)
        .expect(401);
    });
  });
});
