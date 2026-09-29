import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

test('POST /api/uploads/evidence requires authentication with 401', async () => {
  const res = await request(app).post('/api/uploads/evidence');
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('POST /api/uploads/evidence rejects non-image file formats with 400', async () => {
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
      .post('/api/uploads/evidence')
      .set('Authorization', `Bearer ${token}`)
      .attach('images', Buffer.from('plain text file content'), 'test-document.txt');

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /invalid file type/i);
  } finally {
    User.findById = originalFindById;
  }
});

test('POST /api/uploads/evidence successfully processes valid image file', async () => {
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

  // Tiny 1x1 transparent PNG buffer
  const samplePngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  try {
    const res = await request(app)
      .post('/api/uploads/evidence')
      .set('Authorization', `Bearer ${token}`)
      .attach('images', samplePngBuffer, 'pothole-proof.png');

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 1);
    assert.match(res.body.data[0].url, /^\/uploads\/evidence\/evidence-/);
  } finally {
    User.findById = originalFindById;
  }
});
