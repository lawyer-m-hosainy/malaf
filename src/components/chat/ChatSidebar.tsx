import { useState, useEffect, useMemo } from "react";
import { Search, Plus, Users, UserCircle, MessageCircle } from "lucide-react";
import { useChatStore, ChatRoom } from "@/store/chatStore";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/* ─── Avatar colour palette ─── */
const AVATAR_COLORS = [
  "bg-rose-600", "bg-sky-600", "bg-amber-600", "bg-emerald-600",
  "bg-violet-600", "bg-teal-600", "bg-pink-600", "bg-indigo-600",
];
const getAvatarColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/* ─── Relative time helper ─── */
function relativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "البارحة";
  return `منذ ${days} يوم`;
}

export function ChatSidebar() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { activeRoomId, setActiveRoom, rooms, setRooms, unreadCounts, markAsRead, onlineUserIds } = useChatStore();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState<"internal" | "client">("internal");

  /* ─── Fetch rooms from DB ─── */
  useEffect(() => {
    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from("chat_rooms")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Fetch last message for each room
        const roomsWithMeta: ChatRoom[] = await Promise.all(
          data.map(async (room: any) => {
            const { data: msgs } = await supabase
              .from("chat_messages")
              .select("content, created_at")
              .eq("room_id", room.id)
              .order("created_at", { ascending: false })
              .limit(1);

            return {
              ...room,
              lastMessage: msgs?.[0]?.content || "",
              lastMessageAt: msgs?.[0]?.created_at || room.created_at,
            };
          })
        );
        setRooms(roomsWithMeta);
      }
    };
    fetchRooms();
  }, [setRooms]);

  /* ─── Create room ─── */
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    const orgId = currentUser?.orgId;
    if (!orgId) {
      toast.error("لا يمكن إنشاء غرفة بدون تسجيل دخول");
      return;
    }

    const { data, error } = await supabase.from("chat_rooms").insert({
      tenant_id: orgId,
      name: newRoomName.trim(),
      type: newRoomType,
      created_by: currentUser?.id,
    }).select().single();

    if (error) {
      toast.error("فشل إنشاء الغرفة");
      console.error(error);
      return;
    }

    // Add current user as member
    if (data) {
      await supabase.from("chat_members").insert({
        room_id: data.id,
        user_id: currentUser?.id,
      });

      setRooms([{ ...data, lastMessage: "", lastMessageAt: data.created_at }, ...rooms]);
      setActiveRoom(data.id);
    }

    setNewRoomName("");
    setCreateOpen(false);
    toast.success("تم إنشاء الغرفة بنجاح");
  };

  /* ─── Click handler ─── */
  const handleRoomClick = (roomId: string) => {
    setActiveRoom(roomId);
    markAsRead(roomId);
  };

  /* ─── Filtered rooms ─── */
  const internalRooms = useMemo(() =>
    rooms.filter((r) => r.type === "internal" && r.name.includes(search)),
    [rooms, search]
  );
  const clientRooms = useMemo(() =>
    rooms.filter((r) => r.type === "client" && r.name.includes(search)),
    [rooms, search]
  );

  /* ─── Render single room ─── */
  const renderRoom = (room: ChatRoom) => {
    const unread = unreadCounts[room.id] || 0;
    const isActive = activeRoomId === room.id;
    const initials = room.name.substring(0, 2);

    return (
      <div
        key={room.id}
        onClick={() => handleRoomClick(room.id)}
        className={`flex items-center gap-3 p-3 cursor-pointer transition-all rounded-lg mx-2 mb-1 ${
          isActive
            ? "bg-white/10 border-r-4 border-r-[#c9a84c]"
            : "hover:bg-white/5"
        }`}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className={`w-11 h-11 rounded-full ${getAvatarColor(room.id)} flex items-center justify-center text-white font-bold text-sm`}>
            {initials}
          </div>
          {room.online && (
            <div className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0d1b2a] animate-pulse" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-white text-sm font-bold truncate">{room.name}</h4>
            {room.lastMessageAt && (
              <span className="text-[10px] text-slate-500 shrink-0 mr-1">
                {relativeTime(room.lastMessageAt)}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs truncate mt-0.5">
            {room.lastMessage || (room.type === "internal" ? "محادثة داخلية" : "محادثة موكل")}
          </p>
        </div>

        {/* Unread badge */}
        {unread > 0 && (
          <div className="bg-[#c9a84c] text-[#0d1b2a] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
            {unread > 9 ? "+9" : unread}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-[300px] bg-[#0d1b2a] h-full flex flex-col border-l border-white/10 shrink-0" dir="rtl">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#c9a84c] font-bold text-lg flex items-center gap-2">
            <MessageCircle size={20} />
            المراسلات
          </h2>
          <button
            onClick={() => setCreateOpen(true)}
            className="w-8 h-8 rounded-full bg-[#c9a84c]/20 text-[#c9a84c] hover:bg-[#c9a84c]/30 flex items-center justify-center transition-colors"
            title="محادثة جديدة"
            aria-label="محادثة جديدة"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="بحث في المحادثات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 text-white border border-white/10 rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:border-[#c9a84c] placeholder:text-slate-500 transition-colors"
          />
        </div>
      </div>

      {/* Room lists */}
      <div className="flex-1 overflow-y-auto py-2">
        {rooms.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageCircle size={40} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400 text-sm font-bold">لا توجد محادثات بعد</p>
            <p className="text-slate-500 text-xs mt-1">أنشئ محادثة جديدة للبدء</p>
          </div>
        ) : (
          <>
            {internalRooms.length > 0 && (
              <div className="mb-2">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-5 mb-1 flex items-center gap-1">
                  <Users size={12} />
                  الفريق الداخلي ({internalRooms.length})
                </h3>
                {internalRooms.map(renderRoom)}
              </div>
            )}
            {clientRooms.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-5 mb-1 flex items-center gap-1">
                  <UserCircle size={12} />
                  الموكلون ({clientRooms.length})
                </h3>
                {clientRooms.map(renderRoom)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Room Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md border-none shadow-2xl dark:bg-slate-900" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg">محادثة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>اسم المحادثة</Label>
              <Input
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="مثال: الفريق القانوني"
                onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
              />
            </div>
            <div className="space-y-2">
              <Label>نوع المحادثة</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewRoomType("internal")}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                    newRoomType === "internal"
                      ? "bg-[#0d1b2a] text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <Users size={16} className="inline ml-1" />
                  داخلي
                </button>
                <button
                  onClick={() => setNewRoomType("client")}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                    newRoomType === "client"
                      ? "bg-[#0d1b2a] text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <UserCircle size={16} className="inline ml-1" />
                  موكل
                </button>
              </div>
            </div>
            <Button onClick={handleCreateRoom} className="w-full bg-[#c9a84c] hover:bg-[#b0933f] text-[#0d1b2a] font-bold">
              إنشاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
