import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../packages/backend/api/server.js';

describe('Health Check API', () => {
  it('should return healthy status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('message', 'API is healthy');
  });

  it('should handle malformed requests gracefully', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Content-Type', 'application/json')
      .send({ invalid: 'data' })
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
  });
});