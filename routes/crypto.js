import express from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import pino from 'pino';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../middleware/auth.js';

const logger = pino();
const router = express.Router();

// Rate Limiter for Crypto Endpoints (30 requests per minute per IP)
const cryptoRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'تم تجاوز الحد الأقصى لطلبات التشفير. حاول بعد دقيقة.' },
});

router.use(cryptoRateLimiter);

// ═══════════════════════════════════════════════════════
// R6-FIX: ENCRYPTION_KEY validation + rotation support
// ═══════════════════════════════════════════════════════

const MASTER_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
// R6-FIX: Previous key for graceful rotation
const PREVIOUS_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY_PREVIOUS;
const CURRENT_KEY_VERSION = 'v2'; // Increment when rotating

// ✅ R6-FIX: Fail fast in production if no key
if (!MASTER_ENCRYPTION_KEY) {
    if (process.env.NODE_ENV === 'production') {
        logger.error('CRITICAL: ENCRYPTION_KEY is not set — crypto endpoints will reject all requests');
    } else {
        logger.warn('ENCRYPTION_KEY not set — using random key (data will NOT persist across restarts!)');
    }
}

const FALLBACK_KEY = crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 12; // GCM standard IV length

/**
 * Derives a tenant-specific encryption key using the master key and tenant ID.
 */
function getTenantKey(tenantId, masterKey) {
    const key = masterKey || MASTER_ENCRYPTION_KEY || FALLBACK_KEY;
    return crypto.pbkdf2Sync(key, tenantId, 100000, 32, 'sha512');
}

// Validation Schemas
const cryptoSchema = z.object({
    text: z.string().min(1, 'النص مطلوب')
});

const batchCryptoSchema = z.object({
    texts: z.array(z.string())
});

// All crypto routes require authentication
router.use(authMiddleware);

// ✅ R6-FIX: Reject requests in production if no key
function requireEncryptionKey(req, res, next) {
    if (process.env.NODE_ENV === 'production' && !MASTER_ENCRYPTION_KEY) {
        return res.status(503).json({
            success: false,
            error: 'خدمة التشفير غير متاحة — ENCRYPTION_KEY غير مُعدّ'
        });
    }
    next();
}
router.use(requireEncryptionKey);

// ═══════════════════════════════════════════════════════
// R6-FIX: Decrypt helper — tries current key, then previous
// ═══════════════════════════════════════════════════════
function decryptWithRotation(encryptedText, tenantId) {
    const parts = encryptedText.split(':');

    let ivHex, authTagHex, ciphertext;

    // Handle versioned format (v2:iv:tag:data) and legacy format (iv:tag:data)
    if (parts[0].startsWith('v') && parts.length === 4) {
        ivHex = parts[1];
        authTagHex = parts[2];
        ciphertext = parts[3];
    } else if (parts.length === 3) {
        ivHex = parts[0];
        authTagHex = parts[1];
        ciphertext = parts[2];
    } else {
        throw new Error('Invalid encrypted format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Try current key first
    try {
        const tenantKey = getTenantKey(tenantId, MASTER_ENCRYPTION_KEY);
        const decipher = crypto.createDecipheriv('aes-256-gcm', tenantKey, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return { decrypted, usedPreviousKey: false };
    } catch (currentKeyError) {
        // Try previous key if available (rotation in progress)
        if (PREVIOUS_ENCRYPTION_KEY) {
            try {
                const prevTenantKey = getTenantKey(tenantId, PREVIOUS_ENCRYPTION_KEY);
                const decipher = crypto.createDecipheriv('aes-256-gcm', prevTenantKey, iv);
                decipher.setAuthTag(authTag);
                let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                logger.info({ tenantId }, 'Decrypted using PREVIOUS key — data needs re-encryption');
                return { decrypted, usedPreviousKey: true };
            } catch {
                throw currentKeyError; // Both keys failed
            }
        }
        throw currentKeyError;
    }
}

// ═══════════════════════════════════════════════════════
// Encrypt
// ═══════════════════════════════════════════════════════
router.post('/encrypt', async (req, res) => {
    try {
        const { text } = cryptoSchema.parse(req.body);

        const tenantKey = getTenantKey(req.tenantId);
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-gcm', tenantKey, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');

        // R6-FIX: Format includes key version for rotation support
        res.status(200).json({
            success: true,
            result: `${CURRENT_KEY_VERSION}:${iv.toString('hex')}:${authTag}:${encrypted}`
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: error.issues[0].message });
        }
        logger.error({ err: error, tenantId: req.tenantId }, "Encryption Error");
        res.status(500).json({ success: false, error: 'فشلت عملية التشفير' });
    }
});

// ═══════════════════════════════════════════════════════
// Decrypt (with rotation fallback)
// ═══════════════════════════════════════════════════════
router.post('/decrypt', async (req, res) => {
    try {
        const { text } = cryptoSchema.parse(req.body);

        if (!text || !text.includes(':')) {
            return res.status(200).json({ success: true, result: text });
        }

        const { decrypted, usedPreviousKey } = decryptWithRotation(text, req.tenantId);

        res.status(200).json({
            success: true,
            result: decrypted,
            ...(usedPreviousKey && { _rotationNeeded: true })
        });
    } catch (error) {
        logger.warn({ err: error.message, tenantId: req.tenantId }, "Decryption Failed (GCM Auth Failure?)");
        // R2-FIX: لا نعيد النص المشفّر للعميل — نعيد نص فارغ
        res.status(200).json({ success: true, result: '' });
    }
});

// ═══════════════════════════════════════════════════════
// Batch Decrypt (with rotation fallback)
// ═══════════════════════════════════════════════════════
router.post('/batch-decrypt', async (req, res) => {
    try {
        const { texts } = batchCryptoSchema.parse(req.body);

        const results = texts.map(text => {
            if (!text || !text.includes(':')) return text;
            try {
                const { decrypted } = decryptWithRotation(text, req.tenantId);
                return decrypted;
            } catch {
                return ''; // R2-FIX: لا نعيد النص المشفّر
            }
        });

        res.status(200).json({ success: true, results });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: error.issues[0].message });
        }
        res.status(200).json({ success: true, results: req.body.texts });
    }
});

// ═══════════════════════════════════════════════════════
// R6-FIX: Key Rotation Endpoint
// ═══════════════════════════════════════════════════════
// Workflow:
// 1. Set ENCRYPTION_KEY_PREVIOUS = old key
// 2. Set ENCRYPTION_KEY = new key
// 3. POST /api/crypto/re-encrypt { text: oldCiphertext }
// 4. After all data migrated → remove ENCRYPTION_KEY_PREVIOUS

router.post('/re-encrypt', async (req, res) => {
    try {
        const { text } = cryptoSchema.parse(req.body);

        if (!text || !text.includes(':')) {
            return res.status(400).json({ success: false, error: 'النص المُمرر غير مشفر' });
        }

        // Decrypt with any available key
        const { decrypted } = decryptWithRotation(text, req.tenantId);

        // Re-encrypt with current key
        const tenantKey = getTenantKey(req.tenantId);
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-gcm', tenantKey, iv);

        let encrypted = cipher.update(decrypted, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');

        logger.info({
            event: 'KEY_ROTATION_RE_ENCRYPT',
            tenantId: req.tenantId,
            userId: req.user?.uid
        }, 'Data re-encrypted with current key');

        res.status(200).json({
            success: true,
            result: `${CURRENT_KEY_VERSION}:${iv.toString('hex')}:${authTag}:${encrypted}`
        });
    } catch (error) {
        logger.error({ err: error.message, tenantId: req.tenantId }, "Re-encryption failed");
        res.status(500).json({ success: false, error: 'فشلت إعادة التشفير' });
    }
});


export default router;
