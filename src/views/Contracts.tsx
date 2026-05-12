import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Download, Save, History, Wand2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { draftLegalDocument } from "@/services/ai";
import { useCLMStore } from "@/store/useCLMStore";
import { saveContractTemplate } from "@/services/legalDataService";

export default function Contracts() {
  const addContractTemplate = useCLMStore((s) => s.addContractTemplate);
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("تجاري");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("يرجى إدخال وصف للعقد المطلوب");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await draftLegalDocument(`عقد ${category}`, prompt);
      setGeneratedContent(result);
      toast.success("تم توليد مسودة العقد بنجاح");
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!generatedContent.trim()) {
      toast.error("لا يوجد نص لحفظه — ولّد مسودة أولاً أو الصق نصاً في المحرر");
      return;
    }
    const cat = category as "تجاري" | "عمالي" | "عقاري" | "أحوال شخصية";
    const templateId = `TMPL-${Date.now()}`;
    const title = `نموذج ${cat} — ${new Date().toLocaleDateString("ar-EG")}`;
    const desc = prompt.slice(0, 200) || "نموذج محفوظ من صانع العقود";

    addContractTemplate({
      id: templateId,
      title: title,
      description: desc,
      content: generatedContent,
      category: cat,
    });
    
    try {
      await saveContractTemplate({
        title: title,
        category: cat,
        content: generatedContent,
        is_system: false
      });
      toast.success("تم حفظ النموذج في مكتبة العقود");
    } catch (e) {
      console.error(e);
      toast.error("حدث خطأ أثناء الحفظ في قاعدة البيانات");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">صانع العقود الذكي</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">استخدم الذكاء الاصطناعي لصياغة ومراجعة العقود وفقاً للقوانين المصرية.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => toast.info("سجل العقود: لديك 5 مسودات سابقة.")}>
            <History size={18} />
            السجل
          </Button>
          <Button type="button" className="bg-primary-500 hover:bg-primary-600 text-white gap-2" onClick={handleSaveAsTemplate}>
            <Save size={18} />
            حفظ كنموذج
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm dark:bg-navy-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Wand2 size={20} className="text-primary-500" />
                توليد عقد جديد
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">نوع العقد</label>
                <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                  <SelectTrigger className="bg-slate-50 dark:bg-white/5 border-none">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="تجاري">تجاري</SelectItem>
                    <SelectItem value="عمالي">عمالي</SelectItem>
                    <SelectItem value="عقاري">عقاري</SelectItem>
                    <SelectItem value="أحوال شخصية">أحوال شخصية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">وصف العقد والأطراف</label>
                <Textarea 
                  placeholder="مثال: عقد توريد مواد بناء بين شركة أ وشركة ب، مع تحديد شروط الدفع والتسليم..." 
                  className="min-h-[150px] bg-slate-50 dark:bg-white/5 border-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <Button 
                className="w-full bg-primary-500 hover:bg-primary-600 text-white gap-2"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                توليد المسودة بالذكاء الاصطناعي
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm dark:bg-navy-800">
            <CardHeader>
              <CardTitle className="text-sm font-bold">نصيحة قانونية ذكية</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 leading-relaxed">
                تأكد من مراجعة البنود المتعلقة بالقوة القاهرة، التحكيم، والقانون الواجب التطبيق بما يتوافق مع القانون المدني المصري.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-none shadow-sm dark:bg-navy-800 h-full min-h-[600px] flex flex-col">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">مسودة العقد</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => {
                  if (!generatedContent.trim()) {
                    toast.error("لا يوجد نص لتصديره");
                    return;
                  }
                  toast.success("جاري تجهيز العقد للطباعة/PDF...");
                  setTimeout(() => window.print(), 500);
                }}>
                  <Download size={16} />
                  تصدير PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <Textarea 
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                placeholder="سيظهر العقد المولد هنا..."
                className="w-full h-full min-h-[500px] p-6 bg-transparent border-none resize-none focus-visible:ring-0 font-serif text-lg leading-loose"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
