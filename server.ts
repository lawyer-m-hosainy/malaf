import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import admin from 'firebase-admin';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import pino from 'pino';
import { runSeed } from './scripts/demo-seed-supabase.js'; // Ensure .js for NodeNext


// Load environment variables
dotenv.config();

// Initialize Logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Initialize Firebase Admin for token verification
try {
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }
} catch (e) {
  logger.warn({ err: e }, 'Firebase Admin init warning');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Structured Logging Middleware
app.use(pinoHttp({ logger }));

// Compression
app.use(compression());

// Security and utility middlewares
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:", "https://firebasestorage.googleapis.com", "https://picsum.photos"],
            connectSrc: [
                "'self'", 
                "https://firebasestorage.googleapis.com", 
                "https://identitytoolkit.googleapis.com", 
                "https://securetoken.googleapis.com", 
                "https://*.firebaseio.com", 
                "wss://*.firebaseio.com",
                "https://firestore.googleapis.com"
            ]
        }
    },
    xFrameOptions: { action: "deny" },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost:3000', 'https://mohamy-pro.onrender.com'];
app.use(cors({
    origin: allowedOrigins
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiter for AI Endpoints (10 requests per minute)
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10, 
  message: { error: 'تم تجاوز الحد الأقصى للطلبات. يرجى الانتظار دقيقة.' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'mohamay-pro-saudi-production',
    timestamp: new Date().toISOString(),
  });
});

// AI Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
const systemInstruction = 'أنت مساعد قانوني سعودي. الإجابة استرشادية ويجب مراجعتها من محامٍ مرخص.';

// AI Security Middleware
const sanitizeInput = (text: any) => {
    if (!text) return '';
    return text.toString().replace(/<[^>]*>?/gm, ''); // Remove HTML/Script tags
};

const aiSecurityMiddleware = (req: any, res: any, next: any) => {
    // Length Validation & Sanitization
    if (req.body.userMessage !== undefined) {
        const msg = String(req.body.userMessage);
        if (msg.length > 5000) return res.status(400).json({ error: 'يجب أن يكون طول الرسالة أقل من 5000 حرف' });
        req.body.userMessage = sanitizeInput(msg);
    }
    if (req.body.facts !== undefined) {
        const facts = String(req.body.facts);
        if (facts.length > 10000) return res.status(400).json({ error: 'يجب أن يكون طول الوقائع أقل من 10000 حرف' });
        req.body.facts = sanitizeInput(facts);
    }
    if (req.body.content !== undefined) {
        const content = String(req.body.content);
        if (content.length > 50000) return res.status(400).json({ error: 'يجب أن يكون طول المحتوى أقل من 50000 حرف' });
        req.body.content = sanitizeInput(content);
    }

    // Response Timeout (30 seconds)
    req.setTimeout(30000);
    res.setTimeout(30000, () => {
        if (!res.headersSent) {
            res.status(408).json({ error: 'انتهى وقت الطلب (Timeout)' });
        }
    });

    next();
};

app.use('/api/ai', async (req: any, res: any, next: any) => {
    // Auth Middleware to verify Firebase JWT
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'مطلوب مصادقة صالحة' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken; 
        req.tenantId = req.headers['x-tenant-id'] || 'default';
        next();
    } catch (error: any) {
        logger.error({ err: error }, 'Auth Token Error');
        return res.status(403).json({ error: 'التوكن غير صالح أو منتهي الصلاحية' });
    }
}, aiSecurityMiddleware);

// AI Endpoint Routing
app.post('/api/ai/legal-assistant', aiRateLimiter, async (req, res) => {
  if (!ai) { return res.status(500).json({ error: 'Server AI key is not configured' }); }
  try {
    const userMessage = String(req.body.userMessage || '');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: { systemInstruction },
    });
    return res.status(200).json({ text: response.text || '' });
  } catch (error) {
    logger.error({ err: error }, "AI Error");
    return res.status(502).json({ error: 'AI upstream error' });
  }
});

app.post('/api/ai/draft', aiRateLimiter, async (req, res) => {
  if (!ai) { return res.status(500).json({ error: 'Server AI key is not configured' }); }
  try {
    const type = String(req.body.type || 'وثيقة قانونية');
    const facts = String(req.body.facts || '');
    const prompt = `قم بصياغة ${type} احترافية بناءً على الوقائع التالية:\n${facts}`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction },
    });
    return res.status(200).json({ text: response.text || '' });
  } catch (error) {
    logger.error({ err: error }, "AI Error");
    return res.status(502).json({ error: 'AI upstream error' });
  }
});

app.post('/api/ai/analyze', aiRateLimiter, async (req, res) => {
  if (!ai) { return res.status(500).json({ error: 'Server AI key is not configured' }); }
  try {
    const content = String(req.body.content || '');
    const prompt = `حلل النص القانوني التالي وفق الأنظمة السعودية وحدد الملخص والدفوع والمخاطر:\n${content}`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction },
    });
    return res.status(200).json({ text: response.text || '' });
  } catch (error) {
    logger.error({ err: error }, "AI Error");
    return res.status(502).json({ error: 'AI upstream error' });
  }
});

// Demo Reset Endpoint (Investor Demo)
app.post('/api/demo/reset', async (req, res) => {
  const resetToken = req.headers['x-reset-token'];
  if (resetToken !== process.env.DEMO_RESET_SECRET) {
    return res.status(403).json({ error: 'غير مسموح بالوصول' });
  }

  try {
    logger.info('🔄 Starting Demo Reset...');
    await runSeed();
    logger.info('✅ Demo Reset Complete.');
    return res.status(200).json({ message: 'تم إعادة ضبط بيانات العرض التجريبي بنجاح' });
  } catch (error) {
    logger.error({ err: error }, 'Demo Reset Error');
    return res.status(500).json({ error: 'فشل إعادة الضبط' });
  }
});

// Serve frontend static files
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  logger.warn("'dist' folder not found. Frontend will not be served.");
  app.get('/', (req, res) => res.send('API is running. Frontend build (dist) not found.'));
}

// Start Server
app.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`);
  if (!GEMINI_API_KEY) {
    logger.warn('⚠️ Warning: GEMINI_API_KEY is not set. AI features will not work.');
  }
});
