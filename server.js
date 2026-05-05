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
}
catch (e) {
    logger.warn('Firebase Admin init warning:', e);
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
        service: 'legal-erp-egypt-production',
        timestamp: new Date().toISOString(),
    });
});
// AI Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
const systemInstruction = 'أنت مساعد قانوني مصري. الإجابة استرشادية ويجب مراجعتها من محامٍ مقيد بنقابة المحامين المصريين.';
// AI Security Middleware
const sanitizeInput = (text) => {
    if (!text)
        return '';
    return text.toString().replace(/<[^>]*>?/gm, ''); // Remove HTML/Script tags
};
const aiSecurityMiddleware = (req, res, next) => {
    // Length Validation & Sanitization
    if (req.body.userMessage !== undefined) {
        const msg = String(req.body.userMessage);
        if (msg.length > 5000)
            return res.status(400).json({ error: 'يجب أن يكون طول الرسالة أقل من 5000 حرف' });
        req.body.userMessage = sanitizeInput(msg);
    }
    if (req.body.facts !== undefined) {
        const facts = String(req.body.facts);
        if (facts.length > 10000)
            return res.status(400).json({ error: 'يجب أن يكون طول الوقائع أقل من 10000 حرف' });
        req.body.facts = sanitizeInput(facts);
    }
    if (req.body.content !== undefined) {
        const content = String(req.body.content);
        if (content.length > 50000)
            return res.status(400).json({ error: 'يجب أن يكون طول المحتوى أقل من 50000 حرف' });
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
// Auth Middleware to verify Firebase JWT
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'مطلوب مصادقة صالحة' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        req.tenantId = decodedToken.tenantId || req.headers['x-tenant-id'] || 'default';
        req.userRole = decodedToken.role || req.headers['x-user-role'];
        next();
    }
    catch (error) {
        logger.error({ err: error }, 'Auth Token Error');
        return res.status(403).json({ error: 'التوكن غير صالح أو منتهي الصلاحية' });
    }
};

app.use('/api/ai', authMiddleware, aiSecurityMiddleware);
// --- Mock AI Fallbacks for Demos ---
const getMockAssistantResponse = () => `بناءً على القانون المصري، أرى أن موقف الموكل قوي في هذه القضية. يُنصح بتجهيز المستندات الداعمة وتقديمها عبر بوابة التقاضي الإلكتروني. (ملاحظة: هذا رد توضيحي للعرض التوضيحي).`;

const getMockDraftResponse = (type, facts) => `**مسودة ${type}**\n\nأصحاب الفضيلة، السلام عليكم ورحمة الله وبركاته.\n\nتتخلص وقائع هذه الدعوى في الآتي:\n${facts}\n\nوبناءً على ما تقدم، نطلب من فضيلتكم الحكم لصالح موكلنا.\n(رد توضيحي للعرض التوضيحي)`;

const getMockAnalyzeResponse = () => `**التحليل القانوني:**\n1. **نقاط القوة:** وجود عقود موثقة.\n2. **المخاطر:** تأخر في المطالبة قد يدخل في التقادم.\n3. **التوصية:** توجيه إنذار عدلي كخطوة أولى.\n(رد توضيحي للعرض التوضيحي)`;

// AI Endpoint Routing
app.post('/api/ai/legal-assistant', aiRateLimiter, async (req, res) => {
    try {
        const userMessage = String(req.body.userMessage || '');
        if (!ai) return res.status(200).json({ text: getMockAssistantResponse() });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userMessage,
            config: { systemInstruction },
        });
        return res.status(200).json({ text: response.text || getMockAssistantResponse() });
    }
    catch (error) {
        logger.error({ err: error }, "AI Error - Falling back to Mock");
        return res.status(200).json({ text: getMockAssistantResponse() });
    }
});

app.post('/api/ai/draft', aiRateLimiter, async (req, res) => {
    try {
        const type = String(req.body.type || 'وثيقة قانونية');
        const facts = String(req.body.facts || '');
        if (!ai) return res.status(200).json({ text: getMockDraftResponse(type, facts) });

        const prompt = `قم بصياغة ${type} احترافية بناءً على الوقائع التالية:\n${facts}`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { systemInstruction },
        });
        return res.status(200).json({ text: response.text || getMockDraftResponse(type, facts) });
    }
    catch (error) {
        logger.error({ err: error }, "AI Draft Error - Falling back to Mock");
        const type = String(req.body.type || 'وثيقة قانونية');
        const facts = String(req.body.facts || '');
        return res.status(200).json({ text: getMockDraftResponse(type, facts) });
    }
});

app.post('/api/ai/analyze', aiRateLimiter, async (req, res) => {
    try {
        if (!ai) return res.status(200).json({ text: getMockAnalyzeResponse() });

        const content = String(req.body.content || '');
        const prompt = `حلل النص القانوني التالي وفق القانون المصري وحدد الملخص والدفوع والمخاطر:\n${content}`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { systemInstruction },
        });
        return res.status(200).json({ text: response.text || getMockAnalyzeResponse() });
    }
    catch (error) {
        logger.error({ err: error }, "AI Analyze Error - Falling back to Mock");
        return res.status(200).json({ text: getMockAnalyzeResponse() });
    }
});

// --- Server-side API Endpoints for Cases ---
const db = admin.firestore();

// 1. POST /api/cases
app.post('/api/cases', authMiddleware, async (req, res) => {
    try {
        if (req.userRole === 'client') {
            return res.status(403).json({ error: 'غير مصرح للعملاء بإنشاء قضايا' });
        }
        
        const caseData = req.body;
        if (caseData.tenantId && caseData.tenantId !== req.tenantId) {
            return res.status(403).json({ error: 'لا يمكن إنشاء قضية في مساحة عمل مختلفة' });
        }
        
        caseData.tenantId = req.tenantId;
        caseData.createdAt = new Date().toISOString();
        
        const docRef = await db.collection('cases').add(caseData);
        return res.status(201).json({ id: docRef.id, ...caseData });
    } catch (error) {
        logger.error({ err: error }, "Create Case Error");
        return res.status(500).json({ error: 'حدث خطأ أثناء إنشاء القضية' });
    }
});

// 2. PUT /api/cases/:id
app.put('/api/cases/:id', authMiddleware, async (req, res) => {
    try {
        if (req.userRole === 'client') {
            return res.status(403).json({ error: 'غير مصرح للعملاء بتعديل القضايا' });
        }
        
        const caseId = req.params.id;
        const caseRef = db.collection('cases').doc(caseId);
        const caseDoc = await caseRef.get();
        
        if (!caseDoc.exists) {
            return res.status(404).json({ error: 'القضية غير موجودة' });
        }
        
        const existingCase = caseDoc.data();
        if (existingCase.tenantId !== req.tenantId) {
            return res.status(403).json({ error: 'غير مصرح لك بتعديل هذه القضية' });
        }
        
        const updateData = req.body;
        delete updateData.tenantId; // Prevent changing tenantId
        
        await caseRef.update(updateData);
        return res.status(200).json({ id: caseId, ...existingCase, ...updateData });
    } catch (error) {
        logger.error({ err: error }, "Update Case Error");
        return res.status(500).json({ error: 'حدث خطأ أثناء تعديل القضية' });
    }
});

// 3. DELETE /api/cases/:id
app.delete('/api/cases/:id', authMiddleware, async (req, res) => {
    try {
        if (req.userRole === 'client') {
            return res.status(403).json({ error: 'غير مصرح للعملاء بحذف القضايا' });
        }
        
        const caseId = req.params.id;
        const caseRef = db.collection('cases').doc(caseId);
        const caseDoc = await caseRef.get();
        
        if (!caseDoc.exists) {
            return res.status(404).json({ error: 'القضية غير موجودة' });
        }
        
        if (caseDoc.data().tenantId !== req.tenantId) {
            return res.status(403).json({ error: 'غير مصرح لك بحذف هذه القضية' });
        }
        
        await caseRef.delete();
        return res.status(200).json({ success: true, message: 'تم حذف القضية بنجاح' });
    } catch (error) {
        logger.error({ err: error }, "Delete Case Error");
        return res.status(500).json({ error: 'حدث خطأ أثناء حذف القضية' });
    }
});
// Serve frontend static files
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}
else {
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
