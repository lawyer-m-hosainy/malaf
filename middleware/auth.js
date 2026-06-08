import jwt from 'jsonwebtoken';
import { AuthError } from './errorHandler.js';

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.SUPABASE_JWT_SECRET;

    if (!secret) {
      throw new Error('SUPABASE_JWT_SECRET is not configured on the server');
    }

    const decoded = jwt.verify(token, secret);
    
    // Add user info to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      org_id: decoded.user_metadata?.org_id
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      next(new AuthError('Token expired'));
    } else if (err.name === 'JsonWebTokenError') {
      next(new AuthError('Invalid token'));
    } else if (err instanceof AuthError) {
      next(err);
    } else {
      next(err);
    }
  }
};
