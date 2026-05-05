import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send, Bot, User, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getLegalAssistantResponse } from "@/services/ai";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "model";
  text: string;
}

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "مرحباً بك في مَلَف الذكي. أنا مستشارك القانوني الآلي المتخصص في القوانين المصرية. كيف يمكنني مساعدتك اليوم؟" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const response = await getLegalAssistantResponse(userMessage, history);
      setMessages(prev => [...prev, { role: "model", text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "model", text: "عذراً، لا يمكنني الاتصال بالخادم حالياً. (هذا الخطأ يظهر في بيئة التطوير المحلية إذا لم يكن خادم Backend قيد التشغيل)" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 start-6 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-primary-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-primary-600 transition-all hover:scale-110 group"
          >
            <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden",
              isMaximized ? "fixed inset-6 w-auto h-auto" : "w-[400px] h-[550px]"
            )}
          >
            <Card className="border-none shadow-none flex flex-col h-full">
              <CardHeader className="bg-navy-900 text-white p-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center text-navy-900">
                    <Bot size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">المستشار الذكي</CardTitle>
                    <p className="text-[10px] text-slate-300">متصل بالأنظمة المصرية</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-white/10"
                    onClick={() => setIsMaximized(!isMaximized)}
                  >
                    {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-white/10"
                    onClick={() => setIsOpen(false)}
                  >
                    <X size={18} />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "flex gap-3 max-w-[85%]",
                          msg.role === "user" ? "ms-auto flex-row-reverse" : "me-auto"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center",
                          msg.role === "user" ? "bg-slate-100 text-slate-600" : "bg-primary-50 text-primary-600"
                        )}>
                          {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div className={cn(
                          "p-3 rounded-2xl text-sm leading-relaxed",
                          msg.role === "user" 
                            ? "bg-primary-500 text-white rounded-te-none" 
                            : "bg-slate-100 text-slate-800 rounded-ts-none"
                        )}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3 max-w-[85%] me-auto">
                        <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                          <Bot size={16} />
                        </div>
                        <div className="bg-slate-100 p-3 rounded-2xl rounded-ts-none flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                          <span className="text-xs text-slate-500">جاري التفكير في الأنظمة المصرية...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>

              <CardFooter className="p-4 border-t border-slate-100">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex items-center gap-2 w-full"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="اسأل عن نظام الشركات، العمل، أو المعاملات..."
                    className="flex-1 bg-slate-50 border-none focus:ring-0 text-sm p-2 rounded-md outline-none"
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading || !input.trim()}
                    className="bg-primary-500 hover:bg-primary-600 text-white h-9 w-9 p-0 rounded-full"
                  >
                    <Send size={18} className="rotate-180" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
