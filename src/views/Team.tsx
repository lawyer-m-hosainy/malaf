import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Users, Briefcase, CheckCircle2, Clock, Mail, Phone, MoreVertical, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { useTeamStore } from '@/store/useTeamStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export default function Team() {
  const teamMembers = useTeamStore((state) => state.teamMembers);
  const addTeamMember = useTeamStore((state) => state.addTeamMember);
  const updateTeamMember = useTeamStore((state) => state.updateTeamMember);
  const removeTeamMember = useTeamStore((state) => state.removeTeamMember);
  const [addOpen, setAddOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "محامي متدرب" as any });

  const [editOpen, setEditOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<any>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);

  const handleEditSave = () => {
    if (!memberToEdit?.name.trim() || !memberToEdit?.email.trim()) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    updateTeamMember(memberToEdit.id, memberToEdit);
    setEditOpen(false);
    toast.success("تم تحديث بيانات العضو بنجاح");
  };

  const handleDeleteConfirm = () => {
    if (memberToDelete) {
      removeTeamMember(memberToDelete.id);
      setDeleteOpen(false);
      toast.success("تم حذف العضو بنجاح");
    }
  };

  const totalCases = teamMembers.reduce((acc, curr) => acc + curr.activeCases, 0);
  const totalPendingTasks = teamMembers.reduce((acc, curr) => acc + curr.pendingTasks, 0);

  const stats = [
    { title: "إجمالي الفريق", value: teamMembers.length.toLocaleString('ar-EG'), icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { title: "قضايا نشطة", value: totalCases.toLocaleString('ar-EG'), icon: Briefcase, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { title: "مهام معلقة", value: totalPendingTasks.toLocaleString('ar-EG'), icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">إدارة الفريق والإنتاجية</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">متابعة أداء المحامين، توزيع القضايا، والإنتاجية العامة للمكتب.</p>
        </div>
        <Button className="bg-primary-500 hover:bg-primary-600 text-white gap-2" onClick={() => setAddOpen(true)}>
          <Plus size={18} />
          إضافة عضو جديد
        </Button>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="dark:bg-navy-900 dark:text-white">
            <DialogHeader>
              <DialogTitle>إضافة عضو جديد</DialogTitle>
            </DialogHeader>
            <form className="space-y-4 pt-4" onSubmit={(e) => {
              e.preventDefault();
              if (!newMember.name.trim() || !newMember.email.trim()) {
                toast.error("يرجى ملء جميع الحقول");
                return;
              }
              addTeamMember({
                id: `TM-${Date.now()}`,
                name: newMember.name,
                email: newMember.email,
                role: newMember.role,
                avatar: '',
                activeCases: 0,
                pendingTasks: 0,
                completedTasks: 0,
                joinDate: new Date().toISOString().split('T')[0],
                status: 'نشط',
              });
              toast.success("تم إضافة العضو بنجاح");
              setAddOpen(false);
              setNewMember({ name: "", email: "", role: "محامي متدرب" as any });
            }}>
              <div className="space-y-2">
                <Label>الاسم</Label>
                <Input required placeholder="اسم العضو" className="dark:bg-navy-800" value={newMember.name} onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input required type="email" placeholder="example@lawfirm.eg" dir="ltr" className="dark:bg-navy-800 text-start" value={newMember.email} onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>الدور</Label>
                <Select value={newMember.role} onValueChange={(v) => v && setNewMember(prev => ({ ...prev, role: v as any }))}>
                  <SelectTrigger className="dark:bg-navy-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-navy-800">
                    <SelectItem value="محامي شريك">محامي شريك</SelectItem>
                    <SelectItem value="محامي مستشار">محامي مستشار</SelectItem>
                    <SelectItem value="محامي">محامي</SelectItem>
                    <SelectItem value="محامي متدرب">محامي متدرب</SelectItem>
                    <SelectItem value="سكرتير">سكرتير</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-primary-500 text-white">حفظ العضو</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm dark:bg-navy-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-navy-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {teamMembers.length > 0 ? teamMembers.map((member) => (
          <Card key={member.id} className="border-none shadow-sm dark:bg-navy-800 overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-50 dark:border-white/5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-white dark:border-navy-700">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="bg-primary-50 text-primary-700 font-bold">
                      {member.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg font-bold text-navy-900 dark:text-white">{member.name}</CardTitle>
                    <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn(
                    "font-bold",
                    member.status === 'نشط' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400"
                  )}>
                    {member.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-navy-900 dark:hover:text-white" />}>
                      <MoreVertical size={16} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="dark:bg-navy-800 dark:border-white/10 w-40">
                      <DropdownMenuItem onClick={() => { setMemberToEdit(member); setEditOpen(true); }} className="cursor-pointer dark:focus:bg-white/5 gap-2 flex items-center">
                        <Edit size={16} className="text-slate-500" />
                        <span>تعديل</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setMemberToDelete(member); setDeleteOpen(true); }} className="cursor-pointer text-red-600 dark:text-red-400 dark:focus:bg-red-500/10 gap-2 flex items-center">
                        <Trash2 size={16} />
                        <span>حذف</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">قضايا</p>
                  <p className="text-lg font-bold text-navy-900 dark:text-white">{(member.activeCases || 0).toLocaleString('ar-EG')}</p>
                </div>
                <div className="space-y-1 border-x border-slate-50 dark:border-white/5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">مهام</p>
                  <p className="text-lg font-bold text-navy-900 dark:text-white">{(member.pendingTasks || 0).toLocaleString('ar-EG')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">مكتملة</p>
                  <p className="text-lg font-bold text-navy-900 dark:text-white">{(member.completedTasks || 0).toLocaleString('ar-EG')}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">معدل الإنجاز</span>
                  <span className="font-bold text-navy-900 dark:text-white">
                    {Math.round(((member.completedTasks || 0) / Math.max(1, (member.completedTasks || 0) + (member.pendingTasks || 0))) * 100).toLocaleString('ar-EG')}%
                  </span>
                </div>
                <Progress 
                  value={((member.completedTasks || 0) / Math.max(1, (member.completedTasks || 0) + (member.pendingTasks || 0))) * 100} 
                  dir="rtl"
                  className="h-2 bg-slate-100 dark:bg-white/5"
                />
              </div>

              <div className="pt-4 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8 dark:border-white/10" onClick={() => { window.location.href = `mailto:${member.email}`; }}>
                    <Mail size={14} className="text-slate-500" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 dark:border-white/10" onClick={() => { navigator.clipboard.writeText(member.email); toast.success(`تم نسخ بريد ${member.name}`); }}>
                    <Phone size={14} className="text-slate-500" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="text-primary-600 dark:text-primary-400 text-xs font-bold" onClick={() => { setSelectedMember(member); setProfileOpen(true); }}>
                  عرض الملف الشخصي
                </Button>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="col-span-1 lg:col-span-2 xl:col-span-3">
            <EmptyState 
              icon={Users}
              title="لا يوجد أعضاء في الفريق"
              description="لم تقم بإضافة أي أعضاء لفريق عملك بعد."
              actionLabel="إضافة عضو جديد"
              onAction={() => setAddOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="dark:bg-navy-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedMember?.avatar} />
                <AvatarFallback className="bg-primary-50 text-primary-700 font-bold">
                  {selectedMember?.name?.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              {selectedMember?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-500">الدور</p><p className="font-bold">{selectedMember.role}</p></div>
                <div><p className="text-xs text-slate-500">الحالة</p><p className="font-bold">{selectedMember.status}</p></div>
                <div><p className="text-xs text-slate-500">البريد</p><p className="font-bold text-sm">{selectedMember.email}</p></div>
                <div><p className="text-xs text-slate-500">تاريخ الانضمام</p><p className="font-bold">{selectedMember.joinDate}</p></div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-white/10">
                <div className="text-center"><p className="text-xs text-slate-500">قضايا نشطة</p><p className="text-xl font-bold">{selectedMember.activeCases}</p></div>
                <div className="text-center"><p className="text-xs text-slate-500">مهام معلقة</p><p className="text-xl font-bold">{selectedMember.pendingTasks}</p></div>
                <div className="text-center"><p className="text-xs text-slate-500">مهام مكتملة</p><p className="text-xl font-bold">{selectedMember.completedTasks}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="dark:bg-navy-900 dark:text-white">
          <DialogHeader>
            <DialogTitle>تعديل بيانات العضو</DialogTitle>
          </DialogHeader>
          {memberToEdit && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>الاسم</Label>
                <Input value={memberToEdit.name} onChange={(e) => setMemberToEdit({...memberToEdit, name: e.target.value})} className="dark:bg-navy-800" />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input type="email" value={memberToEdit.email} onChange={(e) => setMemberToEdit({...memberToEdit, email: e.target.value})} className="dark:bg-navy-800" />
              </div>
              <div className="space-y-2">
                <Label>الدور</Label>
                <Select value={memberToEdit.role} onValueChange={(v) => setMemberToEdit({...memberToEdit, role: v})}>
                  <SelectTrigger className="dark:bg-navy-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-navy-800">
                    <SelectItem value="محامي شريك">محامي شريك</SelectItem>
                    <SelectItem value="محامي مستشار">محامي مستشار</SelectItem>
                    <SelectItem value="محامي">محامي</SelectItem>
                    <SelectItem value="محامي متدرب">محامي متدرب</SelectItem>
                    <SelectItem value="سكرتير">سكرتير</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select value={memberToEdit.status} onValueChange={(v) => setMemberToEdit({...memberToEdit, status: v})}>
                  <SelectTrigger className="dark:bg-navy-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-navy-800">
                    <SelectItem value="نشط">نشط</SelectItem>
                    <SelectItem value="غير نشط">غير نشط</SelectItem>
                    <SelectItem value="في إجازة">في إجازة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleEditSave} className="w-full bg-primary-500 text-white hover:bg-primary-600">حفظ التعديلات</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="dark:bg-navy-900 dark:text-white dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف العضو '{memberToDelete?.name}' بشكل نهائي من النظام.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="dark:bg-navy-800 dark:hover:bg-white/5 mt-0">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">تأكيد الحذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
