import { useEffect, useState, useRef, useCallback } from "react";
import { MessageInput } from "./MessageInput";
import { VideoCallBar } from "./VideoCallBar";
import { useChatStore, ChatMessage } from "@/store/chatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { supabase } from "@/lib/supabase";
import { Bell, FileText, Download, MessageCircle, Loader2, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "motion/react";

const PAGE_SIZE = 50;

/* ─── Date separator label ─── */
function dateSeparatorLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (today.getTime() - target.getTime()) / 86400000;

  if (diff < 1) return "اليوم";
  if (diff < 2) return "البارحة";
  return d.toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

/* ─── Avatar colour ─── */
const AVATAR_COLORS = [
  "bg-rose-600", "bg-sky-600", "bg-amber-600", "bg-emerald-600",
  "bg-violet-600", "bg-teal-600", "bg-pink-600", "bg-indigo-600",
];
const getAvatarColor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

export function ChatWindow() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { activeRoomId, messagesCache, setMessages, appendMessage, updateRoomLastMessage, rooms } = useChatStore();
  const messages = messagesCache[activeRoomId || ""] || [];

  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [channel, setChannel] = useState<any>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("connecting");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const activeRoom = rooms.find((r) => r.id === activeRoomId);
  const myId = currentUser?.id || "";

  /* ─── Scroll helpers ─── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(fromBottom > 200);
  };

  useEffect(() => {
    // Auto-scroll on new messages only if user is near bottom
    const el = scrollContainerRef.current;
    if (!el) return;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (fromBottom < 200) scrollToBottom();
  }, [messages.length, scrollToBottom]);

  /* ─── Fetch messages + subscribe ─── */
  useEffect(() => {
    if (!activeRoomId) return;

    // Check if we have cached messages
    const cached = messagesCache[activeRoomId];
    if (cached && cached.length > 0) {
      setIsLoading(false);
      setTimeout(scrollToBottom, 50);
    } else {
      setIsLoading(true);
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*, profiles:sender_id(full_name)")
        .eq("room_id", activeRoomId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (!error && data) {
        const mapped: ChatMessage[] = data.reverse().map((m: any) => ({
          ...m,
          sender_name: m.profiles?.full_name || "مجهول",
        }));
        setMessages(activeRoomId, mapped);
        setHasMore(data.length === PAGE_SIZE);
      }
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    };

    fetchMessages();

    /* ─── Realtime channel ─── */
    const roomChannel = supabase
      .channel(`room:${activeRoomId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: myId },
        },
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `room_id=eq.${activeRoomId}`,
      }, async (payload) => {
        console.log("[Chat] New message received via Realtime:", payload.new.id);
        
        // Use sender_name from payload to avoid extra DB query
        let senderName = payload.new.sender_name;
        
        if (!senderName) {
          if (payload.new.sender_id === myId) {
            senderName = currentUser?.name || "أنا";
          } else if (payload.new.sender_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", payload.new.sender_id)
              .single();
            senderName = profile?.full_name || "مجهول";
          } else {
            senderName = "نظام";
          }
        }

        const newMsg: ChatMessage = {
          ...(payload.new as any),
          sender_name: senderName,
        };

        appendMessage(activeRoomId, newMsg);
        updateRoomLastMessage(activeRoomId, newMsg.content, newMsg.created_at);

        // Browser/Mobile notification
        if (newMsg.sender_id !== myId && document.hidden) {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("ملف — رسالة جديدة", { body: newMsg.content, icon: "/favicon.ico" });
          }
        }
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.user_id === myId) return;
        setTypingUsers((prev) => [...new Set([...prev, payload.user_name || "يكتب"])]);
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((n) => n !== (payload.user_name || "يكتب")));
        }, 3000);
      })
      .subscribe((status, err) => {
        console.log(`[Chat] Channel room:${activeRoomId} status:`, status);
        setConnectionStatus(status);
        if (err) console.error(`[Chat] Channel error:`, err);
        
        if (status === "SUBSCRIBED" && myId) {
          roomChannel.track({ user_id: myId, user_name: currentUser?.name });
        }
        
        if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          console.log("[Chat] Connection lost, attempting to reconnect...");
          setTimeout(() => roomChannel.subscribe(), 3000);
        }
      });

    setChannel(roomChannel);

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      roomChannel.unsubscribe();
      setChannel(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId]);

  /* ─── Load more (pagination) ─── */
  const loadMore = async () => {
    if (!activeRoomId || !hasMore) return;
    const oldest = messages[0];
    if (!oldest) return;

    const { data } = await supabase
      .from("chat_messages")
      .select("*, profiles:sender_id(full_name)")
      .eq("room_id", activeRoomId)
      .lt("created_at", oldest.created_at)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (data && data.length > 0) {
      const mapped: ChatMessage[] = data.reverse().map((m: any) => ({
        ...m,
        sender_name: m.profiles?.full_name || "مجهول",
      }));
      const store = useChatStore.getState();
      store.prependMessages(activeRoomId, mapped);
      setHasMore(data.length === PAGE_SIZE);
    } else {
      setHasMore(false);
    }
  };

  /* ─── Empty state ─── */
  if (!activeRoomId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900" dir="rtl">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <MessageCircle className="text-slate-300 dark:text-slate-600" size={40} />
        </div>
        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">اختر محادثة للبدء</h3>
        <p className="text-slate-400 text-sm max-w-xs text-center">اختر محادثة من القائمة الجانبية أو أنشئ محادثة جديدة للتواصل مع فريقك أو موكليك</p>
      </div>
    );
  }

  /* ─── Render message ─── */
  const renderMessage = (msg: ChatMessage, idx: number) => {
    const prevMsg = idx > 0 ? messages[idx - 1] : null;

    // Date separator
    const showDateSep = !prevMsg || dateSeparatorLabel(msg.created_at) !== dateSeparatorLabel(prevMsg.created_at);

    // Grouped messages (same sender consecutive)
    const isContinuation = prevMsg && !prevMsg.is_system && !msg.is_system && prevMsg.sender_id === msg.sender_id && !showDateSep;

    // System message
    if (msg.is_system) {
      return (
        <div key={msg.id}>
          {showDateSep && <DateSep label={dateSeparatorLabel(msg.created_at)} />}
          <div className="flex justify-center my-3 px-4">
            <div className="bg-[#fefce8] dark:bg-amber-900/20 border border-[#fef08a] dark:border-amber-800/30 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm max-w-lg">
              <Bell className="text-[#ca8a04] shrink-0" size={14} />
              <span className="text-[#854d0e] dark:text-amber-300 text-xs font-bold italic">{msg.content}</span>
              {msg.attachment_url && (
                <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs mr-2">انضمام</a>
              )}
            </div>
          </div>
        </div>
      );
    }

    const isMe = msg.sender_id === myId;
    const time = new Date(msg.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

    return (
      <div key={msg.id}>
        {showDateSep && <DateSep label={dateSeparatorLabel(msg.created_at)} />}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`flex ${isMe ? "justify-start" : "justify-end"} ${isContinuation ? "mt-0.5" : "mt-3"} px-4`}
        >
          {/* Other user avatar */}
          {!isMe && !isContinuation && (
            <div className={`w-8 h-8 rounded-full ${getAvatarColor(msg.sender_id || "x")} flex items-center justify-center text-white text-xs font-bold shrink-0 ml-2 mt-1`}>
              {(msg.sender_name || "م").substring(0, 1)}
            </div>
          )}
          {!isMe && isContinuation && <div className="w-8 shrink-0 ml-2" />}

          <div className={`max-w-[70%] ${isContinuation ? "" : ""}`}>
            {/* Sender name */}
            {!isMe && !isContinuation && (
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 px-1">{msg.sender_name}</p>
            )}

            {/* Bubble */}
            <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
              isMe
                ? "bg-[#0d1b2a] text-white rounded-tl-sm"
                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-100 dark:border-white/5 rounded-tr-sm"
            }`}>
              {/* Attachment */}
              {msg.attachment_url && (
                <div className="mb-2">
                  {msg.attachment_type === "image" ? (
                    <a href={msg.attachment_url} target="_blank" rel="noreferrer">
                      <img src={msg.attachment_url} alt="صورة مرفقة" className="rounded-lg max-w-full h-auto max-h-52 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                    </a>
                  ) : (
                    <a href={msg.attachment_url} target="_blank" rel="noreferrer" className={`flex items-center gap-2 p-2.5 rounded-lg transition-colors ${isMe ? "bg-white/10 hover:bg-white/15" : "bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600"}`}>
                      <FileText size={22} className="shrink-0" />
                      <span className="text-sm flex-1 truncate">مستند مرفق</span>
                      <Download size={16} className="shrink-0 opacity-60" />
                    </a>
                  )}
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              <span className={`text-[10px] block mt-1 ${isMe ? "text-slate-400" : "text-slate-400"}`}>{time}</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full relative" dir="rtl">
      {/* Room header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 px-5 py-3 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${getAvatarColor(activeRoomId || "room")} flex items-center justify-center text-white font-bold text-sm`}>
          {(activeRoom?.name || "غ").substring(0, 2)}
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-sm">{activeRoom?.name || "محادثة"}</h3>
          <p className="text-[11px] text-slate-400">
            {connectionStatus !== "SUBSCRIBED" ? (
              <span className="text-amber-500 animate-pulse">جاري الاتصال...</span>
            ) : (
              <>
                {activeRoom?.type === "client" ? "موكل" : "فريق داخلي"}
                {typingUsers.length > 0 && (
                  <span className="text-[#c9a84c] mr-2 animate-pulse">• يكتب الآن...</span>
                )}
              </>
            )}
          </p>
        </div>
      </div>

      <VideoCallBar />

      {/* Messages area */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 py-3">
        {/* Load more */}
        {hasMore && messages.length > 0 && (
          <div className="text-center py-2">
            <button onClick={loadMore} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <Loader2 size={14} className="inline ml-1" />
              تحميل رسائل أقدم
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4 px-4 py-6">
            <div className="flex justify-start"><Skeleton className="h-14 w-56 rounded-2xl rounded-tl-sm" /></div>
            <div className="flex justify-end"><Skeleton className="h-14 w-64 rounded-2xl rounded-tr-sm" /></div>
            <div className="flex justify-start"><Skeleton className="h-14 w-48 rounded-2xl rounded-tl-sm" /></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20">
            <MessageCircle size={48} className="text-slate-200 dark:text-slate-700 mb-3" />
            <p className="text-slate-400 font-bold text-sm">لا توجد رسائل بعد</p>
            <p className="text-slate-400 text-xs mt-1">كن أول من يبدأ المحادثة 👋</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, idx) => renderMessage(msg, idx))}
          </AnimatePresence>
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-end px-4 mt-2">
            <div className="bg-slate-200 dark:bg-slate-800 text-slate-500 px-4 py-2 rounded-2xl rounded-tr-sm text-xs flex items-center gap-2">
              <span className="flex gap-0.5">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce [animation-delay:-0.3s]">.</span>
                <span className="animate-bounce [animation-delay:-0.15s]">.</span>
              </span>
              <span>{typingUsers[0]} يكتب...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom FAB */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 left-4 z-10 w-9 h-9 rounded-full bg-[#0d1b2a] text-white shadow-lg flex items-center justify-center hover:bg-[#1a2c42] transition-colors"
          title="آخر رسالة"
          aria-label="انتقل لآخر رسالة"
        >
          <ArrowDown size={16} />
        </button>
      )}

      <MessageInput channel={channel} roomType={activeRoom?.type} roomName={activeRoom?.name} />
    </div>
  );
}

/* ─── Date Separator Component ─── */
function DateSep({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-6 my-4">
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 px-2">{label}</span>
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}
