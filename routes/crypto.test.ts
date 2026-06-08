import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cryptoRouter from './crypto.js';

// Mock auth middleware to conditionally allow
const mockAuth = vi.fn((req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use('/api/crypto', mockAuth, cryptoRouter);

describe('Crypto Routes', () => {
  const originalEnv = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    // 32-byte hex key for testing (64 hex characters)
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalEnv;
  });

  it('✅ POST /api/crypto/encrypt يشفر البيانات ويرجع encrypted + iv + tag', async () => {
    const response = await request(app)
      .post('/api/crypto/encrypt')
      .set('Authorization', 'Bearer token')
      .send({ data: 'secret message' });

    expect(response.status).toBe(200);
    expect(response.body.encrypted).toBeDefined();
    expect(response.body.iv).toBeDefined();
    expect(response.body.tag).toBeDefined();
  });

  it('✅ POST /api/crypto/decrypt يفك التشفير ويرجع الـ data الأصلية', async () => {
    // First encrypt
    const encRes = await request(app)
      .post('/api/crypto/encrypt')
      .set('Authorization', 'Bearer token')
      .send({ data: 'hello crypto' });

    // Then decrypt
    const decRes = await request(app)
      .post('/api/crypto/decrypt')
      .set('Authorization', 'Bearer token')
      .send({
        encrypted: encRes.body.encrypted,
        iv: encRes.body.iv,
        tag: encRes.body.tag
      });

    expect(decRes.status).toBe(200);
    expect(decRes.body.data).toBe('hello crypto');
  });

  it('✅ encrypt ثم decrypt يرجع نفس الـ data (round-trip test)', async () => {
    const originalText = 'This is a test of the round trip encryption. مَلَف';
    
    const encRes = await request(app)
      .post('/api/crypto/encrypt')
      .set('Authorization', 'Bearer token')
      .send({ data: originalText });

    const decRes = await request(app)
      .post('/api/crypto/decrypt')
      .set('Authorization', 'Bearer token')
      .send({
        encrypted: encRes.body.encrypted,
        iv: encRes.body.iv,
        tag: encRes.body.tag
      });

    expect(decRes.body.data).toBe(originalText);
  });

  it('❌ POST /api/crypto/encrypt بدون auth → 401', async () => {
    const response = await request(app)
      .post('/api/crypto/encrypt')
      .send({ data: 'secret' });

    expect(response.status).toBe(401);
  });

  it('❌ POST /api/crypto/decrypt بـ iv خاطئ → 400', async () => {
    const encRes = await request(app)
      .post('/api/crypto/encrypt')
      .set('Authorization', 'Bearer token')
      .send({ data: 'hello' });

    const decRes = await request(app)
      .post('/api/crypto/decrypt')
      .set('Authorization', 'Bearer token')
      .send({
        encrypted: encRes.body.encrypted,
        iv: 'badiv123456', // Wrong IV
        tag: encRes.body.tag
      });

    expect(decRes.status).toBe(400);
  });

  it('❌ data أكبر من 1MB → 413', async () => {
    const largeData = 'a'.repeat(1024 * 1024 + 10); // slightly over 1MB
    const response = await request(app)
      .post('/api/crypto/encrypt')
      .set('Authorization', 'Bearer token')
      .send({ data: largeData });

    expect(response.status).toBe(413);
  });
});
