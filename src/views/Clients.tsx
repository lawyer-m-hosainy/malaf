import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Search, Filter, MoreHorizontal, Phone, Building2, User, Edit, Trash2, Plus } from "lucide-react";
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useClientsLogic } from "@/hooks/useClientsLogic";
import { useCasesStore } from "@/store/useCasesStore";
import { useClientsStore } from "@/store/useClientsStore";
import { useState } from "react";
import { CSVImporter } from "@/components/CSVImporter";
import { saveClient } from "@/services/legalDataService";
import { EmptyState } from "@/components/EmptyState";

import { useUsageStore } from "@/store/useUsageStore";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchClients, fetchCases, fetchTrustAccounts, fetchEnforcement, fetchTasks, fetchTeam } from "@/services/legalDataService";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useTeamStore } from "@/store/useTeamStore";
import { useEnforcementStore } from "@/store/useEnforcementStore";
import { formatDateEG } from "@/lib/formatEG";
import { ClientPoaTab } from "@/components/ClientPoaTab";
const ClientRow = React.memo(({ client, onEdit, onDelete }: { client: any, onEdit: (c: any) => void, onDelete: (id: string) => void }) => {
  return (
    <TableRow className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            {client.type === 'منشأة' ? <Building2 size={16} /> : <User size={16} />}
          </div>
          <span className="font-bold text-navy-900 dark:text-white">{client.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className={client.type === 'منشأة' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" : "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"}>
          {client.type}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">
        {client.nationalId || client.commercialRegistration}
      </TableCell>
      <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">
        {client.vatNumber || '-'}
      </TableCell>
      <TableCell className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
        <Phone size={14} className="text-slate-400" />
        <span dir="ltr">{client.phone}</span>
      </TableCell>
      <TableCell className="text-end">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="text-slate-400 hover:text-navy-900 dark:hover:text-white" />}>
            <MoreHorizontal size={18} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="dark:bg-navy-800 dark:border-white/10 w-40">
            <DropdownMenuItem onClick={() => onEdit(client)} className="cursor-pointer dark:focus:bg-white/5 gap-2 flex items-center">
              <Edit size={16} className="text-slate-500" />
              <span>تعديل</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(client.id)} className="cursor-pointer text-red-600 dark:text-red-400 dark:focus:bg-red-500/10 gap-2 flex items-center">
              <Trash2 size={16} />
              <span>حذف</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

export default function Clients() {
  const navigate = useNavigate();
  const {
    currentClients,
    searchQuery,
    filterType,
    currentPage,
    totalPages,
    isOpen,
    editingClientId,
    formData,
    setSearchQuery,
    setFilterType,
    setCurrentPage,
    setIsOpen,
    setFormData,
    handleEditClick,
    handleDeleteClick,
    handleSubmit,
    openNewClientDialog,
  } = useClientsLogic();

  const cases = useCasesStore(state => state.cases);
  const clients = useClientsStore(state => state.clients);
  const poas = useClientsStore(state => state.poas) || [];
  const hasLoaded = useClientsStore(state => state.hasLoaded);
  const [selectedClientForProfile, setSelectedClientForProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      if (hasLoaded) return;
      setIsLoading(true);
      try {
        const [remoteClients, remoteCases, remoteTrust, remoteEnf, remoteTasks, remoteTeam] = await Promise.all([
          fetchClients(), 
          fetchCases(),
          fetchTrustAccounts(),
          fetchEnforcement(),
          fetchTasks(),
          fetchTeam()
        ]);
        
        if (remoteClients?.length > 0) useClientsStore.getState().setClients(remoteClients);
        if (remoteCases?.length > 0) useCasesStore.getState().setCases(remoteCases);
        if (remoteTrust?.length > 0) useFinanceStore.getState().setTrustAccounts(remoteTrust);
        if (remoteEnf?.length > 0) useEnforcementStore.getState().setEnforcementCases(remoteEnf);
        if (remoteTasks?.length > 0) useTeamStore.getState().setTasks(remoteTasks);
        if (remoteTeam?.length > 0) useTeamStore.getState().setTeamMembers(remoteTeam);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [hasLoaded]);

  const handleImportClients = async (data: any[]) => {
    for (const row of data) {
      const name = row['اسم العميل'] || row['name'] || row['Name'];
      if (!name) continue;
      
      const newClient = {
        name,
        type: row['النوع'] || row['type'] || 'فرد',
        nationalId: row['الرقم القومي'] || row['nationalId'] || '',
        commercialRegistration: row['السجل التجاري'] || row['cr'] || '',
        vatNumber: row['التسجيل الضريبي'] || row['vat'] || '',
        phone: row['رقم الهاتف'] || row['phone'] || '',
      };
      
      try {
        await saveClient({
          id: `C-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: newClient.name,
          type: newClient.type as 'فرد' | 'منشأة',
          nationalId: newClient.nationalId,
          commercialRegistration: newClient.commercialRegistration,
          vatNumber: newClient.vatNumber,
          phone: newClient.phone,
        });
      } catch (err) {
        console.error("Failed to import client:", newClient.name);
      }
    }
    // Reload clients after import
    const newClients = await fetchClients();
    if (newClients?.length > 0) useClientsStore.getState().setClients(newClients);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">الموكلون والتوكيلات</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة بيانات الأفراد والمنشآت وتوكيلات الشهر العقاري.</p>
        </div>
        <div className="flex items-center gap-2">
          <CSVImporter onImport={handleImportClients} label="استيراد موكلين (CSV)" />
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
          }}>
            <Button type="button" className="bg-primary-500 hover:bg-primary-600 text-white gap-2" onClick={openNewClientDialog}>
              <UserPlus size={18} />
              إضافة عميل جديد
            </Button>
          <DialogContent className="sm:max-w-[500px] border-none shadow-2xl dark:bg-navy-900">
            <DialogHeader>
              <DialogTitle className="text-navy-900 dark:text-white">
                {editingClientId ? "تعديل بيانات العميل" : "إضافة عميل جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">نوع العميل</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v: any) => setFormData(prev => ({ ...prev, type: v }))}
                  >
                    <SelectTrigger className="dark:bg-white/5 dark:border-white/10">
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-navy-800 dark:border-white/10">
                      <SelectItem value="فرد">فرد</SelectItem>
                      <SelectItem value="منشأة">منشأة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">اسم العميل</Label>
                  <Input 
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="الاسم الكامل" 
                    className="dark:bg-white/5 dark:border-white/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {formData.type === 'فرد' ? (
                  <div className="space-y-2">
                    <Label htmlFor="nationalId">الرقم القومي (14 رقم)</Label>
                    <Input 
                      id="nationalId"
                      value={formData.nationalId}
                      onChange={e => setFormData(prev => ({ ...prev, nationalId: e.target.value }))}
                      placeholder="2XXXXXXXXXXXXX" 
                      className="dark:bg-white/5 dark:border-white/10"
                      maxLength={14}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="cr">رقم السجل التجاري</Label>
                    <Input 
                      id="cr"
                      value={formData.commercialRegistration}
                      onChange={e => setFormData(prev => ({ ...prev, commercialRegistration: e.target.value }))}
                      placeholder="XXXXXXX" 
                      className="dark:bg-white/5 dark:border-white/10"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف المصري</Label>
                  <Input 
                    id="phone"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+201XXXXXXXXX" 
                    dir="ltr"
                    className="dark:bg-white/5 dark:border-white/10"
                  />
                </div>
              </div>

              {formData.type === 'منشأة' && (
                <div className="space-y-2">
                  <Label htmlFor="vat">رقم التسجيل الضريبي (إن وجد)</Label>
                  <Input 
                    id="vat"
                    value={formData.vatNumber}
                    onChange={e => setFormData(prev => ({ ...prev, vatNumber: e.target.value }))}
                    placeholder="3XXXXXXXXXXXXXX" 
                    className="dark:bg-white/5 dark:border-white/10"
                  />
                </div>
              )}

              <DialogFooter className="mt-6">
                <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white">
                  {editingClientId ? "حفظ التعديلات" : "حفظ العميل"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader className="p-4 border-b border-slate-50 dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="البحث بالاسم، الرقم القومي، أو السجل التجاري..." 
                className="ps-10 bg-slate-50 dark:bg-white/5 border-none focus-visible:ring-primary-500/20"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" className="gap-2 text-slate-600 dark:text-slate-400 dark:border-white/10" />}>
                <Filter size={18} />
                تصفية {filterType !== "الكل" && `(${filterType})`}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dark:bg-navy-800 dark:border-white/10 w-32">
                <DropdownMenuItem onClick={() => { setFilterType("الكل"); setCurrentPage(1); }} className="cursor-pointer dark:focus:bg-white/5">
                  الكل
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setFilterType("فرد"); setCurrentPage(1); }} className="cursor-pointer dark:focus:bg-white/5">
                  فرد فقط
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setFilterType("منشأة"); setCurrentPage(1); }} className="cursor-pointer dark:focus:bg-white/5">
                  منشأة فقط
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-white/5">
              <TableRow>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">العميل</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">النوع</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">الرقم القومي/السجل</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">رقم التسجيل الضريبي</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">رقم التواصل</TableHead>
                <TableHead className="text-end font-bold text-navy-900 dark:text-white">إجراءات</TableHead>
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
              ) : currentClients.length > 0 ? (
                currentClients.map((client) => (
                  <ClientRow 
                    key={client.id} 
                    client={client} 
                    onEdit={handleEditClick} 
                    onDelete={handleDeleteClick} 
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="p-0 border-b-0">
                    <EmptyState 
                      icon={Users}
                      title="لا يوجد موكلون"
                      description={searchQuery ? "لم يتم العثور على موكلين يطابقون بحثك." : "لم تقم بإضافة أي موكلين بعد. ابدأ بإضافة الموكل الأول."}
                      actionLabel={!searchQuery ? "إضافة عميل" : undefined}
                      onAction={!searchQuery ? openNewClientDialog : undefined}
                    />
                  </TableCell>
                </TableRow>
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

      <Card className="border-none shadow-sm dark:bg-navy-800 mt-6">
        <CardHeader className="p-4 border-b border-slate-50 dark:border-white/5">
          <CardTitle className="text-lg font-bold">ملف الموكل وقضاياه</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2 max-w-sm">
            <Label>اختر الموكل لعرض ملفه</Label>
            <Select 
              value={selectedClientForProfile?.id || undefined} 
              onValueChange={(v: any) => setSelectedClientForProfile(clients.find(c => c.id === v) || null)}
            >
              <SelectTrigger className="dark:bg-white/5 dark:border-white/10">
                <SelectValue placeholder="اختر موكلاً..." />
              </SelectTrigger>
              <SelectContent className="dark:bg-navy-800 dark:border-white/10">
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedClientForProfile && (() => {
            const clientCases = cases.filter(c => c.clientId === selectedClientForProfile.id);
            const activeCases = clientCases.filter(c => c.status === 'متداولة').length;
            const archivedCases = clientCases.filter(c => c.status === 'محفوظة').length;

            return (
              <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-white/5">
                <div className="flex gap-4">
                  <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">إجمالي القضايا: {clientCases.length}</Badge>
                  <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">متداولة: {activeCases}</Badge>
                  <Badge variant="secondary" className="bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">محفوظة: {archivedCases}</Badge>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">اسم القضية / المسمى</TableHead>
                      <TableHead className="font-bold">الحالة</TableHead>
                      <TableHead className="font-bold">الكود</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientCases.length > 0 ? clientCases.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-bold">{c.title || c.id}</TableCell>
                        <TableCell>
                          <Badge className={c.status === 'متداولة' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100' : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-400 hover:bg-slate-100'}>
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {c.status === 'متداولة' ? c.circulationCode || '-' : c.archiveCode || '-'}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-slate-500">لا توجد قضايا لهذا الموكل</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Sub-section A: إدارة التوكيلات */}
                <div className="pt-6 mt-6 border-t border-slate-50 dark:border-white/5">
                  <ClientPoaTab clientId={selectedClientForProfile.id} />
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </motion.div>
  );
}
