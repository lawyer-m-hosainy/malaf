import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Library, Search, FileText, Download, Tag, Calendar, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useComplianceStore } from '@/store/useComplianceStore';
import { useState } from "react";

export default function LegalLibrary() {
  const precedents = useComplianceStore((state) => state.precedents);
  const addPrecedent = useComplianceStore((state) => state.addPrecedent);
  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedPrecedentId, setSelectedPrecedentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedPrecedent = precedents.find(p => p.id === selectedPrecedentId);
  
  const filteredPrecedents = precedents.filter((p) =>
    p.title.includes(searchTerm) ||
    p.category.includes(searchTerm) ||
    p.summary.includes(searchTerm) ||
    p.tags.some((t) => t.includes(searchTerm))
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">المكتبة القانونية</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">أرشفة المذكرات النموذجية، السوابق القضائية، والبحوث القانونية للمكتب.</p>
        </div>
        <Button type="button" className="bg-primary-500 hover:bg-primary-600 text-white gap-2" onClick={() => setAddOpen(true)}>
          <FileText size={18} />
          إضافة مستند جديد
        </Button>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg border-none shadow-2xl dark:bg-navy-900">
          <DialogHeader>
            <DialogTitle className="font-bold">إضافة مستند إلى المكتبة</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const title = String(fd.get("title") || "").trim();
              const category = String(fd.get("category") || "").trim() || "عام";
              const summary = String(fd.get("summary") || "").trim();
              const tagsRaw = String(fd.get("tags") || "").trim();
              if (!title) {
                toast.error("أدخل عنوان المستند");
                return;
              }
              const tags = tagsRaw ? tagsRaw.split(/[,،]/).map((t) => t.trim()).filter(Boolean) : ["مكتبة"];
              addPrecedent({
                id: `LP-${Date.now()}`,
                title,
                category,
                summary: summary || "—",
                tags,
                date: new Date().toISOString().slice(0, 10),
              });
              toast.success("تمت إضافة المستند");
              setAddOpen(false);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="lp-title">العنوان</Label>
              <Input id="lp-title" name="title" required placeholder="عنوان المذكرة أو السابقة" className="dark:bg-white/5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lp-cat">التصنيف</Label>
              <Input id="lp-cat" name="category" placeholder="مثال: تجاري، عمالي" className="dark:bg-white/5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lp-sum">ملخص</Label>
              <Textarea id="lp-sum" name="summary" placeholder="ملخص قصير" className="min-h-[100px] dark:bg-white/5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lp-tags">وسوم (مفصولة بفاصلة)</Label>
              <Input id="lp-tags" name="tags" placeholder="تجاري، عقود" className="dark:bg-white/5" />
            </div>
            <Button type="submit" className="w-full bg-primary-600 text-white hover:bg-primary-700">
              حفظ
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-lg border-none shadow-2xl dark:bg-navy-900">
          <DialogHeader>
            <DialogTitle className="font-bold flex items-center gap-2">
              <FileText className="text-primary-500" />
              {selectedPrecedent?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedPrecedent && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-primary-600 border-primary-100 dark:border-primary-900/30">
                  {selectedPrecedent.category}
                </Badge>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar size={14} />
                  {selectedPrecedent.date}
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                <h4 className="text-sm font-bold mb-2">الملخص والتفاصيل</h4>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {selectedPrecedent.summary}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedPrecedent.tags.map(tag => (
                  <div key={tag} className="flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-white/5 px-2 py-1 rounded text-slate-500">
                    <Tag size={10} />
                    {tag}
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-white/5">
                <Button variant="outline" onClick={() => setViewOpen(false)}>إغلاق</Button>
                <Button className="gap-2 bg-primary-600 hover:bg-primary-700 text-white" onClick={() => {
                  toast.success(`تم تحميل المستند: ${selectedPrecedent.title}`);
                  setViewOpen(false);
                }}>
                  <Download size={16} />
                  تحميل المستند
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <Input 
              placeholder="البحث في السوابق القضائية، المذكرات، أو التصنيفات..." 
              className="ps-10 h-12 bg-slate-50 dark:bg-white/5 border-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPrecedents.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-500">لا توجد نتائج مطابقة للبحث.</div>
        ) : (
          filteredPrecedents.map((precedent) => (
            <Card key={precedent.id} className="border-none shadow-sm dark:bg-navy-800 hover:ring-2 hover:ring-primary-500/20 transition-all group">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-primary-600 border-primary-100 dark:border-primary-900/30">
                  {precedent.category}
                </Badge>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar size={14} />
                  {precedent.date}
                </div>
              </div>
              <CardTitle className="text-lg font-bold mt-2 group-hover:text-primary-600 transition-colors">
                {precedent.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                {precedent.summary}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {precedent.tags.map(tag => (
                  <div key={tag} className="flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-white/5 px-2 py-1 rounded text-slate-500">
                    <Tag size={10} />
                    {tag}
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center gap-2 border-t border-slate-100 dark:border-white/5">
                <Button variant="outline" size="sm" className="flex-1 gap-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors" onClick={() => toast.success(`تم بدء تحميل المستند: ${precedent.title}`)}>
                  <Download size={14} />
                  تحميل
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors" onClick={() => {
                  setSelectedPrecedentId(precedent.id);
                  setViewOpen(true);
                }}>
                  <ExternalLink size={14} />
                  عرض
                </Button>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>
    </motion.div>
  );
}
