import { useState, useRef, useCallback } from "react";
import { Send, Paperclip, Video, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { getCurrentTenantId } from "@/lib/tenant";

interface MessageInputProps {
  channel: any;
  roomType?: "internal" | "client";
  roomName?: string;
}

export function MessageInput({ channel, roomType, roomName }: MessageInputProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { activeRoomId, setActiveVideoCall } = useChatStore();

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = message.length;
  const placeholder = roomType === "client"
    ? `راسل ${roomName || "الموكل"}...`
    : "راسل الفريق...";

  /* ─── Send text message ─── */
  const handleSend = useCallback(async () => {
    if (!message.trim() || !activeRoomId || isSending) return;

    const content = message.trim();
    setMessage("");
    setIsSending(true);

    try {
      const { error } = await supabase.from("chat_messages").insert({
        room_id: activeRoomId,
        content,
        sender_id: currentUser?.id || null,
        sender_name: currentUser?.name || "شخص ما",
        is_system: false,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("فشل إرسال الرسالة");
      setMessage(content); // Restore message on failure
    } finally {
      setIsSending(false);
    }
  }, [message, activeRoomId, currentUser?.id, isSending]);

  /* ─── Keyboard ─── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (activeRoomId && channel && e.key !== "Enter") {
      // Broadcast typing event
      channel.send({
        type: "broadcast",
        event: "typing",
        payload: { user_id: currentUser?.id, user_name: currentUser?.name || "شخص ما" },
      });
    }
  };

  /* ─── File upload ─── */
  const uploadFile = async (file: File) => {
    if (!activeRoomId) return;
    setIsUploading(true);

    try {
      const tenantId = getCurrentTenantId() || "public";
      const isImage = file.type.startsWith("image/");
      const attachmentType = isImage ? "image" : "doc";
      const path = `${tenantId}/${activeRoomId}/${Date.now()}-${file.name}`;

      const { data, error } = await supabase.storage
        .from("chat-attachments")
        .upload(path, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage.from("chat-attachments").getPublicUrl(data.path);

      await supabase.from("chat_messages").insert({
        room_id: activeRoomId,
        content: isImage ? "📷 صورة مرفقة" : `📎 ${file.name}`,
        attachment_url: urlData.publicUrl,
        attachment_type: attachmentType,
        sender_id: currentUser?.id || null,
        sender_name: currentUser?.name || "شخص ما",
        is_system: false,
      });

      toast.success("تم رفع الملف بنجاح");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("فشل رفع الملف — تأكد من إنشاء bucket 'chat-attachments' في Supabase Storage");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  /* ─── Drag & Drop ─── */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  /* ─── Video call ─── */
  const startVideoCall = async () => {
    if (!activeRoomId) return;
    
    const loadingToast = toast.loading("جاري بدء المكالمة...");
    try {
      // Call Edge Function (API key is secure on backend)
      const { data, error } = await supabase.functions.invoke("create-video-room", {
        body: { roomName: `malaf-${activeRoomId}` },
      });

      if (error) {
        // Detailed error from Edge Function
        const errorMsg = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        console.error("Edge Function error object:", error);
        throw new Error(errorMsg);
      }
      
      if (!data?.url) throw new Error("لم يتم إرجاع رابط للمكالمة");

      setActiveVideoCall(data.url);
      toast.dismiss(loadingToast);

      // Send system message about the call
      await supabase.from("chat_messages").insert({
        room_id: activeRoomId,
        content: `📹 ${currentUser?.name || "شخص ما"} بدأ مكالمة فيديو — اضغط للانضمام`,
        is_system: true,
        attachment_url: data.url,
        sender_id: currentUser?.id,
        sender_name: currentUser?.name || "شخص ما",
      });

      // Browser/Mobile handle: Use a fallback for mobile apps
      if (window.open(data.url, "_blank") === null) {
        toast.info("يرجى الضغط على زر 'انضمام' في شريط المكالمة بالأعلى");
      }
    } catch (error: any) {
      console.error("Video call error:", error);
      toast.dismiss(loadingToast);
      
      if (error.message?.includes("DAILY_API_KEY")) {
        toast.error("خطأ في الإعداد: مفتاح DAILY_API_KEY غير موجود في Supabase Secrets");
      } else {
        toast.error(`فشل بدء المكالمة: ${error.message || "حدث خطأ غير متوقع"}`);
      }
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 p-3 transition-colors ${dragOver ? "bg-[#c9a84c]/10 dark:bg-[#c9a84c]/5" : ""}`}
      dir="rtl"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div className="text-center py-4 text-[#c9a84c] text-sm font-bold border-2 border-dashed border-[#c9a84c]/40 rounded-xl mb-2">
          أفلت الملف هنا لإرساله
        </div>
      )}

      {/* Character counter */}
      {charCount > 500 && (
        <div className="text-left mb-1">
          <span className={`text-[10px] font-bold ${charCount > 1000 ? "text-red-500" : "text-amber-500"}`}>
            {charCount} حرف
          </span>
        </div>
      )}

      <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/5 p-2 focus-within:ring-2 focus-within:ring-[#c9a84c]/50 focus-within:border-[#c9a84c]/30 transition-all">
        {/* Action buttons */}
        <div className="flex items-center gap-0.5">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            title="إرفاق ملف"
            aria-label="إرفاق ملف"
            onChange={handleFileInput}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-[#c9a84c] hover:bg-slate-200/50 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="إرفاق ملف"
            disabled={isUploading}
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
          </button>
          <button
            type="button"
            onClick={startVideoCall}
            className="p-2 text-slate-400 hover:text-[#c9a84c] hover:bg-slate-200/50 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="مكالمة فيديو"
          >
            <Video size={18} />
          </button>
        </div>

        {/* Text input */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 max-h-28 min-h-[40px] bg-transparent border-none resize-none focus:outline-none text-slate-700 dark:text-white text-sm px-2 py-2 placeholder:text-slate-400"
          rows={1}
          disabled={isSending}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || isSending}
          title="إرسال"
          aria-label="إرسال"
          className="p-2.5 bg-[#0d1b2a] hover:bg-[#1a2c42] dark:bg-[#c9a84c] dark:hover:bg-[#b0933f] text-white dark:text-[#0d1b2a] rounded-lg transition-all disabled:opacity-40 shrink-0"
        >
          {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="rtl:rotate-180" />}
        </button>
      </div>
    </div>
  );
}
