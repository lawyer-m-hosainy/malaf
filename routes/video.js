import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import pino from 'pino';

const router = express.Router();
const logger = pino();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
);

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_BASE = 'https://api.daily.co/v1';

// ═══════════════════════════════════════════════════════
// Zod Schemas — التحقق من المدخلات
// ═══════════════════════════════════════════════════════

const createRoomSchema = z.object({
  caseId: z.string().min(1, 'معرّف القضية مطلوب'),
  caseName: z.string().optional(),
  clientName: z.string().optional(),
  officeId: z.string().optional(),
  lawyerId: z.string().optional(),
});

const endSessionSchema = z.object({
  sessionId: z.string().uuid('معرّف الجلسة يجب أن يكون UUID صالح'),
  notes: z.string().max(5000).optional(),
  chatLog: z.string().max(50000).optional(),
  durationSeconds: z.number().int().min(0).optional(),
});

const caseIdParamSchema = z.object({
  caseId: z.string().min(1, 'معرّف القضية مطلوب'),
});

// ═══════════════════════════════════════════════════════
// Helper: تسجيل العمليات الحساسة
// ═══════════════════════════════════════════════════════
function logSecurityEvent(req, action, details = {}) {
  logger.info({
    event: 'SECURITY_AUDIT',
    action,
    userId: req.user?.uid || 'unknown',
    tenantId: req.tenantId || 'unknown',
    ip: req.ip,
    userAgent: req.get('user-agent'),
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

// ═══════════════════════════════════════════════════════
// إنشاء غرفة جديدة
// ═══════════════════════════════════════════════════════
router.post('/create-room', async (req, res) => {
  try {
    // ✅ R4-FIX: Zod validation
    const parsed = createRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'بيانات غير صالحة',
        details: parsed.error.issues.map(i => i.message),
      });
    }

    const { caseId, caseName, clientName, officeId, lawyerId } = parsed.data;
    // ✅ استخدام tenantId من الـ auth middleware
    const orgId = req.tenantId || officeId;

    if (!orgId) {
      return res.status(400).json({ success: false, error: 'معرّف المكتب مطلوب' });
    }

    // ✅ R4-FIX: تسجيل العملية الحساسة
    logSecurityEvent(req, 'VIDEO_ROOM_CREATE', { caseId, orgId });

    // إنشاء الغرفة على Daily.co
    const roomName = `malaf-${caseId}-${Date.now()}`;
    const dailyRes = await fetch(`${DAILY_BASE}/rooms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          max_participants: 5,
          enable_chat: true,
          enable_screenshare: true,
          enable_recording: 'local',
          exp: Math.floor(Date.now() / 1000) + 7200 // تنتهي بعد ساعتين
        }
      })
    });

    const room = await dailyRes.json();

    if (room.error) {
       throw new Error(room.info || room.error);
    }

    // ✅ حفظ الجلسة في الجدول الصحيح: video_rooms
    const { data, error } = await supabase
      .from('video_rooms')
      .insert({
        org_id: orgId,
        case_id: caseId,
        room_name: roomName,
        room_url: room.url,
        lawyer_id: lawyerId || null,
        client_id: null,
        status: 'active',
        scheduled_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ 
      success: true, 
      roomUrl: room.url,
      sessionId: data.id,
      roomName 
    });

  } catch (err) {
    logger.error({ err: err.message, path: req.originalUrl }, 'Video room creation error');
    res.status(500).json({ success: false, error: 'فشل إنشاء غرفة الفيديو' });
  }
});

// ═══════════════════════════════════════════════════════
// إنهاء الجلسة وحفظ الملاحظات
// ═══════════════════════════════════════════════════════
router.post('/end-session', async (req, res) => {
  try {
    // ✅ R4-FIX: Zod validation
    const parsed = endSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'بيانات غير صالحة',
        details: parsed.error.issues.map(i => i.message),
      });
    }

    const { sessionId } = parsed.data;
    // ✅ عزل المستأجر
    const orgId = req.tenantId;

    // ✅ R4-FIX: تسجيل العملية الحساسة
    logSecurityEvent(req, 'VIDEO_SESSION_END', { sessionId, orgId });

    const { error } = await supabase
      .from('video_rooms')
      .update({
        status: 'ended',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('org_id', orgId); // ✅ tenant isolation

    if (error) throw error;
    res.json({ success: true });

  } catch (err) {
    logger.error({ err: err.message, path: req.originalUrl }, 'Video session end error');
    res.status(500).json({ success: false, error: 'فشل إنهاء الجلسة' });
  }
});

// ═══════════════════════════════════════════════════════
// جلب سجل جلسات قضية معينة
// ═══════════════════════════════════════════════════════
router.get('/sessions/:caseId', async (req, res) => {
  try {
    // ✅ R4-FIX: Zod validation على params
    const parsed = caseIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'معرّف القضية غير صالح',
      });
    }

    // ✅ عزل المستأجر — لا يمكن الوصول لجلسات مكتب آخر
    const orgId = req.tenantId;
    
    const { data, error } = await supabase
      .from('video_rooms')
      .select('id, org_id, case_id, room_name, room_url, lawyer_id, client_id, status, scheduled_at, created_at, updated_at')
      .eq('case_id', parsed.data.caseId)
      .eq('org_id', orgId) // ✅ tenant isolation
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, sessions: data });
  } catch (err) {
    logger.error({ err: err.message, path: req.originalUrl }, 'Video sessions fetch error');
    res.status(500).json({ success: false, error: 'فشل جلب الجلسات' });
  }
});

export default router;
