import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, Loader2 } from 'lucide-react';
import { parseCSV } from '@/lib/csvParser';
import { toast } from 'sonner';

interface CSVImporterProps {
  onImport: (data: any[]) => Promise<void>;
  label?: string;
}

export function CSVImporter({ onImport, label = 'استيراد CSV' }: CSVImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('يرجى اختيار ملف CSV صالح');
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const parsedData = parseCSV(text);
      if (parsedData.length === 0) {
        toast.error('الملف فارغ أو لا يحتوي على بيانات صالحة');
        return;
      }
      await onImport(parsedData);
      toast.success(`تم استيراد ${parsedData.length} سجل بنجاح`);
    } catch (error) {
      console.error('CSV Import Error:', error);
      toast.error('حدث خطأ أثناء استيراد البيانات');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
      >
        {isImporting ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
        {label}
      </Button>
    </div>
  );
}
