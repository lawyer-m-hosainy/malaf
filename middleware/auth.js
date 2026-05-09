import pino from 'pino';
import jwt from 'jsonwebtoken';

const logger = pino();

/**
 * ═══════════════════════════════════════════════════════
 * Auth Middleware — مَلَف (Malaf)
 * ═══════════════════════════════════════════════════════
 * يتحقق من JWT الصادر من Supabase Auth باستخدام SUPABASE_JWT_SECRET.
 * في وضع التطوير فقط (NODE_ENV !== 'production') يسمح بالوضع التجريبي.
 * ═══════════════════════════════════════════════════════
 */

// ✅ R2-FIX: JWT secret from Supabase (Settings → API → JWT Secret)
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

/**
 * Main authentication middleware.
 * Verifies Supabase JWT tokens cryptographically.
 */
export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // ── وضع التطوير/التجريبي — فقط في بيئة التطوير المحلية ──
    if (process.env.NODE_ENV !== 'production' && process.env.VITE_ENABLE_DEMO === 'true') {
        if (!authHeader) {
            req.user = { uid: 'demo-user', tenantId: 'demo-org', role: 'admin' };
            req.tenantId = 'demo-org';
            req.userRole = 'admin';
            return next();
        }
        // ✅ إذا أرسل المستخدم توكن حتى في demo mode → نتحقق منه عادي
    }

    // ── التحقق من وجود الـ header ──
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // ✅ R4-FIX: تسجيل محاولة وصول بدون توكن
        logger.warn({
            event: 'AUTH_MISSING_TOKEN',
            ip: req.ip,
            path: req.originalUrl,
            method: req.method,
            userAgent: req.get('user-agent'),
        }, 'Access attempt without auth token');
        return res.status(401).json({
            success: false,
            error: 'مطلوب مصادقة صالحة للوصول إلى هذا المورد'
        });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        // ✅ R2-FIX: تحقق فعلي من التوقيع باستخدام JWT_SECRET
        if (JWT_SECRET) {
            // التحقق الكامل: فك التشفير + التحقق من التوقيع + التحقق من الصلاحية
            const decoded = jwt.verify(token, JWT_SECRET, {
                algorithms: ['HS256'],
                // Supabase JWT issuer format: https://<ref>.supabase.co/auth/v1
                // لا نحدد issuer لأن القيمة تختلف بين المشاريع
            });

            req.user = {
                uid: decoded.sub || 'unknown',
                email: decoded.email,
                tenantId: decoded.user_metadata?.org_id || decoded.app_metadata?.org_id || '',
                role: decoded.user_metadata?.role || decoded.role || 'user',
            };
        } else {
            // ⚠️ Fallback: إذا لم يتم تعيين JWT_SECRET — فك payload بدون تحقق (تطوير فقط)
            if (process.env.NODE_ENV === 'production') {
                logger.error('SUPABASE_JWT_SECRET is not set! Authentication is NOT secure.');
                return res.status(500).json({
                    success: false,
                    error: 'خطأ في تكوين المصادقة على الخادم'
                });
            }

            logger.warn('SUPABASE_JWT_SECRET not set — using unverified decode (DEV ONLY)');
            const parts = token.split('.');
            if (parts.length !== 3) throw new Error('Invalid JWT format');
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));

            req.user = {
                uid: payload.sub || payload.user_id || 'unknown',
                email: payload.email,
                tenantId: payload.user_metadata?.org_id || '',
                role: payload.user_metadata?.role || payload.role || 'user',
            };
        }

        req.tenantId = req.user.tenantId;
        req.userRole = req.user.role;

        // ✅ التحقق من وجود tenantId (org_id) — ضروري لعزل المستأجر
        if (!req.tenantId) {
            logger.warn({ uid: req.user.uid }, 'User has no org_id — tenant isolation may fail');
        }

        next();
    } catch (error) {
        // jwt.verify يرمي أخطاء مختلفة حسب نوع المشكلة
        if (error.name === 'TokenExpiredError') {
            logger.warn({
                event: 'AUTH_TOKEN_EXPIRED',
                ip: req.ip,
                path: req.originalUrl,
                userAgent: req.get('user-agent'),
            }, 'Expired JWT token used');
            return res.status(401).json({
                success: false,
                error: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            // ✅ R4-FIX: تسجيل محاولة استخدام توكن مزور — قد يكون هجوم
            logger.warn({
                event: 'AUTH_INVALID_TOKEN',
                ip: req.ip,
                path: req.originalUrl,
                method: req.method,
                userAgent: req.get('user-agent'),
                errorDetail: error.message,
            }, 'SECURITY: Invalid/tampered JWT token detected');
            return res.status(403).json({
                success: false,
                error: 'التوكن غير صالح أو تم التلاعب به'
            });
        }

        logger.error({ err: error }, 'Auth Token Verification Error');
        return res.status(403).json({
            success: false,
            error: 'فشل التحقق من المصادقة'
        });
    }
};
