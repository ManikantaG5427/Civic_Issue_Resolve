import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import Department from '../models/Department.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

describe('Administrator Analytics & Operational Intelligence (Queue 20)', () => {
  let citizenToken;
  let adminToken;
  let adminUser;
  let citizenUser;

  before(async () => {
    const adminId = new mongoose.Types.ObjectId();
    const citizenId = new mongoose.Types.ObjectId();

    adminUser = {
      _id: adminId,
      name: 'Admin Supervisor',
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

    User.findById = (id) => {
      if (id.toString() === adminId.toString()) return Promise.resolve(adminUser);
      if (id.toString() === citizenId.toString()) return Promise.resolve(citizenUser);
      return Promise.resolve(null);
    };

    User.find = () => ({
      select: () =>
        Promise.resolve([
          { _id: new mongoose.Types.ObjectId(), name: 'Field Specialist 1', email: 'worker1@test.com' },
        ]),
    });

    Department.find = () => ({
      select: () =>
        Promise.resolve([
          { _id: new mongoose.Types.ObjectId(), name: 'Sanitation Department', code: 'SNT' },
        ]),
    });

    Issue.aggregate = (_pipeline) => {
      return Promise.resolve([
        { _id: 'submitted', count: 5 },
        { _id: 'in_progress', count: 3 },
        { _id: 'closed', count: 8 },
      ]);
    };

    Issue.countDocuments = () => Promise.resolve(4);

    Issue.find = () => ({
      select: () =>
        Promise.resolve([
          {
            _id: new mongoose.Types.ObjectId(),
            status: 'closed',
            createdAt: new Date(Date.now() - 3600000 * 10),
            updatedAt: new Date(),
            assignedAt: new Date(Date.now() - 3600000 * 8),
            slaDeadline: new Date(Date.now() + 3600000 * 20),
            isEscalated: false,
            feedback: { rating: 5 },
          },
        ]),
    });
  });

  test('GET /api/admin/analytics requires authentication with 401', async () => {
    const res = await request(app).get('/api/admin/analytics');
    assert.equal(res.status, 401);
  });

  test('GET /api/admin/analytics rejects citizen role with 403', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${citizenToken}`);

    assert.equal(res.status, 403);
  });

  test('GET /api/admin/analytics returns comprehensive KPI scorecard and breakdown for admin', async () => {
    const res = await request(app)
      .get('/api/admin/analytics?timeRange=30d')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.kpis);
    assert.ok(typeof res.body.kpis.resolutionRate === 'number');
    assert.ok(res.body.statusDistribution);
    assert.ok(Array.isArray(res.body.departmentPerformance));
    assert.ok(Array.isArray(res.body.workerLeaderboard));
  });
});
