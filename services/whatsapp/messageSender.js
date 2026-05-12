import { createClient } from '@supabase/supabase-js';
import pino from 'pino';

const logger = pino();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const sendWhatsAppMessage = async (phone, message, orgId) => {
    if (!supabaseServiceKey) return false;
    try {
        const sb = createClient(process.env.SUPABASE_URL, supabaseServiceKey);
        const { data: settings } = await sb
            .from('whatsapp_settings')
            .select('*')
            .eq('org_id', orgId)
            .eq('is_active', true)
            .single();
        if (!settings) return false;

        const apiToken = settings.api_token_encrypted;
        const provider = settings.provider || '360dialog';
        let apiUrl, headers, body;
        
        if (provider === '360dialog') {
            apiUrl = 'https://waba.360dialog.io/v1/messages';
            headers = { 'D360-API-KEY': apiToken, 'Content-Type': 'application/json' };
        } else {
            apiUrl = `https://graph.facebook.com/v18.0/${settings.wa_phone_number}/messages`;
            headers = { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' };
        }
        
        body = { messaging_product: 'whatsapp', to: phone.replace('+', ''), type: 'text', text: { body: message } };
        
        const resp = await fetch(apiUrl, { method: 'POST', headers, body: JSON.stringify(body) });
        return resp.ok;
    } catch (err) {
        logger.error({ err }, "Error sending WhatsApp message via messageSender");
        return false;
    }
};
