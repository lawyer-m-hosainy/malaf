import { PhoneOff, Video } from "lucide-react";
import { useChatStore } from "@/store/chatStore";

export function VideoCallBar() {
  const { activeVideoCall, setActiveVideoCall } = useChatStore();

  if (!activeVideoCall) return null;

  return (
    <div className="bg-[#0d1b2a] border-b border-[#c9a84c]/30 p-3 flex items-center justify-between shadow-sm animate-in slide-in-from-top" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#c9a84c]/20 flex items-center justify-center animate-pulse">
          <Video className="text-[#c9a84c]" size={20} />
        </div>
        <div>
          <h4 className="text-white font-bold text-sm">مكالمة فيديو نشطة</h4>
          <p className="text-slate-300 text-xs">اضغط للانضمام إلى الغرفة</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => window.open(activeVideoCall, '_blank')}
          className="bg-[#c9a84c] hover:bg-[#b0933f] text-[#0d1b2a] font-bold text-xs px-4 py-2 rounded-lg transition-colors"
        >
          انضمام
        </button>
        <button 
          onClick={() => setActiveVideoCall(null)}
          title="رفض"
          aria-label="رفض"
          className="bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-400 font-bold text-xs px-3 py-2 rounded-lg transition-colors border border-white/10"
        >
          <PhoneOff size={16} />
        </button>
      </div>
    </div>
  );
}
