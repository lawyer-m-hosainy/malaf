-- Chat System Migration
-- Create tables for internal and external chat

CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  type TEXT CHECK (type IN ('internal','client')),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  attachment_url TEXT NULL,
  attachment_type TEXT CHECK (attachment_type IN ('image','pdf','doc')) NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_members (
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

-- RLS Policies
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for tenant users" ON public.chat_rooms
  FOR SELECT USING (tenant_id = get_user_org_id());

CREATE POLICY "Enable insert for tenant users" ON public.chat_rooms
  FOR INSERT WITH CHECK (tenant_id = get_user_org_id());

CREATE POLICY "Enable read messages for room members" ON public.chat_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.chat_members 
    WHERE chat_members.room_id = chat_messages.room_id 
    AND chat_members.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE chat_rooms.id = chat_messages.room_id
    AND chat_rooms.tenant_id = get_user_org_id()
  ));

CREATE POLICY "Enable insert messages" ON public.chat_messages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE chat_rooms.id = chat_messages.room_id
    AND chat_rooms.tenant_id = get_user_org_id()
  ));

CREATE POLICY "Enable read members" ON public.chat_members
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE chat_rooms.id = chat_members.room_id
    AND chat_rooms.tenant_id = get_user_org_id()
  ));

CREATE POLICY "Enable insert members" ON public.chat_members
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE chat_rooms.id = chat_members.room_id
    AND chat_rooms.tenant_id = get_user_org_id()
  ));

-- Trigger for System Messages on Case Changes
CREATE OR REPLACE FUNCTION notify_case_status_change() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO public.chat_messages (room_id, is_system, content)
    SELECT id, true, '🔔 تحديث قضية: ' || NEW.type || ' — أصبحت الحالة: ' || NEW.status
    FROM public.chat_rooms 
    WHERE case_id = NEW.id AND type = 'client';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on case status changes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_case_status_change') THEN
    CREATE TRIGGER on_case_status_change 
    AFTER UPDATE ON cases 
    FOR EACH ROW EXECUTE FUNCTION notify_case_status_change();
  END IF;
END
$$;
