-- أضف هذه الأعمدة لجدول القضايا إن لم تكن موجودة
ALTER TABLE cases ADD COLUMN IF NOT EXISTS court_category TEXT;   -- نوع القضية
ALTER TABLE cases ADD COLUMN IF NOT EXISTS court_sub_type TEXT;   -- التصنيف
ALTER TABLE cases ADD COLUMN IF NOT EXISTS court_location TEXT;   -- المحكمة/المكان
