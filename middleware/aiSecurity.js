import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter for AI Endpoints (10 requests per minute)
 */
export const aiRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { 
        success: false,
        error: 'تم تجاوز الحد الأقصى للطلبات المسموح بها في الدقيقة. يرجى الانتظار قليلاً.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Sanitizes input text to prevent simple injection/HTML attacks
 */
const sanitizeInput = (text) => {
    if (!text) return '';
    return text.toString().replace(/<[^>]*>?/gm, ''); // Remove HTML/Script tags
};

/**
 * AI Security Middleware: Validates length and sanitizes inputs
 */
export const aiSecurityMiddleware = (req, res, next) => {
    try {
        // userMessage validation
        if (req.body.userMessage !== undefined) {
            const msg = String(req.body.userMessage);
            if (msg.length > 5000) {
                return res.status(400).json({ 
                    success: false,
                    error: 'يجب أن يكون طول الرسالة أقل من 5000 حرف لضمان الأداء.' 
                });
            }
            req.body.userMessage = sanitizeInput(msg);
        }

        // facts validation (for drafting)
        if (req.body.facts !== undefined) {
            const facts = String(req.body.facts);
            if (facts.length > 10000) {
                return res.status(400).json({ 
                    success: false,
                    error: 'يجب أن يكون طول الوقائع أقل من 10000 حرف.' 
                });
            }
            req.body.facts = sanitizeInput(facts);
        }

        // content validation (for analysis)
        if (req.body.content !== undefined) {
            const content = String(req.body.content);
            if (content.length > 50000) {
                return res.status(400).json({ 
                    success: false,
                    error: 'يجب أن يكون طول المحتوى أقل من 50000 حرف.' 
                });
            }
            req.body.content = sanitizeInput(content);
        }

        // Set Timeout for AI operations (30 seconds)
        req.setTimeout(30000);
        next();
    } catch (error) {
        next(error);
    }
};
