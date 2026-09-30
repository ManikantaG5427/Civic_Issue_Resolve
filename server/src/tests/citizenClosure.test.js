import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

test('Citizen Closure & Reopen (Queue 14): verification, star rating, feedback and reopen', async (t) => {
  const citizenId = new mongoose.Types.ObjectId();
  const otherCitizenId = new mongoose.Types.ObjectId();
  const testIssueId = new mongoose.Types.ObjectId();

  const mockCitizen = new User({
    _id: citizenId,
    name: 'Citizen Ananya',
    email: 'ananya@civicresolve.org',
    role: 'citizen',
    isActive: true,
  });

  const mockOtherCitizen = new User({
    _id: otherCitizenId,
    name: 'Citizen Other',
    email: 'other@civicresolve.org',
    role: 'citizen',
    isActive: true,
  });

  const citizenToken = generateAccessToken(mockCitizen);
  const otherCitizenToken = generateAccessToken(mockOtherCitizen);

  const originalUserFindById = User.findById;
  const originalIssueFindOne = Issue.findOne;
  const originalIssueFindById = Issue.findById;

  await t.test('POST /api/issues/:id/confirm-resolution blocks non-owner citizen with 403', async () => {
    User.findById = () => ({
      select: () => Promise.resolve(mockOtherCitizen),
      then: (resolve) => resolve(mockOtherCitizen),
    });

    Issue.findOne = () =>
      Promise.resolve({
        _id: testIssueId,
        issueNumber: 'CIVIC-2026-000999',
        status: 'resolved_verification_pending',
        reporter: citizenId, // Belongs to Ananya, not other citizen
        timeline: [],
        auditLogs: [],
      });

    const res = await request(app)
      .post(`/api/issues/${testIssueId}/confirm-resolution`)
      .set('Authorization', `Bearer ${otherCitizenToken}`)
      .send({ rating: 5, feedback: 'Great job' });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /only confirm closure of your own/i);
  });

  await t.test('POST /api/issues/:id/confirm-resolution requires valid 1-5 star rating', async () => {
    User.findById = () => ({
      select: () => Promise.resolve(mockCitizen),
      then: (resolve) => resolve(mockCitizen),
    });

    const res = await request(app)
      .post(`/api/issues/${testIssueId}/confirm-resolution`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ rating: 6 }); // Invalid rating > 5

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /rating between 1 and 5/i);
  });

  await t.test('POST /api/issues/:id/confirm-resolution sets status to closed and stores feedback', async () => {
    User.findById = () => ({
      select: () => Promise.resolve(mockCitizen),
      then: (resolve) => resolve(mockCitizen),
    });

    const mockIssueDoc = {
      _id: testIssueId,
      issueNumber: 'CIVIC-2026-000999',
      status: 'resolved_verification_pending',
      reporter: citizenId,
      timeline: [],
      auditLogs: [],
      feedback: {},
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
                    status: 'closed',
                    feedback: { rating: 5, comment: 'Fixed perfectly!' },
                  }),
              }),
            }),
          }),
        }),
      }),
    });

    const res = await request(app)
      .post(`/api/issues/${testIssueId}/confirm-resolution`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ rating: 5, feedback: 'Fixed perfectly!' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(mockIssueDoc.status, 'closed');
    assert.equal(mockIssueDoc.feedback.rating, 5);
    assert.equal(mockIssueDoc.timeline[0].action, 'Resolution Confirmed & Ticket Closed');
  });

  await t.test('POST /api/issues/:id/reopen requires mandatory explanation', async () => {
    User.findById = () => ({
      select: () => Promise.resolve(mockCitizen),
      then: (resolve) => resolve(mockCitizen),
    });

    const res = await request(app)
      .post(`/api/issues/${testIssueId}/reopen`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ reopenReason: 'Short' }); // < 10 chars

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /at least 10 characters/i);
  });

  await t.test('POST /api/issues/:id/reopen transitions status to reopened and records defect photos', async () => {
    User.findById = () => ({
      select: () => Promise.resolve(mockCitizen),
      then: (resolve) => resolve(mockCitizen),
    });

    const mockIssueDoc = {
      _id: testIssueId,
      issueNumber: 'CIVIC-2026-000999',
      status: 'resolved_verification_pending',
      reporter: citizenId,
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
                    status: 'reopened',
                  }),
              }),
            }),
          }),
        }),
      }),
    });

    const res = await request(app)
      .post(`/api/issues/${testIssueId}/reopen`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        reopenReason: 'The water leakage started leaking again this morning.',
        reopenPhotos: ['/uploads/evidence/reopen_defect.jpg'],
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(mockIssueDoc.status, 'reopened');
    assert.equal(mockIssueDoc.evidence.length, 1);
    assert.equal(mockIssueDoc.evidence[0].stage, 'reopen');
    assert.equal(mockIssueDoc.timeline[0].action, 'Issue Reopened (Defect / Incomplete Work)');
  });

  // Restore mocks
  User.findById = originalUserFindById;
  Issue.findOne = originalIssueFindOne;
  Issue.findById = originalIssueFindById;
});
