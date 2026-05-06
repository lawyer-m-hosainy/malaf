import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
);

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_BASE = 'https://api.daily.co/v1';

// إنشاء غرفة جديدة
router.post('/create-room', async (req, res) => {
  try {
    const { caseId, caseName, clientName, officeId, lawyerId } = req.body;

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

    // حفظ الجلسة في Supabase
    const { data, error } = await supabase
      .from('video_sessions')
      .insert({
        office_id: officeId,
        case_id: caseId,
        room_name: roomName,
        room_url: room.url,
        lawyer_id: lawyerId,
        client_name: clientName,
        status: 'waiting'
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

  } catch (err: any) {
    console.error('Video room error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// إنهاء الجلسة وحفظ الملاحظات
router.post('/end-session', async (req, res) => {
  try {
    const { sessionId, notes, chatLog, durationSeconds } = req.body;

    const { error } = await supabase
      .from('video_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        notes,
        chat_log: chatLog
      })
      .eq('id', sessionId);

    if (error) throw error;
    res.json({ success: true });

  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// جلب سجل جلسات قضية معينة
router.get('/sessions/:caseId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('video_sessions')
      .select('*')
      .eq('case_id', req.params.caseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, sessions: data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
