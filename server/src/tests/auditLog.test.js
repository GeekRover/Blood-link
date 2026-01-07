import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Administrator from '../models/Administrator.js';

describe('Audit Logging System', () => {
  let adminToken;
  let adminUser;
  let testUser;

  beforeAll(async () => {
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
        city: 'Dhaka'
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

    // Create test user for verification
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
        city: 'Dhaka'
      },
      location: {
        type: 'Point',
        coordinates: [90.3563, 23.6850]
      },
      verificationStatus: 'pending'
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await AuditLog.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/admin/users/:userId/verify', () => {
    it('should create audit log when verifying user', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${testUser._id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Valid documents provided'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Check if audit log was created
      const auditLog = await AuditLog.findOne({
        action: 'user_verified',
        targetId: testUser._id
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog.performedBy.toString()).toBe(adminUser._id.toString());
      expect(auditLog.action).toBe('user_verified');
      expect(auditLog.actionCategory).toBe('verification');
      expect(auditLog.targetModel).toBe('User');
      expect(auditLog.targetIdentifier).toBe(testUser.email);
      expect(auditLog.reason).toBe('Valid documents provided');
    });
  });

  describe('GET /api/audit', () => {
    it('should get all audit logs', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should filter audit logs by action', async () => {
      const res = await request(app)
        .get('/api/audit?action=user_verified')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every(log => log.action === 'user_verified')).toBe(true);
    });

    it('should filter audit logs by category', async () => {
      const res = await request(app)
        .get('/api/audit?category=verification')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every(log => log.actionCategory === 'verification')).toBe(true);
    });
  });

  describe('GET /api/audit/user/:userId', () => {
    it('should get audit logs by specific user', async () => {
      const res = await request(app)
        .get(`/api/audit/user/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/audit/target/:targetModel/:targetId', () => {
    it('should get audit logs for specific target', async () => {
      const res = await request(app)
        .get(`/api/audit/target/User/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.every(log => log.targetId.toString() === testUser._id.toString())).toBe(true);
    });
  });

  describe('GET /api/audit/statistics', () => {
    it('should get audit log statistics', async () => {
      const res = await request(app)
        .get('/api/audit/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalLogs');
      expect(res.body.data).toHaveProperty('logsByCategory');
      expect(res.body.data).toHaveProperty('logsByAction');
      expect(res.body.data).toHaveProperty('mostActiveAdmins');
    });
  });

  describe('GET /api/audit/critical', () => {
    it('should get critical audit logs', async () => {
      const res = await request(app)
        .get('/api/audit/critical')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Access Control', () => {
    it('should deny access to non-admin users', async () => {
      // Create donor user and login
      const donor = await User.create({
        email: 'donor@test.com',
        password: 'password123',
        role: 'donor',
        name: 'Donor User',
        phone: '+8801700000002',
        dateOfBirth: new Date('1995-01-01'),
        gender: 'male',
        bloodType: 'O+',
        address: {
          city: 'Dhaka'
        },
        location: {
          type: 'Point',
          coordinates: [90.3563, 23.6850]
        }
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'donor@test.com',
          password: 'password123'
        });

      const donorToken = loginRes.body.data.token;

      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
