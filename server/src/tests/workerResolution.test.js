import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

test('Worker Resolution (Queue 13): resolution proof and photo verification', async (t) => {
  const workerId = new mongoose.Types.ObjectId();
  const testIssueId = new mongoose.Types.ObjectId();

  const mockWorker = new User({
    _id: workerId,
    name: 'Worker Ramesh',
    email: 'ramesh_worker@civicresolve.org',
    role: 'field_worker',
    isActive: true,
  });

  const workerToken = generateAccessToken(mockWorker);

  const originalUserFindById = User.findById;
  const originalIssueFindOne = Issue.findOne;
  const originalIssueFindById = Issue.findById;

  await t.test('POST /api/worker/issues/:id/resolve requires mandatory photo proof', async () => {
    User.findById = () => ({
      select: () => Promise.resolve(mockWorker),
      then: (resolve) => resolve(mockWorker),
    });

    const res = await request(app)
      .post(`/api/worker/issues/${testIssueId}/resolve`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        resolutionSummary: 'Pothole successfully paved with asphalt and rolled clean.',
        resolutionPhotos: [], // Missing mandatory proof
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /photograph is required/i);
  });

  await t.test('POST /api/worker/issues/:id/resolve requires minimum 10 char summary', async () => {
    User.findById = () => ({
      select: () => Promise.resolve(mockWorker),
      then: (resolve) => resolve(mockWorker),
    });

    const res = await request(app)
      .post(`/api/worker/issues/${testIssueId}/resolve`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        resolutionSummary: 'Done', // < 10 chars
        resolutionPhotos: ['/uploads/evidence/after_fix.jpg'],
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /at least 10 characters/i);
  });

  await t.test('POST /api/worker/issues/:id/resolve transitions status to resolved_verification_pending', async () => {
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
      evidence: [
        { url: '/uploads/evidence/before_1.jpg', stage: 'initial' },
      ],
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
                    status: 'resolved_verification_pending',
                    timeline: [
                      {
                        action: 'Resolved by Field Personnel',
                        status: 'resolved_verification_pending',
                        note: 'Resolution Summary: Pothole successfully reconstructed with 50mm bitumen layer.',
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
      .post(`/api/worker/issues/${testIssueId}/resolve`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        resolutionSummary: 'Pothole successfully reconstructed with 50mm bitumen layer.',
        resolutionPhotos: ['/uploads/evidence/after_repair_1.jpg'],
        materialsUsed: 'Cold mix asphalt 80kg, Compactor roller',
        repairCost: 4500,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(mockIssueDoc.status, 'resolved_verification_pending');
    assert.equal(mockIssueDoc.evidence.length, 2);
    assert.equal(mockIssueDoc.evidence[1].stage, 'resolution');
    assert.equal(mockIssueDoc.timeline[0].action, 'Resolved by Field Personnel');
  });

  // Restore mocks
  User.findById = originalUserFindById;
  Issue.findOne = originalIssueFindOne;
  Issue.findById = originalIssueFindById;
});
