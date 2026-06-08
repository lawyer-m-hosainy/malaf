import { Router } from 'express';
import crypto from 'crypto';

const router = Router();
const ALGORITHM = 'aes-256-gcm';

const getEncryptionKey = () => {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY is missing in process.env');
  }
  return Buffer.from(keyHex, 'hex');
};

router.post('/encrypt', (req, res, next) => {
  try {
    const { data, context } = req.body;
    if (!data) return res.status(400).json({ error: 'Data is required' });

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');

    res.json({
      encrypted,
      iv: iv.toString('hex'),
      tag
    });
  } catch (err) {
    next(err);
  }
});

router.post('/decrypt', (req, res, next) => {
  try {
    const { encrypted, iv, tag, context } = req.body;
    if (!encrypted || !iv || !tag) {
      return res.status(400).json({ error: 'encrypted, iv, and tag are required' });
    }

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    res.json({ data: decrypted });
  } catch (err) {
    res.status(400).json({ error: 'Decryption failed. Data might be corrupted or keys mismatch.' });
  }
});

export default router;
