import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadDocumentFile, saveDocument } from "@/services/legalDataService";
import { useAuthStore } from "@/store/useAuthStore";

export default function UploadForm({ cases, onComplete }: { cases: any[], onComplete: () => void }) {
  const currentUser = useAuthStore((s) => s.currentUser);

  return (
    <form
      className="space-y-4 pt-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const file = (fd.get("file") as File) || null;
        if (!file || !file.size) {
          toast.error("اختر ملفاً");
          return;
        }
        const caseRef = String(fd.get("caseRef") || "").trim();
        const docType = String(fd.get("docType") || "").trim() || "مستند";
        
        const loadingToast = toast.loading("جاري الرفع...");
        try {
          const { path } = await uploadDocumentFile(file, caseRef);
          const newDoc = {
            name: file.name,
            case_id: caseRef || null,
            type: docType,
            size_bytes: file.size,
            storage_path: path,
            uploaded_by: currentUser?.name || "مستخدم"
          };
          await saveDocument(newDoc);
          toast.success("تم تسجيل المستند في المكتب", { id: loadingToast });
          onComplete();
        } catch (err) {
          toast.error("فشل رفع المستند", { id: loadingToast });
        }
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
  );
}
