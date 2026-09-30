import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import Issue from '../models/Issue.js';

describe('Public Verified Civic Map Subsystem (Queue 21)', () => {
  let sampleIssue;

  before(() => {
    sampleIssue = {
      _id: new mongoose.Types.ObjectId(),
      issueNumber: 'CIVIC-2026-000101',
      title: 'Major Road Pothole',
      description: 'Dangerous pothole on Kukatpally main road.',
      category: {
        _id: new mongoose.Types.ObjectId(),
        name: 'Roads & Potholes',
        code: 'ROADS',
      },
      serviceArea: {
        _id: new mongoose.Types.ObjectId(),
        name: 'Kukatpally Pilot Area',
        code: 'HYD-KPK',
      },
      status: 'in_progress',
      priority: 'high',
      location: {
        address: 'Kukatpally, Hyderabad',
        landmark: 'Near Metro Station',
        coordinates: [78.3967, 17.4849],
      },
      evidence: [
        {
          url: '/uploads/evidence/sample-pothole.jpg',
          stage: 'initial',
        },
      ],
      upvotes: [new mongoose.Types.ObjectId()],
      feedback: { rating: 5 },
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject: function () {
        return {
          ...this,
          evidence: [...this.evidence],
          upvotes: [...this.upvotes],
        };
      },
    };

    Issue.find = () => {
      const mockQuery = {
        populate: function () { return this; },
        select: function () { return this; },
        sort: function () { return this; },
        limit: function () { return this; },
        then: function (resolve) { resolve([sampleIssue]); },
      };
      return mockQuery;
    };
  });

  test('GET /api/issues/public-map is accessible without authentication (200 OK)', async () => {
    const res = await request(app).get('/api/issues/public-map');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.issues));
  });

  test('GET /api/issues/public-map strictly anonymizes reporter data for public privacy', async () => {
    const res = await request(app).get('/api/issues/public-map');
    assert.equal(res.status, 200);
    const firstIssue = res.body.issues[0];
    assert.equal(firstIssue.reporter, undefined, 'Reporter details must be omitted in public map');
    assert.ok(firstIssue.location.coordinates);
    assert.equal(firstIssue.issueNumber, 'CIVIC-2026-000101');
  });

  test('GET /api/issues/public-map supports status presets', async () => {
    const res = await request(app).get('/api/issues/public-map?status=active');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
