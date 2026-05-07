import express from 'express';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pino from 'pino';
import { aiRateLimiter, aiSecurityMiddleware } from '../middleware/aiSecurity.js';

const logger = pino();
const router = express.Router();

// AI Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const systemInstruction = `أنت مساعد قانوني ذكي متخصص في القانون المصري. 
قواعد الإجابة:
1. يجب أن تستند إجاباتك إلى القوانين واللوائح المعمول بها في جمهورية مصر العربية (مثل القانون المدني، قانون المرافعات، قانون العقوبات، قانون العمل المصري، إلخ).
2. استخدم مصطلحات قانونية مصرية دقيقة (مثل: صحيفة دعوى، جنحة، جناية، أمر على عريضة، إلخ).
3. دائماً أضف تنويهاً بأن الإجابة استرشادية ولا تغني عن استشارة محامٍ مقيد بنقابة المحامين المصريين.
4. إذا طلب منك صياغة مستند، اجعله بصيغة مهنية تليق بالمحاكم المصرية.`;

// Validation Schemas
const assistantSchema = z.object({
    userMessage: z.string().min(1, 'الرسالة مطلوبة').max(5000, 'الرسالة طويلة جداً')
});

const draftSchema = z.object({
    type: z.string().min(1, 'نوع الوثيقة مطلوب'),
    facts: z.string().min(1, 'الوقائع مطلوبة').max(10000, 'الوقائع طويلة جداً')
});

const analyzeSchema = z.object({
    content: z.string().min(1, 'المحتوى مطلوب').max(50000, 'المحتوى طويل جداً')
});

// Helper for Groq calls
async function callGroq(prompt, sysInstruction) {
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
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (e) {
        logger.error({ err: e }, "Groq call failed");
        return null;
    }
}

// Routes
router.post('/legal-assistant', aiRateLimiter, aiSecurityMiddleware, async (req, res) => {
    try {
        const { userMessage } = assistantSchema.parse(req.body);
        
        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction });
                const result = await model.generateContent(userMessage);
                const response = await result.response;
                const text = response.text();
                if (text) return res.status(200).json({ success: true, text, provider: 'gemini' });
            } catch (e) {
                logger.error({ err: e }, "Gemini call failed");
            }
        }

        const groqResponse = await callGroq(userMessage, systemInstruction);
        if (groqResponse) return res.status(200).json({ success: true, text: groqResponse, provider: 'groq' });
        
        throw new Error('All AI providers failed');
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: error.issues[0].message });
        }
        logger.error({ err: error }, "AI Assistant Error");
        res.status(500).json({ success: false, error: 'حدث خطأ أثناء معالجة طلبك، يرجى المحاولة لاحقاً' });
    }
});

router.post('/draft', aiRateLimiter, aiSecurityMiddleware, async (req, res) => {
    try {
        const { type, facts } = draftSchema.parse(req.body);
        const prompt = `قم بصياغة ${type} احترافية تتبع الأصول القانونية المصرية بناءً على الوقائع التالية:\n${facts}`;
        
        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();
                if (text) return res.status(200).json({ success: true, text, provider: 'gemini' });
            } catch (e) {
                logger.error({ err: e }, "Gemini Draft failed");
            }
        }

        const groqResponse = await callGroq(prompt, systemInstruction);
        if (groqResponse) return res.status(200).json({ success: true, text: groqResponse, provider: 'groq' });
        
        throw new Error('All AI providers failed');
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: error.issues[0].message });
        }
        res.status(500).json({ success: false, error: 'فشل في توليد المسودة، يرجى المحاولة مرة أخرى' });
    }
});

router.post('/analyze', aiRateLimiter, aiSecurityMiddleware, async (req, res) => {
    try {
        const { content } = analyzeSchema.parse(req.body);
        const prompt = `حلل النص القانوني التالي وفق القانون المصري وحدد الملخص والدفوع والمخاطر:\n${content}`;
        
        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();
                if (text) return res.status(200).json({ success: true, text, provider: 'gemini' });
            } catch (e) {
                logger.error({ err: e }, "Gemini Analyze failed");
            }
        }

        const groqResponse = await callGroq(prompt, systemInstruction);
        if (groqResponse) return res.status(200).json({ success: true, text: groqResponse, provider: 'groq' });
        
        throw new Error('All AI providers failed');
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: error.issues[0].message });
        }
        res.status(500).json({ success: false, error: 'فشل في تحليل النص، يرجى المحاولة مرة أخرى' });
    }
});

export default router;
