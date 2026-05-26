import { PhoneOff, Video, ExternalLink } from "lucide-react";
import { useChatStore } from "@/store/chatStore";

export function VideoCallBar() {
  const { activeVideoCall, setActiveVideoCall } = useChatStore();

  if (!activeVideoCall) return null;

  return (
    <div className="bg-[#0d1b2a] border-b border-[#c9a84c]/30 p-3 flex items-center justify-between shadow-sm" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#c9a84c]/20 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-[#c9a84c]/40 flex items-center justify-center animate-ping absolute" />
          <Video className="text-[#c9a84c] relative z-10" size={18} />
        </div>
        <div>
          <h4 className="text-white font-bold text-sm">مكالمة فيديو نشطة</h4>
          <p className="text-slate-400 text-xs">اضغط "انضمام" لفتح الغرفة في نافذة جديدة</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.open(activeVideoCall, "_blank")}
          className="bg-[#c9a84c] hover:bg-[#b0933f] text-[#0d1b2a] font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
          title="انضمام للمكالمة"
        >
          <ExternalLink size={14} />
          انضمام
        </button>
        <button
          onClick={() => setActiveVideoCall(null)}
          title="إغلاق"
          aria-label="إغلاق شريط المكالمة"
          className="bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-400 font-bold text-xs p-2 rounded-lg transition-colors border border-white/10"
        >
          <PhoneOff size={14} />
        </button>
      </div>
    </div>
  );
}
