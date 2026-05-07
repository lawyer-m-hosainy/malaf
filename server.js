import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
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

// Import Middlewares
import { authMiddleware } from './middleware/auth.js';

// Load environment variables
dotenv.config();

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
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:", "https://*.googleapis.com", "https://picsum.photos"],
            connectSrc: ["'self'", "https://*.googleapis.com", "https://*.firebaseio.com", "wss://*.firebaseio.com"]
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
});
