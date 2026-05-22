/**
 * @file server.js
 * @description Node.js / Express backend server handling routes, security headers, rate limiting, and integrations.
 * @sovereignty Project architected, designed, and owned by محمد الحسيني المحامي.
 * @author محمد الحسيني المحامي
 * @copyright (c) 2026. All rights reserved.
 */

import './env.js';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import pino from 'pino';
import { randomUUID } from 'crypto';

// Import Routes
import healthRouter from './routes/health.js';
import aiRouter from './routes/ai.js';
import cryptoRouter from './routes/crypto.js';
import paymentRouter from './routes/payment.js';
import { initSubscriptionCron } from './services/subscription/subscriptionCron.js';

// Import Middlewares
import { authMiddleware } from './middleware/auth.js';

// ═══════════════════════════════════════════════════════
// R9-FIX: NODE_ENV detection + environment validation
// ═══════════════════════════════════════════════════════
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// R9-FIX: Validate required env vars at startup (fail-fast in production)
const REQUIRED_ENV_VARS = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_JWT_SECRET'];
const OPTIONAL_ENV_VARS = ['ENCRYPTION_KEY', 'DAILY_API_KEY', 'GEMINI_API_KEY', 'GROQ_API_KEY'];

const missingRequired = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
const missingOptional = OPTIONAL_ENV_VARS.filter(key => !process.env[key]);

if (missingRequired.length > 0) {
    if (IS_PROD) {
        console.error(`❌ [FATAL] Missing required env vars in production: ${missingRequired.join(', ')}`);
        process.exit(1);
    } else {
        console.warn(`⚠️  [DEV] Missing env vars (non-critical in dev): ${missingRequired.join(', ')}`);
    }
}

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Structured Logging
app.use(pinoHttp({ 
    logger,
    genReqId: function (req, res) {
        const id = req.get('x-request-id') || randomUUID()
        res.setHeader('x-request-id', id)
        req.id = id
        return id
    }
}));

// Compression & Security
app.use(compression());

// ✅ R6-FIX: Security headers + tightened CSP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // R6-FIX: unsafe-eval needed only by Vite dev HMR — production bundles don't need it
            scriptSrc: process.env.NODE_ENV === 'production'
                ? ["'self'", "'unsafe-inline'"]
                : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            // R6-FIX: tightened imgSrc — no wildcard https://*
            imgSrc: ["'self'", "data:", "blob:", "https://*.supabase.co", "https://www.transparenttextures.com"],
            connectSrc: [
                "'self'",
                "https://*.supabase.co", "wss://*.supabase.co",
                "https://accounts.google.com", "https://www.googleapis.com",
                "https://oauth2.googleapis.com", "https://*.googleapis.com",
                "https://*.daily.co"
            ],
            frameSrc: ["'self'", "https://accounts.google.com", "https://*.supabase.co"],
            mediaSrc: ["'self'", "blob:"],
            workerSrc: ["'self'", "blob:"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
        }
    },
    // ✅ R6-FIX: Security headers
    crossOriginEmbedderPolicy: false, // Required for Supabase/Daily.co
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // Google Auth popup
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xContentTypeOptions: true,        // X-Content-Type-Options: nosniff
    xDnsPrefetchControl: { allow: false },
    xFrameOptions: { action: 'deny' },
    xPermittedCrossDomainPolicies: { permittedPolicies: 'none' },
    xPoweredBy: false,
}));

// ✅ R6-FIX: Additional Permissions-Policy header (restrict dangerous APIs)
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(), payment=(), usb=()');
    next();
});

// CORS Configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.PRODUCTION_URL || 'https://malaf.pro', 'https://malaf.pro', 'https://www.malaf.pro', 'https://malaf-platform.onrender.com'] 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3005'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (same-origin, mobile apps, curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // ✅ R2-FIX: رفض الأصول غير المعروفة بدلاً من السماح بها
            logger.warn({ origin }, 'CORS: Blocked request from unknown origin');
            callback(new Error('غير مسموح بالوصول من هذا المصدر (CORS)'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global API Rate Limiter (100 requests per minute per IP)
const globalApiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'تم تجاوز الحد الأقصى للطلبات. حاول بعد دقيقة.' },
    skip: (req) => req.path === '/api/health', // لا تحدّ Health check
});
app.use('/api', globalApiLimiter);

// ✅ R4-FIX: Security Request Logger — تسجيل العمليات الحساسة
const securityRequestLogger = (req, res, next) => {
    // Log only write operations to sensitive routes
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        logger.info({
            event: 'API_WRITE_OPERATION',
            method: req.method,
            path: req.originalUrl,
            ip: req.ip,
            userId: req.user?.uid || 'unauthenticated',
            tenantId: req.tenantId || 'unknown',
            contentLength: req.get('content-length') || 0,
            userAgent: req.get('user-agent'),
            requestId: req.id,
            timestamp: new Date().toISOString(),
        }, `Security: ${req.method} ${req.originalUrl}`);
    }
    next();
};

// --- Routes Mounting ---

// Public Routes
app.use('/api/health', healthRouter);

// Protected Routes — with security logging
app.use('/api/ai', authMiddleware, securityRequestLogger, aiRouter);
app.use('/api/crypto', authMiddleware, securityRequestLogger, cryptoRouter);

// Payment Routes — callback عام (Paymob webhook)، باقي الـ routes محمية
app.use('/api/payment/callback', paymentRouter); // POST callback — عام
app.use('/api/payment/plans', paymentRouter); // GET plans — عام
app.use('/api/payment/status', paymentRouter); // GET status — عام
app.use('/api/payment', authMiddleware, securityRequestLogger, paymentRouter); // /create — محمي

// --- Frontend Serving ---
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    logger.warn("Frontend 'dist' not found. API mode only.");
    app.get('/', (req, res) => res.status(200).json({ message: 'Malaf API is running' }));
}

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    logger.error({ 
        msg: err.message, 
        stack: err.stack,
        path: req.path,
        method: req.method 
    }, 'Unhandled Error');

    const status = err.status || 500;
    res.status(status).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'حدث خطأ داخلي في الخادم، تم تسجيل المشكلة للمراجعة.' 
            : err.message
    });
});


// Start Server
app.listen(PORT, () => {
    logger.info(`🚀 Malaf Backend is running on port ${PORT} [${NODE_ENV}]`);
    logger.info(`   Node ${process.version} | PID ${process.pid}`);
    if (IS_PROD) {
        logger.info(`   📡 Health: /api/health | Ping: /api/health/ping`);
        logger.info(`   🌐 CORS: ${allowedOrigins.join(', ')}`);
    }

    // Initialize Subscription Cron Jobs (renewal reminders, expiration, win-back)
    try {
        initSubscriptionCron();
        logger.info('📅 Subscription Cron Jobs activated');
    } catch (err) {
        logger.warn({ err: err.message }, 'Subscription Cron init skipped (non-critical)');
    }
});
