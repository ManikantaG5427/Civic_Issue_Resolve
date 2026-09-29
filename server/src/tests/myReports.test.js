import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

test('GET /api/issues/my-reports requires authentication with 401', async () => {
  const res = await request(app).get('/api/issues/my-reports');
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('GET /api/issues/my-reports returns citizen reports with pagination structure', async () => {
  const mockUser = new User({
    _id: new mongoose.Types.ObjectId(),
    name: 'Citizen Reporter',
    email: 'reporter@civicresolve.org',
    role: 'citizen',
    isActive: true,
  });

  const token = generateAccessToken(mockUser);

  const originalUserFindById = User.findById;
  const originalCountDocuments = Issue.countDocuments;
  const originalFind = Issue.find;

  User.findById = () => ({
    select: () => Promise.resolve(mockUser),
    then: (resolve) => resolve(mockUser),
  });

  Issue.countDocuments = () => Promise.resolve(1);
  Issue.find = () => ({
    populate: () => ({
      populate: () => ({
        populate: () => ({
          sort: () => ({
            skip: () => ({
              limit: () =>
                Promise.resolve([
                  {
                    _id: new mongoose.Types.ObjectId(),
                    issueNumber: 'CIVIC-2026-000001',
                    title: 'Pothole near KPHB',
                    status: 'submitted',
                    timeline: [
                      { action: 'Reported', visibility: 'public' },
                      { action: 'Internal Note', visibility: 'internal' },
                    ],
                    toObject: function () {
                      return { ...this };
                    },
                  },
                ]),
            }),
          }),
        }),
      }),
    }),
  });

  try {
    const res = await request(app)
      .get('/api/issues/my-reports?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.total, 1);
    assert.equal(res.body.data.page, 1);
    assert.ok(Array.isArray(res.body.data.issues));
    assert.equal(res.body.data.issues.length, 1);
    // Ensure internal timeline notes are filtered out for citizens
    assert.equal(res.body.data.issues[0].timeline.length, 1);
    assert.equal(res.body.data.issues[0].timeline[0].visibility, 'public');
  } finally {
    User.findById = originalUserFindById;
    Issue.countDocuments = originalCountDocuments;
    Issue.find = originalFind;
  }
});

test('GET /api/issues/:id blocks citizen from viewing another citizen private report with 403', async () => {
  const citizenA = new User({
    _id: new mongoose.Types.ObjectId(),
    name: 'Citizen A',
    email: 'citizena@test.com',
    role: 'citizen',
    isActive: true,
  });

  const citizenBOwnerId = new mongoose.Types.ObjectId();

  const tokenA = generateAccessToken(citizenA);

  const originalUserFindById = User.findById;
  const originalFindOne = Issue.findOne;

  User.findById = () => ({
    select: () => Promise.resolve(citizenA),
    then: (resolve) => resolve(citizenA),
  });

  Issue.findOne = () => ({
    populate: () => ({
      populate: () => ({
        populate: () => ({
          populate: () => ({
            populate: () => ({
              populate: () =>
                Promise.resolve({
                  _id: new mongoose.Types.ObjectId(),
                  issueNumber: 'CIVIC-2026-999999',
                  title: 'Private Issue of Citizen B',
                  reporter: { _id: citizenBOwnerId, name: 'Citizen B' },
                }),
            }),
          }),
        }),
      }),
    }),
  });

  try {
    const res = await request(app)
      .get('/api/issues/CIVIC-2026-999999')
      .set('Authorization', `Bearer ${tokenA}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not have permission/i);
  } finally {
    User.findById = originalUserFindById;
    Issue.findOne = originalFindOne;
  }
});
