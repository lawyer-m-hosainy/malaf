import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Plus, FileText, Bookmark, Tag, ChevronLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from '@/store/useUIStore';
import { useComplianceStore } from '@/store/useComplianceStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function InternalWiki() {
  const wikiArticles = useUIStore((state) => state.wikiArticles);
  const addWikiArticle = useUIStore((state) => state.addWikiArticle);
  const knowledgeAssets = useComplianceStore((state) => state.knowledgeAssets);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'wiki' | 'assets'>('assets');
  const [articleOpen, setArticleOpen] = useState(false);
  const [wikiCategory, setWikiCategory] = useState<"أبحاث" | "إجراءات" | "نماذج" | "أنظمة">("إجراءات");

  const categories = [
    { name: 'أبحاث', count: 12, color: 'bg-blue-500' },
    { name: 'إجراءات', count: 8, color: 'bg-emerald-500' },
    { name: 'نماذج', count: 25, color: 'bg-amber-500' },
    { name: 'أنظمة', count: 15, color: 'bg-purple-500' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">المعرفة القانونية (Internal Wiki)</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">مستودع المعرفة الخاص بالمكتب: أبحاث، إجراءات، ونماذج عمل معتمدة.</p>
        </div>
        <Button type="button" className="bg-primary-500 hover:bg-primary-600 text-white gap-2" onClick={() => setArticleOpen(true)}>
          <Plus size={18} />
          إضافة مقال معرفي
        </Button>
      </div>

      <Dialog open={articleOpen} onOpenChange={setArticleOpen}>
        <DialogContent className="sm:max-w-lg border-none shadow-2xl dark:bg-navy-900">
          <DialogHeader>
            <DialogTitle className="font-bold">مقال معرفي جديد</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const title = String(fd.get("title") || "").trim();
              const content = String(fd.get("content") || "").trim();
              const tagsRaw = String(fd.get("tags") || "").trim();
              if (!title || !content) {
                toast.error("أدخل العنوان والمحتوى");
                return;
              }
              const tags = tagsRaw ? tagsRaw.split(/[,،]/).map((t) => t.trim()).filter(Boolean) : ["wiki"];
              addWikiArticle({
                id: `W-${Date.now()}`,
                title,
                content,
                category: wikiCategory,
                author: currentUser?.name || "المكتب",
                lastUpdated: new Date().toISOString().slice(0, 10),
                tags,
              });
              toast.success("تم نشر المقال");
              setArticleOpen(false);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="wiki-title">العنوان</Label>
              <Input id="wiki-title" name="title" required className="dark:bg-white/5" />
            </div>
            <div className="space-y-2">
              <Label>التصنيف</Label>
              <Select value={wikiCategory} onValueChange={(v) => v && setWikiCategory(v as typeof wikiCategory)}>
                <SelectTrigger className="dark:bg-white/5 dark:border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="أبحاث">أبحاث</SelectItem>
                  <SelectItem value="إجراءات">إجراءات</SelectItem>
                  <SelectItem value="نماذج">نماذج</SelectItem>
                  <SelectItem value="أنظمة">أنظمة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wiki-body">المحتوى</Label>
              <Textarea id="wiki-body" name="content" required className="min-h-[140px] dark:bg-white/5" placeholder="نص المقال..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wiki-tags">وسوم (مفصولة بفاصلة)</Label>
              <Input id="wiki-tags" name="tags" placeholder="تجاري، تقاضي إلكتروني" className="dark:bg-white/5" />
            </div>
            <Button type="submit" className="w-full bg-primary-600 text-white hover:bg-primary-700">
              نشر
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {categories.map((cat, i) => (
          <Card key={i} className="border-none shadow-sm dark:bg-navy-800 hover:ring-2 hover:ring-primary-500 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-8 rounded-full ${cat.color}`} />
                <div>
                  <p className="font-bold">{cat.name}</p>
                  <p className="text-xs text-slate-500">{cat.count} مقال</p>
                </div>
              </div>
              <ChevronLeft size={16} className="text-slate-300 rtl:rotate-180" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => setActiveTab('assets')}
              className={cn(
                "pb-2 text-sm font-bold border-b-2 transition-all",
                activeTab === 'assets' ? "border-primary-500 text-primary-600" : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              مستودع المعرفة (Assets)
            </button>
            <button 
              onClick={() => setActiveTab('wiki')}
              className={cn(
                "pb-2 text-sm font-bold border-b-2 transition-all",
                activeTab === 'wiki' ? "border-primary-500 text-primary-600" : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              المقالات الداخلية (Wiki)
            </button>
          </div>

          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <Input 
              placeholder={activeTab === 'assets' ? "البحث في المستندات والأبحاث..." : "البحث في المقالات..."}
              className="ps-10 h-12 bg-white dark:bg-navy-800 border-none shadow-sm dark:bg-navy-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

            {activeTab === 'assets' ? (
              knowledgeAssets.filter(a => a.title.includes(searchQuery)).map((asset) => (
                <Card key={asset.id} className="border-none shadow-sm dark:bg-navy-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{asset.category === 'Research' ? 'بحث قانوني' : 'إجراءات'}</Badge>
                        {asset.isVerified && (
                          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-none text-[9px] flex items-center gap-1">
                            <CheckCircle2 size={10} /> معتمد
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">{asset.updatedAt}</span>
                    </div>
                    <h4 className="font-bold text-lg mb-1">{asset.title}</h4>
                    <div className="flex items-center gap-4 mt-4 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><FileText size={12} /> الإصدار {asset.version}</span>
                      <span className="flex items-center gap-1"><Tag size={12} /> {asset.tags.join(', ')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              wikiArticles.filter(a => a.title.includes(searchQuery) || a.tags?.includes(searchQuery)).map((article) => (
                <Card key={article.id} className="border-none shadow-sm dark:bg-navy-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <h4 className="font-bold text-lg mb-1">{article.title}</h4>
                    <p className="text-sm text-slate-500 line-clamp-2">{article.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm dark:bg-navy-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold">المواضيع الشائعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {['نظام الشركات الجديد', 'إجراءات الإفلاس', 'المنازعات العقارية', 'التحكيم التجاري'].map((tag, i) => (
                <div key={i} onClick={() => { setActiveTab('wiki'); setSearchQuery(tag); }} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">
                  <span className="text-sm">{tag}</span>
                  <Badge variant="outline" className="text-[10px]">{Math.floor(Math.random() * 50) + 10}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm dark:bg-navy-800 bg-primary-600 text-white">
            <CardContent className="p-6 text-center space-y-4">
              <BookOpen size={48} className="mx-auto opacity-20" />
              <h3 className="font-bold">ساهم في المعرفة</h3>
              <p className="text-xs text-primary-100">هل قمت ببحث قانوني مميز؟ شاركه مع زملائك لتعزيز قوة المكتب المعرفية.</p>
              <Button type="button" variant="secondary" className="w-full" onClick={() => setArticleOpen(true)}>نشر مقال جديد</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
