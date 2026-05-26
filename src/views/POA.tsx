import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, FileSignature, AlertCircle, Plus, Eye, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePOALogic } from "@/hooks/usePOALogic";

export default function POA() {
  const {
    clients,
    filteredPOAs,
    searchTerm,
    setSearchTerm,
    isOpen,
    setIsOpen,
    formData,
    setFormData,
    editingPoaId,
    handleSubmit,
    handleEditClick,
    openNewPOADialog,
  } = usePOALogic();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <FileSignature className="h-8 w-8 text-primary-600" />
            إدارة التوكيلات
          </h1>
          <p className="text-slate-500 mt-2">سجل التوكيلات الخاص بالمكتب (عام، قضايا، خاص)</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <Button onClick={openNewPOADialog} className="bg-primary-600 hover:bg-primary-700 text-white gap-2">
            <Plus size={16} />
            إضافة توكيل جديد
          </Button>
          <DialogContent className="sm:max-w-[600px] border-none shadow-2xl dark:bg-navy-900">
            <DialogHeader>
              <DialogTitle className="text-navy-900 dark:text-white">
                {editingPoaId ? "تعديل بيانات التوكيل" : "إضافة توكيل جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الموكل</Label>
                  <Select 
                    value={formData.clientId} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, clientId: v || '' }))}
                  >
                    <SelectTrigger className="dark:bg-white/5 dark:border-white/10">
                      <SelectValue placeholder="اختر الموكل" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-navy-800 dark:border-white/10">
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>نوع التوكيل</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v: any) => setFormData(prev => ({ ...prev, type: v }))}
                  >
                    <SelectTrigger className="dark:bg-white/5 dark:border-white/10">
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-navy-800 dark:border-white/10">
                      <SelectItem value="عام">عام</SelectItem>
                      <SelectItem value="خاص">خاص</SelectItem>
                      <SelectItem value="قضايا فقط">قضايا فقط</SelectItem>
                      <SelectItem value="عقاري">عقاري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>رقم التوكيل</Label>
                  <Input 
                    value={formData.poaNumber}
                    onChange={e => setFormData(prev => ({ ...prev, poaNumber: e.target.value }))}
                    placeholder="1234"
                    className="dark:bg-white/5 dark:border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>حرف</Label>
                  <Input 
                    value={formData.poaLetter}
                    onChange={e => setFormData(prev => ({ ...prev, poaLetter: e.target.value }))}
                    placeholder="أ"
                    className="dark:bg-white/5 dark:border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>سنة</Label>
                  <Input 
                    value={formData.poaYear}
                    onChange={e => setFormData(prev => ({ ...prev, poaYear: e.target.value }))}
                    placeholder="2024"
                    className="dark:bg-white/5 dark:border-white/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>مكتب التوثيق</Label>
                  <Input 
                    value={formData.office}
                    onChange={e => setFormData(prev => ({ ...prev, office: e.target.value as any }))}
                    placeholder="مثال: توثيق الأهرام"
                    className="dark:bg-white/5 dark:border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحالة</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(v: any) => setFormData(prev => ({ ...prev, status: v }))}
                  >
                    <SelectTrigger className="dark:bg-white/5 dark:border-white/10">
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-navy-800 dark:border-white/10">
                      <SelectItem value="ساري">ساري</SelectItem>
                      <SelectItem value="ملغي">ملغي</SelectItem>
                      <SelectItem value="منتهي">منتهي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>تاريخ التوثيق</Label>
                  <div className="relative">
                    <Input 
                      type="date"
                      value={formData.issueDate}
                      onChange={e => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                      className="dark:bg-white/5 dark:border-white/10 ps-10"
                    />
                    <CalendarIcon className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الانتهاء (اختياري)</Label>
                  <div className="relative">
                    <Input 
                      type="date"
                      value={formData.expiryDate}
                      onChange={e => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                      className="dark:bg-white/5 dark:border-white/10 ps-10"
                    />
                    <CalendarIcon className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white">
                  {editingPoaId ? "حفظ التعديلات" : "حفظ التوكيل"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-3 text-slate-400" size={18} />
          <Input 
            placeholder="بحث برقم التوكيل أو اسم الموكل..." 
            className="pr-10 dark:bg-navy-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPOAs.length > 0 ? (
          filteredPOAs.map(poa => (
            <Card key={poa.id} className="dark:bg-navy-800 border-none shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b dark:border-white/5">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-2 bg-slate-50 dark:bg-white/5">
                      {poa.type}
                    </Badge>
                    <CardTitle className="text-lg text-primary-700 dark:text-primary-400">
                      رقم {poa.poaNumber} حرف {poa.poaLetter} لسنة {poa.poaYear}
                    </CardTitle>
                  </div>
                  <Badge variant={poa.status === 'ساري' ? 'default' : 'destructive'} 
                    className={poa.status === 'ساري' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                    {poa.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">اسم الموكل:</span>
                  <span className="font-bold">{poa.clientName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">مكتب التوثيق:</span>
                  <span>{poa.office}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">تاريخ الانتهاء:</span>
                  <span>{poa.expiryDate || "-"}</span>
                </div>
                
                {poa.status === 'منتهي' && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start gap-2 text-xs">
                    <AlertCircle size={16} />
                    <span>هذا التوكيل منتهي الصلاحية أو تم إلغاؤه، يرجى مراجعة الموكل لتجديده.</span>
                  </div>
                )}

                <div className="pt-4 mt-2 border-t dark:border-white/5 flex gap-2">
                  <Button variant="ghost" className="flex-1 text-primary-600 dark:text-primary-400 gap-2">
                    <Eye size={16} />
                    التفاصيل
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(poa)} className="dark:border-white/10">
                    تعديل
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white dark:bg-navy-800 rounded-xl border-2 border-dashed border-slate-100 dark:border-white/5">
            <FileSignature className="h-16 w-16 text-slate-200 dark:text-white/10 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">لا توجد توكيلات مسجلة</p>
          </div>
        )}
      </div>
    </div>
  );
}

