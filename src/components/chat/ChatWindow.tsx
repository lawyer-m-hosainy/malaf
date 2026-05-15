import { useEffect, useState, useRef } from "react";
import { MessageInput } from "./MessageInput";
import { VideoCallBar } from "./VideoCallBar";
import { useChatStore } from "@/store/chatStore";
import { supabase } from "@/lib/supabase";
import { Bell, FileText, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ChatWindow() {
  const { activeRoomId } = useChatStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [channel, setChannel] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  useEffect(() => {
    if (!activeRoomId) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', activeRoomId)
        .order('created_at', { ascending: true });
      
      if (!error && data) {
        setMessages(data);
      }
      setIsLoading(false);
    };

    fetchMessages();

    const roomChannel = supabase
      .channel(`room:${activeRoomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${activeRoomId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = roomChannel.presenceState();
        setOnlineUsers(Object.keys(state));
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        setTypingUsers(prev => [...new Set([...prev, payload.user_id])]);
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(id => id !== payload.user_id));
        }, 3000);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          roomChannel.track({ user_id: 'current_user_id_mock' }); // In real app, track real user ID
        }
      });

    setChannel(roomChannel);

    return () => {
      roomChannel.unsubscribe();
    };
  }, [activeRoomId]);

  if (!activeRoomId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900" dir="rtl">
        <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <FileText className="text-slate-400" size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">اختر محادثة للبدء</h3>
        <p className="text-slate-500 text-sm mt-2">يمكنك التواصل مع فريق العمل أو الموكلين</p>
      </div>
    );
  }

  const renderMessage = (msg: any) => {
    if (msg.is_system) {
      return (
        <div key={msg.id} className="flex justify-center my-4">
          <div className="bg-[#fefce8] border border-[#fef08a] px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm max-w-lg text-center">
            <Bell className="text-[#ca8a04]" size={16} />
            <span className="text-[#854d0e] text-xs font-bold">{msg.content}</span>
            {msg.attachment_url && (
              <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs mr-2">انضمام</a>
            )}
          </div>
        </div>
      );
    }

    // Mock condition to check if message is from current user
    const isMe = msg.sender_id === 'current_user_id_mock' || !msg.sender_id;

    return (
      <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'} mb-4 px-4`}>
        <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
          isMe 
            ? 'bg-[#0d1b2a] text-white rounded-tr-sm' 
            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-100 dark:border-white/5 rounded-tl-sm'
        }`}>
          {msg.attachment_url ? (
            <div className="mb-2">
              {msg.attachment_type === 'image' ? (
                <img src={msg.attachment_url} alt="Attachment" className="rounded-lg max-w-full h-auto max-h-60 object-cover" />
              ) : (
                <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/10 p-2 rounded-lg hover:bg-black/20 transition-colors">
                  <FileText size={24} />
                  <span className="text-sm underline">تحميل المرفق</span>
                  <Download size={16} className="mr-auto" />
                </a>
              )}
            </div>
          ) : null}
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
          <span className={`text-[10px] block mt-1 ${isMe ? 'text-slate-400' : 'text-slate-500'}`}>
            {new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full relative" dir="rtl">
      <VideoCallBar />
      
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 py-4">
        {isLoading ? (
          <div className="space-y-4 px-4">
            <Skeleton className="h-16 w-64 rounded-2xl" />
            <Skeleton className="h-16 w-64 rounded-2xl mr-auto" />
            <Skeleton className="h-16 w-64 rounded-2xl" />
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            
            {typingUsers.length > 0 && (
              <div className="flex justify-start px-4 mb-4">
                <div className="bg-slate-200 dark:bg-slate-800 text-slate-500 px-4 py-2 rounded-2xl rounded-tr-sm text-xs flex items-center gap-1">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
                  <span className="mr-2">يكتب الآن</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <MessageInput channel={channel} />
    </div>
  );
}
