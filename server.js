import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import pino from 'pino';

// Import Routes
import healthRouter from './routes/health.js';
import aiRouter from './routes/ai.js';
import cryptoRouter from './routes/crypto.js';
import whatsappRouter from './routes/whatsapp.js';
// Note: videoRouter is TS, we import it as .ts or let the loader handle it
import videoRouter from './routes/video.js';
import { initScheduler } from './services/whatsapp/notificationScheduler.js';

// Import Middlewares
import { authMiddleware } from './middleware/auth.js';

// Load environment variables
dotenv.config();

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Structured Logging
app.use(pinoHttp({ logger }));

// Compression & Security
app.use(compression());
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "blob:", "https://*"],
            connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co", "https://*.googleapis.com", "https://*.firebaseio.com", "wss://*.firebaseio.com", "https://*.daily.co"],
            mediaSrc: ["'self'", "blob:"],
            workerSrc: ["'self'", "blob:"],
        }
    }
}));

// CORS Configuration - Strict for Production
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.PRODUCTION_URL || 'https://malaf.app'] 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3005'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logger.warn({ origin }, 'CORS Blocked');
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

// --- Routes Mounting ---

// Public Routes
app.use('/api/health', healthRouter);

// Protected Routes
app.use('/api/ai', authMiddleware, aiRouter);
app.use('/api/crypto', authMiddleware, cryptoRouter);
app.use('/api/video', authMiddleware, videoRouter);
app.use('/api/whatsapp', whatsappRouter); // WhatsApp has its own internal auth/validation

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
    logger.info(`🚀 Malaf Backend is running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);

    // Initialize WhatsApp session reminders & invoice notifications
    try {
        initScheduler(async (phone, message, orgId) => {
            // Fetch org's WhatsApp settings to send via correct provider
            if (!supabaseServiceKey) return false;
            const { createClient } = await import('@supabase/supabase-js');
            const sb = createClient(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL, supabaseServiceKey);
            const { data: settings } = await sb
                .from('whatsapp_settings')
                .select('*')
                .eq('org_id', orgId)
                .eq('is_active', true)
                .single();
            if (!settings) return false;

            const apiToken = settings.api_token_encrypted;
            const provider = settings.provider || '360dialog';
            let apiUrl, headers, body;
            if (provider === '360dialog') {
                apiUrl = 'https://waba.360dialog.io/v1/messages';
                headers = { 'D360-API-KEY': apiToken, 'Content-Type': 'application/json' };
            } else {
                apiUrl = `https://graph.facebook.com/v18.0/${settings.wa_phone_number}/messages`;
                headers = { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' };
            }
            body = { messaging_product: 'whatsapp', to: phone.replace('+', ''), type: 'text', text: { body: message } };
            try {
                const resp = await fetch(apiUrl, { method: 'POST', headers, body: JSON.stringify(body) });
                return resp.ok;
            } catch { return false; }
        });
        logger.info('📅 WhatsApp Notification Scheduler activated');
    } catch (err) {
        logger.warn({ err: err.message }, 'WhatsApp Scheduler init skipped (non-critical)');
    }
});
