import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

describe('Geospatial Duplicate Detection & Social Support (Queue 18)', () => {
  let citizenToken;
  let citizenUser;
  let testIssue;

  before(async () => {
    const citizenId = new mongoose.Types.ObjectId();
    citizenUser = {
      _id: citizenId,
      name: 'Test Citizen',
      email: 'citizen@test.com',
      role: 'citizen',
      isActive: true,
    };
    citizenToken = generateAccessToken(citizenUser);

    testIssue = {
      _id: new mongoose.Types.ObjectId(),
      issueNumber: 'CIVIC-2026-000088',
      title: 'Pothole on 5th Main',
      description: 'Dangerous pothole on street road.',
      status: 'submitted',
      priority: 'high',
      location: {
        coordinates: [78.3967, 17.4849],
      },
      upvotes: [],
      followers: [],
      save: async function () {
        return this;
      },
      toObject: function () {
        return {
          ...this,
          upvotes: [...this.upvotes],
          followers: [...this.followers],
        };
      },
    };

    User.findById = (id) => {
      if (id.toString() === citizenId.toString()) return Promise.resolve(citizenUser);
      return Promise.resolve(null);
    };

    Issue.find = () => {
      const mockQuery = {
        populate: function () { return this; },
        select: function () { return this; },
        limit: function () { return this; },
        then: function (resolve) { resolve([testIssue]); },
      };
      return mockQuery;
    };

    Issue.findOne = () => {
      return Promise.resolve(testIssue);
    };
  });

  test('GET /api/issues/nearby-duplicates requires authentication with 401', async () => {
    const res = await request(app)
      .get('/api/issues/nearby-duplicates?latitude=17.4849&longitude=78.3967');

    assert.equal(res.status, 401);
  });

  test('GET /api/issues/nearby-duplicates validates invalid coordinate parameters with 400', async () => {
    const res = await request(app)
      .get('/api/issues/nearby-duplicates?latitude=invalid&longitude=78.3967')
      .set('Authorization', `Bearer ${citizenToken}`);

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  test('GET /api/issues/nearby-duplicates returns candidates with distance calculations', async () => {
    const res = await request(app)
      .get('/api/issues/nearby-duplicates?latitude=17.4850&longitude=78.3968&maxDistanceMeters=200')
      .set('Authorization', `Bearer ${citizenToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.duplicates));
    assert.ok(typeof res.body.duplicates[0].distanceMeters === 'number');
  });

  test('POST /api/issues/:id/upvote toggles upvote status', async () => {
    const res = await request(app)
      .post(`/api/issues/${testIssue._id}/upvote`)
      .set('Authorization', `Bearer ${citizenToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.hasUpvoted, true);
    assert.equal(res.body.upvoteCount, 1);
  });

  test('POST /api/issues/:id/follow toggles issue follow status', async () => {
    const res = await request(app)
      .post(`/api/issues/${testIssue._id}/follow`)
      .set('Authorization', `Bearer ${citizenToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
