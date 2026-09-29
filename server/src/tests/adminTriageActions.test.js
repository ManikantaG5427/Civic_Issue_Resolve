import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

test('Admin Triage (Queue 9): verify, reject, request-info validation & transitions', async (t) => {
  const adminId = new mongoose.Types.ObjectId();
  const citizenId = new mongoose.Types.ObjectId();
  const issueId = new mongoose.Types.ObjectId();

  const mockAdmin = new User({
    _id: adminId,
    name: 'Admin Dave',
    email: 'admin_triage@civicresolve.org',
    role: 'administrator',
    isActive: true,
  });

  const mockCitizen = new User({
    _id: citizenId,
    name: 'Citizen Alice',
    email: 'alice_citizen@civicresolve.org',
    role: 'citizen',
    isActive: true,
  });

  const adminToken = generateAccessToken(mockAdmin);
  const citizenToken = generateAccessToken(mockCitizen);

  const originalUserFindById = User.findById;
  const originalIssueFindOne = Issue.findOne;
  const originalIssueFindById = Issue.findById;

  const createMockIssue = (initialStatus = 'submitted') => {
    return {
      _id: issueId,
      issueNumber: 'CIVIC-2026-000099',
      title: 'Broken streetlight on 5th avenue',
      description: 'Streetlight has been out for three days.',
      status: initialStatus,
      reporter: citizenId,
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

  await t.test('POST /api/admin/issues/:id/verify verifies issue and transitions to in_review', async () => {
    const mockIssue = createMockIssue('submitted');

    User.findById = () => ({
      select: () => Promise.resolve(mockAdmin),
      then: (resolve) => resolve(mockAdmin),
    });

    Issue.findOne = () => Promise.resolve(mockIssue);
    Issue.findById = () => populateMock(mockIssue);

    const res = await request(app)
      .post(`/api/admin/issues/${issueId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'Verified by field inspector' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(mockIssue.status, 'in_review');
    assert.equal(mockIssue.timeline.length, 1);
    assert.equal(mockIssue.timeline[0].status, 'in_review');
  });

  await t.test('POST /api/admin/issues/:id/reject rejects missing reason with 400', async () => {
    User.findById = () => ({
      select: () => Promise.resolve(mockAdmin),
      then: (resolve) => resolve(mockAdmin),
    });

    const res = await request(app)
      .post(`/api/admin/issues/${issueId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'short' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  await t.test('POST /api/admin/issues/:id/reject sets status to rejected with timeline note', async () => {
    const mockIssue = createMockIssue('submitted');

    User.findById = () => ({
      select: () => Promise.resolve(mockAdmin),
      then: (resolve) => resolve(mockAdmin),
    });

    Issue.findOne = () => Promise.resolve(mockIssue);
    Issue.findById = () => populateMock(mockIssue);

    const res = await request(app)
      .post(`/api/admin/issues/${issueId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Out of municipal pilot jurisdiction boundary.', category: 'jurisdiction' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(mockIssue.status, 'rejected');
    assert.match(mockIssue.timeline[0].note, /jurisdiction/i);
  });

  await t.test('POST /api/admin/issues/:id/request-info sets status to info_requested', async () => {
    const mockIssue = createMockIssue('submitted');

    User.findById = () => ({
      select: () => Promise.resolve(mockAdmin),
      then: (resolve) => resolve(mockAdmin),
    });

    Issue.findOne = () => Promise.resolve(mockIssue);
    Issue.findById = () => populateMock(mockIssue);

    const res = await request(app)
      .post(`/api/admin/issues/${issueId}/request-info`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: 'Please attach a clear photo of the pole serial number.' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(mockIssue.status, 'info_requested');
  });

  await t.test('POST /api/issues/:id/provide-info allows citizen to reply', async () => {
    const mockIssue = createMockIssue('info_requested');

    User.findById = () => ({
      select: () => Promise.resolve(mockCitizen),
      then: (resolve) => resolve(mockCitizen),
    });

    Issue.findOne = () => Promise.resolve(mockIssue);
    Issue.findById = () => populateMock(mockIssue);

    const res = await request(app)
      .post(`/api/issues/${issueId}/provide-info`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ responseNote: 'Pole number is KPHB-PL-4421 near pillar 12.' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(mockIssue.status, 'in_review');
  });

  // Restore mocks
  User.findById = originalUserFindById;
  Issue.findOne = originalIssueFindOne;
  Issue.findById = originalIssueFindById;
});
