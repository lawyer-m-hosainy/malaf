-- ═══════════════════════════════════════════════════════════════════════
-- Fix 001: Prevent Role Self-Escalation — منع تصعيد الصلاحيات الذاتي
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. دالة الحماية من تصعيد الصلاحيات
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation() 
RETURNS TRIGGER AS $$ 
DECLARE 
  _current_user_role TEXT;
  _current_user_org_id UUID;
BEGIN 
  -- إذا لم يتغير الدور، اسمح بالعملية فوراً
  IF NEW.role = OLD.role THEN
    RETURN NEW;
  END IF;

  -- الحصول على بيانات المستخدم الحالي من الـ JWT
  -- نستخدم app_metadata لأنها المصدر الأكثر أماناً والمحدث عبر Triggers
  _current_user_role := (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role');
  _current_user_org_id := (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'org_id')::UUID;

  -- 1) السوبر أدمن مسموح له بكل شيء
  IF _current_user_role = 'super_admin' THEN
    RETURN NEW;
  END IF;

  -- 2) مدير المكتب (org_admin) مسموح له بتعديل الأدوار داخل مكتبه فقط
  IF _current_user_role = 'org_admin' THEN
    IF OLD.organization_id = _current_user_org_id THEN
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'غير مسموح لك بتعديل مستخدمين خارج مكتبك';
    END IF;
  END IF;

  -- 3) أي دور آخر (محامي، مساعد، موكل) يحاول تغيير دوره
  RAISE EXCEPTION 'ليس لديك صلاحية لتغيير الأدوار. فقط مدير المكتب أو السوبر أدمن يمكنهم ذلك.';

  RETURN NEW; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- 2. ربط الـ Trigger بجدول profiles
DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_escalation();

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- 🧪 قسم الاختبار (SQL Testing)
-- ═══════════════════════════════════════════════════════════════════════
/*
-- 1. محاكاة محامي يحاول ترقية نفسه (يجب أن يفشل)
-- SET request.jwt.claims = '{"sub": "lawyer_uuid", "app_metadata": {"role": "lawyer", "org_id": "org_uuid"}}';
-- UPDATE profiles SET role = 'org_admin' WHERE id = 'lawyer_uuid';

-- 2. محاكاة مدير مكتب يغير دور موظف عنده (يجب أن ينجح)
-- SET request.jwt.claims = '{"sub": "admin_uuid", "app_metadata": {"role": "org_admin", "org_id": "org_uuid"}}';
-- UPDATE profiles SET role = 'senior_lawyer' WHERE id = 'lawyer_uuid';

-- 3. محاكاة مدير مكتب يغير دور موظف في مكتب آخر (يجب أن يفشل)
-- SET request.jwt.claims = '{"sub": "admin_uuid", "app_metadata": {"role": "org_admin", "org_id": "org_A_uuid"}}';
-- UPDATE profiles SET role = 'org_admin' WHERE id = 'user_from_org_B_uuid';
*/

-- ═══════════════════════════════════════════════════════════════════════
-- ⬅️ قسم التراجع (ROLLBACK)
-- ═══════════════════════════════════════════════════════════════════════
/*
BEGIN;
  DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
  DROP FUNCTION IF EXISTS public.prevent_role_self_escalation();
COMMIT;
*/
