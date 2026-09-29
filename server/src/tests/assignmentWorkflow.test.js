import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

test('Assignment Workflow (Queue 10): worker listing & issue dispatch', async (t) => {
  const adminId = new mongoose.Types.ObjectId();
  const workerId = new mongoose.Types.ObjectId();
  const departmentId = new mongoose.Types.ObjectId();
  const issueId = new mongoose.Types.ObjectId();

  const mockAdmin = new User({
    _id: adminId,
    name: 'Admin Dave',
    email: 'admin_dispatch@civicresolve.org',
    role: 'administrator',
    isActive: true,
  });

  const mockWorker = new User({
    _id: workerId,
    name: 'Worker Ramesh',
    email: 'ramesh_worker@civicresolve.org',
    role: 'field_worker',
    isActive: true,
    department: departmentId,
  });

  const adminToken = generateAccessToken(mockAdmin);

  const originalUserFindById = User.findById;
  const originalUserFindOne = User.findOne;
  const originalUserFind = User.find;
  const originalIssueFindOne = Issue.findOne;
  const originalIssueFindById = Issue.findById;
  const originalIssueCountDocuments = Issue.countDocuments;

  const createMockIssue = (initialStatus = 'in_review') => {
    return {
      _id: issueId,
      issueNumber: 'CIVIC-2026-000555',
      title: 'Water pipe leak on main road',
      description: 'Severe water leak flooding the pedestrian sidewalk.',
      status: initialStatus,
      priority: 'medium',
      department: departmentId,
      timeline: [],
      auditLogs: [],
      save: function () {
        return Promise.resolve(this);
      },
      toObject: function () {
        return { ...this };
      },
    };
  };

  const populateMock = (doc) => ({
    populate: () => ({
      populate: () => ({
        populate: () => ({
          populate: () => ({
            populate: () => ({
              populate: () => Promise.resolve(doc),
            }),
          }),
        }),
      }),
    }),
  });

  await t.test('GET /api/admin/workers returns list of field workers', async () => {
    User.findById = () => ({
      select: () => Promise.resolve(mockAdmin),
      then: (resolve) => resolve(mockAdmin),
    });

    User.find = () => ({
      select: () => ({
        populate: () => ({
          populate: () =>
            Promise.resolve([
              {
                _id: workerId,
                name: 'Worker Ramesh',
                email: 'ramesh_worker@civicresolve.org',
                role: 'field_worker',
                toObject: function () {
                  return { ...this };
                },
              },
            ]),
        }),
      }),
    });

    Issue.countDocuments = () => Promise.resolve(2);

    const res = await request(app)
      .get('/api/admin/workers')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].activeTasksCount, 2);
  });

  await t.test('POST /api/admin/issues/:id/assign rejects invalid worker with 400', async () => {
    const mockIssue = createMockIssue('in_review');

    User.findById = () => ({
      select: () => Promise.resolve(mockAdmin),
      then: (resolve) => resolve(mockAdmin),
    });

    Issue.findOne = () => Promise.resolve(mockIssue);
    User.findOne = () => Promise.resolve(null); // Invalid / non-existent worker

    const res = await request(app)
      .post(`/api/admin/issues/${issueId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        workerId: new mongoose.Types.ObjectId(),
        priority: 'high',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not an active field worker/i);
  });

  await t.test('POST /api/admin/issues/:id/assign successfully assigns worker and updates SLA', async () => {
    const mockIssue = createMockIssue('in_review');

    User.findById = () => ({
      select: () => Promise.resolve(mockAdmin),
      then: (resolve) => resolve(mockAdmin),
    });

    Issue.findOne = () => Promise.resolve(mockIssue);
    User.findOne = () => Promise.resolve(mockWorker);
    Issue.findById = () => populateMock(mockIssue);

    const res = await request(app)
      .post(`/api/admin/issues/${issueId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        departmentId,
        workerId,
        priority: 'urgent',
        slaHours: 24,
        assignmentNote: 'Dispatch immediately due to water loss.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(mockIssue.status, 'assigned');
    assert.equal(mockIssue.priority, 'urgent');
    assert.equal(mockIssue.assignedWorker.toString(), workerId.toString());
    assert.ok(mockIssue.slaDeadline);
    assert.equal(mockIssue.timeline.length, 1);
    assert.equal(mockIssue.timeline[0].status, 'assigned');
    assert.match(mockIssue.timeline[0].note, /Dispatch immediately/i);
  });

  // Restore mocks
  User.findById = originalUserFindById;
  User.findOne = originalUserFindOne;
  User.find = originalUserFind;
  Issue.findOne = originalIssueFindOne;
  Issue.findById = originalIssueFindById;
  Issue.countDocuments = originalIssueCountDocuments;
});
