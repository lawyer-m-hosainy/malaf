import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, Scale, Calculator, Settings, Calendar, Wallet, 
  Users2, BarChart3, Library, FileEdit, Clock, 
  Globe, Sparkles, Landmark, History, BookOpen, FileText, GraduationCap,
  Gavel, HandCoins, FileSignature, MessageSquare, Layers,
  Shield, Building, Home, Heart, Siren, Receipt, Monitor,
  Search, ClipboardList, ChevronDown, FolderOpen, Coins, Building2, MapPin, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";

type SidebarItem = 
  | { type: 'link'; name: string; href: string; icon: any }
  | { type: 'group'; title: string; icon: any; items: { name: string; href: string; icon: any }[] };

const sidebarStructure: SidebarItem[] = [
  // ── أقسام ثابتة ──
  { type: 'link', name: "الرئيسية", href: "/dashboard", icon: LayoutDashboard },
  { type: 'link', name: "الموكلين", href: "/dashboard/clients", icon: Users },
  { type: 'link', name: "القضايا", href: "/dashboard/cases", icon: Scale },

  // ── الجلسات والأجندة القضائية (دمج أجندة الجلسات + التقويم) ──
  { type: 'group', title: "الجلسات والأجندة القضائية", icon: Calendar, items: [
    { name: "أجندة الجلسات", href: "/dashboard/roll", icon: Calendar },
    { name: "التقويم", href: "/dashboard/calendar", icon: Calendar },
  ]},

  // ── أقسام مستقلة ──
  { type: 'link', name: "الشغل الإداري", href: "/dashboard/tasks", icon: ClipboardList },
  { type: 'link', name: "التنفيذ القضائي", href: "/dashboard/enforcement", icon: Gavel },

  // ── المستندات والعقود ──
  { type: 'group', title: "المستندات والعقود", icon: FolderOpen, items: [
    { name: "التوكيلات", href: "/dashboard/poa", icon: FileSignature },
    { name: "إدارة العقود", href: "/dashboard/clm", icon: FileEdit },
    { name: "المستندات", href: "/dashboard/documents", icon: Library },
    { name: "العقود والصياغة", href: "/dashboard/contracts", icon: FileText },
  ]},

  // ── المالية ──
  { type: 'group', title: "المالية", icon: Coins, items: [
    { name: "المالية والفواتير", href: "/dashboard/finance", icon: Calculator },
    { name: "المصروفات", href: "/dashboard/expenses", icon: Wallet },
    { name: "الفاتورة الإلكترونية", href: "/dashboard/eta-invoicing", icon: Receipt },
    { name: "تتبع الوقت", href: "/dashboard/time-tracking", icon: Clock },
    { name: "التحصيل", href: "/dashboard/collections", icon: HandCoins },
  ]},

  // ── الخدمات الذكية ──
  { type: 'group', title: "الخدمات الذكية", icon: Sparkles, items: [
    { name: "أين فريقي؟", href: "/dashboard/field-checkins", icon: MapPin },
    { name: "المحلل الذكي", href: "/dashboard/ai-analyzer", icon: Sparkles },
    { name: "إحصائيات الأداء", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "المعرفة القانونية", href: "/dashboard/wiki", icon: BookOpen },
    { name: "فحص تعارض المصالح", href: "/dashboard/conflict-check", icon: Shield },
  ]},

  // ── فريق العمل (مستقل) ──
  { type: 'link', name: "فريق العمل", href: "/dashboard/team", icon: Users2 },

  // ── البوابات الرسمية ──
  { type: 'group', title: "البوابات الرسمية", icon: Building2, items: [
    { name: "بوابة التقاضي", href: "/dashboard/e-litigation", icon: Globe },
    { name: "المحكمة الاقتصادية", href: "/dashboard/economic-court", icon: Landmark },
    { name: "القضايا الجنائية", href: "/dashboard/criminal-cases", icon: Siren },
    { name: "مجلس الدولة", href: "/dashboard/state-council", icon: Building },
    { name: "محاكم الأسرة", href: "/dashboard/family-courts", icon: Heart },
    { name: "نقابة المحامين", href: "/dashboard/bar-association", icon: GraduationCap },
    { name: "الشهر العقاري", href: "/dashboard/real-estate-registry", icon: Home },
    { name: "مأموريات الخبراء", href: "/dashboard/experts", icon: Search },
    { name: "المسارات المتخصصة", href: "/dashboard/specialized-tracks", icon: Layers },
  ]},
];

export function Sidebar() {
  const hasPermission = useAuthStore(state => state.hasPermission);
  const isSidebarOpen = useUIStore(state => state.isSidebarOpen);
  const closeSidebar = useUIStore(state => state.closeSidebar);
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  // Auto-open group if current route is inside it
  const isRouteInGroup = (items: { href: string }[]) => {
    return items.some(item => location.pathname === item.href || location.pathname.startsWith(item.href + '/'));
  };

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
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sidebarStructure.map((item, idx) => {
          if (item.type === 'link') {
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === "/dashboard"}
                onClick={() => { if (window.innerWidth < 1024) closeSidebar(); }}
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
            );
          }

          // Collapsible group
          const isOpen = openGroups[item.title] || isRouteInGroup(item.items);
          return (
            <div key={item.title}>
              <button
                onClick={() => toggleGroup(item.title)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-3">
                  <item.icon size={18} />
                  {item.title}
                </span>
                <ChevronDown 
                  size={14} 
                  className={cn(
                    "transition-transform duration-200 text-slate-500",
                    isOpen && "rotate-180"
                  )} 
                />
              </button>

              <div className={cn(
                "overflow-hidden transition-all duration-200",
                isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
              )}>
                <div className="mr-3 border-e border-white/10 space-y-0.5 py-1">
                  {item.items.map((sub) => (
                    <NavLink
                      key={sub.href}
                      to={sub.href}
                      onClick={() => { if (window.innerWidth < 1024) closeSidebar(); }}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors text-sm font-medium mr-1",
                          isActive 
                            ? "bg-primary-500 text-white shadow-sm" 
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                        )
                      }
                    >
                      <sub.icon size={15} />
                      {sub.name}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        <NavLink 
          to="/dashboard/billing"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium",
              isActive 
                ? "bg-primary-500 text-white shadow-sm" 
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            )
          }
        >
          <CreditCard size={18} />
          الفوترة والاشتراك
        </NavLink>
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
      </div>
    </aside>
    </>
  );
}
