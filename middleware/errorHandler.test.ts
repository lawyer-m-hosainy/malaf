import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler, AppError, ValidationError, AuthError } from './errorHandler.js';

describe('Error Handler', () => {
  const mockResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('✅ ValidationError يرجع 400 مع error message', () => {
    const error = new ValidationError('Invalid input');
    const req: any = { log: { error: vi.fn() } };
    const res = mockResponse();
    const next = vi.fn();

    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'Invalid input'
    }));
  });

  it('✅ AuthError يرجع 401', () => {
    const error = new AuthError('Unauthorized access');
    const req: any = { log: { error: vi.fn() } };
    const res = mockResponse();
    const next = vi.fn();

    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('✅ AppError مع statusCode مخصص يرجع الـ statusCode', () => {
    const error = new AppError('Custom Error', 403);
    const req: any = { log: { error: vi.fn() } };
    const res = mockResponse();
    const next = vi.fn();

    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Custom Error' }));
  });

  it('✅ في development: يُرسل stack trace', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Some error');
    const req: any = { log: { error: vi.fn() } };
    const res = mockResponse();
    const next = vi.fn();

    errorHandler(error, req, res, next);
    expect(res.json.mock.calls[0][0].stack).toBeDefined();
  });

  it('✅ في production: لا يُرسل stack trace', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Some error');
    const req: any = { log: { error: vi.fn() } };
    const res = mockResponse();
    const next = vi.fn();

    errorHandler(error, req, res, next);
    expect(res.json.mock.calls[0][0].stack).toBeUndefined();
  });

  it('✅ Unknown error يرجع 500 مع رسالة generic', () => {
    const error = new Error('Unexpected issue');
    const req: any = { log: { error: vi.fn() } };
    const res = mockResponse();
    const next = vi.fn();

    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error).toContain('Internal Server Error');
  });
});
