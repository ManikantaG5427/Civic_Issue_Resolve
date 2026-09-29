import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

test('Administrator Review Queue: GET /api/admin/review-queue requires authentication with 401', async () => {
  const res = await request(app).get('/api/admin/review-queue');
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('Administrator Review Queue: GET /api/admin/review-queue rejects citizen role with 403', async () => {
  const mockCitizen = new User({
    _id: new mongoose.Types.ObjectId(),
    name: 'Citizen Jane',
    email: 'citizen_test@civicresolve.org',
    role: 'citizen',
    isActive: true,
  });
  const citizenToken = generateAccessToken(mockCitizen);

  const originalFindById = User.findById;
  User.findById = () => ({
    select: () => Promise.resolve(mockCitizen),
    then: (resolve) => resolve(mockCitizen),
  });

  try {
    const res = await request(app)
      .get('/api/admin/review-queue')
      .set('Authorization', `Bearer ${citizenToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not authorized/i);
  } finally {
    User.findById = originalFindById;
  }
});

test('Administrator Review Queue: allows administrator and returns metrics, issues, and pagination', async () => {
  const mockAdmin = new User({
    _id: new mongoose.Types.ObjectId(),
    name: 'Admin Dave',
    email: 'admin_test@civicresolve.org',
    role: 'administrator',
    isActive: true,
    serviceArea: new mongoose.Types.ObjectId(),
  });
  const adminToken = generateAccessToken(mockAdmin);

  const originalUserFindById = User.findById;
  const originalCountDocuments = Issue.countDocuments;
  const originalFind = Issue.find;

  User.findById = () => ({
    select: () => Promise.resolve(mockAdmin),
    then: (resolve) => resolve(mockAdmin),
  });

  Issue.countDocuments = () => Promise.resolve(3);
  Issue.find = () => ({
    populate: () => ({
      populate: () => ({
        populate: () => ({
          populate: () => ({
            populate: () => ({
              sort: () => ({
                skip: () => ({
                  limit: () =>
                    Promise.resolve([
                      {
                        _id: new mongoose.Types.ObjectId(),
                        issueNumber: 'CIVIC-2026-000101',
                        title: 'Broken water pipe on road 3',
                        status: 'submitted',
                        priority: 'high',
                        category: { name: 'Water Supply', icon: 'droplet' },
                        serviceArea: { name: 'Kukatpally Pilot Area', code: 'HYD-KPK' },
                      },
                    ]),
                }),
              }),
            }),
          }),
        }),
      }),
    }),
  });

  try {
    const res = await request(app)
      .get('/api/admin/review-queue?status=triage&priority=all&page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.metrics);
    assert.equal(typeof res.body.data.metrics.pendingTriage, 'number');
    assert.equal(res.body.data.pagination.page, 1);
    assert.equal(res.body.data.issues.length, 1);
    assert.equal(res.body.data.issues[0].issueNumber, 'CIVIC-2026-000101');
  } finally {
    User.findById = originalUserFindById;
    Issue.countDocuments = originalCountDocuments;
    Issue.find = originalFind;
  }
});
