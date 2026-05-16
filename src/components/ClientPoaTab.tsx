import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Upload, FileText, Search, Link as LinkIcon, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientsStore, PowerOfAttorney } from "@/store/useClientsStore";
import { formatDateEG } from "@/lib/formatEG";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase"; // Assuming this is how Supabase is imported

interface ClientPoaTabProps {
  clientId: string;
}

export function ClientPoaTab({ clientId }: ClientPoaTabProps) {
  const { poas, addPOA, updatePOA } = useClientsStore();
  const clientPoas = poas.filter(p => p.clientId === clientId);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<PowerOfAttorney>>({
    poaNumber: '',
    poaLetter: '',
    poaYear: new Date().getFullYear().toString(),
    office: '',
    type: 'عام قضايا',
    clientRole: 'الشاكي',
    agentRole: 'محامي',
    issueDate: '',
    status: 'ساري',
    cancellationRequested: false,
    fileUrl: ''
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}-poa-${Math.random()}.${fileExt}`;
      const filePath = `poas/${fileName}`;

      // This requires proper RLS policies in Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, fileUrl: urlData.publicUrl }));
      toast.success('تم رفع الملف بنجاح');
    } catch (error) {
      console.error('Error uploading POA:', error);
      toast.error('فشل رفع الملف، تأكد من إعدادات Supabase Storage');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.poaNumber || !formData.office || !formData.issueDate) {
      toast.error('يرجى تعبئة الحقول الإلزامية');
      return;
    }

    const newPoa: PowerOfAttorney = {
      id: `poa-${Date.now()}`,
      clientId,
      poaNumber: formData.poaNumber!,
      poaLetter: formData.poaLetter || '',
      poaYear: formData.poaYear!,
      office: formData.office!,
      type: formData.type!,
      clientRole: formData.clientRole,
      agentRole: formData.agentRole,
      issueDate: formData.issueDate!,
      status: formData.status as any,
      cancellationRequested: false,
      fileUrl: formData.fileUrl
    };

    addPOA(newPoa);
    toast.success('تم إضافة التوكيل بنجاح');
    setIsOpen(false);
    setFormData({
      poaNumber: '', poaLetter: '', poaYear: new Date().getFullYear().toString(),
      office: '', type: 'عام قضايا', clientRole: 'الشاكي', agentRole: 'محامي',
      issueDate: '', status: 'ساري', cancellationRequested: false, fileUrl: ''
    });
  };

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-navy-900 dark:text-white flex items-center gap-2">
          <FileText size={20} className="text-primary-600" />
          إدارة التوكيلات
        </h3>
        
        <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white gap-2" onClick={() => setIsOpen(true)}>
          <Plus size={16} /> إضافة توكيل جديد
        </Button>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>

          <DialogContent className="sm:max-w-[600px] bg-white dark:bg-navy-900 overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>إضافة توكيل جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>رقم التوكيل *</Label>
                  <Input 
                    required 
                    value={formData.poaNumber} 
                    onChange={e => setFormData(p => ({ ...p, poaNumber: e.target.value }))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>حرف التوكيل</Label>
                  <Input 
                    value={formData.poaLetter} 
                    onChange={e => setFormData(p => ({ ...p, poaLetter: e.target.value }))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>سنة التوكيل *</Label>
                  <Input 
                    required 
                    value={formData.poaYear} 
                    onChange={e => setFormData(p => ({ ...p, poaYear: e.target.value }))} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>مكتب التوثيق (الشهر العقاري) *</Label>
                  <Input 
                    required 
                    value={formData.office} 
                    onChange={e => setFormData(p => ({ ...p, office: e.target.value }))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>نوع التوكيل *</Label>
                  <Select value={formData.type} onValueChange={v => setFormData(p => ({ ...p, type: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="عام قضايا">عام قضايا</SelectItem>
                      <SelectItem value="خاص">خاص</SelectItem>
                      <SelectItem value="بنوك">بنوك</SelectItem>
                      <SelectItem value="عقاري">عقاري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>صفة الموكل</Label>
                  <Input 
                    value={formData.clientRole} 
                    onChange={e => setFormData(p => ({ ...p, clientRole: e.target.value }))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>صفة الوكيل</Label>
                  <Input 
                    value={formData.agentRole} 
                    onChange={e => setFormData(p => ({ ...p, agentRole: e.target.value }))} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>تاريخ الإصدار *</Label>
                  <Input 
                    type="date" 
                    required 
                    value={formData.issueDate} 
                    onChange={e => setFormData(p => ({ ...p, issueDate: e.target.value }))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الانتهاء (إن وجد)</Label>
                  <Input 
                    type="date" 
                    value={formData.expiryDate || ''} 
                    onChange={e => setFormData(p => ({ ...p, expiryDate: e.target.value }))} 
                  />
                </div>
              </div>

              <div className="space-y-2 border-t pt-4 mt-2">
                <Label>مرفق التوكيل (PDF / Image)</Label>
                <div className="flex items-center gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="relative overflow-hidden w-full gap-2 border-dashed border-2 hover:bg-slate-50 dark:hover:bg-white/5"
                    disabled={isUploading}
                  >
                    <Upload size={16} />
                    {isUploading ? 'جاري الرفع...' : 'اختر ملف التوكيل'}
                    <input 
                      type="file" 
                      title="اختر ملف التوكيل"
                      aria-label="اختر ملف التوكيل"
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      accept="image/*,.pdf" 
                      onChange={handleFileUpload}
                    />
                  </Button>
                </div>
                {formData.fileUrl && (
                  <div className="text-sm text-green-600 flex items-center gap-2 mt-2">
                    <LinkIcon size={14} /> تم رفع الملف بنجاح
                    <a href={formData.fileUrl} target="_blank" rel="noreferrer" className="underline text-primary-600 text-xs">عرض الملف</a>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-6">
                <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white">
                  حفظ التوكيل
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50 dark:bg-white/5">
            <TableHead className="font-bold">رقم التوكيل</TableHead>
            <TableHead className="font-bold">سنة التوكيل</TableHead>
            <TableHead className="font-bold">مكتب التوثيق</TableHead>
            <TableHead className="font-bold">النوع</TableHead>
            <TableHead className="font-bold">تاريخ التوثيق</TableHead>
            <TableHead className="font-bold">الحالة</TableHead>
            <TableHead className="font-bold text-end">مرفقات / إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientPoas.length > 0 ? (
            clientPoas.map(poa => (
              <TableRow key={poa.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                <TableCell className="font-bold text-primary-600">{poa.poaNumber} {poa.poaLetter ? `/ ${poa.poaLetter}` : ''}</TableCell>
                <TableCell>{poa.poaYear}</TableCell>
                <TableCell>{poa.office}</TableCell>
                <TableCell><Badge variant="outline" className="bg-white dark:bg-navy-900">{poa.type}</Badge></TableCell>
                <TableCell>{formatDateEG(new Date(poa.issueDate))}</TableCell>
                <TableCell>
                  <Badge className={
                    poa.status === 'ساري' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                    poa.status === 'ملغي' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-slate-50 text-slate-700 dark:bg-white/10 dark:text-slate-400'
                  }>
                    {poa.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-end">
                  <div className="flex justify-end gap-2 items-center">
                    {poa.fileUrl && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 gap-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                        onClick={() => window.open(poa.fileUrl, '_blank')}
                      >
                        <LinkIcon size={14} /> عرض المرفق
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                <div className="flex flex-col items-center justify-center gap-2">
                  <FileText size={32} className="text-slate-300 dark:text-slate-600" />
                  <p>لا توجد توكيلات مسجلة لهذا الموكل</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
