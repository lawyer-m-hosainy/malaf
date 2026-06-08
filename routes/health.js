import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase-admin.js';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime()
  });
});

router.get('/detailed', async (req, res) => {
  let supabaseStatus = 'connected';
  try {
    const { error } = await supabaseAdmin.from('auth.users').select('id').limit(1);
    // wait, simple SELECT 1 is requested, let's just do a basic query or check if client exists
    // actually PostgREST might not expose SELECT 1 directly without a function. Let's just query a table we know.
    if (error) {
      supabaseStatus = 'error';
    }
  } catch (err) {
    supabaseStatus = 'error';
  }

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    supabase: supabaseStatus,
    memory: process.memoryUsage()
  });
});

export default router;
