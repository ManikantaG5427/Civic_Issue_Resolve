import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';

test('GET /api/health returns 200 and healthy status', async () => {
  const res = await request(app).get('/api/health');

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.status, 'success');
  assert.equal(res.body.data.status, 'healthy');
  assert.equal(res.body.data.service, 'CivicResolve Backend API');
  assert.ok(res.body.data.database);
});

test('GET /api/nonexistent-route returns 404 with standardized error shape', async () => {
  const res = await request(app).get('/api/nonexistent-route');

  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.equal(res.body.status, 'fail');
  assert.match(res.body.message, /Resource not found/);
});
