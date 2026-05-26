import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Lock, Eye, RefreshCw, Trash2, Mail } from "lucide-react";

export default function Privacy() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto p-6 max-w-4xl space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-navy-900 dark:text-white">سياسة الخصوصية لمنصة مَلَف (Malaf)</h1>
        <p className="text-slate-500">تاريخ التحديث: 26 مايو 2026</p>
      </div>

      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardContent className="p-8 prose dark:prose-invert max-w-none">
          <p className="text-lg leading-relaxed">
            تلتزم منصة "مَلَف" (malaf.pro) بحماية بياناتكم الشخصية وفقاً للقانون المصري رقم 151 لسنة 2020 بشأن حماية البيانات الشخصية.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-primary-600 font-bold">
                <ShieldCheck size={20} />
                1. البيانات التي نجمعها
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>بيانات الهوية (الاسم، الرقم القومي، الهاتف، البريد الإلكتروني).</li>
                <li>بيانات القضايا والتوكيلات والوثائق القانونية.</li>
                <li>البيانات المالية والضريبية المتعلقة بالفوترة.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-primary-600 font-bold">
                <Lock size={20} />
                2. الأطراف الثالثة (المعالجون الثانويون)
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Supabase: استضافة قواعد البيانات والملفات والمصادقة.</li>
                <li>Render.com: استضافة خوادم التطبيق.</li>
                <li>Hostinger: إدارة النطاق التقني.</li>
                <li>Google Gemini AI: معالجة النصوص وتوليد المسودات.</li>
                <li>Paymob: معالجة المدفوعات الإلكترونية وفق لوائح البنك المركزي.</li>
                <li>WhatsApp Business API: إرسال التنبيهات والإشعارات.</li>
                <li>Daily.co: مكالمات الفيديو والاستشارات عن بعد.</li>
              </ul>
            </div>
          </div>

          <h3 className="mt-8 text-primary-600 font-bold flex items-center gap-2">
            <Eye size={20} />
            3. حقوقكم القانونية
          </h3>
          <p className="text-sm">بموجب القانون 151/2020، يحق لكم:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {[
              { icon: ShieldCheck, label: "حق الوصول" },
              { icon: RefreshCw, label: "حق التصحيح" },
              { icon: Trash2, label: "حق الحذف" },
              { icon: Mail, label: "حق النقل" },
              { icon: Lock, label: "حق الاعتراض" },
            ].map((item, i) => (
              <div key={i} className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg flex flex-col items-center gap-2 text-center">
                <item.icon size={16} className="text-primary-500" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          <h3 className="mt-8 text-primary-600 font-bold">4. أمن البيانات ومدة الاحتفاظ</h3>
          <p className="text-sm leading-relaxed">
            نستخدم تقنيات التشفير (AES-256) لحماية البيانات الحساسة. نحتفظ بالبيانات طوال فترة اشتراككم، ولمدة 5 سنوات إضافية للالتزامات الضريبية والقانونية.
          </p>

          <div className="mt-12 p-6 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-900/20 text-center">
            <h4 className="font-bold text-primary-900 dark:text-primary-100">للتواصل مع مسؤول حماية البيانات (DPO)</h4>
            <p className="text-primary-600 font-mono mt-2">privacy@malaf.pro</p>
          </div>

          <hr className="my-12 border-slate-200 dark:border-slate-700" />

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-navy-900 dark:text-white">Privacy Policy for Malaf Platform</h1>
            <p className="text-slate-500">Last Updated: May 26, 2026</p>
          </div>

          <div className="mt-8 space-y-6">
            <p className="text-lg leading-relaxed">
              Malaf (malaf.pro) is committed to protecting your personal data in accordance with Egyptian Law No. 151 of 2020 (PDPL).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-primary-600 font-bold">1. Data Collection</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Identity data (Name, National ID, Phone, Email).</li>
                  <li>Case details, Power of Attorney, and legal documents.</li>
                  <li>Financial and tax data for invoicing.</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-primary-600 font-bold">2. Third-Party Processors</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Supabase: Database, file storage, and authentication.</li>
                  <li>Render.com: Application hosting.</li>
                  <li>Hostinger: Domain management.</li>
                  <li>Google Gemini AI: AI text processing (stateless).</li>
                  <li>Paymob: Payment processing.</li>
                  <li>WhatsApp Business API: Notifications.</li>
                  <li>Daily.co: Video consultations.</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-primary-600 font-bold">3. Your Rights</h3>
              <p className="text-sm">Under Law 151/2020, you have the right to:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Right to Access:</strong> Obtain a copy of your data.</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate data.</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your data.</li>
                <li><strong>Right to Portability:</strong> Export data in a readable format.</li>
                <li><strong>Right to Object:</strong> Object to processing for marketing purposes.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-primary-600 font-bold">4. Data Security & Retention</h3>
              <p className="text-sm leading-relaxed">
                We use AES-256 encryption for sensitive fields. Data is retained for the duration of your subscription plus 5 years for legal and tax compliance.
              </p>
            </div>

            <div className="mt-8 p-6 bg-slate-50 dark:bg-white/5 rounded-xl text-center">
              <h4 className="font-bold">Contact Us</h4>
              <p className="text-sm mt-2 text-slate-500">To exercise your rights, contact our Data Protection Officer (DPO) at:</p>
              <p className="text-primary-600 font-mono mt-1">privacy@malaf.pro</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
