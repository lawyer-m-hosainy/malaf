/* eslint-disable max-lines, max-lines-per-function */
import React from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Scale, ShieldCheck, Clock, Users, ArrowLeft, MessageCircle, 
  CheckCircle2, Star, Phone, Mail, MapPin, Briefcase, Building2, Gavel, FileText, TrendingUp,
  Brain, Receipt, CalendarDays, Hammer, FileSignature, BarChart3, Bot, Globe, ListChecks, Banknote, Shield, Sparkles, Workflow, BookOpen
} from "lucide-react";
import { toast } from "sonner";

/**
 * صفحة الهبوط الرئيسية لمنصة ملف (Landing Page).
 * @returns {React.ReactElement} عنصر واجهة مستخدم صفحة الهبوط
 */
export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white font-sans selection:bg-primary-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 transition-all">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Scale className="text-white w-6 h-6 md:w-7 md:h-7" />
            </div>
            <span className="text-xl md:text-2xl font-black tracking-tighter text-navy-900 dark:text-white leading-none">مَلَف</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-800 dark:text-slate-200">
            <a href="#services" className="hover:text-primary-600 transition-colors">الميزات</a>
            <a href="#pricing" className="hover:text-primary-600 transition-colors">الباقات</a>
            <a href="#about" className="hover:text-primary-600 transition-colors">من نحن</a>
            <a href="#tech" className="hover:text-primary-600 transition-colors">بوابة الموكلين</a>
            <a href="#contact" className="hover:text-primary-600 transition-colors">تواصل معنا</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="hidden md:flex font-medium" onClick={() => navigate('/login')}>
              تسجيل الدخول
            </Button>
            <Button className="bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20 rounded-full px-6" aria-label="ابدأ مجاناً — سجّل حساب جديد" onClick={() => navigate('/login')}>
              ابدأ مجاناً
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 dark:opacity-[0.02]"></div>
        <div className="absolute top-0 right-0 -me-40 -mt-40 w-96 h-96 rounded-full bg-primary-500/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ms-40 -mb-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-4xl mx-auto space-y-6 md:space-y-8"
          >
            <div className="flex justify-center mb-6 md:mb-10">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-primary-600 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-500/30 hover:scale-105 transition-transform duration-500">
                <Scale className="text-white w-14 h-14 md:w-20 md:h-20" />
              </div>
            </div>
            
            <Badge className="bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border border-primary-100 dark:border-primary-800/30 px-4 py-1.5 text-xs md:text-sm font-medium">
              أول نظام إدارة متكامل لمكاتب المحاماة في مصر
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tight text-navy-900 dark:text-white">
              حوّل مكتبك إلى <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-emerald-600 to-blue-600 animate-gradient">
                مكتب ذكي
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-800 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
              ملف يجمع إدارة القضايا، الموكلين، الجلسات، العقود، والفواتير في منصة واحدة مصممة خصيصاً للمحامي المصري.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button size="lg" className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white h-14 px-8 text-lg rounded-full shadow-xl shadow-primary-500/20 transition-transform hover:scale-105" aria-label="ابدأ تجربتك المجانية لمدة أسبوع — سجّل حساب جديد" onClick={() => navigate('/login')}>
                ابدأ تجربتك المجانية لمدة أسبوع
                <ArrowLeft className="ms-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full border-slate-200 dark:border-white/10 bg-white/50 dark:bg-navy-800/50 backdrop-blur-sm hover:bg-slate-100 dark:hover:bg-white/5" onClick={() => window.location.href='#services'}>
                شاهد العرض التوضيحي
              </Button>
            </div>
            
            <div className="pt-12 flex items-center justify-center gap-8 text-sm font-medium text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> خوادم سحابية آمنة</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> تشفير بيانات بنكي</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> نسخ احتياطي يومي</div>
            </div>

            <div className="pt-16 flex flex-col items-center justify-center w-full">
              <a 
                href="https://app.heygen.com/videos/f2fd5c4f361a4036b3ce158cdb6291d3"
                target="_blank" 
                rel="noopener noreferrer"
                className="relative block w-full max-w-[600px] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl shadow-primary-500/20 border-4 md:border-[6px] border-white dark:border-navy-800 bg-gradient-to-br from-navy-900 to-slate-900 aspect-[4/3] md:aspect-video min-h-[200px] hover:scale-[1.02] hover:shadow-primary-500/40 transition-all duration-300 group"
              >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                <div className="absolute -top-10 -right-10 w-32 md:w-40 h-32 md:h-40 bg-primary-500 rounded-full mix-blend-screen filter blur-2xl md:blur-3xl opacity-50"></div>
                <div className="absolute -bottom-10 -left-10 w-32 md:w-40 h-32 md:h-40 bg-emerald-500 rounded-full mix-blend-screen filter blur-2xl md:blur-3xl opacity-50"></div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-6 text-center z-10">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 md:mb-6 group-hover:bg-primary-600 transition-all duration-500 border border-white/20 shadow-xl group-hover:scale-110 group-hover:border-primary-500">
                    <div className="w-0 h-0 border-y-[10px] md:border-y-[12px] border-y-transparent border-l-[14px] md:border-l-[18px] border-l-white ml-2"></div>
                  </div>
                  
                  <span className="bg-primary-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] md:text-xs font-bold mb-2 shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                    العرض التوضيحي السريع
                  </span>
                  
                  <h2 className="text-xl md:text-3xl font-black text-white mb-2 md:mb-3 px-2 drop-shadow-md">
                    مقدمة منصة مَلَف القانونية
                  </h2>
                  
                  <p className="text-primary-100/90 text-sm md:text-base font-medium max-w-sm px-4 drop-shadow-sm">
                    انقر لمشاهدة العرض التوضيحي السريع وتعرّف على ميزات النظام الأساسية
                  </p>
                </div>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="about" className="border-y border-slate-200 dark:border-white/5 bg-white dark:bg-navy-800/50">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "توفير في وقت الإدارة", value: "60%" },
              { label: "نموذج قانوني جاهز", value: "+150" },
              { label: "تشفير وحماية للبيانات", value: "100%" },
              { label: "دعم فني متواصل", value: "24/7" }
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-navy-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === COMPREHENSIVE FEATURES SECTION === */}
      <section id="services" className="py-24 bg-slate-50 dark:bg-navy-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <Badge className="bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border-none px-4 py-1.5 text-sm mb-4">+20 وحدة متكاملة</Badge>
            <h2 className="text-3xl md:text-5xl font-black mb-4">كل ما يحتاجه مكتبك في منصة واحدة</h2>
            <p className="text-slate-800 dark:text-slate-300 text-lg">استبدل عشرات التطبيقات وملفات الإكسل بنظام ذكي مصمم خصيصاً للمحامي المصري.</p>
          </div>

          {/* Category 1: Core Legal */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8"><div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"><Gavel className="w-5 h-5 text-primary-600" /></div><h3 className="text-xl font-bold">إدارة القضايا والتقاضي</h3></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Gavel, title: "الملف الرقمي الموحد", desc: "تنظيم شامل لكل قضية: الخصوم، المحكمة، الدائرة، ونوع الدعوى مع أرشفة كاملة للقرارات." },
                { icon: CalendarDays, title: "الأجندة والتقويم", desc: "متابعة ذكية لتواريخ الجلسات والمواعيد القانونية والطعون مع تنبيهات استباقية." },
                { icon: Users, title: "دليل الموكلين", desc: "قاعدة بيانات مركزية للموكلين تشمل بيانات التواصل، التوكيلات، وتاريخ التعاملات القانونية." },
                { icon: Hammer, title: "متابعة التنفيذ", desc: "إدارة متكاملة لإجراءات التنفيذ القضائي، بدءاً من استلام الصيغة حتى تحصيل المستحقات." },
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="p-5 rounded-2xl bg-white dark:bg-navy-800 border border-slate-100 dark:border-white/5 hover:shadow-lg hover:shadow-primary-500/5 hover:border-primary-200 dark:hover:border-primary-800/30 transition-all group">
                  <div className="w-11 h-11 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors"><f.icon className="w-5 h-5" /></div>
                  <h4 className="font-bold mb-2 text-navy-900 dark:text-white">{f.title}</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Category 2: Finance */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8"><div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><Banknote className="w-5 h-5 text-emerald-600" /></div><h3 className="text-xl font-bold">المالية والتحصيل والضرائب</h3></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Receipt, title: "الفاتورة الإلكترونية", desc: "إصدار فواتير ضريبية (14%) متوافقة تماماً مع متطلبات مصلحة الضرائب المصرية (ETA)." },
                { icon: ShieldCheck, title: "حسابات الأمانات", desc: "نظام محاسبي دقيق لفصل أموال الموكلين عن أتعاب المكتب لضمان أعلى معايير النزاهة." },
                { icon: Banknote, title: "تتبع الرسوم والدمغات", desc: "تسجيل كافة الرسوم القضائية والدمغات وربطها آلياً بملف القضية لسهولة المحاسبة." },
                { icon: BarChart3, title: "تقارير الربحية", desc: "تحليل مالي دقيق لمداخيل المكتب ومصروفاته مع حساب صافي الأرباح لكل فترة زمنية." },
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="p-5 rounded-2xl bg-white dark:bg-navy-800 border border-slate-100 dark:border-white/5 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800/30 transition-all group">
                  <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><f.icon className="w-5 h-5" /></div>
                  <h4 className="font-bold mb-2 text-navy-900 dark:text-white">{f.title}</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Category 3: Documents & Contracts */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8"><div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center"><FileSignature className="w-5 h-5 text-violet-600" /></div><h3 className="text-xl font-bold">المستندات والعقود الذكية</h3></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: FileSignature, title: "منشئ العقود الآلي", desc: "توليد مسودات عقود احترافية (إيجار، عمل، شركات) متوافقة مع القانون المصري في ثوانٍ." },
                { icon: Shield, title: "أرشفة مشفرة آمنة", desc: "تخزين كافة الوثائق والمستندات القانونية بتشفير AES-256 لضمان سرية بيانات موكليك." },
                { icon: BookOpen, title: "+150 نموذج معيارى", desc: "مكتبة ضخمة من النماذج القانونية الجاهزة للصياغة، تشمل الإنذارات والمذكرات القانونية." },
                { icon: FileText, title: "إدارة الوثائق CLM", desc: "تتبع دورة حياة الوثيقة من المسودة إلى التوقيع مع سجل كامل للتعديلات والإصدارات." },
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="p-5 rounded-2xl bg-white dark:bg-navy-800 border border-slate-100 dark:border-white/5 hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800/30 transition-all group">
                  <div className="w-11 h-11 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-violet-600 group-hover:text-white transition-colors"><f.icon className="w-5 h-5" /></div>
                  <h4 className="font-bold mb-2 text-navy-900 dark:text-white">{f.title}</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Category 4: Smart & Team */}
          <div>
            <div className="flex items-center gap-3 mb-8"><div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"><Sparkles className="w-5 h-5 text-amber-600" /></div><h3 className="text-xl font-bold">الذكاء الاصطناعي والتحكم</h3></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Brain, title: "المساعد القانوني AI", desc: "تحليل مذكرات الخصوم، استخراج الثغرات القانونية، وتلخيص الوثائق الطويلة بذكاء فائق." },
                { icon: Bot, title: "أتمتة التواصل", desc: "بوت واتساب وماسنجر للرد على استفسارات الموكلين وتحديد المواعيد آلياً على مدار الساعة." },
                { icon: ListChecks, title: "إدارة فريق العمل", desc: "توزيع المهام بين المحامين المساعدين ومتابعة نسب الإنجاز وسجل النشاط اليومي للمكتب." },
                { icon: Globe, title: "بوابة الموكلين", desc: "مساحة خاصة للموكل لمتابعة قضاياه وتحميل مستنداته، مما يقلل الاتصالات الهاتفية بنسبة 70%." },
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="p-5 rounded-2xl bg-white dark:bg-navy-800 border border-slate-100 dark:border-white/5 hover:shadow-lg hover:border-amber-200 dark:hover:border-amber-800/30 transition-all group">
                  <div className="w-11 h-11 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors"><f.icon className="w-5 h-5" /></div>
                  <h4 className="font-bold mb-2 text-navy-900 dark:text-white">{f.title}</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className="py-20 bg-white dark:bg-navy-800 border-y border-slate-100 dark:border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">ابدأ في 3 خطوات بسيطة</h2>
            <p className="text-slate-700 dark:text-slate-300">من التسجيل للإنتاجية الكاملة في أقل من 10 دقائق.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { num: "1", title: "سجّل مكتبك", desc: "أنشئ حسابك بالبريد أو Google في ثوانٍ — بدون بطاقة ائتمان.", gradient: "from-primary-500 to-emerald-500" },
              { num: "2", title: "أضف بياناتك", desc: "أدخل موكليك وقضاياك يدوياً أو استوردهم بملف CSV دفعة واحدة.", gradient: "from-emerald-500 to-blue-500" },
              { num: "3", title: "أدِر مكتبك بذكاء", desc: "تابع جلساتك، أصدر فواتيرك، ووزّع مهامك — كل شيء في مكان واحد.", gradient: "from-blue-500 to-violet-500" },
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} text-white text-2xl font-black flex items-center justify-center mx-auto mb-5 shadow-lg`}>{step.num}</div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-24 bg-white dark:bg-navy-800 border-t border-slate-100 dark:border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">لمن صُمِّمت ملف؟</h2>
            <p className="text-slate-800 dark:text-slate-300 text-lg">منصة مرنة تتكيف مع حجم عملك وطبيعة مكتبك.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: "مكاتب المحاماة الفردية", desc: "إدارة كل شيء لوحدك بدون فريق إداري. وفر وقتك للعمل القانوني الحقيقي بدلاً من الأعمال الإدارية." },
              { icon: Briefcase, title: "شركات المحاماة المتوسطة", desc: "تنسيق فرق العمل، توزيع المهام، ومتابعة الأداء اليومي لكل محامٍ في فريقك." },
              { icon: Building2, title: "الشركات القانونية الكبرى", desc: "حوكمة متكاملة، تقارير تنفيذية دقيقة، وإدارة صلاحيات معقدة للفروع المتعددة." }
            ].map((audience, i) => (
              <div key={i} className="p-8 rounded-3xl bg-slate-50 dark:bg-navy-900 border border-slate-100 dark:border-white/5 text-center hover:border-primary-200 transition-colors">
                <div className="w-16 h-16 bg-white dark:bg-navy-800 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <audience.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-4">{audience.title}</h3>
                <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
                  {audience.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech/Portal Section */}
      <section id="tech" className="py-24 bg-slate-50 dark:bg-navy-900 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-8">
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none px-4 py-1.5 text-sm">
                ميزة تنافسية لمكتبك
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                بوابة موكلين متطورة <br /> تبقي عملاءك على اطلاع دائم
              </h2>
              <p className="text-lg text-slate-800 dark:text-slate-300 leading-relaxed">
                ارفع مستوى الشفافية والرضا لدى موكليك. من خلال بوابة الموكلين الخاصة بك، يمكن لعملائك متابعة سير قضاياهم، الاطلاع على الجلسات، وتحميل المستندات دون الحاجة لإزعاجك بالاتصالات المتكررة.
              </p>
              <ul className="space-y-4">
                {[
                  "تقليل اتصالات الاستفسار بنسبة 70%",
                  "أرشفة إلكترونية آمنة لمستندات الموكل",
                  "واجهة احترافية تحمل شعار مكتبك",
                  "شفافية تامة تعزز ثقة العميل"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                    <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white rounded-full px-8 shadow-lg shadow-primary-500/20" onClick={() => navigate('/client-portal')}>
                تعرف على بوابة الموكلين
              </Button>
            </div>
            <div className="lg:w-1/2 relative">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10"
              >
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary-500/20 to-emerald-500/20 rounded-[2rem] blur-2xl"></div>
                <div className="relative bg-white dark:bg-navy-800 border border-slate-200 dark:border-white/10 rounded-[2rem] p-2 shadow-2xl overflow-hidden group">
                  <div className="absolute inset-0 bg-primary-600/10 opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-[1.5rem]"></div>
                  <img src="/client-portal-mockup.webp" alt="واجهة بوابة الموكلين لمنصة مَلَف" className="w-full h-auto rounded-[1.5rem] aspect-[3/2] object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  {/* Floating badge */}
                  <div className="absolute top-8 -start-6 bg-white dark:bg-navy-900 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-white/5 flex items-center gap-3 animate-bounce-slow">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-700 dark:text-slate-300 font-bold uppercase">معدل الإنجاز</div>
                      <div className="text-lg font-black text-navy-900 dark:text-white">98.5%</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Demonstration Section */}
      <section className="py-20 bg-white dark:bg-navy-800 border-y border-slate-100 dark:border-white/5">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-6 mb-12">
            <Badge className="bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border border-primary-100 dark:border-primary-800/30 px-4 py-1.5 text-xs md:text-sm font-medium">
              شاهد العرض التفصيلي للميزات الذكية
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 dark:text-white">
              كيف تقوم منصة مَلَف بتطوير مكتبك؟
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              تعرّف على أهم ميزات المنصة وكيف تساهم في تنظيم وإدارة القضايا والتوكيلات بكفاءة عالية.
            </p>
          </div>

          <div className="w-full flex justify-center">
            <a 
              href="https://app.heygen.com/videos/8dc83a38ae484418bbac75fd38674fe1"
              target="_blank" 
              rel="noopener noreferrer"
              className="relative block w-full max-w-[600px] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl shadow-primary-500/20 border-4 md:border-[6px] border-white dark:border-navy-800 bg-gradient-to-br from-navy-900 to-slate-900 aspect-[4/3] md:aspect-video min-h-[200px] hover:scale-[1.02] hover:shadow-primary-500/40 transition-all duration-300 group"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 bg-[url('https://resource2.heygen.ai/video/8dc83a38ae484418bbac75fd38674fe1/v18ef80c3651f410e90adfb5ba50ad885/gif.gif')]"
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/60 to-transparent"></div>
              <div className="absolute inset-0 bg-navy-950/20 backdrop-blur-[1px]"></div>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-6 text-center z-10">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 md:mb-6 group-hover:bg-primary-600 transition-all duration-500 border border-white/20 shadow-xl group-hover:scale-110 group-hover:border-primary-500">
                  <div className="w-0 h-0 border-y-[10px] md:border-y-[12px] border-y-transparent border-l-[14px] md:border-l-[18px] border-l-white ml-2"></div>
                </div>
                
                <span className="bg-primary-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] md:text-xs font-bold mb-2 shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                  العرض الشامل للميزات
                </span>
                
                <h2 className="text-xl md:text-3xl font-black text-white mb-2 md:mb-3 px-2 drop-shadow-md">
                  دليل إدارة المكاتب والذكاء الاصطناعي
                </h2>
                
                <p className="text-primary-100/90 text-sm md:text-base font-medium max-w-sm px-4 drop-shadow-sm">
                  انقر لمشاهدة العرض التوضيحي الشامل وتعرّف على ميزات النظام للتطوير الفوري لمكتبك
                </p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white dark:bg-navy-800">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <Badge className="bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border-none px-4 py-1.5 text-sm mb-4">
              باقات الاشتراك
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">ابدأ مجاناً — وكبّر مع نمو مكتبك</h2>
            <p className="text-slate-800 dark:text-slate-300 text-lg">أسعار شفافة بدون رسوم خفية. أقل من تكلفة كوب قهوة يومياً.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: "تجربة مجانية",
                price: 0,
                priceLabel: "مجاناً",
                desc: "جرب المنصة بكامل ميزاتها لمدة أسبوع",
                popular: false,
                isCustom: false,
                isFree: true,
                features: [
                  "تجربة كاملة للباقة المتقدمة",
                  "موكلون وقضايا غير محدودة",
                  "الذكاء الاصطناعي وبوت واتساب",
                  "إدارة العقود والفواتير",
                  "بدون بطاقة ائتمان",
                ]
              },
              {
                name: "الأساسية",
                price: 599,
                priceLabel: "599",
                desc: "للمحامي الفردي والمكاتب الناشئة",
                popular: false,
                isCustom: false,
                isFree: false,
                features: [
                  "50 قضية",
                  "الفاتورة الإلكترونية (ETA)",
                  "التقويم والمواعيد",
                  "مساعد AI محدود",
                  "حتى 5 مستخدمين",
                  "دعم بالبريد",
                ]
              },
              {
                name: "المتقدمة",
                price: 999,
                priceLabel: "999",
                desc: "الأنسب للمكاتب المتنامية",
                popular: true,
                isCustom: false,
                isFree: false,
                features: [
                  "500 قضية",
                  "إدارة العقود (CLM)",
                  "التنفيذ القضائي",
                  "نظام التحصيل الكامل",
                  "AI غير محدود",
                  "بوت واتساب الذكي",
                  "حتى 20 مستخدم",
                  "تقارير متقدمة",
                ]
              },
              {
                name: "المؤسسات",
                price: 1599,
                priceLabel: "1599",
                desc: "لشركات المحاماة والمكاتب الكبرى",
                popular: false,
                isCustom: false,
                isFree: false,
                features: [
                  "قضايا غير محدودة",
                  "كل ميزات المتقدمة",
                  "بوابة الموكلين الخاصة",
                  "الملكية الفكرية",
                  "إدارة الامتثال",
                  "مستخدمين غير محدود",
                  "دعم فني ذو أولوية",
                  "تقارير تنفيذية",
                ]
              }
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className={`relative p-7 rounded-3xl border-2 transition-all ${
                  plan.popular
                    ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 shadow-xl shadow-primary-500/10 scale-105 z-10"
                    : "border-slate-100 dark:border-white/5 bg-white dark:bg-navy-800 hover:border-primary-200 dark:hover:border-primary-800/30"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary-600 text-white px-4 py-1 text-xs font-bold shadow-lg">الأكثر طلباً</Badge>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">{plan.desc}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`font-black text-navy-900 dark:text-white ${plan.isFree ? 'text-3xl' : 'text-5xl'}`}>{plan.priceLabel}</span>
                    {!plan.isFree && <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">ج.م/شهر</span>}
                  </div>
                  {!plan.isFree && <p className="text-[11px] text-primary-600 dark:text-primary-400 font-medium mt-1">= {Math.round(plan.price / 30)} ج.م/يوم فقط</p>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => navigate('/login')}
                  aria-label={`${plan.isFree ? 'ابدأ مجاناً — باقة التجربة المجانية لمدة أسبوع' : `ابدأ الآن — اشترك في باقة ${plan.name}`}`}
                  className={`w-full py-5 rounded-xl font-bold transition-all ${
                    plan.popular
                      ? "bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20"
                      : plan.isFree
                        ? "bg-slate-100 dark:bg-white/5 hover:bg-primary-600 hover:text-white text-navy-900 dark:text-white"
                        : "bg-slate-100 dark:bg-white/5 hover:bg-primary-600 hover:text-white text-navy-900 dark:text-white"
                  }`}
                >
                  {plan.isFree ? 'ابدأ مجاناً' : 'ابدأ الآن'}
                </Button>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-700 dark:text-slate-300 mt-8">جميع الأسعار بالجنيه المصري وتشمل ضريبة القيمة المضافة. خصم 20% على الاشتراك السنوي.</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-600"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">مكتبك يستحق أكثر من Excel وواتساب</h2>
          <p className="text-primary-100 text-lg mb-10 max-w-2xl mx-auto">
            جرّب مَلَف مجاناً لمدة أسبوع (7 أيام) واستمتع بإدارة ذكية ومتكاملة لمكتبك — بدون الحاجة لبطاقة ائتمان.
          </p>
          <Button size="lg" className="bg-white dark:bg-navy-900 text-primary-600 hover:bg-slate-50 h-14 px-10 text-lg rounded-full shadow-xl" aria-label="ابدأ الآن — سجّل مكتبك وابدأ تجربة مجانية" onClick={() => navigate('/login')}>
            ابدأ الآن
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-navy-900 text-slate-300 py-16 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Scale className="text-white w-7 h-7" />
                </div>
                <span className="text-xl font-black tracking-tighter text-white leading-none">مَلَف</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                منصة SaaS متكاملة مصممة خصيصاً لرقمنة مكاتب المحاماة في مصر والوطن العربي، من خلال حلول ذكية وأتمتة شاملة.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">روابط سريعة</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/" className="hover:text-primary-400 transition-colors">الرئيسية</a></li>
                <li><a href="#services" className="hover:text-primary-400 transition-colors">الميزات</a></li>
                <li><a href="#pricing" className="hover:text-primary-400 transition-colors">الباقات والأسعار</a></li>
                <li><a href="#about" className="hover:text-primary-400 transition-colors">من نحن</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">الخدمات</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/client-portal" className="hover:text-primary-400 transition-colors">بوابة الموكلين</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">تطبيقات الهواتف</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">مركز المساعدة</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">API للمطورين</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">تواصل معنا</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary-500 shrink-0" />
                  <span>المنصورة — توريل القديمة، شارع بوتاري، محافظة الدقهلية، جمهورية مصر العربية</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary-500 shrink-0" />
                  <span dir="ltr">+20 114 197 3834</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary-500 shrink-0" />
                  <span>m.hosainy.law@gmail.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div>&copy; {new Date().getFullYear()} شركة ملف لتقنية المعلومات. جميع الحقوق محفوظة.</div>
            <div className="flex gap-6">
              <a href="/terms" className="hover:text-white transition-colors">الشروط والأحكام</a>
              <a href="/privacy" className="hover:text-white transition-colors">سياسة الخصوصية</a>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a 
        href="https://wa.me/201141973834" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 start-8 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-50"
        aria-label="تواصل معنا عبر واتساب"
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </div>
  );
}
