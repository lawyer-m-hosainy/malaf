-- ═══════════════════════════════════════════════════════════════════ 
 -- مَلَف: إصلاحات نظام الدردشة والمكالمات 
 -- ═══════════════════════════════════════════════════════════════════ 
 
 -- 1. تحسين الهوية المتكررة (Replica Identity) لضمان وصول تحديثات Realtime كاملة 
 ALTER TABLE public.chat_messages REPLICA IDENTITY FULL; 
 
 -- 2. التأكد من أن جدول الرسائل مضاف لمنشور Realtime (في حال لم يتم ذلك مسبقاً) 
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
 
 -- 3. تحسين سياسات الوصول لملفات المستخدمين لضمان رؤية الأسماء في الدردشة 
 -- السماح للمستخدمين برؤية أسماء بعضهم البعض إذا كانوا في نفس المنظمة أو موكلين لديها 
 DROP POLICY IF EXISTS "Users view org members" ON public.profiles; 
 CREATE POLICY "Users view relevant profiles" ON public.profiles 
     FOR SELECT USING ( 
         organization_id = get_user_org_id() 
         OR 
         id = auth.uid() 
     ); 
 
 -- 4. إضافة عمود sender_name لجدول الرسائل لتسريع العرض وتقليل الاستعلامات (إختياري ولكن مفيد) 
 ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_name TEXT; 
 
 -- تحديث الأسماء الموجودة مسبقاً 
 UPDATE public.chat_messages cm 
 SET sender_name = p.full_name 
 FROM public.profiles p 
 WHERE cm.sender_id = p.id AND cm.sender_name IS NULL;
