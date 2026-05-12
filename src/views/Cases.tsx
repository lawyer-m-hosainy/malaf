import { motion, AnimatePresence } from "motion/react";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MoreHorizontal, Link2, Link2Off, ChevronDown, ChevronUp, Plus, Edit, Trash2, Scale } from "lucide-react";
import { useCasesStore } from "@/store/useCasesStore";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useTeamStore } from "@/store/useTeamStore";
import { useClientsStore } from "@/store/useClientsStore";
import { useEnforcementStore } from "@/store/useEnforcementStore";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCases, fetchClients, fetchEnforcement, fetchTasks, fetchTeam, fetchTrustAccounts, saveCase } from "@/services/legalDataService";
import { CSVImporter } from "@/components/CSVImporter";

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import {
  NewCaseDialog,
  CaseDetailsPanel,
  MemorandumsDialog,
  ReferToEnforcementDialog,
  useCaseActions
} from "./cases-components";

const CaseRow = React.memo(({ 
  c, 
  isExpanded, 
  onToggleExpand, 
  handleLinkToELitigation, 
  onEdit, 
  onDelete,
  onRefer,
  sessions,
  expenses,
  tasks,
  deadlines
}: any) => {
  return (
    <React.Fragment>
      <TableRow 
        className={cn(
          "transition-colors cursor-pointer group",
          isExpanded ? "bg-primary-50/30 dark:bg-primary-900/10" : "hover:bg-slate-50/50 dark:hover:bg-white/5"
        )}
        onClick={() => onToggleExpand(c.id)}
      >
        <TableCell className="p-0 text-center">
          <div className="flex items-center justify-center">
            {isExpanded ? (
              <ChevronUp size={18} className="text-primary-500" />
            ) : (
              <ChevronDown size={18} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
            )}
          </div>
        </TableCell>
        <TableCell className="font-bold text-primary-600 dark:text-primary-400">
          {c.id}
        </TableCell>
        <TableCell className="text-sm text-slate-700 dark:text-slate-300">{c.court}</TableCell>
        <TableCell>
          <div className="text-xs space-y-1">
            <p><span className="text-slate-400">المدعي:</span> <span className="font-bold text-navy-900 dark:text-white">{c.plaintiff}</span></p>
            <p><span className="text-slate-400">المدعى عليه:</span> <span className="font-bold text-navy-900 dark:text-white">{c.defendant}</span></p>
          </div>
        </TableCell>
        <TableCell>
          <Badge className={cn(
            "font-bold",
            c.status === 'متداولة' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100" : 
            c.status === 'تحت الدراسة' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100" : "bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-400 hover:bg-slate-100"
          )}>
            {c.status}
          </Badge>
        </TableCell>
        <TableCell>
          <div className={cn(
            "flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md w-fit",
            c.eLitigationStatus === 'مربوط ببوابة التقاضي' ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400" : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400"
          )}>
            {c.eLitigationStatus === 'مربوط ببوابة التقاضي' ? <Link2 size={12} /> : <Link2Off size={12} />}
            {c.eLitigationStatus}
          </div>
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <MemorandumsDialog caseData={c} />
        </TableCell>
        <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-2">
            {c.eLitigationStatus !== 'مربوط ببوابة التقاضي' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-[10px] font-bold border-primary-200 dark:border-white/10 text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-white/5 gap-1"
                onClick={() => handleLinkToELitigation(c.id)}
              >
                <Link2 size={12} />
                الربط بالبوابة
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-navy-900 dark:hover:text-white" />}>
                <MoreHorizontal size={18} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dark:bg-navy-800 dark:border-white/10 w-40">
                {c.status !== 'محفوظة' && c.status !== 'مغلقة' && (
                  <DropdownMenuItem onClick={() => onEdit(c)} className="cursor-pointer dark:focus:bg-white/5 gap-2 flex items-center">
                    <Edit size={16} className="text-slate-500" />
                    <span>تعديل</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onRefer(c)} className="cursor-pointer dark:focus:bg-white/5 gap-2 flex items-center">
                  <Scale size={16} className="text-primary-500" />
                  <span>إحالة للتنفيذ</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(c.id)} className="cursor-pointer text-red-600 dark:text-red-400 dark:focus:bg-red-500/10 gap-2 flex items-center">
                  <Trash2 size={16} />
                  <span>حذف</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
      
      <AnimatePresence>
        {isExpanded && (
          <TableRow className="bg-slate-50/30 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
            <TableCell colSpan={8} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <CaseDetailsPanel 
                  caseData={c} 
                  sessions={sessions} 
                  expenses={expenses} 
                  tasks={tasks} 
                  deadlines={deadlines}
                />
              </motion.div>
            </TableCell>
          </TableRow>
        )}
      </AnimatePresence>
    </React.Fragment>
  );
});

export default function Cases() {
  const cases = useCasesStore(state => state.cases);
  const sessions = useCasesStore(state => state.sessions);
  const deadlines = useCasesStore(state => state.deadlines);
  const deleteCase = useCasesStore(state => state.deleteCase);
  const hasLoaded = useCasesStore(state => state.hasLoaded);
  const expenses = useFinanceStore(state => state.expenses);
  const tasks = useTeamStore(state => state.tasks);

  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState<any>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<string | null>(null);
  const [referOpen, setReferOpen] = useState(false);
  const [caseToRefer, setCaseToRefer] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("الكل");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const isLoading = !hasLoaded;

  // R8: Data loading moved to global AppDataLoader to prevent redundant fetches on navigation

  const handleToggleExpand = React.useCallback((id: string) => {
    setExpandedCase(prev => prev === id ? null : id);
  }, []);

  const handleEditClick = React.useCallback((c: any) => {
    setCaseToEdit(c);
    setIsNewCaseOpen(true);
  }, []);

  const handleDeleteClick = React.useCallback((id: string) => {
    setCaseToDelete(id);
    setDeleteOpen(true);
  }, []);

  const handleReferClick = React.useCallback((c: any) => {
    setCaseToRefer(c);
    setReferOpen(true);
  }, []);

  const filteredCases = (cases || []).filter(c => {
    const matchesSearch = (c.id || "").includes(searchQuery) || 
                          (c.automatedNumber || "").includes(searchQuery) ||
                          (c.circulationCode || "").includes(searchQuery) ||
                          (c.archiveCode || "").includes(searchQuery) ||
                          (c.plaintiff || "").includes(searchQuery) || 
                          (c.defendant || "").includes(searchQuery) ||
                          (c.court || "").includes(searchQuery);
    const matchesStatus = filterStatus === "الكل" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const currentCases = filteredCases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const { handleLinkToELitigation } = useCaseActions();

  const handleImportCases = async (data: any[]) => {
    for (const row of data) {
      const title = row['اسم القضية'] || row['title'] || row['Title'];
      if (!title) continue;
      
      try {
        await saveCase({
          title,
          court: row['المحكمة'] || row['court'] || '',
          plaintiff: row['المدعي'] || row['plaintiff'] || '',
          defendant: row['المدعى عليه'] || row['defendant'] || '',
          status: row['الحالة'] || row['status'] || 'متداولة',
          type: row['النوع'] || row['type'] || 'مدني',
        });
      } catch (err) {
        console.error("Failed to import case:", title);
      }
    }
    const newCases = await fetchCases();
    if (newCases?.length > 0) useCasesStore.getState().setCases(newCases);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">إدارة القضايا</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">متابعة القضايا، المذكرات، والربط مع بوابة التقاضي الإلكتروني.</p>
        </div>
        <div className="flex items-center gap-2">
          <CSVImporter onImport={handleImportCases} label="استيراد قضايا (CSV)" />
          <Button
            type="button"
            className="bg-primary-500 hover:bg-primary-600 text-white gap-2 shadow-lg shadow-primary-500/20"
            onClick={() => setIsNewCaseOpen(true)}
          >
            <Plus size={18} />
            قضية جديدة
          </Button>
        </div>
        <NewCaseDialog 
          open={isNewCaseOpen} 
          onOpenChange={(open) => {
            setIsNewCaseOpen(open);
            if (!open) setCaseToEdit(null);
          }} 
          caseToEdit={caseToEdit}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="ابحث برقم القضية، المحكمة، أو الأطراف..." 
            className="ps-10 border-slate-200 dark:border-white/10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Badge variant="outline" className="text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10">
            تصفية:
          </Badge>
          <div className="flex gap-1">
            {["الكل", "متداولة", "تحت الدراسة", "مغلقة"].map(status => (
              <Button
                key={status}
                variant={filterStatus === status ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 text-xs",
                  filterStatus === status ? "bg-primary-50 text-primary-700 hover:bg-primary-100" : "text-slate-500"
                )}
                onClick={() => setFilterStatus(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm dark:bg-navy-900 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-white/5">
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead className="text-start">رقم القضية</TableHead>
                <TableHead className="text-start">المحكمة</TableHead>
                <TableHead className="text-start">الأطراف</TableHead>
                <TableHead className="text-start">الحالة</TableHead>
                <TableHead className="text-start">بوابة التقاضي</TableHead>
                <TableHead className="text-start">المذكرات</TableHead>
                <TableHead className="text-end">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8} className="p-4">
                      <Skeleton className="h-12 w-full rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : currentCases.length > 0 ? (
                currentCases.map(c => (
                  <CaseRow 
                    key={c.id} 
                    c={c} 
                    isExpanded={expandedCase === c.id}
                    onToggleExpand={handleToggleExpand}
                    handleLinkToELitigation={handleLinkToELitigation}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    onRefer={handleReferClick}
                    sessions={sessions}
                    expenses={expenses}
                    tasks={tasks}
                    deadlines={deadlines}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                      <Scale size={48} className="opacity-20" />
                      <p>لا توجد قضايا تطابق فلاتر البحث</p>
                    </div>
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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="dark:bg-navy-900 dark:text-white dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف القضية وجميع المذكرات والجلسات المرتبطة بها بشكل نهائي.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="dark:bg-navy-800 dark:hover:bg-white/5 mt-0">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (caseToDelete) {
                deleteCase(caseToDelete);
                toast.success("تم حذف القضية بنجاح");
              }
            }} className="bg-red-600 hover:bg-red-700 text-white">تأكيد الحذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReferToEnforcementDialog 
        open={referOpen} 
        onOpenChange={(open) => {
          setReferOpen(open);
          if (!open) setCaseToRefer(null);
        }} 
        caseData={caseToRefer} 
      />
    </motion.div>
  );
}
