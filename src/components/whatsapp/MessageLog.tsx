import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, User, PhoneIncoming, PhoneOutgoing, Zap } from "lucide-react";

interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  content: string;
  created_at: string;
  ai_handled: boolean;
  command_detected: string | null;
}

export function MessageLog({ messages }: { messages: Message[] }) {
  if (!messages || messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">سجل المحادثات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-muted-foreground">
            لا توجد رسائل مسجلة بعد.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">سجل آخر المحادثات</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-3 p-3 rounded-lg border ${
                  msg.direction === 'inbound' ? 'bg-slate-50 border-slate-100 dark:bg-slate-900 dark:border-slate-800' : 'bg-primary/5 border-primary/10'
                }`}
              >
                <div className="mt-1">
                  {msg.direction === 'inbound' ? (
                    <div className="bg-slate-200 dark:bg-slate-800 p-2 rounded-full">
                      <PhoneIncoming className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </div>
                  ) : msg.ai_handled ? (
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full">
                      <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  ) : (
                    <div className="bg-primary/20 p-2 rounded-full">
                      <PhoneOutgoing className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">
                      {msg.direction === 'inbound' ? msg.from_number : msg.to_number}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleString('ar-EG', {
                        hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short'
                      })}
                    </span>
                  </div>
                  
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  
                  <div className="flex gap-2 pt-1">
                    {msg.command_detected && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
                        <Zap className="w-3 h-3 me-1" /> أمر: {msg.command_detected}
                      </Badge>
                    )}
                    {msg.ai_handled && (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-emerald-200 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400">
                        <Bot className="w-3 h-3 me-1" /> رد آلي
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
