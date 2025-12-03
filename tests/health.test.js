// tests/health.test.js
const request = require('supertest');
const app = require('../src/app');
const { initDB } = require('../src/config/db');

describe('Health endpoints', () => {
  beforeAll(async () => {
    await initDB();
  });

  test('GET /health debe responder ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.status).toBe('ok');
  });

  test('GET /health/db debe responder ok', async () => {
    const res = await request(app).get('/health/db');
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.db).toBe('ok');
  });
});
