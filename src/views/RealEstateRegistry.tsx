import { useState } from "react";
import { motion } from "motion/react";
import { formatEGP, formatDateEG } from "@/lib/formatEG";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, FileText, Search, Plus, Map, Building, Scale, MapPin, CheckCircle, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// --- Mock Data ---
const MOCK_REQUESTS = [
  { id: "SH-2024-1042", type: "تسجيل عقد بيع عقاري", date: "2024-05-10", stage: "فحص فني", expectedDate: "2024-06-10", fees: 25150 },
  { id: "SH-2024-0988", type: "توكيل عام قضايا", date: "2024-05-12", stage: "تم التوثيق", expectedDate: "2024-05-12", fees: 150 },
];

const STEPS = [
  { id: 1, title: "أطراف العقد" },
  { id: 2, title: "بيانات العقار" },
  { id: 3, title: "الثمن والسداد" },
  { id: 4, title: "شروط العقد" },
  { id: 5, title: "المستندات" },
  { id: 6, title: "الرسوم" },
  { id: 7, title: "المراجعة" },
];

export default function RealEstateRegistry() {
  const [activeTab, setActiveTab] = useState("registry");
  const [searchTerm, setSearchTerm] = useState('');
  
  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    contractType: "sale",
    sellerName: "",
    sellerId: "",
    buyerName: "",
    buyerId: "",
    propertyAddress: "",
    propertyType: "apartment",
    area: "",
    price: "",
    terms: "",
    docs: {
      initialContract: false,
      ids: false,
      commercialRegister: false,
      taxClearance: false,
      stamp: false,
      surveyPlan: false
    },
    agreement: false
  });

  const priceNum = parseFloat(formData.price) || 0;
  const fees = {
    registry: priceNum * 0.025,
    stamp: priceNum * 0.005,
    admin: 150,
    total: (priceNum * 0.025) + (priceNum * 0.005) + 150
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.sellerName || !formData.buyerName || formData.sellerId.length !== 14 || formData.buyerId.length !== 14) {
        toast.error("يرجى إكمال بيانات الأطراف والتأكد من صحة الأرقام القومية (14 رقم)");
        return;
      }
    }
    if (currentStep === 2 && (!formData.propertyAddress || !formData.area)) {
      toast.error("يرجى إدخال بيانات العقار");
      return;
    }
    if (currentStep === 3 && !formData.price) {
      toast.error("يرجى إدخال الثمن");
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 7));
  };

  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = () => {
    if (!formData.agreement) {
      toast.error("يجب الموافقة على الإقرار بصحة البيانات");
      return;
    }
    toast.success(`تم تقديم الطلب بنجاح! رقم الطلب: SH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setIsWizardOpen(false);
    setCurrentStep(1);
    setFormData({
      contractType: "sale", sellerName: "", sellerId: "", buyerName: "", buyerId: "",
      propertyAddress: "", propertyType: "apartment", area: "", price: "", terms: "",
      docs: { initialContract: false, ids: false, commercialRegister: false, taxClearance: false, stamp: false, surveyPlan: false },
      agreement: false
    });
  };

  const renderStageBadge = (stage: string) => {
    if (stage.includes("تم")) return <Badge className="bg-emerald-50 text-emerald-700 border-none"><CheckCircle size={12} className="me-1"/> {stage}</Badge>;
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{stage}</Badge>;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">الشهر العقاري والتوثيق</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">متابعة إجراءات التوثيق والتسجيل بمكاتب الشهر العقاري.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b border-slate-200 dark:border-white/10 rounded-none h-auto p-0 bg-transparent gap-6">
          <TabsTrigger value="registry" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1a5c3a] data-[state=active]:text-[#1a5c3a] dark:data-[state=active]:text-emerald-400 dark:data-[state=active]:border-emerald-400 data-[state=active]:bg-transparent py-3 px-1 font-bold text-slate-500">الشهر والتوثيق</TabsTrigger>
          <TabsTrigger value="inkind" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1a5c3a] data-[state=active]:text-[#1a5c3a] dark:data-[state=active]:text-emerald-400 dark:data-[state=active]:border-emerald-400 data-[state=active]:bg-transparent py-3 px-1 font-bold text-slate-500">السجل العيني</TabsTrigger>
          <TabsTrigger value="survey" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1a5c3a] data-[state=active]:text-[#1a5c3a] dark:data-[state=active]:text-emerald-400 dark:data-[state=active]:border-emerald-400 data-[state=active]:bg-transparent py-3 px-1 font-bold text-slate-500">الرفع المساحي</TabsTrigger>
          <TabsTrigger value="units" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1a5c3a] data-[state=active]:text-[#1a5c3a] dark:data-[state=active]:text-emerald-400 dark:data-[state=active]:border-emerald-400 data-[state=active]:bg-transparent py-3 px-1 font-bold text-slate-500">الوحدات العقارية</TabsTrigger>
        </TabsList>

        <TabsContent value="registry" className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-slate-200 dark:border-white/10 shadow-sm dark:bg-navy-800 hover:border-emerald-300 transition-colors cursor-pointer" onClick={() => setIsWizardOpen(true)}>
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-900 dark:text-white mb-1">تسجيل العقود</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">عقود البيع والرهن العقاري</p>
                  <p className="text-[11px] text-emerald-600/80 font-mono" dir="ltr">ق. 114/1946</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 dark:border-white/10 shadow-sm dark:bg-navy-800 hover:border-blue-300 transition-colors cursor-pointer">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center shrink-0">
                  <Home className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-900 dark:text-white mb-1">توثيق التوكيلات الرسمية</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">توكيلات عامة وخاصة في القضايا</p>
                  <p className="text-[11px] text-blue-600/80 font-mono" dir="ltr">ق. 68/1947</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 dark:border-white/10 shadow-sm dark:bg-navy-800 hover:border-violet-300 transition-colors cursor-pointer">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-xl flex items-center justify-center shrink-0">
                  <Building className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-900 dark:text-white mb-1">محاضر الصلح والاتفاق</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">توثيق عقود الصلح الرسمية</p>
                  <p className="text-[11px] text-violet-600/80 font-mono" dir="ltr">م. 549 مدني</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 dark:border-white/10 shadow-sm dark:bg-navy-800 hover:border-amber-300 transition-colors cursor-pointer">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center shrink-0">
                  <Home className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-900 dark:text-white mb-1">إشهار الشركات</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">تسجيل عقود تأسيس وتعديل الشركات</p>
                  <p className="text-[11px] text-amber-600/80 font-mono" dir="ltr">ق. 159/1981</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-slate-200 dark:border-white/10 shadow-sm dark:bg-navy-800">
            <CardHeader className="pb-4 border-b border-slate-50 dark:border-white/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1a5c3a]" /> طلبات الشهر العقاري
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input placeholder="بحث برقم الطلب..." className="pr-10 dark:bg-navy-900 w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                  <Button className="bg-[#1a5c3a] hover:bg-[#124229] text-white gap-2 font-bold px-4 rounded-md shadow-sm" onClick={() => setIsWizardOpen(true)}>
                    <Plus size={18}/> طلب جديد
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-white/5">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">رقم الطلب</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">نوع العقد</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">تاريخ الإيداع</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">المرحلة</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">تاريخ الشهر المتوقع</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">رسوم الشهر</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_REQUESTS.map(req => (
                    <TableRow key={req.id}>
                      <TableCell className="font-bold text-navy-900 dark:text-white">{req.id}</TableCell>
                      <TableCell>{req.type}</TableCell>
                      <TableCell>{formatDateEG(req.date)}</TableCell>
                      <TableCell>{renderStageBadge(req.stage)}</TableCell>
                      <TableCell className="font-mono text-sm">{formatDateEG(req.expectedDate)}</TableCell>
                      <TableCell className="font-bold text-emerald-600">{formatEGP(req.fees)}</TableCell>
                    </TableRow>
                  ))}
                  {MOCK_REQUESTS.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16 text-slate-500">
                        <div className="flex flex-col items-center gap-3">
                          <FileText size={32} className="text-slate-300 dark:text-slate-600" />
                          <p>لا توجد طلبات مسجلة</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inkind">
          <div className="py-24 text-center text-slate-500 border rounded-xl border-dashed dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-6">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-2">السجل العيني (ق. 142 لسنة 1964)</h3>
            <p>التسجيل الأول للعقار ونقل الملكية في السجل العيني، وقيد الحقوق العينية الأصلية والتبعية.</p>
          </div>
        </TabsContent>
        <TabsContent value="survey">
          <div className="py-24 text-center text-slate-500 border rounded-xl border-dashed dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-6">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-2">الرفع المساحي (ق. 10 لسنة 1997)</h3>
            <p>طلب كشف تحديد مساحي، رفع إحداثيات WGS84، وربط بيانات الرفع المساحي بالهيئة المصرية العامة للمساحة.</p>
          </div>
        </TabsContent>
        <TabsContent value="units">
          <div className="py-24 text-center text-slate-500 border rounded-xl border-dashed dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-6">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-2">الوحدات العقارية (ق. 148 لسنة 2001)</h3>
            <p>تسجيل وحدات ومفرزات عقارية (شقق، فيلات، محلات تجارية) وحساب الحصص الشائعة في الأرض والأجزاء المشتركة.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Registry Request Wizard Modal */}
      <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-[850px] w-[95vw] p-0 overflow-hidden dark:bg-navy-900 border-slate-200 dark:border-white/10 shadow-2xl rounded-xl">
          
          <div className="flex bg-slate-50/80 dark:bg-navy-950 border-b border-slate-200 dark:border-white/10">
            {STEPS.map((step, idx) => (
              <div 
                key={step.id} 
                className={`flex-1 py-4 px-2 text-center border-b-2 transition-all ${currentStep === step.id ? 'border-[#1a5c3a] bg-[#eaf3de] dark:bg-emerald-900/20 dark:border-emerald-500' : currentStep > step.id ? 'border-[#2d6a4f] text-[#2d6a4f] dark:border-emerald-700 dark:text-emerald-500' : 'border-transparent text-slate-400'}`}
              >
                <div className={`text-xs font-bold mb-1 ${currentStep === step.id ? 'text-[#1a5c3a] dark:text-emerald-400' : currentStep > step.id ? 'text-[#2d6a4f] dark:text-emerald-500' : 'text-slate-400'}`}>{step.id}</div>
                <div className={`text-[11px] md:text-sm font-bold ${currentStep === step.id ? 'text-[#1a5c3a] dark:text-emerald-400' : currentStep > step.id ? 'text-[#2d6a4f] dark:text-emerald-500' : 'text-slate-500'}`}>
                  {step.title}
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">نوع الطلب <span className="text-red-500">*</span></Label>
                    <Select value={formData.contractType} onValueChange={(v) => setFormData({...formData, contractType: v as string})}>
                      <SelectTrigger><SelectValue placeholder="اختر نوع العقد" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sale">تسجيل عقد بيع عقاري</SelectItem>
                        <SelectItem value="mortgage">تسجيل عقد رهن رسمي</SelectItem>
                        <SelectItem value="proxy">توثيق توكيل رسمي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">الأساس القانوني</Label>
                    <Input value={formData.contractType === 'sale' ? 'ق. 114/1946 — م. 934 مدني' : ''} readOnly className="bg-slate-50 dark:bg-white/5 text-slate-500 font-bold" />
                  </div>
                  
                  <div className="col-span-2 mt-4"><hr className="border-slate-100 dark:border-white/5"/></div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">اسم البائع / المتنازل <span className="text-red-500">*</span></Label>
                    <Input value={formData.sellerName} onChange={e => setFormData({...formData, sellerName: e.target.value})} placeholder="الاسم رباعي مطابق للبطاقة" />
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">الرقم القومي (14 رقم) <span className="text-red-500">*</span></Label>
                    <Input maxLength={14} type="text" dir="ltr" className="text-right" value={formData.sellerId} onChange={e => setFormData({...formData, sellerId: e.target.value})} />
                  </div>

                  <div className="col-span-2 mt-2"><hr className="border-slate-100 dark:border-white/5"/></div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">اسم المشتري / المتنازل إليه <span className="text-red-500">*</span></Label>
                    <Input value={formData.buyerName} onChange={e => setFormData({...formData, buyerName: e.target.value})} placeholder="الاسم رباعي مطابق للبطاقة" />
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">الرقم القومي (14 رقم) <span className="text-red-500">*</span></Label>
                    <Input maxLength={14} type="text" dir="ltr" className="text-right" value={formData.buyerId} onChange={e => setFormData({...formData, buyerId: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2">
                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">العنوان التفصيلي للعقار <span className="text-red-500">*</span></Label>
                    <Input value={formData.propertyAddress} onChange={e => setFormData({...formData, propertyAddress: e.target.value})} placeholder="مثال: شقة رقم 5، الدور الثالث، عقار رقم 10 شارع طلعت حرب، القاهرة" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">نوع العقار <span className="text-red-500">*</span></Label>
                    <Select value={formData.propertyType} onValueChange={(v) => setFormData({...formData, propertyType: v as string})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">شقة سكنية</SelectItem>
                        <SelectItem value="villa">فيلا</SelectItem>
                        <SelectItem value="land">قطعة أرض فضاء</SelectItem>
                        <SelectItem value="commercial">محل تجاري</SelectItem>
                        <SelectItem value="building">عقار كامل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">المساحة (متر مربع) <span className="text-red-500">*</span></Label>
                    <Input type="number" dir="ltr" className="text-right" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2 max-w-md">
                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">الثمن الكلي (بالجنيه المصري) <span className="text-red-500">*</span></Label>
                    <Input type="number" dir="ltr" className="text-right font-bold text-lg" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                  </div>
                  <div className="bg-[#eaf3de] dark:bg-emerald-900/20 p-4 rounded-lg border border-[#52b788] dark:border-emerald-800 text-sm text-[#1a3a2a] dark:text-emerald-100 flex items-start gap-3">
                    <AlertTriangle size={20} className="shrink-0 text-[#2d6a4f] dark:text-emerald-500" />
                    <div>
                      <p className="font-bold mb-1">تنبيه قانوني (القانون 70 لسنة 1964):</p>
                      <p className="leading-relaxed">الثمن المُثبت في العقد هو الأساس لحساب رسوم الشهر العقاري وضريبة التصرفات العقارية. برجاء التأكد من كتابة الثمن الفعلي المتفق عليه بدقة، حيث سيتم حساب رسوم التسجيل (2.5%) وضريبة الدمغة تلقائياً في الخطوة القادمة.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">الشروط الخاصة بالبيع والتسليم (اختياري)</Label>
                  <Textarea rows={6} className="leading-relaxed" placeholder="مثال: يلتزم الطرف الأول (البائع) بتسليم العين المباعة خالية من أي شواغل أو رهون في موعد أقصاه..." value={formData.terms} onChange={e => setFormData({...formData, terms: e.target.value})} />
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-base font-bold text-[#1a5c3a] dark:text-emerald-400 mb-4">قائمة المستندات الإلزامية المطلوبة للإيداع</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`flex items-start space-x-3 rtl:space-x-reverse border rounded-lg p-4 cursor-pointer transition-colors ${formData.docs.initialContract ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-white/10'}`} onClick={() => setFormData({...formData, docs: {...formData.docs, initialContract: !formData.docs.initialContract}})}>
                    <Checkbox id="doc1" checked={formData.docs.initialContract} />
                    <div className="space-y-1">
                      <Label htmlFor="doc1" className="text-sm font-bold cursor-pointer">العقد الابتدائي</Label>
                      <p className="text-xs text-slate-500">أصل العقد الابتدائي الموقع من الطرفين</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-start space-x-3 rtl:space-x-reverse border rounded-lg p-4 cursor-pointer transition-colors ${formData.docs.ids ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-white/10'}`} onClick={() => setFormData({...formData, docs: {...formData.docs, ids: !formData.docs.ids}})}>
                    <Checkbox id="doc2" checked={formData.docs.ids} />
                    <div className="space-y-1">
                      <Label htmlFor="doc2" className="text-sm font-bold cursor-pointer">إثبات الشخصية</Label>
                      <p className="text-xs text-slate-500">صور بطاقات الرقم القومي سارية للأطراف</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-start space-x-3 rtl:space-x-reverse border rounded-lg p-4 cursor-pointer transition-colors ${formData.docs.taxClearance ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-white/10'}`} onClick={() => setFormData({...formData, docs: {...formData.docs, taxClearance: !formData.docs.taxClearance}})}>
                    <Checkbox id="doc3" checked={formData.docs.taxClearance} />
                    <div className="space-y-1">
                      <Label htmlFor="doc3" className="text-sm font-bold cursor-pointer">شهادة الضرائب</Label>
                      <p className="text-xs text-slate-500">شهادة خلو من الضرائب العقارية (مكلفة)</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-start space-x-3 rtl:space-x-reverse border rounded-lg p-4 cursor-pointer transition-colors ${formData.docs.surveyPlan ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-white/10'}`} onClick={() => setFormData({...formData, docs: {...formData.docs, surveyPlan: !formData.docs.surveyPlan}})}>
                    <Checkbox id="doc4" checked={formData.docs.surveyPlan} />
                    <div className="space-y-1">
                      <Label htmlFor="doc4" className="text-sm font-bold cursor-pointer">كشف التحديد المساحي</Label>
                      <p className="text-xs text-slate-500">استمارة التغيير المساحي من هيئة المساحة</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                  <div className="bg-slate-50 dark:bg-white/5 px-6 py-4 border-b border-slate-200 dark:border-white/10">
                    <h3 className="text-base font-bold text-navy-900 dark:text-white">تقدير رسوم الشهر والتوثيق (ق. 70/1964)</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold">%</div>
                        <div>
                          <p className="text-sm font-bold text-navy-900 dark:text-white">رسوم الشهر (2.5%)</p>
                          <p className="text-xs text-slate-500">نسبة من قيمة العقد المُصرح بها</p>
                        </div>
                      </div>
                      <span className="font-bold text-lg text-navy-900 dark:text-white">{formatEGP(fees.registry)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 font-bold">%</div>
                        <div>
                          <p className="text-sm font-bold text-navy-900 dark:text-white">ضريبة الدمغة (0.5%)</p>
                          <p className="text-xs text-slate-500">ضريبة نوعية على المحررات الرسمية</p>
                        </div>
                      </div>
                      <span className="font-bold text-lg text-navy-900 dark:text-white">{formatEGP(fees.stamp)}</span>
                    </div>

                    <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 font-bold">ج</div>
                        <div>
                          <p className="text-sm font-bold text-navy-900 dark:text-white">رسوم إدارية ونماذج</p>
                          <p className="text-xs text-slate-500">رسوم حفظ وبحث ونماذج مطبوعة</p>
                        </div>
                      </div>
                      <span className="font-bold text-lg text-navy-900 dark:text-white">{formatEGP(fees.admin)}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-bold text-[#1a3a2a] dark:text-emerald-400">إجمالي الرسوم المطلوبة</span>
                      <span className="text-2xl font-bold text-[#2d6a4f] dark:text-emerald-500">{formatEGP(fees.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4 dark:border-white/10">
                  <h3 className="text-lg font-bold text-[#1a5c3a] dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="text-[#52b788] dark:text-emerald-500" /> مراجعة بيانات الطلب النهائي
                  </h3>
                </div>
                
                <div className="bg-[#eaf3de] dark:bg-emerald-900/20 border border-[#52b788] dark:border-emerald-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-[#1a3a2a] dark:text-emerald-200 font-bold text-center">
                    بتقديم هذا الطلب تُقرّ بصحة جميع البيانات وفق أحكام القانون المدني المصري وقانون الشهر العقاري 114 لسنة 1946.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm bg-slate-50 dark:bg-white/5 p-6 rounded-xl">
                  <div className="text-slate-500">نوع الطلب</div>
                  <div className="font-bold text-end text-navy-900 dark:text-white">تسجيل عقد بيع عقاري</div>
                  
                  <div className="text-slate-500">الأساس القانوني</div>
                  <div className="font-bold text-end text-navy-900 dark:text-white">ق. 114/1946 — م. 934 مدني</div>
                  
                  <div className="col-span-2"><hr className="border-slate-200 dark:border-white/10"/></div>

                  <div className="text-slate-500">البائع (المتنازل)</div>
                  <div className="font-bold text-end text-navy-900 dark:text-white">{formData.sellerName || '—'}</div>
                  
                  <div className="text-slate-500">المشتري (المتنازل إليه)</div>
                  <div className="font-bold text-end text-navy-900 dark:text-white">{formData.buyerName || '—'}</div>
                  
                  <div className="col-span-2"><hr className="border-slate-200 dark:border-white/10"/></div>

                  <div className="text-slate-500">العقار والمساحة</div>
                  <div className="font-bold text-end text-navy-900 dark:text-white">{formData.propertyAddress} ({formData.area} م²)</div>
                  
                  <div className="text-slate-500">الثمن الكلي المكتوب بالعقد</div>
                  <div className="font-bold text-end text-navy-900 dark:text-white">{formData.price ? formatEGP(Number(formData.price)) : '—'}</div>
                  
                  <div className="text-slate-500">تاريخ التقديم</div>
                  <div className="font-bold text-end text-navy-900 dark:text-white">{formatDateEG(new Date().toISOString())}</div>
                </div>

                <div className="bg-white dark:bg-navy-800 p-5 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm mt-6 flex items-start space-x-3 rtl:space-x-reverse cursor-pointer" onClick={() => setFormData({...formData, agreement: !formData.agreement})}>
                  <Checkbox id="agreement" checked={formData.agreement} className="mt-0.5 data-[state=checked]:bg-[#1a5c3a] data-[state=checked]:border-[#1a5c3a]" />
                  <Label htmlFor="agreement" className="text-sm leading-relaxed font-bold cursor-pointer text-[#1a3a2a] dark:text-slate-200">
                    أُقِرُّ بأن جميع البيانات صحيحة ومطابقة للحقيقة، وأن المستندات مستوفاة وفقاً لأحكام قانون الشهر العقاري المصري رقم 114 لسنة 1946 وتعديلاته، وأتحمل المسئولية القانونية الكاملة عن أي بيانات خاطئة أو مستندات غير صحيحة.
                  </Label>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t dark:border-white/10 bg-slate-50 dark:bg-navy-950 flex sm:justify-between items-center gap-4 rounded-b-xl">
            <Button variant="outline" onClick={handlePrev} disabled={currentStep === 1} className="gap-2 bg-white dark:bg-navy-900 border-slate-200 dark:border-white/10 hover:bg-slate-100">
              <ChevronRight size={16} className="rtl:hidden" />
              <ChevronLeft size={16} className="ltr:hidden" />
              السابق
            </Button>
            
            <div className="text-sm font-bold text-slate-500">الخطوة {currentStep} من 7</div>

            {currentStep < 7 ? (
              <Button onClick={handleNext} className="gap-2 bg-white border border-slate-200 dark:bg-navy-800 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 px-6 shadow-sm">
                التالي
                <ChevronLeft size={16} className="rtl:hidden" />
                <ChevronRight size={16} className="ltr:hidden" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="gap-2 bg-[#2d6a4f] hover:bg-[#1a4a35] text-white font-bold px-8 py-6 h-auto text-base">
                <FileText size={18} />
                تقديم الطلب
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
