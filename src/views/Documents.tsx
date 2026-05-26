import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Search, Download, Trash2, Folder, File, Filter, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useCallback, memo, useEffect, lazy, Suspense } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCasesStore } from "@/store/useCasesStore";
import React from "react";
import { fetchDocuments, deleteDocumentRecord, downloadDocumentFile, deleteDocumentFile } from "@/services/legalDataService";

// Lazy load the upload form to reduce initial bundle size
const UploadForm = lazy(() => import("./documents-components/UploadForm"));

type DocRow = {
  id: string;
  name: string;
  case: string;
  type: string;
  size: string;
  date: string;
  uploadedBy: string;
  storagePath?: string;
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
          <span className="font-bold text-navy-900 dark:text-white truncate max-w-[200px]" title={doc.name}>{doc.name}</span>
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm text-slate-500">{doc.case}</TableCell>
      <TableCell>
        <Badge variant="outline" className="text-slate-600 dark:text-slate-400">
          {doc.type}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-slate-500 whitespace-nowrap">{doc.size}</TableCell>
      <TableCell className="text-sm text-slate-500 whitespace-nowrap">{doc.date}</TableCell>
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
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "name">("date_desc");

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await fetchDocuments();
      setDocuments(docs.map((d: any) => ({
        id: d.id,
        name: d.file_name || d.name || "مستند بدون اسم",
        case: d.case_id || "عام",
        type: d.category || d.type || "مستند",
        size: formatBytes(d.size || d.size_bytes || 0),
        date: new Date(d.created_at).toISOString().slice(0, 10),
        uploadedBy: d.uploaded_by || "مستخدم",
        storagePath: d.storage_path || d.file_url
      })));
    } catch (e) {
      toast.error("فشل تحميل المستندات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = useCallback(async (doc: DocRow) => {
    const loadingToast = toast.loading("جاري التحميل...");
    try {
      if (doc.storagePath) {
        const blob = await downloadDocumentFile(doc.storagePath);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = doc.name;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob(["محتوى المستند التجريبي"], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = doc.name;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast.success(`تم تحميل المستند: ${doc.name}`, { id: loadingToast });
    } catch (e) {
      toast.error("فشل تحميل المستند", { id: loadingToast });
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const doc = documents.find((d) => d.id === id);
      if (doc?.storagePath) {
        try {
          await deleteDocumentFile(doc.storagePath);
        } catch (e) {
          console.error("Storage delete failed", e);
        }
      }
      if (!id.startsWith("d-")) {
        await deleteDocumentRecord(id);
      }
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast.success(`تم حذف المستند من السجل`);
    } catch (e) {
      toast.error("فشل حذف المستند");
    }
  }, [documents]);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || doc.case.toLowerCase().includes(searchTerm.toLowerCase());
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">إدارة المستندات</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">أرشفة وتنظيم الملفات والوثائق القانونية وربطها بالقضايا.</p>
        </div>
        <Button type="button" className="bg-primary-500 hover:bg-primary-600 text-white gap-2 w-full sm:w-auto" onClick={() => setUploadOpen(true)}>
          <Upload size={18} />
          رفع مستند جديد
        </Button>
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md border-none shadow-2xl dark:bg-navy-900">
          <DialogHeader>
            <DialogTitle className="font-bold">رفع مستند جديد</DialogTitle>
          </DialogHeader>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-500" /></div>}>
            <UploadForm cases={cases} onComplete={() => { setUploadOpen(false); loadDocuments(); }} />
          </Suspense>
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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="p-4">
                        <Skeleton className="h-12 w-full rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : currentDocuments.length === 0 ? (
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
