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
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Scale className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-navy-900 dark:text-white leading-none">مَلَف</span>
              <span className="text-[10px] font-bold text-primary-600 tracking-widest uppercase">MALAF</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#services" className="hover:text-primary-600 transition-colors">خدماتنا</a>
            <a href="#about" className="hover:text-primary-600 transition-colors">من نحن</a>
            <a href="#tech" className="hover:text-primary-600 transition-colors">التقنية القانونية</a>
            <a href="#contact" className="hover:text-primary-600 transition-colors">تواصل معنا</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="hidden md:flex font-medium" onClick={() => navigate('/client-portal')}>
              بوابة الموكلين
            </Button>
            <Button className="bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20 rounded-full px-6" onClick={() => navigate('/login')}>
              تسجيل الدخول
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
            className="max-w-4xl mx-auto space-y-8"
          >
            <Badge className="bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border border-primary-100 dark:border-primary-800/30 px-4 py-1.5 text-sm font-medium">
              الريادة في تقديم الخدمات القانونية المتكاملة
            </Badge>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tight text-navy-900 dark:text-white">
              حوكمة مكاتب <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-emerald-600 to-blue-600 animate-gradient">
                المحاماة الذكية
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
              أول منصة ERP قانونية متكاملة مصممة خصيصاً للمكاتب والشركات القانونية في مصر. أتمتة كاملة، ذكاء اصطناعي، وإدارة شاملة للقضايا والموكلين.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button size="lg" className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white h-14 px-8 text-lg rounded-full shadow-xl shadow-primary-500/20 transition-transform hover:scale-105" onClick={() => window.location.href='#contact'}>
                طلب استشارة مجانية
                <ArrowLeft className="ms-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full border-slate-200 dark:border-white/10 bg-white/50 dark:bg-navy-800/50 backdrop-blur-sm hover:bg-slate-100 dark:hover:bg-white/5" onClick={() => navigate('/client-portal')}>
                متابعة قضيتك
              </Button>
            </div>
            
            <div className="pt-12 flex items-center justify-center gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> مقيدون بنقابة المحامين المصريين</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> سرية تامة</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> تقارير دورية</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="about" className="border-y border-slate-200 dark:border-white/5 bg-white dark:bg-navy-800/50">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "سنوات الخبرة", value: "+15" },
              { label: "قضية ناجحة", value: "+2,500" },
              { label: "موكل راضٍ", value: "+1,200" },
              { label: "محامٍ ومستشار", value: "24" }
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">مجالات التخصص</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">نغطي طيفاً واسعاً من التخصصات القانونية لتلبية كافة احتياجاتك بدقة واحترافية.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Building2, title: "القضايا التجارية", desc: "تأسيس الشركات، صياغة العقود التجارية، قضايا الإفلاس، والمنازعات بين الشركاء." },
              { icon: Briefcase, title: "القضايا العمالية", desc: "تمثيل الشركات والعمال في منازعات العمل، صياغة لوائح تنظيم العمل، وعقود التوظيف." },
              { icon: Gavel, title: "القضايا الجزائية", desc: "الدفاع في القضايا الجنائية، الجرائم الاقتصادية، والجرائم المعلوماتية." },
              { icon: Users, title: "الأحوال الشخصية", desc: "قضايا التركات، الأوقاف، الوصايا، وكافة النزاعات الأسرية بسرية تامة." },
              { icon: FileText, title: "الملكية الفكرية", desc: "تسجيل العلامات التجارية، براءات الاختراع، وحماية حقوق المؤلف." },
              { icon: ShieldCheck, title: "الامتثال والحوكمة", desc: "ضمان توافق أعمال شركتك مع الأنظمة واللوائح المحلية والدولية." }
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

      {/* Tech/Portal Section */}
      <section id="tech" className="py-24 bg-white dark:bg-navy-800 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-8">
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none px-4 py-1.5 text-sm">
                التقنية في خدمة القانون
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                بوابة موكلين متطورة <br /> تبقيك على اطلاع دائم
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                نؤمن بالشفافية المطلقة. من خلال بوابة الموكلين الخاصة بنا، يمكنك متابعة سير قضاياك، الاطلاع على الجلسات القادمة، تحميل المستندات، والتواصل مع فريق العمل الموكل بقضيتك على مدار الساعة.
              </p>
              <ul className="space-y-4">
                {[
                  "تحديثات فورية لحالة القضية",
                  "ربط مع بوابة التقاضي الإلكتروني",
                  "أرشفة إلكترونية آمنة للمستندات",
                  "فواتير إلكترونية متوافقة مع منظومة ETA"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                    <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button size="lg" className="bg-navy-900 hover:bg-navy-800 dark:bg-white dark:bg-navy-900 dark:text-navy-900 dark:hover:bg-slate-100 rounded-full px-8" onClick={() => navigate('/client-portal')}>
                اكتشف بوابة الموكلين
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
                  <img 
                    src="https://picsum.photos/seed/malaf/1200/800" 
                    alt="Malaf Dashboard Preview" 
                    className="rounded-[1.5rem] w-full shadow-inner opacity-50 grayscale"
                  />
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">ماذا يقول موكلونا</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">نفخر بثقة عملائنا ونعتبرها وسام شرف لنا.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "شركة الأفق للتجارة", text: "احترافية عالية في التعامل مع قضيتنا التجارية المعقدة. فريق العمل كان متجاوباً جداً والبوابة الإلكترونية سهلت علينا متابعة كل جديد." },
              { name: "مؤسسة البناء الحديث", text: "صياغة العقود لديهم دقيقة جداً وتحمي حقوقنا بشكل كامل. نعتمد عليهم كمستشار قانوني دائم لمؤسستنا." },
              { name: "عبدالله السالم", text: "سرعة في الإنجاز وشفافية في التعامل. تم إنهاء قضيتي العمالية في وقت قياسي وبنتائج مرضية جداً." }
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

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-600"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">هل أنت مستعد لحماية حقوقك؟</h2>
          <p className="text-primary-100 text-lg mb-10 max-w-2xl mx-auto">
            تواصل معنا اليوم للحصول على استشارة قانونية مبدئية. فريقنا جاهز لدراسة قضيتك وتقديم أفضل الحلول القانونية.
          </p>
          <Button size="lg" className="bg-white dark:bg-navy-900 text-primary-600 hover:bg-slate-50 h-14 px-10 text-lg rounded-full shadow-xl" onClick={() => window.location.href='#contact'}>
            تواصل معنا الآن
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-navy-900 text-slate-300 py-16 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                  <Scale className="text-white w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-tighter text-white leading-none">مَلَف</span>
                  <span className="text-[8px] font-bold text-primary-400 tracking-widest uppercase">MALAF</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                مكتب محاماة رائد يقدم خدمات قانونية متكاملة للشركات والأفراد، معتمدين على الخبرة العميقة والتقنية الحديثة.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">روابط سريعة</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/" className="hover:text-primary-400 transition-colors">الرئيسية</a></li>
                <li><a href="#services" className="hover:text-primary-400 transition-colors">خدماتنا</a></li>
                <li><a href="#about" className="hover:text-primary-400 transition-colors">من نحن</a></li>
                <li><a href="/client-portal" className="hover:text-primary-400 transition-colors">بوابة الموكلين</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">الخدمات</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/login" className="hover:text-primary-400 transition-colors">القضايا التجارية</a></li>
                <li><a href="/login" className="hover:text-primary-400 transition-colors">القضايا العمالية</a></li>
                <li><a href="/login" className="hover:text-primary-400 transition-colors">تأسيس الشركات</a></li>
                <li><a href="/login" className="hover:text-primary-400 transition-colors">صياغة العقود</a></li>
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
            <div>&copy; {new Date().getFullYear()} مكتب العدالة للمحاماة والاستشارات القانونية. جميع الحقوق محفوظة.</div>
            <div className="flex gap-6">
              <a href="#" style={{ pointerEvents: 'none', opacity: 0.4 }} className="hover:text-white transition-colors">الشروط والأحكام</a>
              <a href="#" style={{ pointerEvents: 'none', opacity: 0.4 }} className="hover:text-white transition-colors">سياسة الخصوصية</a>
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
