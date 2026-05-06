import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, Users, Scale, Calculator, Settings, Calendar, Wallet, 
  Users2, ListTodo, BarChart3, ShieldCheck, Library, FileEdit, Clock, 
  Fingerprint, Globe, Sparkles, Landmark, History, BookOpen, FileText, Briefcase, GraduationCap,
  Gavel, HandCoins, Zap, FileSignature, MessageSquare, Layers,
  PieChart as PieChartIcon, Shield, Building, Home, Heart, Siren, Receipt, Monitor,
  Search, ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";

const navGroups = [
  {
    title: "القائمة الرئيسية",
    items: [
      { name: "الرئيسية", href: "/dashboard", icon: LayoutDashboard },
      { name: "الموكلين", href: "/dashboard/clients", icon: Users },
      { name: "التوكيلات", href: "/dashboard/poa", icon: FileSignature },
      { name: "القضايا", href: "/dashboard/cases", icon: Scale },
      { name: "أجندة الجلسات", href: "/dashboard/roll", icon: Calendar },
      { name: "التقويم", href: "/dashboard/calendar", icon: Calendar },
      { name: "الشغل الإداري", href: "/dashboard/tasks", icon: ClipboardList },
      { name: "التنفيذ القضائي", href: "/dashboard/enforcement", icon: Gavel },
      { name: "المالية والمصروفات", href: "/dashboard/finance", icon: Calculator },
      { name: "العقود والمستندات", href: "/dashboard/documents", icon: Library },
    ]
  },
  {
    title: "خدمات متخصصة",
    items: [
      { name: "الفاتورة الإلكترونية", href: "/dashboard/eta-invoicing", icon: Receipt },
      { name: "مأموريات الخبراء", href: "/dashboard/experts", icon: Search },
      { name: "الشهر العقاري", href: "/dashboard/real-estate-registry", icon: Home },
      { name: "المسارات المتخصصة", href: "/dashboard/specialized-tracks", icon: Layers },
      { name: "فحص تعارض المصالح", href: "/dashboard/conflict-check", icon: Shield },
      { name: "تتبع الوقت", href: "/dashboard/time-tracking", icon: Clock },
      { name: "التحصيل", href: "/dashboard/collections", icon: HandCoins },
      { name: "واتساب بوت", href: "/dashboard/whatsapp", icon: MessageSquare },
      { name: "المحلل الذكي", href: "/dashboard/ai-analyzer", icon: Sparkles },
      { name: "إحصائيات الأداء", href: "/dashboard/analytics", icon: BarChart3 },
      { name: "فريق العمل", href: "/dashboard/team", icon: Users2 },
      { name: "المعرفة القانونية", href: "/dashboard/wiki", icon: BookOpen },
    ]
  },
  {
    title: "بوابات مصر الرقمية",
    items: [
      { name: "بوابة التقاضي", href: "/dashboard/e-litigation", icon: Globe },
      { name: "مجلس الدولة", href: "/dashboard/state-council", icon: Building },
      { name: "المحكمة الاقتصادية", href: "/dashboard/economic-court", icon: Landmark },
      { name: "القضايا الجنائية", href: "/dashboard/criminal-cases", icon: Siren },
      { name: "محاكم الأسرة", href: "/dashboard/family-courts", icon: Heart },
      { name: "نقابة المحامين", href: "/dashboard/bar-association", icon: GraduationCap },
    ]
  }
];

export function Sidebar() {
  const hasPermission = useAuthStore(state => state.hasPermission);
  const isSidebarOpen = useUIStore(state => state.isSidebarOpen);
  const closeSidebar = useUIStore(state => state.closeSidebar);

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={closeSidebar}
        />
      )}

      <aside className={cn(
        "bg-navy-900 dark:bg-black text-white flex flex-col h-[100dvh] fixed lg:sticky top-0 z-50 shadow-xl transition-transform duration-300 w-64 border-e border-navy-900/20 dark:border-white/10",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0" 
      )}>
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-8 h-8 rounded bg-accent-500 flex items-center justify-center text-navy-900 font-bold">
          <Scale size={20} />
        </div>
        <h1 className="text-xl font-bold tracking-tight">مَلَف</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {group.title && (
              <h3 className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => {
                   if (window.innerWidth < 1024) closeSidebar();
                }}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                    isActive 
                      ? "bg-primary-500 text-white shadow-sm" 
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  )
                }
              >
                <item.icon size={18} />
                {item.name}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <NavLink 
          to="/dashboard/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium",
              isActive 
                ? "bg-primary-500 text-white shadow-sm" 
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            )
          }
        >
          <Settings size={18} />
          الإعدادات
        </NavLink>
        {hasPermission('view_reports') && (
          <NavLink 
            to="/dashboard/audit-logs"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium mt-1",
                isActive 
                  ? "bg-primary-500 text-white shadow-sm" 
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )
            }
          >
            <History size={18} />
            سجل العمليات
          </NavLink>
        )}
      </div>
    </aside>
    </>
  );
}
