const request = require('supertest');
const app = require('../../src/app');

const BASE = '/api/v1';
const ts = Date.now();

let accessToken;
let wsPublicId;

// Helper to register a fresh user and get token
const registerAndLogin = async (suffix = '') => {
  const res = await request(app)
    .post(`${BASE}/auth/register`)
    .send({
      name: `WS User ${suffix}`,
      email: `wstest${suffix}+${ts}@example.com`,
      password: 'Password@123',
    });
  return res.body.data.accessToken;
};

beforeAll(async () => {
  accessToken = await registerAndLogin('A');
});

const auth = () => ({ Authorization: `Bearer ${accessToken}` });

describe('POST /workspaces', () => {
  it('creates a workspace and returns 201', async () => {
    const res = await request(app)
      .post(`${BASE}/workspaces`)
      .set(auth())
      .send({ name: 'My Test Workspace' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.workspace.name).toBe('My Test Workspace');
    expect(res.body.data.workspace.public_id).toBeDefined();
    expect(res.body.data.workspace.slug).toBeDefined();
    wsPublicId = res.body.data.workspace.public_id;
  });

  it('rejects empty name with 400', async () => {
    const res = await request(app).post(`${BASE}/workspaces`).set(auth()).send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects unauthenticated request with 401', async () => {
    const res = await request(app).post(`${BASE}/workspaces`).send({ name: 'Test' });
    expect(res.status).toBe(401);
  });
});

describe('GET /workspaces', () => {
  it('lists workspaces for the authenticated user', async () => {
    const res = await request(app).get(`${BASE}/workspaces`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get(`${BASE}/workspaces`);
    expect(res.status).toBe(401);
  });
});

describe('GET /workspaces/:wsId', () => {
  it('returns workspace by public_id', async () => {
    const res = await request(app).get(`${BASE}/workspaces/${wsPublicId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.workspace.public_id).toBe(wsPublicId);
  });

  it('returns 404 for nonexistent workspace', async () => {
    const res = await request(app)
      .get(`${BASE}/workspaces/00000000-0000-0000-0000-000000000000`)
      .set(auth());
    expect(res.status).toBe(404);
  });

  it('IDOR: returns 404 when other user tries to access workspace', async () => {
    const otherToken = await registerAndLogin('B');
    const res = await request(app)
      .get(`${BASE}/workspaces/${wsPublicId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /workspaces/:wsId', () => {
  it('updates workspace name', async () => {
    const res = await request(app)
      .patch(`${BASE}/workspaces/${wsPublicId}`)
      .set(auth())
      .send({ name: 'Updated Workspace Name' });
    expect(res.status).toBe(200);
    expect(res.body.data.workspace.name).toBe('Updated Workspace Name');
  });

  it('rejects empty patch body with 400', async () => {
    const res = await request(app)
      .patch(`${BASE}/workspaces/${wsPublicId}`)
      .set(auth())
      .send({});
    expect(res.status).toBe(400);
  });
});

