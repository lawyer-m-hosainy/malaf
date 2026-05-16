import React, { useState, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useCasesStore } from "@/store/useCasesStore";
import { Calendar, AlertCircle, Printer, Filter, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { useClientsStore } from "@/store/useClientsStore";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// R8-FIX: Memoized row component — prevents 100+ rows from re-rendering on filter change
const SessionRollRow = memo(({ item, onSendSMS }: { item: any; onSendSMS: (item: any) => void }) => (
  <TableRow className={item.isRecess ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}>
    <TableCell className="font-bold whitespace-nowrap text-sm">
      {new Date(item.date).toLocaleDateString('ar-EG', { weekday: 'short', month: 'short', day: 'numeric' })}
      {item.isRecess && <span title="إجازة قضائية"><AlertCircle size={12} className="inline ms-1 text-amber-500" /></span>}
    </TableCell>
    <TableCell className="font-bold text-navy-900 dark:text-white whitespace-nowrap text-sm">{item.caseId}</TableCell>
    <TableCell className="text-sm">{item.court}</TableCell>
    <TableCell className="text-sm">{item.circuit}</TableCell>
    <TableCell className="text-sm font-medium">{item.opponent || '-'}</TableCell>
    <TableCell className="text-sm text-slate-500 dark:text-slate-400">{item.previousDecision}</TableCell>
    <TableCell className="text-sm text-slate-500 dark:text-slate-400">{item.postponementReason}</TableCell>
    <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.nextSessionDate}</TableCell>
    <TableCell className="text-sm font-medium text-primary-700 dark:text-primary-400">{item.responsibleLawyer}</TableCell>
    <TableCell className="text-sm text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={item.notes}>{item.notes}</TableCell>
    <TableCell className="text-center">
      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="إرسال تذكير SMS للموكل" onClick={() => onSendSMS(item)}>
        <MessageSquare size={14} className="text-blue-500" />
      </Button>
    </TableCell>
  </TableRow>
));

export default function SessionsRoll() {
  const cases = useCasesStore(state => state.cases);
  const sessions = useCasesStore(state => state.sessions);

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [courtFilter, setCourtFilter] = useState("");
  const [lawyerFilter, setLawyerFilter] = useState("");

  const clients = useClientsStore(state => state.clients);
  const addClientLog = useClientsStore(state => state.addClientLog);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [smsTemplate, setSmsTemplate] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);

  const handleOpenSmsDialog = (item: any) => {
    // Attempt to find the client. item.caseId in the table is actually the id, so we need to match it.
    // We already have cases store.
    const relatedCase = cases.find(c => c.id === item.caseId);
    
    // If not found by caseNumber, we might need to find by session's original caseId
    const originalSession = sessions.find(s => s.id === item.id);
    const actualCase = relatedCase || cases.find(c => c.id === originalSession?.caseId);

    const client = clients.find(c => c.id === actualCase?.clientId);
    
    if (!client || !client.phone) {
      toast.error("لا يوجد رقم هاتف مسجل للموكل في هذه القضية");
      return;
    }
    
    setSelectedSession({ ...item, client });
    setSmsTemplate(`نذكركم بجلستكم غداً في محكمة ${item.court} الساعة ${item.time || 'الصباحية'}. محاميكم: ${item.responsibleLawyer}`);
    setSmsDialogOpen(true);
  };

  const handleSendSms = async () => {
    if (!selectedSession || !smsTemplate.trim()) return;
    setIsSendingSms(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-client-sms', {
        body: {
          phone: selectedSession.client.phone,
          message: smsTemplate,
          clientId: selectedSession.client.id
        }
      });

      if (error) throw error;

      toast.success("تم إرسال الرسالة النصية بنجاح");
      
      if (addClientLog) {
        addClientLog(selectedSession.client.id, `تم إرسال تذكير SMS بشأن جلسة قضية ${selectedSession.caseId}: ${smsTemplate}`);
      }
      
      setSmsDialogOpen(false);
    } catch (error: any) {
      console.error('SMS Error:', error);
      toast.error(`فشل الإرسال: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setIsSendingSms(false);
    }
  };

  const handlePrint = () => {
    if (rollData.length === 0) {
      toast.error("لا توجد جلسات لطباعتها في الفترة المحددة");
      return;
    }

    const today = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const rows = rollData.map(item => `
      <tr>
        <td>${new Date(item.date).toLocaleDateString('ar-EG', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
        <td style="font-weight:bold">${item.caseId}</td>
        <td>${item.court}</td>
        <td>${item.circuit}</td>
        <td>${item.opponent || '-'}</td>
        <td>${item.previousDecision}</td>
        <td>${item.postponementReason}</td>
        <td>${item.nextSessionDate}</td>
        <td>${item.responsibleLawyer}</td>
        <td>${item.notes}</td>
      </tr>
    `).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("يرجى السماح بفتح النوافذ المنبثقة للطباعة");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>أجندة المكتب — ${today}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; color: #1a1a1a; font-size: 11px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 3px double #0d5c2e; padding-bottom: 15px; }
          .header h1 { font-size: 22px; color: #0d5c2e; margin-bottom: 4px; }
          .header p { font-size: 12px; color: #666; }
          .header .date { font-size: 13px; font-weight: bold; color: #333; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #0d5c2e; color: white; padding: 8px 6px; font-size: 10px; font-weight: bold; text-align: center; white-space: nowrap; }
          td { padding: 7px 6px; border-bottom: 1px solid #ddd; text-align: center; font-size: 10px; }
          tr:nth-child(even) { background: #f8f8f8; }
          .footer { margin-top: 25px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
          .footer .stamp { display: inline-block; border: 2px solid #0d5c2e; border-radius: 50%; width: 60px; height: 60px; line-height: 60px; text-align: center; font-size: 8px; color: #0d5c2e; font-weight: bold; margin-top: 15px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏛️ أجندة المكتب — جلسات اليوم</h1>
          <p>سجل الجلسات والمواعيد — منصة مَلَف لإدارة مكاتب المحاماة</p>
          <div class="date">📅 ${today} | من ${startDate} إلى ${endDate} | عدد الجلسات: ${rollData.length}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>رقم الدعوى</th>
              <th>المحكمة</th>
              <th>الدائرة</th>
              <th>اسم الخصم</th>
              <th>القرار السابق</th>
              <th>سبب التأجيل</th>
              <th>الجلسة القادمة</th>
              <th>المحامي المسؤول</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">
          <p>تم الإنشاء تلقائياً من منصة مَلَف — ${new Date().toLocaleString('ar-EG')}</p>
          <div class="stamp">مَلَف</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    
    // انتظر تحميل الصفحة ثم اطبع
    printWindow.onload = () => {
      printWindow.print();
    };
    // fallback لو onload ما اشتغلش
    setTimeout(() => { try { printWindow.print(); } catch {} }, 500);

    toast.success("تم فتح نافذة الطباعة", { description: "اختر 'حفظ كـ PDF' أو اطبع مباشرة" });
  };

  const isSummerRecess = (dateStr: string) => {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    // July (7) to end of September (9)
    return month >= 7 && month <= 9;
  };

  const rollData = useMemo(() => {
    if (!startDate || !endDate) return [];
    
    return sessions
      .filter(session => {
        const inDateRange = session.date >= startDate && session.date <= endDate;
        const matchesCourt = courtFilter ? session.court.includes(courtFilter) : true;
        const matchesLawyer = lawyerFilter && session.responsibleLawyer ? session.responsibleLawyer.includes(lawyerFilter) : true;
        return inDateRange && matchesCourt && matchesLawyer;
      })
      .map(session => {
        const relatedCase = cases.find(c => c.id === session.caseId);
        return {
          id: session.id,
          date: session.date,
          caseId: relatedCase?.id || session.caseId,
          court: session.court,
          circuit: session.circuit || '-',
          opponent: relatedCase?.clientRole === 'مدعي' ? relatedCase?.defendant : relatedCase?.plaintiff,
          previousDecision: session.previousDecision || '-',
          postponementReason: session.postponementReason || '-',
          nextSessionDate: session.nextSessionDate || '-',
          responsibleLawyer: session.responsibleLawyer || '-',
          notes: session.notes || '-',
          time: session.time || '',
          isRecess: isSummerRecess(session.date)
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sessions, cases, startDate, endDate, courtFilter, lawyerFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">أجندة المكتب</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">سجل الجلسات والمواعيد مطابقاً للأجندة الورقية (أجندة المحامين)</p>
        </div>
        <Button onClick={handlePrint} className="bg-primary-500 hover:bg-primary-600 text-white gap-2 shadow-lg shadow-primary-500/20">
          <Printer size={16} />
          طباعة أجندة اليوم
        </Button>
      </div>

      <Card className="border-none shadow-sm dark:bg-navy-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
          <div className="space-y-2">
            <label htmlFor="startDate" className="text-sm font-bold text-navy-900 dark:text-white">من تاريخ</label>
            <input id="startDate" title="من تاريخ" aria-label="من تاريخ" type="date" className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 px-3 bg-transparent text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="endDate" className="text-sm font-bold text-navy-900 dark:text-white">إلى تاريخ</label>
            <input id="endDate" title="إلى تاريخ" aria-label="إلى تاريخ" type="date" className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 px-3 bg-transparent text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy-900 dark:text-white">المحكمة</label>
            <input type="text" placeholder="تصفية بالمحكمة..." className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 px-3 bg-transparent text-sm" value={courtFilter} onChange={e => setCourtFilter(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy-900 dark:text-white">المحامي</label>
            <input type="text" placeholder="تصفية بالمحامي..." className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 px-3 bg-transparent text-sm" value={lawyerFilter} onChange={e => setLawyerFilter(e.target.value)} />
          </div>
        </div>

        <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-slate-50/50 dark:bg-white/5">
              <TableRow>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">التاريخ</TableHead>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">رقم الدعوى</TableHead>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">المحكمة</TableHead>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">الدائرة</TableHead>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">اسم الخصم</TableHead>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">القرار السابق</TableHead>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">سبب التأجيل</TableHead>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">الجلسة القادمة</TableHead>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">المحامي المسؤول</TableHead>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">ملاحظات</TableHead>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rollData.length > 0 ? rollData.map((item) => (
                <SessionRollRow key={item.id} item={item} onSendSMS={handleOpenSmsDialog} />
              )) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                    لا توجد جلسات مجدولة في هذه الفترة أو تطابق شروط البحث.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>* إجازة العطلة القضائية تمتد من 1 يوليو حتى 1 أكتوبر</span>
          <span>* أيام العمل الرسمية: السبت إلى الخميس</span>
        </div>
      </Card>

      <Dialog open={smsDialogOpen} onOpenChange={setSmsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-navy-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-500" />
              إرسال تذكير SMS للموكل
            </DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-md text-sm">
                <p><span className="font-bold">الموكل:</span> {selectedSession.client.name}</p>
                <p><span className="font-bold">رقم الهاتف:</span> <span dir="ltr">{selectedSession.client.phone}</span></p>
                <p><span className="font-bold">القضية:</span> {selectedSession.caseId}</p>
              </div>
              
              <div className="space-y-2">
                <Label>نص الرسالة</Label>
                <Textarea 
                  value={smsTemplate}
                  onChange={(e) => setSmsTemplate(e.target.value)}
                  rows={4}
                  className="resize-none dark:bg-navy-800"
                />
                <p className="text-xs text-slate-500">سيتم إرسال هذه الرسالة مباشرة إلى هاتف الموكل وتسجيلها في السجل الخاص به.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSmsDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSendSms} disabled={isSendingSms || !smsTemplate.trim()} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              {isSendingSms ? 'جاري الإرسال...' : (
                <>
                  <Send size={16} />
                  إرسال الرسالة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
