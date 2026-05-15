import { useState, useRef } from "react";
import { Send, Image as ImageIcon, Paperclip, Video, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useChatStore } from "@/store/chatStore";
import { toast } from "sonner";
import { getCurrentTenantId } from "@/lib/tenant";

export function MessageInput({ channel }: { channel: any }) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeRoomId, setActiveVideoCall } = useChatStore();

  const handleSend = async () => {
    if (!message.trim() || !activeRoomId) return;

    const content = message;
    setMessage("");

    try {
      // In a real app, you'd fetch the current user's ID
      // const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from("chat_messages").insert({
        room_id: activeRoomId,
        content: content,
        // sender_id: user?.id,
        is_system: false,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("فشل إرسال الرسالة");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (activeRoomId && channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: 'current_user_id_mock' } // In real app, use auth user ID
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'doc') => {
    const file = e.target.files?.[0];
    if (!file || !activeRoomId) return;

    setIsUploading(true);
    try {
      const tenantId = getCurrentTenantId();
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(`${tenantId}/${activeRoomId}/${Date.now()}-${file.name}`, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(data.path);

      await supabase.from("chat_messages").insert({
        room_id: activeRoomId,
        content: type === 'image' ? 'صورة مرفقة' : 'مستند مرفق',
        attachment_url: publicUrl,
        attachment_type: type,
        // sender_id: user?.id,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("فشل رفع الملف");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startVideoCall = async () => {
    try {
      const res = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_DAILY_API_KEY}` 
        },
        body: JSON.stringify({ properties: { exp: Math.floor(Date.now() / 1000) + 3600 } })
      });
      
      const { url } = await res.json();
      setActiveVideoCall(url);
      
      // Send a system message about the call
      if (activeRoomId) {
        await supabase.from("chat_messages").insert({
          room_id: activeRoomId,
          content: 'بدأ مكالمة فيديو جديدة',
          is_system: true,
          attachment_url: url,
        });
      }
      
      window.open(url, '_blank');
    } catch (error) {
      console.error("Video call error:", error);
      toast.error("فشل بدء المكالمة. تأكد من إعدادات VITE_DAILY_API_KEY");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 p-4" dir="rtl">
      <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/5 p-2 focus-within:ring-2 focus-within:ring-[#c9a84c] focus-within:border-transparent transition-all">
        
        <div className="flex items-center gap-1">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,.pdf,.doc,.docx"
            onChange={(e) => handleFileUpload(e, e.target.files?.[0]?.type.includes('image') ? 'image' : 'doc')}
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-[#c9a84c] hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="إرفاق ملف"
            disabled={isUploading}
          >
            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
          </button>
          <button 
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = "image/*";
                fileInputRef.current.click();
              }
            }}
            className="p-2 text-slate-400 hover:text-[#c9a84c] hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="إرسال صورة"
            disabled={isUploading}
          >
            <ImageIcon size={20} />
          </button>
          <button 
            type="button"
            onClick={startVideoCall}
            className="p-2 text-slate-400 hover:text-[#c9a84c] hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="مكالمة فيديو"
          >
            <Video size={20} />
          </button>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اكتب رسالتك هنا... (Shift + Enter لسطر جديد)"
          className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none resize-none focus:outline-none text-slate-700 dark:text-white px-2 py-2"
          rows={1}
        />

        <button 
          onClick={handleSend}
          disabled={!message.trim() || isUploading}
          className="p-2.5 bg-[#0d1b2a] hover:bg-[#1a2c42] dark:bg-[#c9a84c] dark:hover:bg-[#b0933f] text-white dark:text-[#0d1b2a] rounded-lg transition-colors disabled:opacity-50 shrink-0"
        >
          <Send size={18} className="rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}
