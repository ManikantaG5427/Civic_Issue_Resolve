import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

test('RBAC: Unauthenticated requests return 401', async () => {
  const res = await request(app).get('/api/rbac/admin-access');
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('RBAC: Citizen role authorization checks', async () => {
  // Mock citizen user
  const mockCitizen = new User({
    _id: new mongoose.Types.ObjectId(),
    name: 'Test Citizen',
    email: 'citizen@test.com',
    role: 'citizen',
    isActive: true,
  });

  const citizenToken = generateAccessToken(mockCitizen);

  // 1. Citizen accessing Citizen area -> 200
  // Note: We stub User.findById for mock testing
  const originalFindById = User.findById;
  User.findById = () => ({
    select: () => Promise.resolve(mockCitizen),
    then: (resolve) => resolve(mockCitizen),
  });

  try {
    const citizenRes = await request(app)
      .get('/api/rbac/citizen-access')
      .set('Authorization', `Bearer ${citizenToken}`);

    assert.equal(citizenRes.status, 200);
    assert.equal(citizenRes.body.success, true);
    assert.equal(citizenRes.body.data.userRole, 'citizen');

    // 2. Citizen accessing Field Worker area -> 403 Forbidden
    const workerRes = await request(app)
      .get('/api/rbac/worker-access')
      .set('Authorization', `Bearer ${citizenToken}`);

    assert.equal(workerRes.status, 403);
    assert.equal(workerRes.body.success, false);
    assert.match(workerRes.body.message, /not authorized/i);

    // 3. Citizen accessing Admin area -> 403 Forbidden
    const adminRes = await request(app)
      .get('/api/rbac/admin-access')
      .set('Authorization', `Bearer ${citizenToken}`);

    assert.equal(adminRes.status, 403);
    assert.equal(adminRes.body.success, false);
    assert.match(adminRes.body.message, /not authorized/i);
  } finally {
    User.findById = originalFindById;
  }
});

test('RBAC: Super Admin role has elevated access', async () => {
  const mockSuperAdmin = new User({
    _id: new mongoose.Types.ObjectId(),
    name: 'Test Super Admin',
    email: 'superadmin@test.com',
    role: 'super_admin',
    isActive: true,
  });

  const superAdminToken = generateAccessToken(mockSuperAdmin);

  const originalFindById = User.findById;
  User.findById = () => ({
    select: () => Promise.resolve(mockSuperAdmin),
    then: (resolve) => resolve(mockSuperAdmin),
  });

  try {
    const res = await request(app)
      .get('/api/rbac/admin-access')
      .set('Authorization', `Bearer ${superAdminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  } finally {
    User.findById = originalFindById;
  }
});
