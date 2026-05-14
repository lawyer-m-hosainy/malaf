import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, Eye, Lock, Server, Trash2, FileText, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  const navigate = useNavigate();
  const lastUpdated = "15 مايو 2026";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white font-sans" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 py-16">
        <div className="container mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ShieldCheck className="w-12 h-12 text-white/80 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3">سياسة الخصوصية</h1>
            <p className="text-emerald-100 text-sm">آخر تحديث: {lastUpdated}</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-navy-800 rounded-3xl shadow-xl border border-slate-100 dark:border-white/5 p-8 md:p-12 space-y-10 leading-relaxed text-slate-700 dark:text-slate-300"
        >
          {/* مقدمة */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-emerald-500" /> أولاً: مقدمة
            </h2>
            <div className="space-y-3 text-sm">
              <p>تلتزم شركة ملف لتقنية المعلومات ("نحن" أو "المنصة") بحماية خصوصية مستخدميها. توضح هذه السياسة كيفية جمع واستخدام وحماية وتخزين البيانات الشخصية عند استخدامك لمنصة مَلَف.</p>
              <p>تُطبَّق هذه السياسة وفقاً لأحكام الدستور المصري (المادة 57 — حماية الحياة الخاصة) وقانون مكافحة جرائم تقنية المعلومات رقم 175 لسنة 2018 ولائحته التنفيذية.</p>
            </div>
          </section>

          {/* البيانات التي نجمعها */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-emerald-500" /> ثانياً: البيانات التي نجمعها
            </h2>
            <div className="space-y-3 text-sm">
              <p><strong>2.1 بيانات التسجيل:</strong></p>
              <ul className="list-disc list-inside space-y-1 pr-4">
                <li>الاسم الكامل للمسؤول عن الحساب.</li>
                <li>البريد الإلكتروني ورقم الهاتف.</li>
                <li>اسم المكتب أو الكيان القانوني.</li>
                <li>كلمة المرور (مُشفّرة — لا نخزنها بصورتها الأصلية).</li>
              </ul>
              <p><strong>2.2 بيانات التشغيل:</strong></p>
              <ul className="list-disc list-inside space-y-1 pr-4">
                <li>بيانات القضايا والموكلين والجلسات المُدخلة من المستخدم.</li>
                <li>الفواتير والمعاملات المالية.</li>
                <li>المستندات والملفات المرفوعة.</li>
                <li>سجلات المراسلات عبر واتساب بوت (إن تم تفعيله).</li>
              </ul>
              <p><strong>2.3 بيانات الاستخدام (تلقائية):</strong></p>
              <ul className="list-disc list-inside space-y-1 pr-4">
                <li>عنوان IP وبيانات المتصفح (User Agent).</li>
                <li>سجلات الدخول والخروج والأنشطة داخل المنصة.</li>
                <li>بيانات الأداء والأخطاء التقنية (لأغراض التحسين فقط).</li>
              </ul>
              <p><strong>2.4 بيانات لا نجمعها:</strong></p>
              <ul className="list-disc list-inside space-y-1 pr-4">
                <li>لا نجمع بيانات الموقع الجغرافي إلا عند تفعيل ميزة تسجيل الحضور الميداني (بموافقتك الصريحة).</li>
                <li>لا نجمع بيانات بطاقات الائتمان — تتم معالجة المدفوعات عبر بوابة Paymob المرخصة من البنك المركزي المصري.</li>
              </ul>
            </div>
          </section>

          {/* كيف نستخدم البيانات */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-emerald-500" /> ثالثاً: كيف نستخدم البيانات
            </h2>
            <div className="space-y-3 text-sm">
              <p>نستخدم بياناتك للأغراض التالية حصراً:</p>
              <ul className="list-disc list-inside space-y-2 pr-4">
                <li><strong>تقديم الخدمة:</strong> تشغيل المنصة وإدارة حسابك وتوفير الميزات المتاحة في باقتك.</li>
                <li><strong>التواصل:</strong> إرسال إشعارات الخدمة وتذكيرات الجلسات والفواتير المستحقة.</li>
                <li><strong>الأمان:</strong> حماية حسابك ومنع الوصول غير المصرح به.</li>
                <li><strong>التحسين:</strong> تحليل أنماط الاستخدام (بصورة مجمّعة ومُجهّلة) لتحسين أداء المنصة.</li>
                <li><strong>الالتزام القانوني:</strong> الامتثال للالتزامات القانونية والتنظيمية المفروضة علينا.</li>
              </ul>
              <p><strong>لا نستخدم بياناتك في:</strong></p>
              <ul className="list-disc list-inside space-y-1 pr-4">
                <li>بيعها أو تأجيرها لأطراف ثالثة.</li>
                <li>عرض إعلانات مستهدفة.</li>
                <li>تدريب نماذج ذكاء اصطناعي خارجية على بيانات قضاياك.</li>
              </ul>
            </div>
          </section>

          {/* التشفير والأمان */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-emerald-500" /> رابعاً: التشفير والأمان التقني
            </h2>
            <div className="space-y-3 text-sm">
              <p>نطبق أعلى معايير الأمان لحماية بياناتك:</p>
              <ul className="list-disc list-inside space-y-2 pr-4">
                <li><strong>تشفير البيانات:</strong> AES-256-GCM مع مفاتيح دوّارة (Key Rotation) لتشفير البيانات الحساسة.</li>
                <li><strong>تشفير الاتصال:</strong> HTTPS/TLS 1.3 لجميع الاتصالات بين المتصفح والخوادم.</li>
                <li><strong>عزل البيانات:</strong> فصل تام بين بيانات كل مكتب (Row Level Security) على مستوى قاعدة البيانات.</li>
                <li><strong>المصادقة:</strong> JWT مع تجديد تلقائي + دعم المصادقة الثنائية عبر Google.</li>
                <li><strong>الحماية من الهجمات:</strong> CSP Headers + Rate Limiting + CORS + HMAC Webhook Verification.</li>
                <li><strong>كلمات المرور:</strong> تُخزَّن مُشفّرة باستخدام bcrypt ولا يمكن قراءتها حتى من مسؤولي النظام.</li>
                <li><strong>النسخ الاحتياطي:</strong> نسخ احتياطي يومي تلقائي مع إمكانية الاسترجاع.</li>
              </ul>
            </div>
          </section>

          {/* مشاركة البيانات */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-emerald-500" /> خامساً: مشاركة البيانات مع أطراف ثالثة
            </h2>
            <div className="space-y-3 text-sm">
              <p>لا نشارك بياناتك الشخصية أو بيانات قضاياك مع أي طرف ثالث إلا في الحالات التالية:</p>
              <ul className="list-disc list-inside space-y-2 pr-4">
                <li><strong>مقدمو الخدمة:</strong> نتعامل مع مقدمي خدمة تقنية (استضافة، دفع إلكتروني) ملتزمين باتفاقيات سرية صارمة:
                  <ul className="list-none pr-6 mt-1 space-y-1">
                    <li>— Supabase (قاعدة البيانات والمصادقة)</li>
                    <li>— Render.com (الاستضافة)</li>
                    <li>— Paymob (المدفوعات — مرخصة من البنك المركزي المصري)</li>
                    <li>— Google AI / Groq (الذكاء الاصطناعي — يتلقى فقط نص الاستعلام بدون بيانات تعريفية)</li>
                  </ul>
                </li>
                <li><strong>الالتزام القانوني:</strong> بناءً على أمر قضائي صادر من محكمة مصرية مختصة.</li>
                <li><strong>حماية الحقوق:</strong> لمنع الاحتيال أو حماية سلامة المنصة ومستخدميها.</li>
              </ul>
            </div>
          </section>

          {/* الاحتفاظ بالبيانات */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <Server className="w-5 h-5 text-emerald-500" /> سادساً: الاحتفاظ بالبيانات
            </h2>
            <div className="space-y-3 text-sm">
              <p><strong>6.1</strong> نحتفظ ببياناتك طوال فترة اشتراكك النشط ولمدة 90 يوماً بعد إلغاء الاشتراك.</p>
              <p><strong>6.2</strong> بعد انتهاء فترة الاحتفاظ، يتم حذف البيانات نهائياً ولا يمكن استرجاعها.</p>
              <p><strong>6.3</strong> يحق لك طلب تصدير جميع بياناتك قبل حذفها خلال فترة الـ 90 يوماً.</p>
              <p><strong>6.4</strong> سجلات التدقيق (Audit Logs) تُحتفظ بها لمدة سنة واحدة لأغراض الأمان والمساءلة.</p>
            </div>
          </section>

          {/* حقوق المستخدم */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> سابعاً: حقوقك
            </h2>
            <div className="space-y-3 text-sm">
              <p>يحق لك في أي وقت:</p>
              <ul className="list-disc list-inside space-y-2 pr-4">
                <li><strong>حق الوصول:</strong> طلب نسخة كاملة من بياناتك الشخصية المُخزّنة لدينا.</li>
                <li><strong>حق التصحيح:</strong> تعديل أي بيانات غير صحيحة أو غير مكتملة.</li>
                <li><strong>حق الحذف:</strong> طلب حذف بياناتك نهائياً (مع مراعاة الالتزامات القانونية).</li>
                <li><strong>حق النقل:</strong> تصدير بياناتك بصيغة قابلة للقراءة.</li>
                <li><strong>حق الاعتراض:</strong> الاعتراض على أي معالجة لبياناتك تتجاوز نطاق تقديم الخدمة.</li>
              </ul>
              <p>لممارسة أي من هذه الحقوق، تواصل معنا عبر: <span className="font-bold text-navy-900 dark:text-white" dir="ltr">+20 114 197 3834</span></p>
            </div>
          </section>

          {/* حذف البيانات */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <Trash2 className="w-5 h-5 text-emerald-500" /> ثامناً: حذف الحساب والبيانات
            </h2>
            <div className="space-y-3 text-sm">
              <p><strong>8.1</strong> يمكنك طلب حذف حسابك وجميع بياناتك بشكل نهائي عبر التواصل مع فريق الدعم.</p>
              <p><strong>8.2</strong> سيتم تنفيذ طلب الحذف خلال 14 يوم عمل من تاريخ التأكيد.</p>
              <p><strong>8.3</strong> الحذف نهائي ولا يمكن التراجع عنه. ننصح بتصدير بياناتك قبل طلب الحذف.</p>
            </div>
          </section>

          {/* ملفات تعريف الارتباط */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-emerald-500" /> تاسعاً: ملفات تعريف الارتباط (Cookies)
            </h2>
            <div className="space-y-3 text-sm">
              <p>نستخدم ملفات تعريف الارتباط الضرورية فقط لتشغيل المنصة:</p>
              <ul className="list-disc list-inside space-y-1 pr-4">
                <li><strong>ملفات المصادقة:</strong> للحفاظ على جلسة تسجيل الدخول.</li>
                <li><strong>ملفات التفضيلات:</strong> لحفظ إعدادات المظهر (الوضع الداكن/الفاتح).</li>
              </ul>
              <p>لا نستخدم ملفات تعريف ارتباط إعلانية أو تتبعية من أطراف ثالثة.</p>
            </div>
          </section>

          {/* التعديلات */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-emerald-500" /> عاشراً: تعديل السياسة
            </h2>
            <div className="space-y-3 text-sm">
              <p>يحق لنا تعديل هذه السياسة في أي وقت. سيتم إخطار المشتركين بأي تعديلات جوهرية عبر البريد الإلكتروني قبل 15 يوماً من تاريخ سريانها.</p>
              <p>للاستفسار أو الشكاوى المتعلقة بالخصوصية: <span className="font-bold text-navy-900 dark:text-white" dir="ltr">+20 114 197 3834</span></p>
            </div>
          </section>

          <div className="pt-6 border-t border-slate-200 dark:border-white/10 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} شركة ملف لتقنية المعلومات. جميع الحقوق محفوظة.
          </div>
        </motion.div>

        <div className="text-center mt-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2 text-slate-500">
            <ArrowRight size={16} /> العودة للرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}
