import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Search, Download, Trash2, Folder, File, Filter } from "lucide-react";
import { toast } from "sonner";
import { useState, useCallback, memo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCasesStore } from "@/store/useCasesStore";
import React from "react";

type DocRow = {
  id: string;
  name: string;
  case: string;
  type: string;
  size: string;
  date: string;
  uploadedBy: string;
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const DocumentRow = memo(({ doc, onDownload, onDelete }: { doc: DocRow, onDownload: (doc: DocRow) => void, onDelete: (id: string) => void }) => {
  return (
    <TableRow className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
            <File size={16} />
          </div>
          <span className="font-bold text-navy-900 dark:text-white">{doc.name}</span>
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm text-slate-500">{doc.case}</TableCell>
      <TableCell>
        <Badge variant="outline" className="text-slate-600 dark:text-slate-400">
          {doc.type}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-slate-500">{doc.size}</TableCell>
      <TableCell className="text-sm text-slate-500">{doc.date}</TableCell>
      <TableCell className="text-end">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary-600" onClick={() => onDownload(doc)}>
            <Download size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-destructive" onClick={() => onDelete(doc.id)}>
            <Trash2 size={16} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

export default function Documents() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const cases = useCasesStore((s) => s.cases) || [];
  const [documents, setDocuments] = useState<DocRow[]>([
    { id: "d1", name: "لائحة دعوى - شركة الراجحي.pdf", case: "C-2024-001", type: "لائحة", size: "2.4 MB", date: "2024-04-01", uploadedBy: "أحمد المحامي" },
    { id: "d2", name: "عقد تأسيس شركة النهضة.pdf", case: "C-2024-002", type: "عقد", size: "1.1 MB", date: "2024-04-05", uploadedBy: "سارة المستشارة" },
    { id: "d3", name: "مذكرة جوابية - عمالي.docx", case: "C-2024-003", type: "مذكرة", size: "500 KB", date: "2024-04-10", uploadedBy: "أحمد المحامي" },
    { id: "d4", name: "حكم ابتدائي - قضية تجارية.pdf", case: "C-2024-001", type: "حكم", size: "3.2 MB", date: "2024-04-12", uploadedBy: "خالد الشريك" },
  ]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "name">("date_desc");

  const handleDownload = useCallback((doc: DocRow) => {
    const blob = new Blob(["محتوى المستند التجريبي"], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`تم تحميل المستند: ${doc.name}`);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    toast.success(`تم حذف المستند من السجل`);
  }, []);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.includes(searchTerm) || doc.case.includes(searchTerm);
    const matchesFolder = activeFolder ? doc.type === activeFolder : true;
    return matchesSearch && matchesFolder;
  }).sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "date_asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / itemsPerPage));
  const currentDocuments = filteredDocuments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">إدارة المستندات</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">أرشفة وتنظيم الملفات والوثائق القانونية وربطها بالقضايا.</p>
        </div>
        <Button type="button" className="bg-primary-500 hover:bg-primary-600 text-white gap-2" onClick={() => setUploadOpen(true)}>
          <Upload size={18} />
          رفع مستند جديد
        </Button>
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md border-none shadow-2xl dark:bg-navy-900">
          <DialogHeader>
            <DialogTitle className="font-bold">رفع مستند جديد</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const file = (fd.get("file") as File) || null;
              if (!file || !file.size) {
                toast.error("اختر ملفاً");
                return;
              }
              const caseRef = String(fd.get("caseRef") || "").trim() || "—";
              const docType = String(fd.get("docType") || "").trim() || "مستند";
              const row: DocRow = {
                id: `d-${Date.now()}`,
                name: file.name,
                case: caseRef,
                type: docType,
                size: formatBytes(file.size),
                date: new Date().toISOString().slice(0, 10),
                uploadedBy: currentUser?.name || "مستخدم",
              };
              setDocuments((prev) => [row, ...prev]);
              toast.success("تم تسجيل المستند في المكتب");
              setUploadOpen(false);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="doc-file">الملف</Label>
              <Input id="doc-file" name="file" type="file" required className="dark:bg-white/5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-case">القضية المرتبطة</Label>
              <select 
                id="doc-case" 
                name="caseRef" 
                title="القضية المرتبطة"
                className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm dark:text-white"
              >
                <option value="" className="dark:bg-navy-900">— ملف عام (بدون قضية) —</option>
                {cases.map((c: any) => (
                  <option key={c.id} value={c.id} className="dark:bg-navy-900">
                    {c.id} - {c.plaintiff} ضد {c.defendant}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-type">نوع المستند</Label>
              <Input id="doc-type" name="docType" placeholder="لائحة، مذكرة، عقد..." className="dark:bg-white/5" />
            </div>
            <Button type="submit" className="w-full bg-primary-600 text-white hover:bg-primary-700">
              حفظ في السجل
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm dark:bg-navy-800 md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-bold">المجلدات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className={`w-full justify-start gap-3 ${activeFolder === null ? 'bg-slate-50 dark:bg-white/5 text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`} onClick={() => setActiveFolder(null)}>
              <Folder size={18} />
              جميع المستندات
            </Button>
            <Button variant="ghost" className={`w-full justify-start gap-3 ${activeFolder === 'لائحة' || activeFolder === 'مذكرة' ? 'bg-slate-50 dark:bg-white/5 text-primary-600' : 'text-slate-600 dark:text-slate-400'}`} onClick={() => setActiveFolder('مذكرة')}>
              <Folder size={18} />
              لوائح ومذكرات
            </Button>
            <Button variant="ghost" className={`w-full justify-start gap-3 ${activeFolder === 'عقد' || activeFolder === 'اتفاقية' ? 'bg-slate-50 dark:bg-white/5 text-primary-600' : 'text-slate-600 dark:text-slate-400'}`} onClick={() => setActiveFolder('عقد')}>
              <Folder size={18} />
              عقود واتفاقيات
            </Button>
            <Button variant="ghost" className={`w-full justify-start gap-3 ${activeFolder === 'حكم' || activeFolder === 'قرار' ? 'bg-slate-50 dark:bg-white/5 text-primary-600' : 'text-slate-600 dark:text-slate-400'}`} onClick={() => setActiveFolder('حكم')}>
              <Folder size={18} />
              أحكام وقرارات
            </Button>
            <Button variant="ghost" className={`w-full justify-start gap-3 ${activeFolder === 'مستند العميل' ? 'bg-slate-50 dark:bg-white/5 text-primary-600' : 'text-slate-600 dark:text-slate-400'}`} onClick={() => setActiveFolder('مستند العميل')}>
              <Folder size={18} />
              مستندات العملاء
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-navy-800 md:col-span-3">
          <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  placeholder="ابحث عن مستند..." 
                  className="pr-10 bg-slate-50 dark:bg-white/5 border-none"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" className="gap-2 dark:border-white/10" />}>
                  <Filter size={16} />
                  تصفية وترتيب
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="dark:bg-navy-800 dark:border-white/10">
                  <DropdownMenuItem onClick={() => setSortBy("date_desc")} className="cursor-pointer dark:focus:bg-white/5">الأحدث أولاً</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("date_asc")} className="cursor-pointer dark:focus:bg-white/5">الأقدم أولاً</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("name")} className="cursor-pointer dark:focus:bg-white/5">حسب الاسم (أ-ي)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-white/5">
                <TableRow>
                  <TableHead className="text-start font-bold">اسم المستند</TableHead>
                  <TableHead className="text-start font-bold">رقم القضية</TableHead>
                  <TableHead className="text-start font-bold">النوع</TableHead>
                  <TableHead className="text-start font-bold">الحجم</TableHead>
                  <TableHead className="text-start font-bold">تاريخ الرفع</TableHead>
                  <TableHead className="text-end font-bold">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      لا توجد مستندات مطابقة للبحث
                    </TableCell>
                  </TableRow>
                ) : (
                  currentDocuments.map((doc) => (
                    <DocumentRow key={doc.id} doc={doc} onDownload={handleDownload} onDelete={handleDelete} />
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-50 dark:border-white/5 bg-white dark:bg-navy-800 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                صفحة {currentPage} من {totalPages}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  السابق
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  );
}
