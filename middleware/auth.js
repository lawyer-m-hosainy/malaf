import admin from 'firebase-admin';
import pino from 'pino';

const logger = pino();

// Initialize Firebase Admin if not already initialized
try {
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
} catch (e) {
    console.warn('Firebase Admin init warning in middleware:', e);
}

/**
 * Auth Middleware to verify Firebase JWT
 */
export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false,
            error: 'مطلوب مصادقة صالحة للوصول إلى هذا المورد' 
        });
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        
        // Multi-tenant check: ensure user has a tenantId
        if (!decodedToken.tenantId) {
            return res.status(403).json({ 
                success: false,
                error: 'المستخدم غير مرتبط بمساحة عمل (Tenant) - يرجى التواصل مع الإدارة' 
            });
        }
        
        req.tenantId = decodedToken.tenantId;
        req.userRole = decodedToken.role;
        next();
    } catch (error) {
        logger.error({ err: error }, 'Auth Token Verification Error');
        return res.status(403).json({ 
            success: false,
            error: 'انتهت صلاحية الجلسة أو التوكن غير صالح، يرجى تسجيل الدخول مرة أخرى' 
        });
    }
};
