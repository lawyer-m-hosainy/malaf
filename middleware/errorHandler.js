import { logger } from './logger.js';

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

export class AuthError extends AppError {
  constructor(message) {
    super(message, 401);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

export const errorHandler = (err, req, res, next) => {
  logger.error({ 
    err: { message: err.message, stack: err.stack }, 
    path: req.path,
    method: req.method
  }, 'Global error handler caught an error');

  const statusCode = err.statusCode || err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(isProd ? {} : { stack: err.stack })
  });
};
