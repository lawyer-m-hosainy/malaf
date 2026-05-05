import { useMemo } from 'react';
import { toast } from 'sonner';
import { StoreCasesRepository } from '@/repositories/casesRepository';
import { saveCases as saveCasesToFirestore } from '@/services/legalDataService';
import { addCaseMemorandum, linkCaseToELitigation } from '@/application/cases/useCases';
import { uploadCaseDocument } from '@/services/fileService';
import { useCasesStore } from '@/store/useCasesStore';

export function useCaseActions() {
  const cases = useCasesStore((state) => state.cases);
  const setCases = useCasesStore((state) => state.setCases);
  const addDeadline = useCasesStore((state) => state.addDeadline);

  const casesRepository = useMemo(
    () =>
      new StoreCasesRepository(() => Object.values(useCasesStore.getState().cases || cases), setCases, addDeadline, async (updatedCases) => {
        try {
          await saveCasesToFirestore(updatedCases);
        } catch {
          toast.error("تعذر مزامنة التعديلات مع قاعدة البيانات");
        }
      }),
    [cases, setCases, addDeadline]
  );

  const handleLinkToELitigation = (caseId: string) => {
    linkCaseToELitigation(casesRepository, caseId);
  };

  const handleFileUpload = async (caseId: string, file: File, onSuccess: () => void, onError: (msg: string) => void) => {
    try {
      await uploadCaseDocument(file, caseId);
      addCaseMemorandum(casesRepository, caseId, file.name);
      onSuccess();
    } catch (error) {
      const message =
        error instanceof Error && error.message === "FILE_TOO_LARGE"
          ? "حجم الملف كبير جدًا (الحد الأقصى 10MB)"
          : error instanceof Error && error.message === "FILE_TYPE_NOT_ALLOWED"
          ? "نوع الملف غير مسموح. المسموح: PDF, DOC, DOCX, TXT"
          : error instanceof Error && error.message.includes("مهلة")
          ? error.message
          : "فشل رفع الملف. تأكد من الاتصال بالإنترنت وإعدادات Firebase.";
      onError(message);
    }
  };

  return { casesRepository, handleLinkToELitigation, handleFileUpload };
}
