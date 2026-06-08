import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import healthRouter from './health.js';

const app = express();
app.use('/api/health', healthRouter);

describe('Health Routes', () => {
  it('✅ GET /api/health يرجع 200 مع status: ok', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('✅ GET /api/health يرجع timestamp صحيح', async () => {
    const response = await request(app).get('/api/health');
    expect(response.body.timestamp).toBeDefined();
    expect(new Date(response.body.timestamp).getTime()).not.toBeNaN();
  });

  it('✅ GET /api/health لا يحتاج auth', async () => {
    // Already verified by the above tests since we are not passing tokens
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
  });

  it('✅ GET /api/health/detailed يتحقق من Supabase connection', async () => {
    const response = await request(app).get('/api/health/detailed');
    expect(response.status).toBe(200);
    expect(response.body.supabase).toBeDefined();
  });
});
