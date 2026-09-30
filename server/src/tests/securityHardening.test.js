import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';

describe('Security, Production Hardening & Documentation (Queue 22)', () => {
  test('GET /api/docs returns interactive HTML documentation viewer (200 OK)', async () => {
    const res = await request(app).get('/api/docs');
    assert.equal(res.status, 200);
    assert.ok(res.text.includes('CivicResolve REST API Specifications'));
    assert.ok(res.text.includes('Phase 2 · Production Hardened'));
  });

  test('GET /api/docs?format=json returns valid OpenAPI 3.0 specification object', async () => {
    const res = await request(app).get('/api/docs?format=json');
    assert.equal(res.status, 200);
    assert.equal(res.body.openapi, '3.0.3');
    assert.equal(res.body.info.title, 'CivicResolve - Civic Issue Resolution Platform API');
    assert.ok(res.body.paths['/health']);
    assert.ok(res.body.paths['/auth/login']);
    assert.ok(res.body.paths['/issues']);
    assert.ok(res.body.paths['/admin/analytics']);
  });

  test('GET /api/health returns comprehensive Phase 2 diagnostics and capabilities', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.version, '2.0.0');
    assert.equal(res.body.data.capabilities.socketRealTime, true);
    assert.equal(res.body.data.capabilities.slaBackgroundCron, true);
    assert.equal(res.body.data.capabilities.analytics, true);
    assert.equal(res.body.data.capabilities.publicMap, true);
  });

  test('Security headers (Helmet) are set on HTTP responses', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
  });
});
