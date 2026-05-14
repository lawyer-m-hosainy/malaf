import React from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Scale, ShieldCheck, Clock, Users, ArrowLeft, MessageCircle, 
  CheckCircle2, Star, Phone, Mail, MapPin, Briefcase, Building2, Gavel, FileText, TrendingUp
} from "lucide-react";
import { toast } from "sonner";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white font-sans selection:bg-primary-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 transition-all">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <img src="/logo.png" alt="شعار ملف - محمد الحسيني" className="h-10 md:h-16 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-black tracking-tighter text-navy-900 dark:text-white leading-none">مَلَف</span>
              <span className="text-[8px] md:text-[10px] font-bold text-primary-600 tracking-widest uppercase">محمد الحسيني</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
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
            <Button className="bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20 rounded-full px-6" onClick={() => navigate('/login')}>
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
              <img 
                src="/logo.png" 
                alt="شعار ملف - محمد الحسيني" 
                className="h-28 md:h-40 w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
              />
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
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
              ملف يجمع إدارة القضايا، الموكلين، الجلسات، العقود، والفواتير في منصة واحدة مصممة خصيصاً للمحامي المصري.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button size="lg" className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white h-14 px-8 text-lg rounded-full shadow-xl shadow-primary-500/20 transition-transform hover:scale-105" onClick={() => navigate('/login')}>
                ابدأ تجربتك المجانية
                <ArrowLeft className="ms-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full border-slate-200 dark:border-white/10 bg-white/50 dark:bg-navy-800/50 backdrop-blur-sm hover:bg-slate-100 dark:hover:bg-white/5" onClick={() => window.location.href='#services'}>
                شاهد العرض التوضيحي
              </Button>
            </div>
            
            <div className="pt-12 flex items-center justify-center gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> خوادم سحابية آمنة</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> تشفير بيانات بنكي</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> نسخ احتياطي يومي</div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="pt-16 flex flex-col items-center justify-center w-full"
            >
              <a 
                href="https://app.heygen.com/videos/f2fd5c4f361a4036b3ce158cdb6291d3" 
                target="_blank" 
                rel="noopener noreferrer"
                className="relative block w-full max-w-[600px] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl shadow-primary-500/20 border-4 md:border-[6px] border-white dark:border-navy-800 bg-gradient-to-br from-primary-900 to-navy-900 aspect-[4/3] md:aspect-video min-h-[200px] hover:scale-[1.02] hover:shadow-primary-500/40 transition-all duration-300 group"
              >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                
                <div className="absolute -top-10 -right-10 w-32 md:w-40 h-32 md:h-40 bg-primary-500 rounded-full mix-blend-screen filter blur-2xl md:blur-3xl opacity-50"></div>
                <div className="absolute -bottom-10 -left-10 w-32 md:w-40 h-32 md:h-40 bg-emerald-500 rounded-full mix-blend-screen filter blur-2xl md:blur-3xl opacity-50"></div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-6 text-center z-10">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 md:mb-6 group-hover:bg-primary-600 transition-all duration-500 border border-white/20 shadow-xl group-hover:scale-110 group-hover:border-primary-500">
                    <div className="w-0 h-0 border-y-[10px] md:border-y-[12px] border-y-transparent border-l-[14px] md:border-l-[18px] border-l-white ml-2"></div>
                  </div>
                  <h3 className="text-xl md:text-3xl font-black text-white mb-2 md:mb-3 px-2">مقدمة منصة مَلَف القانونية</h3>
                  <p className="text-primary-100/80 text-sm md:text-base font-medium max-w-sm px-4">انقر لمشاهدة العرض التوضيحي القصير وتعرف على مميزات النظام</p>
                </div>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="about" className="border-y border-slate-200 dark:border-white/5 bg-white dark:bg-navy-800/50">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "مكتب محاماة مشترك", value: "+500" },
              { label: "قضية مُدارة", value: "+50,000" },
              { label: "متوسط التقييم", value: "4.9/5" },
              { label: "توفير في وقت الإدارة", value: "-60%" }
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-navy-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-slate-50 dark:bg-navy-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">ماذا تدير بملف؟</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">منصة واحدة تغنيك عن عشرات التطبيقات وملفات الإكسل المشتتة.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Gavel, title: "القضايا والجلسات", desc: "إدارة متكاملة للمواعيد، المحاكم، والمستجدات مع تنبيهات تلقائية قبل كل جلسة." },
              { icon: Users, title: "الموكلين", desc: "ملفات كاملة لكل موكل، عقود، وتواصل مباشر ومسجل لحفظ حقوق المكتب." },
              { icon: FileText, title: "الفواتير والتحصيل", desc: "إصدار فواتير إلكترونية متوافقة مع منظومة ETA المصرية، وتتبع للمدفوعات المتأخرة." },
              { icon: Briefcase, title: "إدارة الفريق", desc: "صلاحيات دقيقة لكل محامٍ، توزيع المهام، وقياس ومتابعة إنتاجية أعضاء المكتب." },
              { icon: Scale, title: "الذكاء الاصطناعي", desc: "صياغة مستندات قانونية وتلخيص مذكرات ومرفقات ضخمة في ثوانٍ معدودة." },
              { icon: ShieldCheck, title: "بوابة الموكلين", desc: "شفافية تامة ورضا أكبر لعملائك من خلال بوابة خاصة تتيح لهم متابعة قضاياهم دون إزعاجك." }
            ].map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-white dark:bg-navy-800 border border-slate-100 dark:border-white/5 hover:shadow-xl hover:shadow-primary-500/5 transition-all group"
              >
                <div className="w-14 h-14 bg-slate-50 dark:bg-navy-900 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <service.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {service.desc}
                </p>
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
            <p className="text-slate-600 dark:text-slate-400 text-lg">منصة مرنة تتكيف مع حجم عملك وطبيعة مكتبك.</p>
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
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
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
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
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
              <Button size="lg" className="bg-navy-900 hover:bg-navy-800 dark:bg-white dark:bg-navy-900 dark:text-navy-900 dark:hover:bg-slate-100 rounded-full px-8" onClick={() => navigate('/login')}>
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
                <div className="relative bg-white dark:bg-navy-800 border border-slate-200 dark:border-white/10 rounded-[2rem] p-2 shadow-2xl overflow-hidden">
                  <div className="rounded-[1.5rem] w-full aspect-[3/2] bg-slate-100 dark:bg-navy-900 flex flex-col p-6 gap-4">
                    <div className="w-full flex justify-between items-center pb-4 border-b border-slate-200 dark:border-white/5">
                      <div className="w-32 h-6 bg-slate-200 dark:bg-white/10 rounded-md"></div>
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10"></div>
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10"></div>
                      </div>
                    </div>
                    <div className="flex gap-4 flex-1">
                      <div className="w-1/4 bg-slate-200 dark:bg-white/5 rounded-xl h-full"></div>
                      <div className="flex-1 flex flex-col gap-4">
                        <div className="flex gap-4">
                          <div className="flex-1 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-xl"></div>
                          <div className="flex-1 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl"></div>
                          <div className="flex-1 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-xl"></div>
                        </div>
                        <div className="flex-1 bg-slate-200 dark:bg-white/5 rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                  {/* Floating badge */}
                  <div className="absolute top-8 -start-6 bg-white dark:bg-navy-900 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-white/5 flex items-center gap-3 animate-bounce-slow">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">معدل الإنجاز</div>
                      <div className="text-lg font-black text-navy-900 dark:text-white">98.5%</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-50 dark:bg-navy-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">ماذا يقول أصحاب المكاتب</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">آراء محامين ومديري مكاتب استخدموا المنصة لتحويل أعمالهم.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "أ. خالد منصور، شريك في مكتب منصور وشركاه", text: "كنا بنضيع 3 ساعات يومياً في التنظيم الورقي والبحث في الملفات. مع ملف، بقت الـ 3 ساعات دول شغل حقيقي وقضايا أكتر." },
              { name: "أ. نورهان إبراهيم، مديرة مكتب", text: "بوابة الموكلين خفّضت استفسارات الواتساب والمكالمات الهاتفية من مكتبنا بنسبة 70%، الموكل بيشوف قضيته بنفسه في أي وقت." },
              { name: "أ. محمود سليم، محامٍ حر", text: "النظام المحاسبي وربطه بالفاتورة الإلكترونية أنقذنا من غرامات التأخير ووفر وقت المحاسب بشكل لا يصدق. المنصة دي ضرورة مش رفاهية." }
            ].map((testimonial, i) => (
              <div key={i} className="p-8 rounded-3xl bg-white dark:bg-navy-800 border border-slate-100 dark:border-white/5">
                <div className="flex gap-1 text-amber-400 mb-6">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">"{testimonial.text}"</p>
                <div className="font-bold text-navy-900 dark:text-white">{testimonial.name}</div>
              </div>
            ))}
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">اختر الباقة المناسبة لمكتبك</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">أسعار شفافة بدون رسوم خفية. جميع الباقات تشمل تحديثات مجانية ودعم فني.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "الأساسية",
                price: 300,
                desc: "مثالية لمكاتب المحاماة الناشئة",
                popular: false,
                features: [
                  "إدارة العملاء والقضايا",
                  "الفاتورة الإلكترونية (ETA)",
                  "التقويم والمواعيد",
                  "مساعد الذكاء الاصطناعي (محدود)",
                  "حتى 5 مستخدمين",
                  "50 قضية",
                ]
              },
              {
                name: "المتقدمة",
                price: 600,
                desc: "الأنسب للمكاتب المتوسطة والمتنامية",
                popular: true,
                features: [
                  "كل ميزات الأساسية",
                  "إدارة العقود (CLM)",
                  "نظام التحصيل",
                  "فحص تعارض المصالح",
                  "تتبع الوقت والفوترة",
                  "تقارير متقدمة",
                  "حتى 20 مستخدم",
                  "500 قضية",
                ]
              },
              {
                name: "المؤسسات",
                price: 1300,
                desc: "للشركات القانونية الكبرى",
                popular: false,
                features: [
                  "كل ميزات المتقدمة",
                  "إدارة الامتثال (GRC)",
                  "بوابة العميل الخاصة",
                  "الملكية الفكرية",
                  "المسارات المتخصصة",
                  "دعم فني ذو أولوية",
                  "مستخدمون غير محدودون",
                  "قضايا غير محدودة",
                ]
              }
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`relative p-8 rounded-3xl border-2 transition-all ${
                  plan.popular
                    ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 shadow-xl shadow-primary-500/10 scale-105"
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
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{plan.desc}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-black text-navy-900 dark:text-white">{plan.price}</span>
                    <span className="text-sm text-slate-400 font-medium">ج.م/شهر</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => navigate('/login')}
                  className={`w-full py-5 rounded-xl font-bold transition-all ${
                    plan.popular
                      ? "bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20"
                      : "bg-slate-100 dark:bg-white/5 hover:bg-primary-600 hover:text-white text-navy-900 dark:text-white"
                  }`}
                >
                  ابدأ الآن
                </Button>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-400 mt-8">جميع الأسعار بالجنيه المصري وتشمل ضريبة القيمة المضافة. خصم 17% على الاشتراك السنوي.</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-600"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">مكتبك يستحق أكثر من Excel وواتساب</h2>
          <p className="text-primary-100 text-lg mb-10 max-w-2xl mx-auto">
            جرّب ملف مجاناً لمدة 14 يوم واستمتع بإدارة ذكية ومتكاملة لمكتبك — بدون الحاجة لبطاقة ائتمان.
          </p>
          <Button size="lg" className="bg-white dark:bg-navy-900 text-primary-600 hover:bg-slate-50 h-14 px-10 text-lg rounded-full shadow-xl" onClick={() => navigate('/login')}>
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
                <img src="/logo.png" alt="شعار ملف - محمد الحسيني" className="h-14 w-auto object-contain bg-white/10 rounded-xl p-1" />
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-tighter text-white leading-none">مَلَف</span>
                  <span className="text-[8px] font-bold text-primary-400 tracking-widest uppercase">محمد الحسيني</span>
                </div>
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
                  <span>شارع قصر النيل، وسط البلد، برج النيل، الدور 12، القاهرة، جمهورية مصر العربية</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary-500 shrink-0" />
                  <span dir="ltr">+20 2 234 5678</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary-500 shrink-0" />
                  <span>info@aladala-law.eg</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div>&copy; {new Date().getFullYear()} شركة ملف لتقنية المعلومات. جميع الحقوق محفوظة.</div>
            <div className="flex gap-6">
              <a href="#" className="pointer-events-none opacity-40 hover:text-white transition-colors">الشروط والأحكام</a>
              <a href="#" className="pointer-events-none opacity-40 hover:text-white transition-colors">سياسة الخصوصية</a>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a 
        href="https://wa.me/201000000000" 
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
