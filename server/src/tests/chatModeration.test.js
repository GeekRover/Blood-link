/**
 * @fileoverview Tests for Admin Chat Moderation
 * @module tests/integration/chatModeration
 * @requires supertest
 * @requires mongoose
 *
 * Tests cover:
 * - Message flagging by admins
 * - Message hiding by admins
 * - User reporting system
 * - Moderation statistics
 * - Authorization checks
 * - Report count tracking
 *
 * @see server/src/models/Message.js
 * @see server/src/controllers/chatController.js
 */

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index.js';
import User from '../models/User.js';
import Administrator from '../models/Administrator.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

describe('Admin Chat Moderation', () => {
  let adminToken;
  let adminUser;
  let user1Token;
  let user1;
  let user2;
  let testChat;
  let testMessage;

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

    // Create user 1
    user1 = await User.create({
      email: 'user1@test.com',
      password: 'password123',
      role: 'donor',
      name: 'User One',
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

    // Create user 2
    user2 = await User.create({
      email: 'user2@test.com',
      password: 'password123',
      role: 'recipient',
      name: 'User Two',
      phone: '+8801700000002',
      dateOfBirth: new Date('1995-01-01'),
      gender: 'female',
      bloodType: 'A-',
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

    // Login user 1
    const user1LoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user1@test.com',
        password: 'password123'
      });
    user1Token = user1LoginRes.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Chat.deleteMany({});
    await Message.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Create test chat
    testChat = await Chat.create({
      participants: [user1._id, user2._id]
    });

    // Create test message
    testMessage = await Message.create({
      chat: testChat._id,
      sender: user1._id,
      content: 'This is a test message'
    });
  });

  afterEach(async () => {
    await Chat.deleteMany({});
    await Message.deleteMany({});
  });

  describe('GET /api/chats/admin/stats - Get Moderation Statistics', () => {
    beforeEach(async () => {
      // Create flagged message
      await Message.create({
        chat: testChat._id,
        sender: user1._id,
        content: 'Flagged message',
        isFlagged: true,
        flaggedBy: adminUser._id,
        flaggedAt: new Date(),
        flagReason: 'Inappropriate content'
      });

      // Create hidden message
      await Message.create({
        chat: testChat._id,
        sender: user2._id,
        content: 'Hidden message',
        isHidden: true,
        hiddenBy: adminUser._id,
        hiddenAt: new Date(),
        hiddenReason: 'Spam'
      });

      // Create reported message
      const reportedMsg = await Message.create({
        chat: testChat._id,
        sender: user1._id,
        content: 'Reported message',
        reportCount: 3
      });

      reportedMsg.reports.push({
        reportedBy: user2._id,
        reason: 'Spam content',
        category: 'spam'
      });
      await reportedMsg.save();
    });

    it('should return moderation statistics', async () => {
      const res = await request(app)
        .get('/api/chats/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalChats).toBeGreaterThan(0);
      expect(res.body.data.totalMessages).toBeGreaterThan(0);
      expect(res.body.data.flaggedMessages).toBeGreaterThan(0);
      expect(res.body.data.hiddenMessages).toBeGreaterThan(0);
      expect(res.body.data.reportedMessages).toBeGreaterThan(0);
    });

    it('should require admin authorization', async () => {
      await request(app)
        .get('/api/chats/admin/stats')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/chats/admin/stats')
        .expect(401);
    });
  });

  describe('GET /api/chats/admin/all - Get All Chats', () => {
    beforeEach(async () => {
      // Create additional chats
      await Chat.create({
        participants: [user1._id, adminUser._id]
      });
      await Chat.create({
        participants: [user2._id, adminUser._id]
      });
    });

    it('should return all chats with pagination', async () => {
      const res = await request(app)
        .get('/api/chats/admin/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.chats).toBeDefined();
      expect(Array.isArray(res.body.data.chats)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should support pagination parameters', async () => {
      const res = await request(app)
        .get('/api/chats/admin/all?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.chats.length).toBeLessThanOrEqual(2);
    });

    it('should require admin authorization', async () => {
      await request(app)
        .get('/api/chats/admin/all')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);
    });
  });

  describe('GET /api/chats/admin/flagged - Get Flagged Messages', () => {
    beforeEach(async () => {
      await Message.create({
        chat: testChat._id,
        sender: user1._id,
        content: 'First flagged message',
        isFlagged: true,
        flaggedBy: adminUser._id,
        flaggedAt: new Date(),
        flagReason: 'Inappropriate'
      });

      await Message.create({
        chat: testChat._id,
        sender: user2._id,
        content: 'Second flagged message',
        isFlagged: true,
        flaggedBy: adminUser._id,
        flaggedAt: new Date(),
        flagReason: 'Harassment'
      });
    });

    it('should return all flagged messages', async () => {
      const res = await request(app)
        .get('/api/chats/admin/flagged')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.messages).toHaveLength(2);
      expect(res.body.data.messages.every(m => m.isFlagged)).toBe(true);
    });

    it('should populate sender and flaggedBy details', async () => {
      const res = await request(app)
        .get('/api/chats/admin/flagged')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.messages[0].sender).toBeDefined();
      expect(res.body.data.messages[0].sender.name).toBeDefined();
      expect(res.body.data.messages[0].flaggedBy).toBeDefined();
    });

    it('should require admin authorization', async () => {
      await request(app)
        .get('/api/chats/admin/flagged')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);
    });
  });

  describe('GET /api/chats/admin/reported - Get Reported Messages', () => {
    beforeEach(async () => {
      const msg1 = await Message.create({
        chat: testChat._id,
        sender: user1._id,
        content: 'Highly reported message',
        reportCount: 5
      });
      msg1.reports.push({
        reportedBy: user2._id,
        reason: 'Spam',
        category: 'spam'
      });
      await msg1.save();

      const msg2 = await Message.create({
        chat: testChat._id,
        sender: user2._id,
        content: 'Less reported message',
        reportCount: 2
      });
      msg2.reports.push({
        reportedBy: user1._id,
        reason: 'Inappropriate',
        category: 'inappropriate'
      });
      await msg2.save();
    });

    it('should return all reported messages sorted by report count', async () => {
      const res = await request(app)
        .get('/api/chats/admin/reported')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.messages).toHaveLength(2);
      // Should be sorted by reportCount descending
      expect(res.body.data.messages[0].reportCount).toBeGreaterThanOrEqual(
        res.body.data.messages[1].reportCount
      );
    });

    it('should include report details', async () => {
      const res = await request(app)
        .get('/api/chats/admin/reported')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.messages[0].reports).toBeDefined();
      expect(Array.isArray(res.body.data.messages[0].reports)).toBe(true);
    });

    it('should require admin authorization', async () => {
      await request(app)
        .get('/api/chats/admin/reported')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);
    });
  });

  describe('POST /api/chats/admin/messages/:messageId/flag - Flag Message', () => {
    it('should flag message successfully', async () => {
      const res = await request(app)
        .post(`/api/chats/admin/messages/${testMessage._id}/flag`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Contains inappropriate content that violates guidelines'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message.isFlagged).toBe(true);
      expect(res.body.data.message.flagReason).toBe('Contains inappropriate content that violates guidelines');
      expect(res.body.data.message.flaggedBy.toString()).toBe(adminUser._id.toString());
    });

    it('should require reason field', async () => {
      const res = await request(app)
        .post(`/api/chats/admin/messages/${testMessage._id}/flag`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('reason');
    });

    it('should validate reason length (minimum 10 characters)', async () => {
      const res = await request(app)
        .post(`/api/chats/admin/messages/${testMessage._id}/flag`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Short' // Less than 10 characters
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('10 characters');
    });

    it('should prevent flagging already flagged message', async () => {
      // Flag the message first
      await request(app)
        .post(`/api/chats/admin/messages/${testMessage._id}/flag`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'First flag with valid reason for testing'
        })
        .expect(200);

      // Try to flag again
      const res = await request(app)
        .post(`/api/chats/admin/messages/${testMessage._id}/flag`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Second flag attempt with valid reason'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already flagged');
    });

    it('should return 404 for non-existent message', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .post(`/api/chats/admin/messages/${fakeId}/flag`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Valid reason for non-existent message'
        })
        .expect(404);
    });

    it('should require admin authorization', async () => {
      await request(app)
        .post(`/api/chats/admin/messages/${testMessage._id}/flag`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reason: 'User attempting to flag message'
        })
        .expect(403);
    });
  });

  describe('POST /api/chats/admin/messages/:messageId/hide - Hide Message', () => {
    it('should hide message successfully', async () => {
      const res = await request(app)
        .post(`/api/chats/admin/messages/${testMessage._id}/hide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Message contains spam and should be hidden from all users'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message.isHidden).toBe(true);
      expect(res.body.data.message.hiddenReason).toBe('Message contains spam and should be hidden from all users');
      expect(res.body.data.message.hiddenBy.toString()).toBe(adminUser._id.toString());
    });

    it('should require reason field', async () => {
      const res = await request(app)
        .post(`/api/chats/admin/messages/${testMessage._id}/hide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('reason');
    });

    it('should validate reason length (minimum 10 characters)', async () => {
      const res = await request(app)
        .post(`/api/chats/admin/messages/${testMessage._id}/hide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Bad' // Less than 10 characters
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('10 characters');
    });

    it('should prevent hiding already hidden message', async () => {
      // Hide the message first
      await request(app)
        .post(`/api/chats/admin/messages/${testMessage._id}/hide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'First hide with valid reason for testing'
        })
        .expect(200);

      // Try to hide again
      const res = await request(app)
        .post(`/api/chats/admin/messages/${testMessage._id}/hide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Second hide attempt with valid reason'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already hidden');
    });

    it('should require admin authorization', async () => {
      await request(app)
        .post(`/api/chats/admin/messages/${testMessage._id}/hide`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reason: 'User attempting to hide message'
        })
        .expect(403);
    });
  });

  describe('POST /api/chats/admin/messages/:messageId/unhide - Unhide Message', () => {
    beforeEach(async () => {
      // Hide the message first
      testMessage.isHidden = true;
      testMessage.hiddenBy = adminUser._id;
      testMessage.hiddenAt = new Date();
      testMessage.hiddenReason = 'Test hide';
      await testMessage.save();
    });

    it('should unhide message successfully', async () => {
      const res = await request(app)
        .post(`/api/chats/admin/messages/${testMessage._id}/unhide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message.isHidden).toBe(false);
    });

    it('should return 400 when message is not hidden', async () => {
      // Unhide first
      await request(app)
        .post(`/api/chats/admin/messages/${testMessage._id}/unhide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Try to unhide again
      const res = await request(app)
        .post(`/api/chats/admin/messages/${testMessage._id}/unhide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not hidden');
    });

    it('should require admin authorization', async () => {
      await request(app)
        .post(`/api/chats/admin/messages/${testMessage._id}/unhide`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);
    });
  });

  describe('POST /api/chats/messages/:messageId/report - Report Message (User)', () => {
    it('should allow user to report message', async () => {
      const res = await request(app)
        .post(`/api/chats/messages/${testMessage._id}/report`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reason: 'This message contains spam content that should be reviewed',
          category: 'spam'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message.reportCount).toBe(1);
      expect(res.body.data.message.reports).toHaveLength(1);
      expect(res.body.data.message.reports[0].category).toBe('spam');
    });

    it('should require reason field', async () => {
      const res = await request(app)
        .post(`/api/chats/messages/${testMessage._id}/report`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          category: 'spam'
          // Missing reason
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('reason');
    });

    it('should require category field', async () => {
      const res = await request(app)
        .post(`/api/chats/messages/${testMessage._id}/report`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reason: 'Valid reason but missing category'
          // Missing category
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('category');
    });

    it('should validate category enum', async () => {
      const res = await request(app)
        .post(`/api/chats/messages/${testMessage._id}/report`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reason: 'Valid reason with invalid category',
          category: 'invalid-category' // Not in enum
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should validate reason length (minimum 10 characters)', async () => {
      const res = await request(app)
        .post(`/api/chats/messages/${testMessage._id}/report`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reason: 'Spam', // Less than 10 characters
          category: 'spam'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('10 characters');
    });

    it('should prevent duplicate reports from same user', async () => {
      // First report
      await request(app)
        .post(`/api/chats/messages/${testMessage._id}/report`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reason: 'First report with valid reason for testing',
          category: 'spam'
        })
        .expect(200);

      // Try to report again
      const res = await request(app)
        .post(`/api/chats/messages/${testMessage._id}/report`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reason: 'Second report attempt with valid reason',
          category: 'spam'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already reported');
    });

    it('should increment reportCount for multiple unique reporters', async () => {
      // User 1 reports
      await request(app)
        .post(`/api/chats/messages/${testMessage._id}/report`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reason: 'User 1 reporting spam message for review',
          category: 'spam'
        })
        .expect(200);

      // Login user 2
      const user2LoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user2@test.com',
          password: 'password123'
        });
      const user2Token = user2LoginRes.body.data.token;

      // User 2 reports
      const res = await request(app)
        .post(`/api/chats/messages/${testMessage._id}/report`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          reason: 'User 2 also reporting this spam message',
          category: 'spam'
        })
        .expect(200);

      expect(res.body.data.message.reportCount).toBe(2);
    });

    it('should require authentication', async () => {
      await request(app)
        .post(`/api/chats/messages/${testMessage._id}/report`)
        .send({
          reason: 'Reporting without authentication',
          category: 'spam'
        })
        .expect(401);
    });

    it('should return 404 for non-existent message', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .post(`/api/chats/messages/${fakeId}/report`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reason: 'Valid reason for non-existent message',
          category: 'spam'
        })
        .expect(404);
    });
  });

  describe('Report Categories', () => {
    it('should accept valid report categories', async () => {
      const validCategories = ['spam', 'harassment', 'inappropriate', 'scam', 'other'];

      for (const category of validCategories) {
        // Create new message for each category
        const msg = await Message.create({
          chat: testChat._id,
          sender: user1._id,
          content: `Test message for ${category}`
        });

        const res = await request(app)
          .post(`/api/chats/messages/${msg._id}/report`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            reason: `Testing valid category: ${category} with sufficient length`,
            category: category
          })
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.message.reports[0].category).toBe(category);
      }
    });
  });
});
