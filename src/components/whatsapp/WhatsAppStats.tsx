import React from "react";
import { MessageCircle, Zap, Users, TrendingUp } from "lucide-react";

export default function WhatsAppStats() {
  // بيانات تجريبية (Hardcoded) كما هو مطلوب
  const stats = {
    todayMessages: 24,
    executedCommands: 156,
    activeClients: 38,
    responseRate: 89
  };

  const cardClass = "bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* البطاقة 1 — رسائل اليوم */}
      <div className={cardClass}>
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <MessageCircle size={20} />
          </div>
        </div>
        <div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.todayMessages}</h3>
          <p className="text-sm text-gray-500 mt-1">رسالة اليوم</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
      </div>

      {/* البطاقة 2 — أوامر منُفّذة */}
      <div className={cardClass}>
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Zap size={20} />
          </div>
        </div>
        <div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.executedCommands}</h3>
          <p className="text-sm text-gray-500 mt-1">أمر منُفّذ هذا الأسبوع</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
      </div>

      {/* البطاقة 3 — موكلين نشطين */}
      <div className={cardClass}>
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Users size={20} />
          </div>
        </div>
        <div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeClients}</h3>
          <p className="text-sm text-gray-500 mt-1">موكل تفاعل مع البوت</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></div>
      </div>

      {/* البطاقة 4 — معدل الاستجابة */}
      <div className={cardClass}>
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <TrendingUp size={20} />
          </div>
        </div>
        <div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.responseRate}%</h3>
          <p className="text-sm text-gray-500 mt-1">معدل الرد التلقائي</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500"></div>
      </div>
    </div>
  );
}
