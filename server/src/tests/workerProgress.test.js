import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

test('Worker Progress (Queue 12): start-work and progress-update workflow', async (t) => {
  const workerId = new mongoose.Types.ObjectId();
  const otherWorkerId = new mongoose.Types.ObjectId();
  const testIssueId = new mongoose.Types.ObjectId();

  const mockWorker = new User({
    _id: workerId,
    name: 'Worker Ramesh',
    email: 'ramesh_worker@civicresolve.org',
    role: 'field_worker',
    isActive: true,
  });

  const mockOtherWorker = new User({
    _id: otherWorkerId,
    name: 'Worker Suresh',
    email: 'suresh_worker@civicresolve.org',
    role: 'field_worker',
    isActive: true,
  });

  const workerToken = generateAccessToken(mockWorker);
  const otherWorkerToken = generateAccessToken(mockOtherWorker);

  const originalUserFindById = User.findById;
  const originalIssueFindOne = Issue.findOne;
  const originalIssueFindById = Issue.findById;

  await t.test('POST /api/worker/issues/:id/start-work rejects unassigned worker with 403', async () => {
    User.findById = () => ({
      select: () => Promise.resolve(mockOtherWorker),
      then: (resolve) => resolve(mockOtherWorker),
    });

    Issue.findOne = () =>
      Promise.resolve({
        _id: testIssueId,
        issueNumber: 'CIVIC-2026-000888',
        status: 'assigned',
        assignedWorker: workerId, // Assigned to Ramesh, not Suresh
        timeline: [],
        auditLogs: [],
        save: () => Promise.resolve(),
      });

    const res = await request(app)
      .post(`/api/worker/issues/${testIssueId}/start-work`)
      .set('Authorization', `Bearer ${otherWorkerToken}`)
      .send({ note: 'Trying to start work' });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not assigned/i);
  });

  await t.test('POST /api/worker/issues/:id/start-work updates status to in_progress', async () => {
    User.findById = () => ({
      select: () => Promise.resolve(mockWorker),
      then: (resolve) => resolve(mockWorker),
    });

    const mockIssueDoc = {
      _id: testIssueId,
      issueNumber: 'CIVIC-2026-000888',
      status: 'assigned',
      assignedWorker: workerId,
      timeline: [],
      auditLogs: [],
      save: function () {
        return Promise.resolve(this);
      },
    };

    Issue.findOne = () => Promise.resolve(mockIssueDoc);
    Issue.findById = () => ({
      populate: () => ({
        populate: () => ({
          populate: () => ({
            populate: () => ({
              populate: () => ({
                populate: () =>
                  Promise.resolve({
                    ...mockIssueDoc,
                    status: 'in_progress',
                    timeline: [
                      {
                        action: 'Work Started',
                        status: 'in_progress',
                        note: 'Arrived at site with repair crew',
                      },
                    ],
                  }),
              }),
            }),
          }),
        }),
      }),
    });

    const res = await request(app)
      .post(`/api/worker/issues/${testIssueId}/start-work`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ note: 'Arrived at site with repair crew' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(mockIssueDoc.status, 'in_progress');
    assert.equal(mockIssueDoc.timeline.length, 1);
    assert.equal(mockIssueDoc.timeline[0].action, 'Work Started');
  });

  await t.test('POST /api/worker/issues/:id/progress-update validates note length', async () => {
    User.findById = () => ({
      select: () => Promise.resolve(mockWorker),
      then: (resolve) => resolve(mockWorker),
    });

    const res = await request(app)
      .post(`/api/worker/issues/${testIssueId}/progress-update`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ note: 'hi' }); // < 5 chars

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /at least 5 characters/i);
  });

  await t.test('POST /api/worker/issues/:id/progress-update records progress note and materials', async () => {
    User.findById = () => ({
      select: () => Promise.resolve(mockWorker),
      then: (resolve) => resolve(mockWorker),
    });

    const mockIssueDoc = {
      _id: testIssueId,
      issueNumber: 'CIVIC-2026-000888',
      status: 'in_progress',
      assignedWorker: workerId,
      timeline: [],
      auditLogs: [],
      evidence: [],
      save: function () {
        return Promise.resolve(this);
      },
    };

    Issue.findOne = () => Promise.resolve(mockIssueDoc);
    Issue.findById = () => ({
      populate: () => ({
        populate: () => ({
          populate: () => ({
            populate: () => ({
              populate: () => ({
                populate: () =>
                  Promise.resolve({
                    ...mockIssueDoc,
                    timeline: [
                      {
                        action: 'Progress Update',
                        status: 'in_progress',
                        note: 'Excavated damaged section.\n[Materials & Equipment: Asphalt 50kg, JCB excavator]',
                      },
                    ],
                  }),
              }),
            }),
          }),
        }),
      }),
    });

    const res = await request(app)
      .post(`/api/worker/issues/${testIssueId}/progress-update`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        note: 'Excavated damaged section.',
        materialsUsed: 'Asphalt 50kg, JCB excavator',
        stagePhotos: ['/uploads/evidence/progress_1.jpg'],
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(mockIssueDoc.timeline.length, 1);
    assert.equal(mockIssueDoc.evidence.length, 1);
    assert.equal(mockIssueDoc.evidence[0].stage, 'progress');
  });

  // Restore mocks
  User.findById = originalUserFindById;
  Issue.findOne = originalIssueFindOne;
  Issue.findById = originalIssueFindById;
});
