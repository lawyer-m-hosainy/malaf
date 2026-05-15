import { Search } from "lucide-react";
import { useChatStore } from "@/store/chatStore";

const MOCK_INTERNAL_ROOMS = [
  { id: "1", name: "الفريق القانوني", type: "internal", online: true },
  { id: "2", name: "أحمد محمود (محامي)", type: "internal", online: false },
];

const MOCK_CLIENT_ROOMS = [
  { id: "3", name: "شركة النيل (نزاع تجاري)", type: "client", online: true },
  { id: "4", name: "خالد سعيد (أحوال شخصية)", type: "client", online: false },
];

export function ChatSidebar() {
  const { activeRoomId, setActiveRoom, unreadCounts, markAsRead } = useChatStore();

  const handleRoomClick = (roomId: string) => {
    setActiveRoom(roomId);
    markAsRead(roomId);
  };

  const renderRoom = (room: any) => {
    const unread = unreadCounts[room.id] || 0;
    const isActive = activeRoomId === room.id;

    return (
      <div 
        key={room.id}
        onClick={() => handleRoomClick(room.id)}
        className={`flex items-center justify-between p-3 cursor-pointer transition-colors border-b border-white/5 ${isActive ? 'bg-white/10 border-l-4 border-l-[#c9a84c]' : 'hover:bg-white/5'}`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">
              {room.name.charAt(0)}
            </div>
            {room.online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0d1b2a]"></div>
            )}
          </div>
          <div>
            <h4 className="text-white text-sm font-bold truncate max-w-[140px]">{room.name}</h4>
            <p className="text-slate-400 text-xs truncate max-w-[140px]">{room.type === 'internal' ? 'داخلي' : 'موكل'}</p>
          </div>
        </div>
        {unread > 0 && (
          <div className="bg-[#c9a84c] text-[#0d1b2a] text-[10px] font-bold px-2 py-0.5 rounded-full">
            {unread}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-[280px] bg-[#0d1b2a] h-full flex flex-col border-l border-white/10" dir="rtl">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-white font-bold text-lg mb-4 text-[#c9a84c]">المراسلات</h2>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="بحث..." 
            className="w-full bg-slate-800/50 text-white border border-white/10 rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:border-[#c9a84c]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">الفريق الداخلي</h3>
          {MOCK_INTERNAL_ROOMS.map(renderRoom)}
        </div>
        <div className="p-3 pt-0">
          <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">الموكلون</h3>
          {MOCK_CLIENT_ROOMS.map(renderRoom)}
        </div>
      </div>
    </div>
  );
}
