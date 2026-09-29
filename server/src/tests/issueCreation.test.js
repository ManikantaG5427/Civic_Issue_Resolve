import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import IssueCategory from '../models/IssueCategory.js';
import ServiceArea from '../models/ServiceArea.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

test('POST /api/issues requires authentication with 401', async () => {
  const res = await request(app).post('/api/issues').send({
    title: 'Large Pothole on Main Road',
  });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('POST /api/issues rejects invalid or missing fields with 400', async () => {
  const mockUser = new User({
    _id: new mongoose.Types.ObjectId(),
    name: 'Citizen Tester',
    email: 'tester@test.com',
    role: 'citizen',
    isActive: true,
  });

  const token = generateAccessToken(mockUser);

  const originalFindById = User.findById;
  User.findById = () => ({
    select: () => Promise.resolve(mockUser),
    then: (resolve) => resolve(mockUser),
  });

  try {
    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Bad', // too short (<5)
        description: 'Short', // too short (<15)
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(Array.isArray(res.body.errors));
  } finally {
    User.findById = originalFindById;
  }
});

test('POST /api/issues successfully creates a civic issue report', async () => {
  const mockUser = new User({
    _id: new mongoose.Types.ObjectId(),
    name: 'Citizen Reporter',
    email: 'reporter@civicresolve.org',
    role: 'citizen',
    isActive: true,
  });

  const mockCategory = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Potholes & Damaged Roads',
    code: 'CAT-POTHOLE',
    defaultPriority: 'high',
    isActive: true,
  };

  const mockServiceArea = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Kukatpally Pilot Area',
    code: 'HYD-KPK',
    city: 'Hyderabad',
    state: 'Telangana',
    centerLocation: { coordinates: [78.3967, 17.4849] },
    isActive: true,
  };

  const token = generateAccessToken(mockUser);

  const originalUserFindById = User.findById;
  const originalCatFindById = IssueCategory.findById;
  const originalAreaFindOne = ServiceArea.findOne;
  const originalIssueSave = Issue.prototype.save;
  const originalIssueFindById = Issue.findById;
  const originalCountDocuments = Issue.countDocuments;
  const originalFindOne = Issue.findOne;

  User.findById = () => ({
    select: () => Promise.resolve(mockUser),
    then: (resolve) => resolve(mockUser),
  });
  IssueCategory.findById = () => Promise.resolve(mockCategory);
  ServiceArea.findOne = () => Promise.resolve(mockServiceArea);
  Issue.countDocuments = () => ({ maxTimeMS: () => Promise.resolve(0) });
  Issue.findOne = () => ({ maxTimeMS: () => Promise.resolve(null) });

  let savedIssueData = null;
  Issue.prototype.save = function () {
    savedIssueData = this;
    return Promise.resolve(this);
  };

  Issue.findById = () => ({
    populate: () => ({
      populate: () => ({
        populate: () => ({
          populate: () =>
            Promise.resolve({
              _id: savedIssueData?._id || new mongoose.Types.ObjectId(),
              issueNumber: savedIssueData?.issueNumber || 'CIVIC-2026-000001',
              title: savedIssueData?.title || 'Massive Pothole near Metro Station',
              description:
                savedIssueData?.description ||
                'Road asphalt has collapsed causing hazardous traffic delays and potential accidents.',
              status: 'submitted',
              priority: 'high',
              category: mockCategory,
              serviceArea: mockServiceArea,
              reporter: mockUser,
              location: savedIssueData?.location,
              timeline: savedIssueData?.timeline,
            }),
        }),
      }),
    }),
  });

  try {
    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Massive Pothole near Metro Station',
        description:
          'Road asphalt has collapsed causing hazardous traffic delays and potential accidents.',
        category: mockCategory._id.toString(),
        landmark: 'Opposite Metro Pillar 124, KPHB Phase 1',
        address: 'Kukatpally Main Road, Hyderabad',
        coordinates: [78.3967, 17.4849],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.match(res.body.data.issueNumber, /^CIVIC-\d{4}-\d+/);
    assert.equal(res.body.data.status, 'submitted');
    assert.equal(res.body.data.title, 'Massive Pothole near Metro Station');
  } finally {
    User.findById = originalUserFindById;
    IssueCategory.findById = originalCatFindById;
    ServiceArea.findOne = originalAreaFindOne;
    Issue.prototype.save = originalIssueSave;
    Issue.findById = originalIssueFindById;
    Issue.countDocuments = originalCountDocuments;
    Issue.findOne = originalFindOne;
  }
});
