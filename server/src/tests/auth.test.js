import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';

test('POST /api/auth/register rejects missing required fields with 400', async () => {
  const res = await request(app).post('/api/auth/register').send({
    email: 'invalid-email',
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.status, 'fail');
  assert.ok(Array.isArray(res.body.errors));
});

test('POST /api/auth/login rejects empty payload with 400', async () => {
  const res = await request(app).post('/api/auth/login').send({});

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.status, 'fail');
});

test('GET /api/auth/me rejects unauthenticated request with 401', async () => {
  const res = await request(app).get('/api/auth/me');

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /not logged in/i);
});

test('GET /api/auth/me rejects invalid bearer token with 401', async () => {
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', 'Bearer invalid.token.value');

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('POST /api/auth/refresh rejects request without token with 400', async () => {
  const res = await request(app).post('/api/auth/refresh').send({});

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});
