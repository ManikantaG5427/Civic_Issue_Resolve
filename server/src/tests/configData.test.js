import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import ServiceArea from '../models/ServiceArea.js';
import Department from '../models/Department.js';
import IssueCategory from '../models/IssueCategory.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

test('GET /api/service-areas returns 200 with active service areas array', async () => {
  const originalFind = ServiceArea.find;
  ServiceArea.find = () => ({
    sort: () =>
      Promise.resolve([
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Kukatpally Pilot Area',
          code: 'HYD-KPK',
          city: 'Hyderabad',
          state: 'Telangana',
          isActive: true,
        },
      ]),
  });

  try {
    const res = await request(app).get('/api/service-areas');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data[0].code, 'HYD-KPK');
  } finally {
    ServiceArea.find = originalFind;
  }
});

test('GET /api/departments returns 200 with civic departments array', async () => {
  const originalFind = Department.find;
  Department.find = () => ({
    sort: () =>
      Promise.resolve([
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Roads and Public Works',
          code: 'DPW-RDS',
          defaultSlaHours: 48,
          isActive: true,
        },
      ]),
  });

  try {
    const res = await request(app).get('/api/departments');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data[0].code, 'DPW-RDS');
  } finally {
    Department.find = originalFind;
  }
});

test('GET /api/categories returns 200 with categories populated with departments', async () => {
  const originalFind = IssueCategory.find;
  IssueCategory.find = () => ({
    populate: () => ({
      sort: () =>
        Promise.resolve([
          {
            _id: new mongoose.Types.ObjectId(),
            name: 'Potholes & Damaged Roads',
            code: 'CAT-POTHOLE',
            defaultDepartment: { name: 'Roads and Public Works', code: 'DPW-RDS' },
            isActive: true,
          },
        ]),
    }),
  });

  try {
    const res = await request(app).get('/api/categories');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data[0].code, 'CAT-POTHOLE');
  } finally {
    IssueCategory.find = originalFind;
  }
});

test('POST /api/config/categories rejected for non-superadmin users with 403', async () => {
  const mockCitizen = new User({
    _id: new mongoose.Types.ObjectId(),
    name: 'Citizen User',
    email: 'citizen@test.com',
    role: 'citizen',
    isActive: true,
  });

  const token = generateAccessToken(mockCitizen);

  const originalFindById = User.findById;
  User.findById = () => ({
    select: () => Promise.resolve(mockCitizen),
    then: (resolve) => resolve(mockCitizen),
  });

  try {
    const res = await request(app)
      .post('/api/config/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Test Category',
        code: 'CAT-TEST',
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not authorized/i);
  } finally {
    User.findById = originalFindById;
  }
});
