import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ChatAssistant } from "../ai/ChatAssistant";
import { useUIStore } from "../../store/useUIStore";
import { AlertCircle } from "lucide-react";
import { FirstLoginWizard } from "@/components/FirstLoginWizard";
import { FounderSignatureModal } from "@/components/FounderSignatureModal";

export function RootLayout() {
  const isAiFallback = useUIStore((state) => state.isAiFallback);

  return (
    <div className="flex min-h-screen bg-background font-sans text-slate-900 dark:text-white" dir="rtl">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        {isAiFallback && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 p-2 flex items-center justify-center gap-2 text-amber-800 dark:text-amber-200 text-sm font-medium animate-in fade-in slide-in-from-top duration-300">
            <AlertCircle className="w-4 h-4" />
            <span>النظام يعمل في وضع التراجع (Fallback Mode). النتائج قد تكون أقل دقة.</span>
          </div>
        )}
        <main className="flex-1 p-3 md:p-6 pb-24 overflow-auto">
          <Outlet />
        </main>
      </div>
      <ChatAssistant />
      <FirstLoginWizard />
      <FounderSignatureModal />
    </div>
  );
}
