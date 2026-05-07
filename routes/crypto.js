import express from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import pino from 'pino';
import { authMiddleware } from '../middleware/auth.js';

const logger = pino();
const router = express.Router();

const MASTER_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;

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
        const cipher = crypto.createCipheriv('aes-256-cbc', tenantKey, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        res.status(200).json({ 
            success: true, 
            result: iv.toString('hex') + ':' + encrypted 
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
        if (textParts.length < 2) throw new Error('Invalid format');
        
        const ivHex = textParts.shift();
        const encryptedText = textParts.join(':');
        
        const tenantKey = getTenantKey(req.tenantId);
        const iv = Buffer.from(ivHex, 'hex');
        
        const decipher = crypto.createDecipheriv('aes-256-cbc', tenantKey, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        res.status(200).json({ success: true, result: decrypted });
    } catch (error) {
        // Return original text if decryption fails (as fallback) but log it
        logger.warn({ err: error.message, tenantId: req.tenantId }, "Decryption Fallback");
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
                const ivHex = textParts.shift();
                const encryptedText = textParts.join(':');
                
                const iv = Buffer.from(ivHex, 'hex');
                const decipher = crypto.createDecipheriv('aes-256-cbc', tenantKey, iv);
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
