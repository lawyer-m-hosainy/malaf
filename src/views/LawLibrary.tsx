import React, { useState } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Gavel, FileText, Copy, Bookmark, ChevronLeft, Calendar, Hash, Scale, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Ruling {
  id: string;
  court: string;
  year: string;
  rulingNumber: string;
  principle: string; // المبدأ القانوني
  fullText: string;
  category: string; // مدني، جنائي، إلخ
  date: string;
}

const MOCK_RULINGS: Ruling[] = [
  {
    id: "R1",
    court: "محكمة النقض",
    year: "90",
    rulingNumber: "1234",
    category: "مدني",
    date: "2024-01-15",
    principle: "المسؤولية التقصيرية تقوم على أركان ثلاثة هي الخطأ والضرر وعلاقة السببية بينهما، واستخلاص هذه الأركان من مسائل الواقع التي تستقل بها محكمة الموضوع.",
    fullText: "لما كان من المقرر في قضاء هذه المحكمة أن المسؤولية التقصيرية تقوم على أركان ثلاثة هي الخطأ والضرر وعلاقة السببية، وكان استخلاص الخطأ الموجب للمسؤولية من سلطة محكمة الموضوع ما دام استخلاصها سائغاً ومستنداً إلى ما له أصل ثابت في الأوراق..."
  },
  {
    id: "R2",
    court: "محكمة النقض",
    year: "91",
    rulingNumber: "5678",
    category: "جنائي",
    date: "2024-02-10",
    principle: "التفتيش الذي يجريه مأمور الضبط القضائي بغير إذن سابق من النيابة العامة يقع باطلاً ما لم تكن هناك حالة من حالات التلبس المنصوص عليها قانوناً.",
    fullText: "من المقرر أن بطلان التفتيش يقتضي استبعاد كل دليل مستمد منه، وحيث أن الثابت من الأوراق أن الضابط قام بتفتيش مسكن المتهم دون إذن سابق ودون توافر حالة التلبس..."
  },
  {
    id: "R3",
    court: "الإدارية العليا",
    year: "65",
    rulingNumber: "9012",
    category: "إداري",
    date: "2023-11-20",
    principle: "القرار الإداري يجب أن يكون مسبباً تسبيباً كافياً يظهر وجه الحق فيه، وإغفال التسبيب يؤدي إلى بطلان القرار لعيب الشكل والسبب.",
    fullText: "إن سلطة الإدارة في إصدار القرارات ليست سلطة تحكمية بل يجب أن تنبني على وقائع مادية وقانونية تبرره، ولما كان القرار المطعون فيه قد خلا من ذكر الأسباب..."
  },
  {
    id: "R4",
    court: "محكمة النقض",
    year: "89",
    rulingNumber: "3456",
    category: "أحوال شخصية",
    date: "2023-12-05",
    principle: "تقدير نفقة الزوجية والأقارب منوط بحالة الزوج يسرأ وعسراً، وللقاضي سلطة تقديرية واسعة في ذلك تبعاً للظروف الاقتصادية والاجتماعية.",
    fullText: "حيث أن النفقة تقدر بحسب حال الزوج وقت استحقاقها، وكان الحكم المطعون فيه قد راعى دخل الطاعن وما يقدمه من مستندات تدل على أعبائه العائلية..."
  },
  {
    id: "R5",
    court: "محكمة النقض",
    year: "92",
    rulingNumber: "7890",
    category: "تجاري",
    date: "2024-03-01",
    principle: "عقد الشركة يترتب عليه ظهور شخصية معنوية مستقلة عن الشركاء، ولا يجوز التنفيذ على أموال الشركة بمديونية خاصة بأحد الشركاء.",
    fullText: "المقرر قانوناً أن للشركة شخصية اعتبارية مستقلة، وذمة مالية منفصلة عن ذمم الشركاء فيها، وبالتالي فلا يجوز قانوناً الحجز على أصول الشركة استيفاء لدين شخصي..."
  },
  {
    id: "R6",
    court: "محكمة النقض",
    year: "88",
    rulingNumber: "1122",
    category: "مدني",
    date: "2023-10-15",
    principle: "دعوى صحة ونفاذ عقد البيع تهدف إلى نقل الملكية، ويجب أن يكون العقد مستوفياً لأركانه القانونية لإجابة الطلبات فيها.",
    fullText: "المقصود بدعوى صحة ونفاذ عقد البيع هو تنفيذ التزامات البائع بنقل الملكية تنفيذاً عينياً، ويشترط لقبولها أن يكون البيع وارداً على عقار مملوك للبائع..."
  },
  {
    id: "R7",
    court: "محكمة النقض",
    year: "90",
    rulingNumber: "4455",
    category: "جنائي",
    date: "2024-01-20",
    principle: "الاعتراف الذي يصدر نتيجة إكراه مادي أو معنوي لا يعتد به كدليل في الإدانة، ويجب على المحكمة استظهار الظروف التي صدر فيها الاعتراف.",
    fullText: "من القواعد المستقرة أن الاعتراف لكي يكون صحيحاً يجب أن يكون اختيارياً صادراً عن إرادة حرة، فإذا ما شاب الإرادة عيب الإكراه وجب استبعاد الاعتراف..."
  },
  {
    id: "R8",
    court: "محكمة النقض",
    year: "91",
    rulingNumber: "6677",
    category: "عمالي",
    date: "2024-02-25",
    principle: "الفصل التعسفي يوجب التعويض للعامل، وعبء إثبات جدية سبب الفصل يقع على عاتق صاحب العمل.",
    fullText: "حيث أن علاقة العمل محمية بموجب القانون، فإن إنهاء صاحب العمل للعقد دون سبب مشروع يعتبر فصلاً تعسفياً يستوجب التعويض الجابر للضرر..."
  },
  {
    id: "R9",
    court: "محكمة النقض",
    year: "93",
    rulingNumber: "8899",
    category: "إيجارات",
    date: "2024-04-10",
    principle: "امتداد عقد الإيجار للأقارب حتى الدرجة الأولى يشترط الإقامة الهادئة والمستقرة مع المستأجر الأصلي وقت الوفاة أو الترك لمدة سنة على الأقل.",
    fullText: "من المقرر في قضاء هذه المحكمة أن حق المستفيد في الامتداد القانوني لعقد الإيجار ينشأ من واقعة الإقامة الفعلية مع المستأجر الأصلي..."
  },
  {
    id: "R10",
    court: "محكمة النقض",
    year: "87",
    rulingNumber: "2233",
    category: "تجاري",
    date: "2023-09-01",
    principle: "التقادم المسقط للحق في المطالبة بالحقوق التجارية هو خمس سنوات ما لم ينص القانون على غير ذلك.",
    fullText: "المادة 68 من قانون التجارة نصت على تقادم الدعاوى الناشئة عن التزامات التجار قبل بعضهم البعض بمرور خمس سنوات من تاريخ استحقاق الالتزام..."
  }
];

export default function LawLibrary() {
  const [selectedRulingId, setSelectedRulingId] = useState<string | null>(MOCK_RULINGS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourt, setFilterCourt] = useState("الكل");
  const [filterYear, setFilterYear] = useState("");
  const [filterNumber, setFilterNumber] = useState("");

  const selectedRuling = MOCK_RULINGS.find(r => r.id === selectedRulingId);

  const filteredRulings = MOCK_RULINGS.filter(r => {
    const matchesSearch = r.principle.includes(searchQuery) || r.fullText.includes(searchQuery);
    const matchesCourt = filterCourt === "الكل" || r.court === filterCourt;
    const matchesYear = filterYear ? r.year === filterYear : true;
    const matchesNumber = filterNumber ? r.rulingNumber === filterNumber : true;
    return matchesSearch && matchesCourt && matchesYear && matchesNumber;
  });

  const handleCopyPrinciple = () => {
    if (selectedRuling) {
      navigator.clipboard.writeText(selectedRuling.principle);
      toast.success("تم نسخ المبدأ القانوني إلى الحافظة");
    }
  };

  const handleAttachToMemo = () => {
    if (selectedRuling) {
      toast.success("تم حفظ المبدأ في 'المسودات القانونية' بنجاح", {
        description: "يمكنك استخدامه لاحقاً عند صياغة مذكراتك."
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Scale className="text-primary-500" />
            مكتبة الأحكام القضائية
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">البحث في أحدث المبادئ القانونية الصادرة عن محكمة النقض والإدارية العليا.</p>
        </div>
      </div>

      {/* Advanced Search Bar */}
      <Card className="border-none shadow-sm dark:bg-navy-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1 space-y-2">
            <label className="text-xs font-bold text-slate-500">البحث بالكلمة</label>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                placeholder="ابحث في المبادئ..." 
                className="ps-10 border-slate-200 dark:border-white/10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500">المحكمة</label>
            <select 
              title="المحكمة"
              className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
              value={filterCourt}
              onChange={(e) => setFilterCourt(e.target.value)}
            >
              <option value="الكل">جميع المحاكم</option>
              <option value="محكمة النقض">محكمة النقض</option>
              <option value="الإدارية العليا">الإدارية العليا</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500">رقم الطعن</label>
            <div className="relative">
              <Hash className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                placeholder="رقم الطعن..." 
                className="ps-10 border-slate-200 dark:border-white/10"
                value={filterNumber}
                onChange={(e) => setFilterNumber(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500">السنة القضائية</label>
            <div className="relative">
              <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                placeholder="السنة (مثلاً 90 ق)" 
                className="ps-10 border-slate-200 dark:border-white/10"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Split View */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Results Sidebar (Right in RTL, but we'll put it on the right) */}
        <div className="w-1/3 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 px-2">
            <span>نتائج البحث: {filteredRulings.length} حكم</span>
          </div>
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-3">
              {filteredRulings.map((ruling) => (
                <Card 
                  key={ruling.id} 
                  className={cn(
                    "cursor-pointer transition-all border-none hover:shadow-md",
                    selectedRulingId === ruling.id 
                      ? "ring-2 ring-primary-500 bg-primary-50/50 dark:bg-primary-900/10" 
                      : "bg-white dark:bg-navy-800"
                  )}
                  onClick={() => setSelectedRulingId(ruling.id)}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {ruling.category}
                      </Badge>
                      <span className="text-[10px] text-slate-400">{ruling.date}</span>
                    </div>
                    <h4 className="text-sm font-bold text-navy-900 dark:text-white line-clamp-2 leading-relaxed">
                      {ruling.principle}
                    </h4>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><Gavel size={10} /> {ruling.court}</span>
                      <span className="flex items-center gap-1"><Hash size={10} /> {ruling.rulingNumber} لسنة {ruling.year} ق</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredRulings.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                  <Search size={40} className="mx-auto mb-4 opacity-20" />
                  <p>لا توجد نتائج تطابق بحثك</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Content Area (Left) */}
        <Card className="flex-1 border-none shadow-sm dark:bg-navy-900 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {selectedRuling ? (
              <motion.div 
                key={selectedRuling.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                {/* Header Actions */}
                <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary-500 text-white rounded-lg">
                      <Gavel size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-navy-900 dark:text-white">تفاصيل الحكم القضائي</h3>
                      <p className="text-xs text-slate-500">{selectedRuling.court} — طعن رقم {selectedRuling.rulingNumber} لسنة {selectedRuling.year} ق</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleCopyPrinciple}>
                      <Copy size={14} />
                      نسخ المبدأ
                    </Button>
                    <Button className="gap-2 bg-primary-600 hover:bg-primary-700 text-white" onClick={handleAttachToMemo}>
                      <Bookmark size={14} />
                      إرفاق في مذكرة
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 p-6">
                  <div className="max-w-3xl mx-auto space-y-8">
                    <section className="space-y-4">
                      <div className="flex items-center gap-2 text-primary-600 font-bold">
                        <Info size={18} />
                        <h4>المبدأ القانوني</h4>
                      </div>
                      <div className="p-6 bg-primary-50/30 dark:bg-primary-900/10 border-r-4 border-primary-500 rounded-lg">
                        <p className="text-lg leading-loose font-bold text-navy-900 dark:text-white text-justify">
                          "{selectedRuling.principle}"
                        </p>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                        <FileText size={18} />
                        <h4>منطوق الحكم وأسبابه</h4>
                      </div>
                      <div className="text-justify leading-loose text-slate-600 dark:text-slate-400 space-y-4">
                        <p>{selectedRuling.fullText}</p>
                        <p>... ومن حيث أن هذا النعي سديد، ذلك أن المقرر في قضاء هذه المحكمة أن الخطأ الموجب للمسؤولية هو انحراف عن السلوك المألوف للشخص العادي، ولما كان الحكم المطعون فيه قد خالف هذا النظر فإنه يكون قد أخطأ في تطبيق القانون مما يستوجب نقضه.</p>
                      </div>
                    </section>
                  </div>
                </ScrollArea>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <FileText size={64} className="mb-4 opacity-10" />
                <p>اختر حكماً من القائمة لعرض تفاصيله</p>
              </div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
