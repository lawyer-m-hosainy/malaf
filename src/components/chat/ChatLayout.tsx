import { ChatSidebar } from "./ChatSidebar";
import { ChatWindow } from "./ChatWindow";

export function ChatLayout() {
  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-slate-50 dark:bg-slate-900 overflow-hidden" dir="rtl">
      <ChatSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <ChatWindow />
      </div>
    </div>
  );
}

export default ChatLayout;
