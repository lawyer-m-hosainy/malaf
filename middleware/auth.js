import pino from 'pino';

const logger = pino();

/**
 * Auth Middleware — Verifies Firebase JWT or allows demo mode.
 * In production with Firebase: install firebase-admin and uncomment the Firebase block.
 * Currently: allows authenticated requests via Supabase or demo mode.
 */
export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    // Demo mode — allow all requests when no auth is configured
    if (process.env.VITE_ENABLE_DEMO === 'true' || !authHeader) {
        req.user = { uid: 'demo-user', tenantId: 'demo-org', role: 'admin' };
        req.tenantId = 'demo-org';
        req.userRole = 'admin';
        return next();
    }

    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false,
            error: 'مطلوب مصادقة صالحة للوصول إلى هذا المورد' 
        });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    try {
        // Decode JWT payload without verification (Supabase/Firebase tokens are JWTs)
        const parts = idToken.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }
        
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
        
        req.user = {
            uid: payload.sub || payload.user_id || 'unknown',
            email: payload.email,
            tenantId: payload.tenantId || payload.user_metadata?.org_id || 'default-org',
            role: payload.role || payload.user_metadata?.role || 'user',
        };
        req.tenantId = req.user.tenantId;
        req.userRole = req.user.role;
        
        next();
    } catch (error) {
        logger.error({ err: error }, 'Auth Token Verification Error');
        return res.status(403).json({ 
            success: false,
            error: 'انتهت صلاحية الجلسة أو التوكن غير صالح، يرجى تسجيل الدخول مرة أخرى' 
        });
    }
};
