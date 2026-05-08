import { Bell, Search, User, LogOut, ShieldCheck, CheckCircle2, AlertCircle, Info, XCircle, Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/useAuthStore";
import { useClientsStore } from "@/store/useClientsStore";
import { useCasesStore } from "@/store/useCasesStore";
import { useTeamStore } from "@/store/useTeamStore";
import { useUIStore } from "@/store/useUIStore";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useDeferredValue } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

import { useNotificationsStore } from "@/store/useNotificationsStore";

export function Topbar() {
  const currentUser = useAuthStore(state => state.currentUser);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationsStore();
  const toggleSidebar = useUIStore(state => state.toggleSidebar);
  const clients = useClientsStore(state => state.clients);
  const cases = useCasesStore(state => state.cases);
  const tasks = useTeamStore(state => state.tasks);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  const unreadCountDisplay = unreadCount;

  const searchResults = useMemo(() => {
    if (!deferredSearchQuery.trim()) return null;
    const query = deferredSearchQuery.toLowerCase();
    
    const filteredClients = clients.filter(c => c.name.toLowerCase().includes(query)).slice(0, 3);
    const filteredCases = cases.filter(c => c.id.toLowerCase().includes(query) || (c.plaintiff || "").toLowerCase().includes(query) || (c.defendant || "").toLowerCase().includes(query)).slice(0, 3);
    const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(query)).slice(0, 3);
    
    return { clients: filteredClients, cases: filteredCases, tasks: filteredTasks };
  }, [deferredSearchQuery, clients, cases, tasks]);

  const handleMarkAllAsReadClick = () => {
    markAllAsRead();
    toast.success("تم تحديد الكل كمقروء");
  };

  const handleLogout = async () => {
    try {
      // تسجيل خروج Supabase
      await supabase.auth.signOut();
      
      // ═══ R2 Security: مسح جميع بيانات المستأجر من الذاكرة ═══
      // هذا حرج لمنع تسرب بيانات مكتب لمكتب آخر عند تبديل الحسابات
      const { useAuthStore } = await import('@/store/useAuthStore');
      const { useClientsStore } = await import('@/store/useClientsStore');
      const { useCasesStore } = await import('@/store/useCasesStore');
      const { useTeamStore } = await import('@/store/useTeamStore');
      const { useFinanceStore } = await import('@/store/useFinanceStore');
      const { useInvoicesStore } = await import('@/store/useInvoicesStore');
      const { useEnforcementStore } = await import('@/store/useEnforcementStore');
      const { useNotificationsStore } = await import('@/store/useNotificationsStore');
      const { setTenantIdCache } = await import('@/lib/tenant');
      
      // مسح cache المستأجر
      setTenantIdCache(null);
      
      // مسح جميع الـ stores
      useAuthStore.getState().reset();
      useClientsStore.getState().setClients([]);
      useCasesStore.getState().setCases([]);
      useTeamStore.getState().setTeamMembers([]);
      useTeamStore.getState().setTasks([]);
      useFinanceStore.getState().setTrustAccounts([]);
      useInvoicesStore.getState().loadInvoices([]);
      useEnforcementStore.getState().setEnforcementCases([]);
      useNotificationsStore.getState().clearAll();
      
      // مسح localStorage لمنع استعادة بيانات قديمة
      localStorage.removeItem('auth-storage');
      
      toast.success("تم تسجيل الخروج بنجاح");
      navigate("/login");
    } catch {
      toast.error("تعذر تسجيل الخروج، حاول مرة أخرى");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-emerald-500" size={16} />;
      case 'warning': return <AlertCircle className="text-amber-500" size={16} />;
      case 'error': return <XCircle className="text-destructive" size={16} />;
      default: return <Info className="text-blue-500" size={16} />;
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="lg:hidden text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white"
        >
          <Menu size={24} />
        </Button>
        <div className="relative flex-1 sm:w-96">
          <div className="flex items-center bg-slate-100 dark:bg-white/5 rounded-md px-3 py-2 w-full focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
            <Search size={18} className="text-slate-400 min-w-[18px]" />
            <input 
            type="text" 
            placeholder="ابحث عن قضية، عميل، أو رقم هوية..." 
            aria-label="بحث داخل النظام"
            className="bg-transparent border-none outline-none w-full text-sm px-3 placeholder:text-slate-400 dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {searchResults && (
          <div className="absolute top-full mt-2 w-full bg-white dark:bg-navy-800 rounded-lg shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden z-50">
            <ScrollArea className="max-h-96">
              <div className="p-2">
                {searchResults.clients.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1">العملاء</p>
                    {searchResults.clients.map(client => (
                      <button 
                        key={client.id}
                        onClick={() => { navigate('/dashboard/clients'); setSearchQuery(""); }}
                        className="w-full text-start px-2 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-white/5 text-sm transition-colors"
                      >
                        {client.name}
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.cases.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1">القضايا</p>
                    {searchResults.cases.map(c => (
                      <button 
                        key={c.id}
                        onClick={() => { navigate('/dashboard/cases'); setSearchQuery(""); }}
                        className="w-full text-start px-2 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-white/5 text-sm transition-colors"
                      >
                        <span className="font-bold text-primary-600">{c.id}</span> - {c.plaintiff}
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.tasks.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1">المهام</p>
                    {searchResults.tasks.map(t => (
                      <button 
                        key={t.id}
                        onClick={() => { navigate('/dashboard/tasks'); setSearchQuery(""); }}
                        className="w-full text-start px-2 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-white/5 text-sm transition-colors"
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.clients.length === 0 && searchResults.cases.length === 0 && searchResults.tasks.length === 0 && (
                  <p className="text-center py-4 text-sm text-slate-400">لا توجد نتائج</p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-4 shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
          className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full"
          aria-label="تبديل المظهر"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button aria-label="فتح الإشعارات" className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors group">
              <Bell size={20} className="group-hover:text-primary-500 transition-colors" />
              {unreadCountDisplay > 0 && (
                <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-white dark:border-navy-900"></span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
            <DropdownMenuGroup>
              <div className="p-4 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
                <DropdownMenuLabel className="p-0">الإشعارات</DropdownMenuLabel>
                <button 
                  onClick={handleMarkAllAsReadClick}
                  className="text-[10px] font-bold text-primary-600 hover:underline"
                >
                  تحديد الكل كمقروء
                </button>
              </div>
            </DropdownMenuGroup>
            <ScrollArea className="max-h-80">
              <div className="divide-y divide-slate-50 dark:divide-white/5">
                {notifications.length > 0 ? (
                  notifications.slice(0, 10).map(n => (
                    <div 
                      key={n.id} 
                      className={cn(
                        "p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer",
                        !n.read && "bg-primary-50/30 dark:bg-primary-900/10"
                      )}
                      onClick={() => markAsRead(n.id)}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5">{getNotificationIcon(n.type)}</div>
                        <div className="flex-1">
                          <p className={cn("text-sm font-bold", !n.read ? "text-navy-900 dark:text-white" : "text-slate-600 dark:text-slate-400")}>
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleTimeString('ar-EG')}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400">لا توجد إشعارات</div>
                )}
              </div>
            </ScrollArea>
            <div className="p-2 border-t border-slate-50 dark:border-white/5 text-center">
              <button 
                className="text-xs font-bold text-primary-600 hover:underline"
                onClick={() => console.warn('Notifications page not built yet')}
              >
                عرض جميع الإشعارات
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-2"></div>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <button aria-label="فتح قائمة الحساب" className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 p-1.5 rounded-md transition-colors">
              <div className="text-end hidden sm:block">
                <p className="text-sm font-bold text-navy-900 dark:text-white">{currentUser?.name}</p>
                <div className="flex items-center justify-end gap-1">
                  <ShieldCheck size={12} className="text-primary-500" />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{currentUser?.role}</p>
                </div>
              </div>
              <Avatar className="h-9 w-9 border-2 border-primary-50 dark:border-white/10">
                <AvatarImage src={currentUser?.avatar} />
                <AvatarFallback className="bg-primary-500 text-white font-bold">
                  {currentUser?.name.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>حسابي</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate('/dashboard/settings')}>
              <User size={16} />
              الملف الشخصي
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
              <LogOut size={16} />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
