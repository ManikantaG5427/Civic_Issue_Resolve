import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import Notification from '../models/Notification.js';
import { generateAccessToken } from '../utils/tokenUtils.js';
import { checkAndEscalateOverdueIssues } from '../services/slaCronService.js';

describe('SLA Automated Background Engine & Escalation (Queue 19)', () => {
  let citizenToken;
  let adminToken;
  let adminUser;
  let citizenUser;
  let overdueIssue;

  before(async () => {
    Notification.prototype.save = async function () {
      return this;
    };

    const adminId = new mongoose.Types.ObjectId();
    const citizenId = new mongoose.Types.ObjectId();
    const workerId = new mongoose.Types.ObjectId();

    adminUser = {
      _id: adminId,
      name: 'Municipal Admin',
      email: 'admin@test.com',
      role: 'administrator',
      isActive: true,
    };
    citizenUser = {
      _id: citizenId,
      name: 'Citizen User',
      email: 'citizen@test.com',
      role: 'citizen',
      isActive: true,
    };

    adminToken = generateAccessToken(adminUser);
    citizenToken = generateAccessToken(citizenUser);

    const pastDate = new Date(Date.now() - 3600 * 1000 * 24); // 1 day ago

    overdueIssue = {
      _id: new mongoose.Types.ObjectId(),
      issueNumber: 'CIVIC-2026-000099',
      title: 'Major Pipeline Breach',
      status: 'assigned',
      priority: 'high',
      slaDeadline: pastDate,
      isEscalated: false,
      reporter: { _id: citizenId, name: 'Citizen User' },
      assignedWorker: { _id: workerId, name: 'Worker One' },
      department: { name: 'Water Works', code: 'WTR' },
      timeline: [],
      auditLogs: [],
      save: async function () {
        return this;
      },
    };

    User.findById = (id) => {
      if (id.toString() === adminId.toString()) return Promise.resolve(adminUser);
      if (id.toString() === citizenId.toString()) return Promise.resolve(citizenUser);
      return Promise.resolve(null);
    };

    User.findOne = () => ({
      select: () => Promise.resolve(adminUser),
      then: (resolve) => resolve(adminUser),
    });

    User.find = () => ({
      select: () => Promise.resolve([adminUser]),
    });

    Issue.find = () => {
      const mockQuery = {
        populate: function () { return this; },
        sort: function () { return this; },
        then: function (resolve) { resolve([overdueIssue]); },
      };
      return mockQuery;
    };
  });

  test('checkAndEscalateOverdueIssues marks overdue task as escalated with timeline entry', async () => {
    const result = await checkAndEscalateOverdueIssues();
    assert.equal(result.escalatedCount, 1);
    assert.equal(overdueIssue.isEscalated, true);
    assert.ok(overdueIssue.timeline.length > 0);
    assert.ok(overdueIssue.timeline.some((t) => t.action.includes('SLA Breached')));
  });

  test('POST /api/admin/sla/check-escalations rejects citizen with 403', async () => {
    const res = await request(app)
      .post('/api/admin/sla/check-escalations')
      .set('Authorization', `Bearer ${citizenToken}`);

    assert.equal(res.status, 403);
  });

  test('POST /api/admin/sla/check-escalations triggers manual sweep for admin', async () => {
    const res = await request(app)
      .post('/api/admin/sla/check-escalations')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  test('GET /api/admin/sla/overdue returns list of overdue issues for admin', async () => {
    const res = await request(app)
      .get('/api/admin/sla/overdue')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.overdueIssues));
  });
});
