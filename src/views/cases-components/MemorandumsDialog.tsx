import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Upload, ExternalLink, Trash2 } from "lucide-react";
import { Case } from "@/types";
import { useCaseActions } from "./useCaseActions";
import { toast } from "sonner";

interface MemorandumsDialogProps {
  caseData: Case;
}

export default function MemorandumsDialog({ caseData }: MemorandumsDialogProps) {
  const { handleFileUpload } = useCaseActions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const memorandums = caseData.memorandums ?? [];

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    await handleFileUpload(
      caseData.id,
      file,
      () => {
        setIsUploading(false);
        toast.success(`تم رفع "${file.name}" بنجاح`);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      (error) => {
        setIsUploading(false);
        toast.error(error || "فشل رفع الملف");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="ghost" size="sm" className="flex items-center gap-1 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400" onClick={() => setOpen(true)}>
        <FileText size={14} />
        <span className="text-xs font-bold">{memorandums.length}</span>
      </Button>
      <DialogContent className="max-w-xl bg-white dark:bg-navy-900 border-none shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-navy-900 dark:text-white font-bold">المذكرات والوثائق - {caseData.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">قائمة الوثائق المرفوعة</h3>
            <div>
              <input 
                type="file" 
                title="اختر ملف المذكرة"
                placeholder="ارفاق ملف"
                className="hidden" 
                ref={fileInputRef}
                onChange={onFileChange}
              />
              {!['محفوظة', 'مغلقة'].includes(caseData.status) && (
                <Button 
                  size="sm" 
                  className="bg-primary-500 text-white gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                  رفع وثيقة
                </Button>
              )}
            </div>
          </div>
          <div className="border dark:border-white/10 rounded-lg divide-y divide-slate-100 dark:divide-white/10">
            {memorandums.map((memo, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy-900 dark:text-white">{memo}</p>
                    <p className="text-[10px] text-slate-400">تم الرفع: مسبقًا</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400">
                    <ExternalLink size={14} />
                  </Button>
                  {!['محفوظة', 'مغلقة'].includes(caseData.status) && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive">
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {memorandums.length === 0 && (
              <p className="text-[10px] text-slate-400 text-center py-4 italic">لا توجد مذكرات أو ملفات مرفوعة</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
