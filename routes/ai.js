import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '../lib/supabase-admin.js';

const router = Router();

// Rate limiting map (in-memory for simple implementation, 10 reqs/min)
const rateLimits = new Map();

const checkRateLimit = (userId) => {
  const now = Date.now();
  const windowStart = now - 60000;
  
  if (!rateLimits.has(userId)) {
    rateLimits.set(userId, []);
  }
  
  let timestamps = rateLimits.get(userId);
  timestamps = timestamps.filter(t => t > windowStart);
  
  if (timestamps.length >= 10) {
    return false;
  }
  
  timestamps.push(now);
  rateLimits.set(userId, timestamps);
  return true;
};

router.post('/analyze-document', async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!checkRateLimit(userId)) {
      return res.status(429).json({ error: 'Rate limit exceeded (max 10 requests per minute)' });
    }

    const { text, type } = req.body;
    if (!text || !type) return res.status(400).json({ error: 'text and type are required' });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `Analyze this legal document of type ${type}. Extract the parties, dates, amounts, and provide a short summary. Return ONLY JSON in the format: { "parties": [], "dates": [], "amounts": [], "type": "...", "summary": "..." }\n\nDocument: ${text.substring(0, 30000)}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Attempt to parse JSON from the response
    let jsonResponse;
    try {
      // Find JSON array or object in the text
      const match = responseText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      jsonResponse = match ? JSON.parse(match[0]) : { summary: responseText };
    } catch (e) {
      jsonResponse = { summary: responseText };
    }

    res.json(jsonResponse);
  } catch (err) {
    next(err);
  }
});

router.post('/conflict-check', async (req, res, next) => {
  try {
    const { clientName, orgId } = req.body;
    if (!clientName || !orgId) return res.status(400).json({ error: 'clientName and orgId are required' });

    // Perform a basic search using Supabase Admin
    const { data: conflicts, error } = await supabaseAdmin
      .from('cases') // Assuming cases table holds client data
      .select('id, title, client_name')
      .eq('org_id', orgId)
      .ilike('client_name', `%${clientName}%`);

    if (error) {
      return res.status(500).json({ error: 'Database query failed' });
    }

    const hasConflict = conflicts && conflicts.length > 0;

    res.json({
      hasConflict,
      conflicts: conflicts || []
    });
  } catch (err) {
    next(err);
  }
});

export default router;
