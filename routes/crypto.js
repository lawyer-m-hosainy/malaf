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

const MASTER_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 12; // GCM standard IV length
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a tenant-specific encryption key using the master key and tenant ID.
 */
function getTenantKey(tenantId) {
    return crypto.pbkdf2Sync(MASTER_ENCRYPTION_KEY, tenantId, 100000, 32, 'sha512');
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

router.post('/encrypt', async (req, res) => {
    try {
        const { text } = cryptoSchema.parse(req.body);
        
        const tenantKey = getTenantKey(req.tenantId);
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-gcm', tenantKey, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        
        // Format: iv:authTag:encryptedText
        res.status(200).json({ 
            success: true, 
            result: `${iv.toString('hex')}:${authTag}:${encrypted}`
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: error.issues[0].message });
        }
        logger.error({ err: error, tenantId: req.tenantId }, "Encryption Error");
        res.status(500).json({ success: false, error: 'فشلت عملية التشفير' });
    }
});

router.post('/decrypt', async (req, res) => {
    try {
        const { text } = cryptoSchema.parse(req.body);
        
        const textParts = text.split(':');
        if (textParts.length < 3) throw new Error('Invalid format for GCM');
        
        const ivHex = textParts[0];
        const authTagHex = textParts[1];
        const encryptedText = textParts[2];
        
        const tenantKey = getTenantKey(req.tenantId);
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        
        const decipher = crypto.createDecipheriv('aes-256-gcm', tenantKey, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        res.status(200).json({ success: true, result: decrypted });
    } catch (error) {
        // Log decryption failure but don't leak reason to client
        logger.warn({ err: error.message, tenantId: req.tenantId }, "Decryption Failed (GCM Auth Failure?)");
        // Return original if it's not encrypted, or handle accordingly
        res.status(200).json({ success: true, result: req.body.text });
    }
});


router.post('/batch-decrypt', async (req, res) => {
    try {
        const { texts } = batchCryptoSchema.parse(req.body);
        const tenantKey = getTenantKey(req.tenantId);
        
        const results = texts.map(text => {
            if (!text || !text.includes(':')) return text;
            try {
                const textParts = text.split(':');
                if (textParts.length < 3) return text; // Fallback for old format or unencrypted
                
                const ivHex = textParts[0];
                const authTagHex = textParts[1];
                const encryptedText = textParts[2];
                
                const iv = Buffer.from(ivHex, 'hex');
                const authTag = Buffer.from(authTagHex, 'hex');
                
                const decipher = crypto.createDecipheriv('aes-256-gcm', tenantKey, iv);
                decipher.setAuthTag(authTag);
                
                let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                return decrypted;
            } catch (e) {
                return text;
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


export default router;
