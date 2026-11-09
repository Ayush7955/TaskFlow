'use strict';

const request = require('supertest');
const app = require('../../src/app');

describe('Security — Rate Limiting', () => {
  test('auth endpoints block after 10 requests within 15 minutes', async () => {
    const payload = { email: 'test@example.com', password: 'wrongpassword' };

    // Make 11 rapid requests — 11th should be rate-limited
    const responses = [];
    for (let i = 0; i < 11; i++) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(payload);
      responses.push(res.status);
    }

    // At least one response should be 429
    expect(responses).toContain(429);
  }, 30000);

  test('health endpoint not rate limited heavily', async () => {
    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app).get('/api/v1/health').then((r) => r.status)
      )
    );
    // All should succeed (not 429)
    expect(responses.every((s) => s !== 429)).toBe(true);
  });
});

describe('Security — Helmet Headers', () => {
  let res;
  beforeAll(async () => {
    res = await request(app).get('/api/v1/health');
  });

  test('sets X-Content-Type-Options: nosniff', () => {
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  test('sets X-Frame-Options', () => {
    expect(res.headers['x-frame-options']).toBeTruthy();
  });

  test('sets X-DNS-Prefetch-Control', () => {
    expect(res.headers['x-dns-prefetch-control']).toBeTruthy();
  });
});

describe('Security — Input Sanitization', () => {
  test('strips HTML from request body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: '<script>alert("xss")</script>Alice',
        email: 'alice-xss@test.com',
        password: 'Password123!',
      });
    // Should not reflect back the script tag in any form
    if (res.body.data?.name) {
      expect(res.body.data.name).not.toContain('<script>');
    }
    // Either registered (201) or validation error (422) — not 500
    expect([201, 422, 400]).toContain(res.status);
  });

  test('rejects oversized payloads', async () => {
    const bigString = 'x'.repeat(1_000_000);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'a@b.com', password: bigString });
    expect([400, 413, 422]).toContain(res.status);
  });
});

describe('Security — Auth', () => {
  test('returns 401 for missing token', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });

  test('returns 401 for malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });

  test('returns 401 for expired/invalid JWT signature', async () => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwdWJsaWNJZCI6InRlc3QiLCJpYXQiOjE2MDAwMDAwMDB9.fake-sig';
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${fakeToken}`);
    expect(res.status).toBe(401);
  });

  test('error responses have consistent envelope', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message');
  });
});
