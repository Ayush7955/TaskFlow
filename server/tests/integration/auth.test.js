const request = require('supertest');
const app = require('../../src/app');

const BASE = '/api/v1/auth';
// Use timestamp to ensure unique email each test run
const ts = Date.now();
const testUser = {
  name: 'Test User',
  email: `test+${ts}@example.com`,
  password: 'Password@123',
};

describe('POST /auth/register', () => {
  let accessToken;

  it('registers a new user and returns 201 with accessToken', async () => {
    const res = await request(app).post(`${BASE}/register`).send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email);
    // Should NOT expose secrets
    expect(res.body.data.user.password_hash).toBeUndefined();
    expect(res.body.data.user.email_verify_token_hash).toBeUndefined();
    // Cookie should be set
    expect(res.headers['set-cookie']).toBeDefined();
    accessToken = res.body.data.accessToken;
  });

  it('rejects duplicate email with 409', async () => {
    const res = await request(app).post(`${BASE}/register`).send(testUser);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects invalid email format with 400', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ ...testUser, email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeDefined();
  });

  it('rejects password shorter than 8 chars with 400', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ ...testUser, email: `short+${ts}@example.com`, password: '123' });
    expect(res.status).toBe(400);
  });

  it('rejects missing name with 400', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email: `noname+${ts}@example.com`, password: 'Password@123' });
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  let accessToken;

  it('logs in and returns accessToken', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: testUser.email, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email);
    accessToken = res.body.data.accessToken;
  });

  it('rejects wrong password with 401 and generic message', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: testUser.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
    // Generic message — no user enumeration
    expect(res.body.error.message).toBe('Invalid credentials');
  });

  it('rejects non-existent email with same 401 generic message', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'nobody@nowhere.com', password: 'Password@123' });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid credentials');
  });
});

describe('GET /auth/me', () => {
  let accessToken;

  beforeAll(async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: testUser.email, password: testUser.password });
    accessToken = res.body.data.accessToken;
  });

  it('returns current user with valid token', async () => {
    const res = await request(app)
      .get(`${BASE}/me`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.password_hash).toBeUndefined();
  });

  it('returns 401 without Authorization header', async () => {
    const res = await request(app).get(`${BASE}/me`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get(`${BASE}/me`)
      .set('Authorization', 'Bearer this.is.invalid');
    expect(res.status).toBe(401);
  });

  it('returns 401 with malformed Authorization header', async () => {
    const res = await request(app)
      .get(`${BASE}/me`)
      .set('Authorization', 'NotBearer sometoken');
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('clears the refresh token cookie', async () => {
    const res = await request(app).post(`${BASE}/logout`);
    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('Logged out');
  });
});

