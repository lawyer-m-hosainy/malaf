import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
// @ts-ignore
import admin from 'firebase-admin';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import pino from 'pino';
import crypto from 'crypto';
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
            scriptSrc: ["'self'"], // Removed 'unsafe-inline' and 'unsafe-eval' for production
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
                "https://firestore.googleapis.com",
                "https://api.groq.com" // Allowed for server-side if needed, though server-to-server doesn't need CSP
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

const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.PRODUCTION_URL || 'https://malaf.app'] 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3005'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS not allowed for this origin'));
        }
    },
    credentials: true
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
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'mohamay-pro-saudi-production',
    timestamp: new Date().toISOString(),
  });
});

// AI Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const systemInstruction = 'أنت مساعد قانوني مصري. الإجابة استرشادية ويجب مراجعتها من محامٍ مقيد بنقابة المحامين المصريين.';

async function callGroqAI(prompt: string, sysInstruction: string) {
    if (!GROQ_API_KEY) return null;
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: sysInstruction },
                    { role: "user", content: prompt }
                ]
            })
        });
        if (!response.ok) return null;
        const data: any = await response.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (e) {
        logger.error({ err: e }, "Groq call failed");
        return null;
    }
}

// --- Mock AI Fallbacks for Demos ---
const getMockAssistantResponse = () => `بناءً على القانون المصري، أرى أن موقف الموكل قوي في هذه القضية. يُنصح بتجهيز المستندات الداعمة وتقديمها عبر بوابة التقاضي الإلكتروني. (ملاحظة: هذا رد توضيحي للعرض التوضيحي).`;

const getMockDraftResponse = (type: string, facts: string) => `**مسودة ${type}**\n\nأصحاب الفضيلة، السلام عليكم ورحمة الله وبركاته.\n\nتتخلص وقائع هذه الدعوى في الآتي:\n${facts}\n\nوبناءً على ما تقدم، نطلب من فضيلتكم الحكم لصالح موكلنا.\n(رد توضيحي للعرض التوضيحي)`;

const getMockAnalyzeResponse = () => `**التحليل القانوني:**\n1. **نقاط القوة:** وجود عقود موثقة.\n2. **المخاطر:** تأخر في المطالبة قد يدخل في التقادم.\n3. **التوصية:** توجيه إنذار عدلي كخطوة أولى.\n(رد توضيحي للعرض التوضيحي)`;

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
        
        // BUG-009: Ensure email is verified for production
        if (process.env.NODE_ENV === 'production' && !decodedToken.email_verified) {
            return res.status(403).json({ error: 'يرجى تفعيل البريد الإلكتروني أولاً' });
        }

        req.user = decodedToken; 
        if (!decodedToken.tenantId) {
            return res.status(403).json({ error: 'المستخدم غير مرتبط بمساحة عمل (Tenant)' });
        }
        req.tenantId = decodedToken.tenantId;
        next();
    } catch (error: any) {
        logger.error({ err: error }, 'Auth Token Error');
        return res.status(403).json({ error: 'التوكن غير صالح أو منتهي الصلاحية' });
    }
}, aiSecurityMiddleware);

// AI Endpoint Routing
app.post('/api/ai/legal-assistant', aiRateLimiter, async (req, res) => {
    try {
        const userMessage = String(req.body.userMessage || '');
        
        // 1. Try Gemini
        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction });
                const result = await model.generateContent(userMessage);
                const response = result.response;
                const text = response.text();
                if (text) return res.status(200).json({ text, provider: 'gemini' });
            } catch (e) {
                logger.error({ err: e }, "Gemini call failed");
            }
        }

        // 2. Try Groq
        const groqResponse = await callGroqAI(userMessage, systemInstruction);
        if (groqResponse) return res.status(200).json({ text: groqResponse, provider: 'groq' });
        
        // 3. Fallback to Mock
        return res.status(200).json({ 
            text: getMockAssistantResponse(), 
            provider: 'mock',
            isFallback: true 
        });
    }
    catch (error) {
        logger.error({ err: error }, "AI Error - Falling back to Mock");
        return res.status(200).json({ 
            text: getMockAssistantResponse(), 
            provider: 'mock',
            isFallback: true 
        });
    }
});

app.post('/api/ai/draft', aiRateLimiter, async (req, res) => {
    try {
        const type = String(req.body.type || 'وثيقة قانونية');
        const facts = String(req.body.facts || '');
        const prompt = `قم بصياغة ${type} احترافية بناءً على الوقائع التالية:\n${facts}`;
        
        // 1. Try Gemini
        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction });
                const result = await model.generateContent(prompt);
                const response = result.response;
                const text = response.text();
                if (text) return res.status(200).json({ text, provider: 'gemini' });
            } catch (e) {
                logger.error({ err: e }, "Gemini Draft call failed");
            }
        }

        // 2. Try Groq
        const groqResponse = await callGroqAI(prompt, systemInstruction);
        if (groqResponse) return res.status(200).json({ text: groqResponse, provider: 'groq' });
        
        // 3. Fallback to Mock
        return res.status(200).json({ 
            text: getMockDraftResponse(type, facts), 
            provider: 'mock',
            isFallback: true 
        });
    }
    catch (error) {
        logger.error({ err: error }, "AI Draft Error - Falling back to Mock");
        const type = String(req.body.type || 'وثيقة قانونية');
        const facts = String(req.body.facts || '');
        return res.status(200).json({ 
            text: getMockDraftResponse(type, facts), 
            provider: 'mock',
            isFallback: true 
        });
    }
});

app.post('/api/ai/analyze', aiRateLimiter, async (req, res) => {
    try {
        const content = String(req.body.content || '');
        const prompt = `حلل النص القانوني التالي وفق القانون المصري وحدد الملخص والدفوع والمخاطر:\n${content}`;
        
        // 1. Try Gemini
        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction });
                const result = await model.generateContent(prompt);
                const response = result.response;
                const text = response.text();
                if (text) return res.status(200).json({ text, provider: 'gemini' });
            } catch (e) {
                logger.error({ err: e }, "Gemini Analyze call failed");
            }
        }

        // 2. Try Groq
        const groqResponse = await callGroqAI(prompt, systemInstruction);
        if (groqResponse) return res.status(200).json({ text: groqResponse, provider: 'groq' });
        
        // 3. Fallback to Mock
        return res.status(200).json({ 
            text: getMockAnalyzeResponse(), 
            provider: 'mock',
            isFallback: true 
        });
    }
    catch (error) {
        logger.error({ err: error }, "AI Analyze Error - Falling back to Mock");
        return res.status(200).json({ 
            text: getMockAnalyzeResponse(), 
            provider: 'mock',
            isFallback: true 
        });
    }
});

// --- Crypto Endpoints ---
const MASTER_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;

function getTenantKey(tenantId: string) {
    return crypto.pbkdf2Sync(MASTER_ENCRYPTION_KEY, tenantId, 100000, 32, 'sha512');
}

app.post('/api/crypto/encrypt', async (req: any, res: any) => {
    // Re-applying auth specifically here if needed, but it's better to use authMiddleware
    // For now, let's keep it consistent with the existing structure
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
        const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
        const tenantId = decodedToken.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'No tenant' });

        const text = req.body.text;
        if (!text) return res.status(400).json({ error: 'Text is required' });
        
        const tenantKey = getTenantKey(tenantId);
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', tenantKey, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        res.status(200).json({ result: iv.toString('hex') + ':' + encrypted });
    } catch (error) {
        logger.error({ err: error }, "Encryption Error");
        res.status(500).json({ error: 'Encryption failed' });
    }
});

app.post('/api/crypto/decrypt', async (req: any, res: any) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
        const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
        const tenantId = decodedToken.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'No tenant' });

        const text = req.body.text;
        if (!text) return res.status(400).json({ error: 'Text is required' });
        
        const textParts = text.split(':');
        const ivHex = textParts.shift();
        const encryptedText = textParts.join(':');
        
        if (!ivHex || !encryptedText) return res.status(400).json({ error: 'Invalid encrypted text format' });
        
        const tenantKey = getTenantKey(tenantId);
        const iv = Buffer.from(ivHex, 'hex');
        
        const decipher = crypto.createDecipheriv('aes-256-cbc', tenantKey, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        res.status(200).json({ result: decrypted });
    } catch (error) {
        logger.error({ err: error }, "Decryption Error");
        res.status(200).json({ result: req.body.text });
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
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  logger.warn("'dist' folder not found. Frontend will not be served.");
  app.get('/', (_req, res) => res.send('API is running. Frontend build (dist) not found.'));
}

// Start Server
app.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`);
  if (!GEMINI_API_KEY) {
    logger.warn('⚠️ Warning: GEMINI_API_KEY is not set. AI features will not work.');
  }
});
