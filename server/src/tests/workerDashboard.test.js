import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

test('Worker Dashboard (Queue 11): task queue retrieval and RBAC', async (t) => {
  const workerId = new mongoose.Types.ObjectId();
  const citizenId = new mongoose.Types.ObjectId();

  const mockWorker = new User({
    _id: workerId,
    name: 'Worker Ramesh',
    email: 'ramesh_worker@civicresolve.org',
    role: 'field_worker',
    isActive: true,
  });

  const mockCitizen = new User({
    _id: citizenId,
    name: 'Citizen Alice',
    email: 'alice_citizen@civicresolve.org',
    role: 'citizen',
    isActive: true,
  });

  const workerToken = generateAccessToken(mockWorker);
  const citizenToken = generateAccessToken(mockCitizen);

  const originalUserFindById = User.findById;
  const originalIssueCountDocuments = Issue.countDocuments;
  const originalIssueFind = Issue.find;

  await t.test('GET /api/worker/tasks requires authentication with 401', async () => {
    const res = await request(app).get('/api/worker/tasks');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('GET /api/worker/tasks rejects citizen role with 403', async () => {
    User.findById = () => ({
      select: () => Promise.resolve(mockCitizen),
      then: (resolve) => resolve(mockCitizen),
    });

    const res = await request(app)
      .get('/api/worker/tasks')
      .set('Authorization', `Bearer ${citizenToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not authorized/i);
  });

  await t.test('GET /api/worker/tasks allows field worker and returns task metrics', async () => {
    User.findById = () => ({
      select: () => Promise.resolve(mockWorker),
      then: (resolve) => resolve(mockWorker),
    });

    Issue.countDocuments = () => Promise.resolve(2);
    Issue.find = () => ({
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
                        issueNumber: 'CIVIC-2026-000888',
                        title: 'Repair manhole cover at KPHB 7th road',
                        status: 'assigned',
                        priority: 'high',
                        slaDeadline: new Date(Date.now() + 24 * 3600 * 1000),
                        category: { name: 'Drainage & Sewerage' },
                        serviceArea: { name: 'Kukatpally Pilot Area' },
                      },
                    ]),
                }),
              }),
            }),
          }),
        }),
      }),
    });

    const res = await request(app)
      .get('/api/worker/tasks?status=active&page=1&limit=10')
      .set('Authorization', `Bearer ${workerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.metrics);
    assert.equal(typeof res.body.data.metrics.assigned, 'number');
    assert.equal(typeof res.body.data.metrics.inProgress, 'number');
    assert.equal(typeof res.body.data.metrics.overdue, 'number');
    assert.equal(res.body.data.tasks.length, 1);
    assert.equal(res.body.data.tasks[0].issueNumber, 'CIVIC-2026-000888');
  });

  // Restore mocks
  User.findById = originalUserFindById;
  Issue.countDocuments = originalIssueCountDocuments;
  Issue.find = originalIssueFind;
});
