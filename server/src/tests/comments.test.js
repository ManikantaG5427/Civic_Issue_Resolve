import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import Notification from '../models/Notification.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

describe('Comments & Internal Notes Subsystem (Queue 17)', () => {
  let citizenToken;
  let otherCitizenToken;
  let workerToken;
  let adminToken;
  let citizenUser;
  let otherCitizenUser;
  let workerUser;
  let adminUser;
  let testIssue;

  before(async () => {
    // Mock Notification save
    Notification.prototype.save = async function () {
      return this;
    };
    // Generate valid tokens with mocked DB methods
    const citizenId = new mongoose.Types.ObjectId();
    const otherCitizenId = new mongoose.Types.ObjectId();
    const workerId = new mongoose.Types.ObjectId();
    const adminId = new mongoose.Types.ObjectId();

    citizenUser = { _id: citizenId, name: 'Citizen Reporter', email: 'citizen@test.com', role: 'citizen', isActive: true };
    otherCitizenUser = { _id: otherCitizenId, name: 'Other Citizen', email: 'other@test.com', role: 'citizen', isActive: true };
    workerUser = { _id: workerId, name: 'Field Specialist', email: 'worker@test.com', role: 'field_worker', isActive: true };
    adminUser = { _id: adminId, name: 'Admin Lead', email: 'admin@test.com', role: 'administrator', isActive: true };

    citizenToken = generateAccessToken(citizenUser);
    otherCitizenToken = generateAccessToken(otherCitizenUser);
    workerToken = generateAccessToken(workerUser);
    adminToken = generateAccessToken(adminUser);

    testIssue = {
      _id: new mongoose.Types.ObjectId(),
      issueNumber: 'CIVIC-2026-000077',
      title: 'Water Main Pressure Issue',
      description: 'Severe water leakage on primary avenue road.',
      status: 'in_progress',
      priority: 'high',
      reporter: { _id: citizenId, name: 'Citizen Reporter', email: 'citizen@test.com', role: 'citizen' },
      assignedWorker: { _id: workerId, name: 'Field Specialist', email: 'worker@test.com', role: 'field_worker' },
      comments: [
        {
          _id: new mongoose.Types.ObjectId(),
          author: citizenId,
          authorName: 'Citizen Reporter',
          authorRole: 'citizen',
          content: 'Water is still leaking this morning.',
          isInternal: false,
          createdAt: new Date(),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          author: workerId,
          authorName: 'Field Specialist',
          authorRole: 'field_worker',
          content: 'Replacement pipe valve ordered from supplier depot.',
          isInternal: true,
          createdAt: new Date(),
        },
      ],
      timeline: [],
      auditLogs: [],
      save: async function () { return this; },
      toObject: function () {
        return {
          ...this,
          comments: [...this.comments],
          timeline: [...this.timeline],
        };
      },
    };

    // Mock User.findById
    User.findById = (id) => {
      const idStr = id.toString();
      if (idStr === citizenId.toString()) return Promise.resolve(citizenUser);
      if (idStr === otherCitizenId.toString()) return Promise.resolve(otherCitizenUser);
      if (idStr === workerId.toString()) return Promise.resolve(workerUser);
      if (idStr === adminId.toString()) return Promise.resolve(adminUser);
      return Promise.resolve(null);
    };

    // Mock Issue.findOne
    Issue.findOne = (_query) => {
      const mockQuery = {
        populate: function () { return this; },
        select: function () { return this; },
        then: function (resolve) { resolve(testIssue); },
      };
      return mockQuery;
    };
  });

  test('POST /api/issues/:id/comments returns 403 for non-reporter citizen', async () => {
    const res = await request(app)
      .post(`/api/issues/${testIssue._id}/comments`)
      .set('Authorization', `Bearer ${otherCitizenToken}`)
      .send({ content: 'Unauthorized citizen comment' });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('POST /api/issues/:id/comments requires authentication with 401', async () => {
    const res = await request(app)
      .post(`/api/issues/${testIssue._id}/comments`)
      .send({ content: 'Test unauthenticated comment' });

    assert.equal(res.status, 401);
  });

  test('POST /api/issues/:id/comments validates minimum content length with 400', async () => {
    const res = await request(app)
      .post(`/api/issues/${testIssue._id}/comments`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ content: ' ' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  test('POST /api/issues/:id/comments allows citizen reporter to post public comment', async () => {
    const res = await request(app)
      .post(`/api/issues/${testIssue._id}/comments`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ content: 'Can we get an estimated time of completion?' });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.comment.content, 'Can we get an estimated time of completion?');
    assert.equal(res.body.comment.isInternal, false);
  });

  test('POST /api/issues/:id/comments forces isInternal=false for citizens', async () => {
    const res = await request(app)
      .post(`/api/issues/${testIssue._id}/comments`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ content: 'Citizen trying to post internal note', isInternal: true });

    assert.equal(res.status, 201);
    assert.equal(res.body.comment.isInternal, false);
  });

  test('POST /api/issues/:id/comments allows staff to post internal notes', async () => {
    const res = await request(app)
      .post(`/api/issues/${testIssue._id}/comments`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ content: 'Specialist valve repair scheduled for 2 PM.', isInternal: true });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.comment.isInternal, true);
  });

  test('GET /api/issues/:id/comments returns sanitized comments for citizen (no internal notes)', async () => {
    const res = await request(app)
      .get(`/api/issues/${testIssue._id}/comments`)
      .set('Authorization', `Bearer ${citizenToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    // Should only include isInternal === false
    const hasInternal = res.body.comments.some((c) => c.isInternal === true);
    assert.equal(hasInternal, false, 'Citizen must not see internal notes');
  });

  test('GET /api/issues/:id/comments returns all comments including internal notes for staff', async () => {
    const res = await request(app)
      .get(`/api/issues/${testIssue._id}/comments`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const hasInternal = res.body.comments.some((c) => c.isInternal === true);
    assert.equal(hasInternal, true, 'Staff must see internal notes');
  });
});
