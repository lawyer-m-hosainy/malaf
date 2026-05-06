import React, { useState } from "react";
import { MessageSquare, Search, ArrowDownLeft, ArrowUpRight, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const initialMessages = [
  {
    id: 1,
    name: 'محمد أحمد',
    phone: '01012345678',
    type: 'client',
    content: 'عايز أعرف موعد الجلسة الجاية في قضيتي',
    time: 'منذ 5 دقائق',
    direction: 'inbound',
    command: null
  },
  {
    id: 2,
    name: 'البوت',
    phone: 'system',
    type: 'bot',
    content: 'أهلاً محمد، موعد جلستك القادمة: الإثنين 15/7 الساعة 11 صباحاً في محكمة شمال القاهرة.',
    time: 'منذ 5 دقائق',
    direction: 'outbound',
    command: null
  },
  {
    id: 3,
    name: 'المحامي / خالد',
    phone: '01098765432',
    type: 'lawyer',
    content: 'جلسة 1045 تأجلت للأسبوع الجاي',
    time: 'منذ 23 دقيقة',
    direction: 'inbound',
    command: 'جلسة'
  },
  {
    id: 4,
    name: 'البوت',
    phone: 'system',
    type: 'bot',
    content: 'تم تحديث القضية 1045 ✅ وإرسال إشعار للموكل.',
    time: 'منذ 23 دقيقة',
    direction: 'outbound',
    command: null
  },
  {
    id: 5,
    name: 'سارة محمود',
    phone: '01156789012',
    type: 'client',
    content: 'شكراً جزيلاً على التذكير بالجلسة',
    time: 'منذ ساعة',
    direction: 'inbound',
    command: null
  }
];

export function MessageLog({ messages = initialMessages }: { messages?: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterTime, setFilterTime] = useState("today");

  const displayMessages = messages.length > 0 && messages !== initialMessages ? messages : initialMessages;

  const getAvatarColor = (type: string) => {
    switch (type) {
      case 'client': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400';
      case 'lawyer': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400';
      case 'bot': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300';
    }
  };

  const getTypeBadge = (type: string) => {
    switch(type) {
      case 'client': return <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">موكل</span>;
      case 'lawyer': return <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">محامي</span>;
      case 'bot': return <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">بوت</span>;
      default: return null;
    }
  };

  return (
    <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col">
      <CardHeader className="pb-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <CardTitle className="text-lg font-bold text-gray-800">سجل المحادثات</CardTitle>
        </div>
        
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="بحث في الرسائل..." 
              className="pr-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={(v) => v && setFilterType(v)}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الرسائل</SelectItem>
              <SelectItem value="client">الموكلين</SelectItem>
              <SelectItem value="lawyer">المحامين</SelectItem>
              <SelectItem value="bot">البوت</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterTime} onValueChange={(v) => v && setFilterTime(v)}>
            <SelectTrigger className="w-[110px] h-9">
              <SelectValue placeholder="الوقت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="today">اليوم</SelectItem>
              <SelectItem value="week">هذا الأسبوع</SelectItem>
              <SelectItem value="month">هذا الشهر</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 relative">
        <ScrollArea className="h-[500px] w-full">
          <div className="flex flex-col">
            {displayMessages.map((msg, idx) => (
              <div 
                key={msg.id} 
                className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-50 dark:border-slate-800/50 ${
                  msg.direction === 'outbound' ? 'bg-[#f0fdf4]/30 dark:bg-emerald-950/10' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm ${getAvatarColor(msg.type)}`}>
                  {(!msg.name || msg.name === 'system' || msg.name === 'البوت') ? 'ب' : [...msg.name][0]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate max-w-[120px] sm:max-w-[200px]">
                        {msg.name}
                      </span>
                      {getTypeBadge(msg.type)}
                      <span className="text-xs text-gray-500 font-mono" dir="ltr">{msg.phone}</span>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap mr-2">
                      {msg.time}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                    {msg.content}
                  </p>

                  <div className="flex items-center gap-3 mt-2">
                    {/* Direction Indicator */}
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      {msg.direction === 'inbound' ? (
                        <><ArrowDownLeft className="w-3 h-3 text-emerald-500" /> رسالة واردة</>
                      ) : (
                        <><ArrowUpRight className="w-3 h-3 text-gray-400" /> رسالة صادرة</>
                      )}
                    </div>

                    {/* Command Badge */}
                    {msg.command && (
                      <Badge variant="secondary" className="h-5 text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100 px-1.5 flex gap-1">
                        <Zap className="w-3 h-3" />
                        أمر: {msg.command}
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
