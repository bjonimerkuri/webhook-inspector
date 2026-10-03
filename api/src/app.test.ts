import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';

describe('webhook API', () => {
  it('captures a request sent to a hook URL', async () => {
    const app = createApp();
    const { body: created } = await request(app).post('/api/endpoints').expect(201);

    await request(app)
      .post(`/hook/${created.id}/orders?source=test`)
      .set('Content-Type', 'application/json')
      .send({ amount: 42 })
      .expect(200);

    const { body } = await request(app).get(`/api/endpoints/${created.id}/requests`).expect(200);
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      method: 'POST',
      path: `/hook/${created.id}/orders?source=test`,
      query: { source: 'test' },
    });
    expect(JSON.parse(body[0].body)).toEqual({ amount: 42 });
  });

  it('returns 404 for an unknown endpoint', async () => {
    const app = createApp();
    await request(app).post('/hook/unknown').send('x').expect(404);
    await request(app).get('/api/endpoints/unknown/requests').expect(404);
  });

  it('clears captured requests', async () => {
    const app = createApp();
    const { body: created } = await request(app).post('/api/endpoints');
    await request(app).get(`/hook/${created.id}`).expect(200);
    await request(app).delete(`/api/endpoints/${created.id}/requests`).expect(204);
    const { body } = await request(app).get(`/api/endpoints/${created.id}/requests`);
    expect(body).toEqual([]);
  });
});
