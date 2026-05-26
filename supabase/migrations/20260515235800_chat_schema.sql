-- Chat System Migration (Malaf) 
 -- Compatible with existing organizations + profiles + cases schema 
 
 -- ────────────────────────────────────────────── 
 -- 1. Tables 
 -- ────────────────────────────────────────────── 
 
 CREATE TABLE IF NOT EXISTS public.chat_rooms ( 
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
   tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL, 
   name TEXT NOT NULL, 
   type TEXT NOT NULL CHECK (type IN ('internal','client')), 
   case_id UUID REFERENCES cases(id) ON DELETE SET NULL, 
   created_by UUID REFERENCES profiles(id) ON DELETE SET NULL, 
   created_at TIMESTAMPTZ DEFAULT now() 
 ); 
 
 CREATE TABLE IF NOT EXISTS public.chat_messages ( 
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
   room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE, 
   sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL, 
   content TEXT NOT NULL DEFAULT '', 
   attachment_url TEXT, 
   attachment_type TEXT CHECK (attachment_type IN ('image','pdf','doc')), 
   is_system BOOLEAN DEFAULT false, 
   created_at TIMESTAMPTZ DEFAULT now() 
 ); 
 
 CREATE TABLE IF NOT EXISTS public.chat_members ( 
   room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE, 
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, 
   last_read_at TIMESTAMPTZ DEFAULT now(), 
   PRIMARY KEY (room_id, user_id) 
 ); 
 
 -- ────────────────────────────────────────────── 
 -- 2. Indexes 
 -- ────────────────────────────────────────────── 
 
 CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC); 
 CREATE INDEX IF NOT EXISTS idx_chat_rooms_tenant ON chat_rooms(tenant_id); 
 
 -- ────────────────────────────────────────────── 
 -- 3. Row Level Security 
 -- ────────────────────────────────────────────── 
 
 ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY; 
 ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY; 
 ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY; 
 
 -- chat_rooms: tenant members can SELECT and INSERT 
 CREATE POLICY "Tenant reads own rooms" ON public.chat_rooms 
   FOR SELECT USING (tenant_id = get_user_org_id()); 
 
 CREATE POLICY "Tenant creates rooms" ON public.chat_rooms 
   FOR INSERT WITH CHECK (tenant_id = get_user_org_id()); 
 
 -- chat_messages: tenant members can SELECT and INSERT 
 CREATE POLICY "Tenant reads messages" ON public.chat_messages 
   FOR SELECT USING (EXISTS ( 
     SELECT 1 FROM public.chat_rooms 
     WHERE chat_rooms.id = chat_messages.room_id 
     AND chat_rooms.tenant_id = get_user_org_id() 
   )); 
 
 CREATE POLICY "Tenant sends messages" ON public.chat_messages 
   FOR INSERT WITH CHECK (EXISTS ( 
     SELECT 1 FROM public.chat_rooms 
     WHERE chat_rooms.id = chat_messages.room_id 
     AND chat_rooms.tenant_id = get_user_org_id() 
   )); 
 
 -- chat_members: tenant members can SELECT and manage 
 CREATE POLICY "Tenant reads members" ON public.chat_members 
   FOR SELECT USING (EXISTS ( 
     SELECT 1 FROM public.chat_rooms 
     WHERE chat_rooms.id = chat_members.room_id 
     AND chat_rooms.tenant_id = get_user_org_id() 
   )); 
 
 CREATE POLICY "Tenant manages members" ON public.chat_members 
   FOR ALL USING (EXISTS ( 
     SELECT 1 FROM public.chat_rooms 
     WHERE chat_rooms.id = chat_members.room_id 
     AND chat_rooms.tenant_id = get_user_org_id() 
   )); 
 
 -- ────────────────────────────────────────────── 
 -- 4. Trigger: auto system message on case status change 
 -- ────────────────────────────────────────────── 
 
 CREATE OR REPLACE FUNCTION notify_case_status_change() RETURNS TRIGGER AS $$ 
 BEGIN 
   IF NEW.status IS DISTINCT FROM OLD.status THEN 
     INSERT INTO public.chat_messages (room_id, is_system, content) 
     SELECT cr.id, true, 
       '🔔 تحديث قضية: ' || COALESCE(NEW.type, '') || ' — الحالة الجديدة: ' || NEW.status 
     FROM public.chat_rooms cr 
     WHERE cr.case_id = NEW.id AND cr.type = 'client'; 
   END IF; 
   RETURN NEW; 
 END; 
 $$ LANGUAGE plpgsql SECURITY DEFINER; 
 
 DO $$ 
 BEGIN 
   IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_case_status_change_chat') THEN 
     CREATE TRIGGER on_case_status_change_chat 
     AFTER UPDATE ON cases 
     FOR EACH ROW EXECUTE FUNCTION notify_case_status_change(); 
   END IF; 
 END 
 $$; 
 
 -- ────────────────────────────────────────────── 
 -- 5. Enable Realtime for chat_messages 
 -- ────────────────────────────────────────────── 
 
 DO $$
 BEGIN
     IF NOT EXISTS (
         SELECT 1 FROM pg_publication_tables 
         WHERE pubname = 'supabase_realtime' 
         AND schemaname = 'public' 
         AND tablename = 'chat_messages'
     ) THEN
         ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
     END IF;
 END $$;
 
 -- ────────────────────────────────────────────── 
 -- MANUAL STEPS (run in Supabase Dashboard): 
 -- ────────────────────────────────────────────── 
 -- 1. Go to Storage → Create bucket "chat-attachments" 
 --    - Set to PUBLIC bucket (so getPublicUrl works) 
 --    - Or add a policy: authenticated users can INSERT/SELECT 
 -- 2. The publication command above enables Realtime 
 --    for chat_messages. Verify in Database → Replication.
