const request = require('supertest');
const app = require('../../src/app');

const BASE = '/api/v1';
const ts = Date.now();

let accessToken;
let wsPublicId;
let boardPublicId;

beforeAll(async () => {
  // Register user
  const authRes = await request(app)
    .post(`${BASE}/auth/register`)
    .send({ name: 'Board Test', email: `boardtest+${ts}@example.com`, password: 'Password@123' });
  accessToken = authRes.body.data.accessToken;

  // Create workspace
  const wsRes = await request(app)
    .post(`${BASE}/workspaces`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name: 'Board Test WS' });
  wsPublicId = wsRes.body.data.workspace.public_id;
});

const auth = () => ({ Authorization: `Bearer ${accessToken}` });

describe('POST /workspaces/:wsId/boards', () => {
  it('creates a board inside a workspace', async () => {
    const res = await request(app)
      .post(`${BASE}/workspaces/${wsPublicId}/boards`)
      .set(auth())
      .send({ name: 'Product Launch' });
    expect(res.status).toBe(201);
    expect(res.body.data.board.name).toBe('Product Launch');
    expect(res.body.data.board.public_id).toBeDefined();
    boardPublicId = res.body.data.board.public_id;
  });

  it('rejects empty name', async () => {
    const res = await request(app)
      .post(`${BASE}/workspaces/${wsPublicId}/boards`)
      .set(auth())
      .send({ name: '' });
    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated request', async () => {
    const res = await request(app)
      .post(`${BASE}/workspaces/${wsPublicId}/boards`)
      .send({ name: 'Test' });
    expect(res.status).toBe(401);
  });
});

describe('GET /workspaces/:wsId/boards', () => {
  it('lists boards in workspace', async () => {
    const res = await request(app).get(`${BASE}/workspaces/${wsPublicId}/boards`).set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
  });
});

describe('GET /boards/:boardId', () => {
  it('returns board detail', async () => {
    const res = await request(app).get(`${BASE}/boards/${boardPublicId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.board.public_id).toBe(boardPublicId);
  });

  it('returns 404 for nonexistent board', async () => {
    const res = await request(app)
      .get(`${BASE}/boards/00000000-0000-0000-0000-000000000000`)
      .set(auth());
    expect(res.status).toBe(404);
  });

  it('IDOR: other user gets 404', async () => {
    const otherRes = await request(app)
      .post(`${BASE}/auth/register`)
      .send({ name: 'Other', email: `other+${ts}@example.com`, password: 'Password@123' });
    const otherToken = otherRes.body.data.accessToken;
    const res = await request(app)
      .get(`${BASE}/boards/${boardPublicId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /boards/:boardId', () => {
  it('updates board name', async () => {
    const res = await request(app)
      .patch(`${BASE}/boards/${boardPublicId}`)
      .set(auth())
      .send({ name: 'Updated Board Name' });
    expect(res.status).toBe(200);
    expect(res.body.data.board.name).toBe('Updated Board Name');
  });
});

describe('Archive / Restore board', () => {
  it('archives board', async () => {
    const res = await request(app)
      .post(`${BASE}/boards/${boardPublicId}/archive`)
      .set(auth());
    expect(res.status).toBe(200);
  });

  it('restores board', async () => {
    const res = await request(app)
      .post(`${BASE}/boards/${boardPublicId}/restore`)
      .set(auth());
    expect(res.status).toBe(200);
  });
});

describe('DELETE /boards/:boardId', () => {
  it('soft-deletes board', async () => {
    // Create a throwaway board to delete
    const createRes = await request(app)
      .post(`${BASE}/workspaces/${wsPublicId}/boards`)
      .set(auth())
      .send({ name: 'Delete Me' });
    const delBoardId = createRes.body.data.board.public_id;

    const res = await request(app).delete(`${BASE}/boards/${delBoardId}`).set(auth());
    expect(res.status).toBe(204);
  });
});

