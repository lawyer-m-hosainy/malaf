import { useState } from "react";
import { motion } from "motion/react";
import { 
  BookOpen, Search, Filter, ShieldAlert, Users, Briefcase, FileText, 
  Landmark, Gavel, FileSignature, MapPin, Building, Scale, Clock,
  Car, ScrollText, AlertCircle, ChevronLeft, Bookmark, History, FileCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const WIKI_CATEGORIES = [
  { id: 1, name: "الإجراءات الجنائية", count: 85, icon: ShieldAlert, color: "text-red-500", bg: "bg-red-50" },
  { id: 2, name: "قانون الأحوال الشخصية", count: 95, icon: Users, color: "text-pink-500", bg: "bg-pink-50" },
  { id: 3, name: "العقود والمعاملات المدنية", count: 90, icon: Briefcase, color: "text-amber-500", bg: "bg-amber-50" },
  { id: 4, name: "التقاضي والمرافعات", count: 75, icon: Gavel, color: "text-blue-500", bg: "bg-blue-50" },
  { id: 5, name: "الشركات والتجاري", count: 80, icon: Building, color: "text-indigo-500", bg: "bg-indigo-50" },
  { id: 6, name: "العمل والتأمينات", count: 70, icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
  { id: 7, name: "الملكية العقارية والتسجيل", count: 65, icon: MapPin, color: "text-emerald-500", bg: "bg-emerald-50" },
  { id: 8, name: "الإداري ومجلس الدولة", count: 60, icon: Landmark, color: "text-slate-500", bg: "bg-slate-50" },
  { id: 9, name: "المحكمة الاقتصادية", count: 45, icon: Scale, color: "text-green-700", bg: "bg-green-50" },
  { id: 10, name: "التحكيم والوساطة", count: 40, icon: FileSignature, color: "text-violet-500", bg: "bg-violet-50" },
  { id: 11, name: "الملكية الفكرية والتقنية", count: 55, icon: FileText, color: "text-purple-500", bg: "bg-purple-50" },
  { id: 12, name: "قانون المرور والحوادث", count: 50, icon: Car, color: "text-yellow-600", bg: "bg-yellow-50" },
  { id: 13, name: "نماذج المستندات", count: 60, icon: ScrollText, color: "text-cyan-600", bg: "bg-cyan-50" },
  { id: 14, name: "أحكام قضائية بارزة", count: 45, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
];

const RECENT_ARTICLES = [
  { id: 1, title: "الاستئناف الجنائي — قانون ١/٢٠٢٤ الجديد كاملاً", category: "الإجراءات الجنائية", level: "متوسط", author: "Claude AI", date: "اليوم" },
  { id: 2, title: "الحبس الاحتياطي — الأحكام والمدد والطعن فيه", category: "الإجراءات الجنائية", level: "متقدم", author: "Claude AI", date: "الأمس" },
  { id: 3, title: "الخلع — الشروط والإجراءات والأثر القانوني", category: "قانون الأحوال الشخصية", level: "مبتدئ", author: "Claude AI", date: "الأمس" },
  { id: 4, title: "تأسيس ش.ذ.م.م — الخطوات والوثائق ٢٠٢٤", category: "الشركات والتجاري", level: "متوسط", author: "Claude AI", date: "منذ ٣ أيام" },
  { id: 5, title: "رسوم الدعوى الاقتصادية — الحساب والاستثناءات", category: "المحكمة الاقتصادية", level: "متوسط", author: "Claude AI", date: "منذ أسبوع" },
];

export default function InternalWiki() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  return (
    <div className="space-y-6 pb-20 font-sans" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <BookOpen className="text-primary-600" size={32} />
            المعرفة القانونية
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-2xl">
            مكتبة حية متكاملة للمحامين المصريين تحتوي على أكثر من ٨٢٠ مقال قانوني، تشمل نصوص تشريعية، إجراءات عملية، مواعيد طعن، أحكام نقض، ونماذج مستندات. مدعومة بالذكاء الاصطناعي.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-primary-700 border-primary-200 bg-primary-50 px-3 py-1.5 text-xs">
            ٨٢٠+ مقال متاح
          </Badge>
          <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs">
            مُحدّث لعام ٢٠٢٤-٢٠٢٥
          </Badge>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-2">
          <div className="relative flex items-center">
            <Search className="absolute right-4 text-slate-400" size={20} />
            <Input 
              placeholder="ابحث في أكثر من ٨٢٠ موضوع، مبدأ قضائي، أو إجراء قانوني..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-12 py-6 border-none text-lg focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400"
            />
            <Button variant="ghost" size="icon" className="absolute left-2 text-slate-400 hover:text-slate-600" title="تصفية النتائج" aria-label="تصفية">
              <Filter size={20} />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Categories */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 px-1">
            <Bookmark size={18} className="text-slate-400" /> التصنيفات الرئيسية (١٤)
          </h3>
          <div className="flex flex-col space-y-1">
            <button 
              className={`flex items-center justify-between p-3 rounded-lg text-sm transition-colors ${activeCategory === null ? 'bg-primary-50 text-primary-700 font-bold' : 'hover:bg-slate-50 text-slate-700'}`}
              onClick={() => setActiveCategory(null)}
            >
              <span className="flex items-center gap-2"><BookOpen size={16} /> الكل</span>
              <Badge variant="secondary" className="text-[10px]">820</Badge>
            </button>
            {WIKI_CATEGORIES.map(cat => (
              <button 
                key={cat.id}
                className={`flex items-center justify-between p-3 rounded-lg text-sm transition-colors ${activeCategory === cat.id ? 'bg-primary-50 text-primary-700 font-bold' : 'hover:bg-slate-50 text-slate-700'}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${cat.bg}`}>
                    <cat.icon size={14} className={cat.color} />
                  </div>
                  {cat.name}
                </span>
                <Badge variant="secondary" className="text-[10px] bg-slate-100">{cat.count}</Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Active Category Header (If Selected) */}
          {activeCategory && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex items-start gap-4">
              {(() => {
                const cat = WIKI_CATEGORIES.find(c => c.id === activeCategory);
                if (!cat) return null;
                return (
                  <>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${cat.bg}`}>
                      <cat.icon size={32} className={cat.color} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">{cat.name}</h2>
                      <p className="text-slate-500 text-sm mt-1">عرض {cat.count} مقال قانوني مفصل مع الأحكام والمواعيد والنماذج.</p>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* Articles List / Grid */}
          {!activeCategory && !searchQuery ? (
            <>
              {/* Highlight Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-primary-600 to-primary-800 text-white border-none shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Scale size={120} />
                  </div>
                  <CardContent className="p-6 relative z-10">
                    <Badge className="bg-white/20 text-white border-none hover:bg-white/30 mb-3 text-xs">أحدث التشريعات</Badge>
                    <h3 className="text-xl font-bold mb-2">استئناف الجنايات (قانون ١/٢٠٢٤)</h3>
                    <p className="text-primary-100 text-sm mb-4 line-clamp-2">تعرف على التفاصيل الكاملة لقانون إنشاء محاكم الجنايات المستأنفة، الإجراءات، مواعيد الطعن الجديدة بـ ٤٠ يوماً، وموقف القضايا المتداولة.</p>
                    <Button variant="secondary" size="sm" className="bg-white text-primary-700 hover:bg-slate-50 text-xs font-bold">اقرأ المقال الشامل</Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <History size={120} />
                  </div>
                  <CardContent className="p-6 relative z-10">
                    <Badge className="bg-white/20 text-white border-none hover:bg-white/30 mb-3 text-xs">مراجعة شاملة</Badge>
                    <h3 className="text-xl font-bold mb-2">التقادم في القانون المصري</h3>
                    <p className="text-slate-300 text-sm mb-4 line-clamp-2">دليل شامل يجمع كل مدد التقادم المدنية، الجنائية، العمالية، والتجارية مع حالات انقطاع ووقف التقادم وفقاً لأحدث مبادئ محكمة النقض.</p>
                    <Button variant="secondary" size="sm" className="bg-white text-slate-800 hover:bg-slate-50 text-xs font-bold">اقرأ المقال الشامل</Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recently Added Section */}
              <div>
                <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
                  <FileCheck size={18} className="text-primary-600" /> أُضيفت مؤخراً (بواسطة الذكاء الاصطناعي)
                </h3>
                <div className="space-y-3">
                  {RECENT_ARTICLES.map(article => (
                    <div key={article.id} className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">{article.category}</span>
                          <span className="text-[10px] text-slate-400">• {article.date}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 group-hover:text-primary-700 transition-colors">{article.title}</h4>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <Badge variant="outline" className="text-slate-500 font-normal text-[10px]">{article.level}</Badge>
                        <Button variant="ghost" size="sm" className="text-slate-400 group-hover:text-primary-600 ml-auto md:ml-0" aria-label="اقرأ المقال">
                          <ChevronLeft size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <BookOpen size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-500 mb-2">جاري توليد المكتبة...</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">المقالات في هذا التصنيف يتم توليدها حالياً باستخدام الذكاء الاصطناعي بناءً على القواعد المحددة. ستظهر هنا فور اكتمال التوليد وحفظها في قاعدة البيانات.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
