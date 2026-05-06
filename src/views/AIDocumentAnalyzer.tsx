import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileSearch, ListChecks, Scale, Loader2, Download, Copy, FileText, LayoutTemplate, User, Briefcase } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { analyzeLegalDocument } from "@/services/ai";
import { EGYPTIAN_TEMPLATES } from "@/services/ai/egyptianTemplates";
import { useCasesStore } from "@/store/useCasesStore";
import { useClientsStore } from "@/store/useClientsStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export default function AIDocumentAnalyzer() {
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");

  const cases = useCasesStore(state => state.cases);
  const clients = useClientsStore(state => state.clients);

  const selectedCase = useMemo(() => cases.find(c => c.id === selectedCaseId), [cases, selectedCaseId]);
  const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId), [clients, selectedClientId]);

  const handleAnalyze = async () => {
    if (!content.trim()) {
      toast.error("يرجى إدخال نص الوثيقة للتحليل");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeLegalDocument(content);
      setAnalysis(result);
      toast.success("تم تحليل الوثيقة بنجاح");
    } catch (error) {
      console.error(error);
      toast.error("فشل التحليل. تأكد من إعداد Gemini API.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fillTemplate = (template: any) => {
    let filled = template.template;
    
    // Auto-fill placeholders if case/client is selected
    const data: Record<string, string> = {
      'اسم_الموكل': selectedClient?.name || (selectedCase?.plaintiff || ""),
      'رقم_التوكيل': selectedCase?.powerOfAttorneyRef || "",
      'رقم_الدعوى': selectedCase?.id || "",
      'المحكمة': selectedCase?.court || "",
      'الدائرة': selectedCase?.circuit || "",
      'المدعى_عليه': selectedCase?.defendant || "",
      'اسم_المحامي': "الأستاذ/ محمد حسيني", // Default or current user
      'التاريخ': new Date().toLocaleDateString('ar-EG'),
    };

    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      filled = filled.replace(regex, value || `[${key}]`);
    });

    setContent(filled.trim());
    toast.success(`تم تحميل قالب: ${template.title}`);
  };

  const handleExportPDF = async () => {
    const element = document.getElementById("analysis-result");
    if (!element) return;

    setIsAnalyzing(true);
    try {
      const [jsPDFModule, html2canvasModule] = await Promise.all([
        import("jspdf"),
        import("html2canvas")
      ]);
      
      const jsPDF = jsPDFModule.default;
      const html2canvas = html2canvasModule.default;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`legal-document-${Date.now()}.pdf`);
      toast.success("تم تصدير الملف بنجاح");
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("فشل تصدير الملف");
    } finally {
      setIsAnalyzing(false);
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
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">المحلل القانوني والمساعد الذكي</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">تحليل الوثائق القانونية، استخراج الدفوع، وصياغة العقود باستخدام القوالب المصرية.</p>
        </div>
        <Badge className="bg-accent-500 text-navy-900 font-bold px-3 py-1">مدعوم بـ Gemini AI</Badge>
      </div>

      <Tabs defaultValue="analyzer" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-white/5">
          <TabsTrigger value="analyzer" className="gap-2">
            <FileSearch size={16} /> المحلل الذكي
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <LayoutTemplate size={16} /> القوالب المصرية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyzer" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm dark:bg-navy-800 flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <FileSearch size={20} className="text-primary-500" />
                  نص الوثيقة
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                <Textarea 
                  placeholder="قم بلصق نص لائحة الدعوى، صك الحكم، أو أي وثيقة قانونية هنا..." 
                  className="flex-1 min-h-[400px] bg-slate-50 dark:bg-white/5 border-none resize-none p-4 leading-relaxed"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <Button 
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white h-12 gap-2"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  بدء التحليل الذكي
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm dark:bg-navy-800 flex flex-col">
              <CardHeader className="border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ListChecks size={20} className="text-emerald-500" />
                  نتائج التحليل / المستند
                </CardTitle>
                {(analysis || content) && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                      navigator.clipboard.writeText(analysis || content);
                      toast.success("تم النسخ للحافظة");
                    }}>
                      <Copy size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExportPDF}>
                      <Download size={16} />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1 p-6 overflow-y-auto max-h-[550px]" id="analysis-result">
                {isAnalyzing ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 text-slate-500">
                    <Loader2 size={48} className="animate-spin text-primary-500" />
                    <p className="animate-pulse">جاري معالجة المستند...</p>
                  </div>
                ) : analysis ? (
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap leading-loose text-slate-700 dark:text-slate-300 font-serif">
                      {analysis}
                    </div>
                  </div>
                ) : content ? (
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap leading-loose text-slate-700 dark:text-slate-300 font-serif p-4 border rounded-md">
                      {content}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-slate-400">
                    <Scale size={64} className="opacity-10" />
                    <p>بانتظار إدخال النص لبدء التحليل أو اختيار قالب</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-100 dark:border-white/5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User size={14} className="text-primary-500" /> اختيار الموكل (للتعبئة التلقائية)
              </Label>
              <select 
                className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
              >
                <option value="">— اختر موكلاً —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Briefcase size={14} className="text-primary-500" /> اختيار القضية
              </Label>
              <select 
                className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
                value={selectedCaseId}
                onChange={e => setSelectedCaseId(e.target.value)}
              >
                <option value="">— اختر قضية —</option>
                {cases.map(c => <option key={c.id} value={c.id}>{c.id} - {c.plaintiff}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EGYPTIAN_TEMPLATES.map((template) => (
              <Card 
                key={template.id} 
                className="hover:shadow-md transition-shadow cursor-pointer border-slate-100 dark:border-white/5 dark:bg-navy-800"
                onClick={() => fillTemplate(template)}
              >
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600">
                      <FileText size={20} />
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{template.category}</Badge>
                  </div>
                  <CardTitle className="text-sm font-bold mt-3 text-navy-900 dark:text-white">
                    {template.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-slate-500 line-clamp-2">
                    قالب جاهز للصياغة القانونية مع إمكانية التعبئة الآلية.
                  </p>
                  <Button variant="link" className="p-0 h-auto text-xs mt-2 text-primary-600">
                    استخدام القالب
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
