import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { apiGet } from "@/lib/apiClient";

const ConnectionStatus = () => {
  const { currentUser } = useAuthStore();
  const orgId = currentUser?.orgId || currentUser?.id;

  const [status, setStatus] = useState({
    isConnected: false,
    lastMessage: 'جاري الفحص...',
    phone: '—',
    isLoading: true,
  });

  useEffect(() => {
    if (orgId) checkConnection();
  }, [orgId]);

  const checkConnection = async () => {
    try {
      // ✅ BUG-004 FIX: جلب بيانات حقيقية من API
      const settings = await apiGet(`/api/whatsapp/settings/${orgId}`);
      const stats = await apiGet(`/api/whatsapp/stats/${orgId}`).catch(() => null);

      setStatus({
        isConnected: settings.is_active === true,
        lastMessage: stats?.totalMessages
          ? `${stats.totalMessages} رسالة هذا الشهر`
          : 'لا توجد رسائل بعد',
        phone: settings.wa_phone_number || '—',
        isLoading: false,
      });
    } catch {
      setStatus({
        isConnected: false,
        lastMessage: 'تعذر الاتصال بالخادم (Connection Failed)',
        phone: '—',
        isLoading: false,
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      
      {/* يسار: حالة الاتصال */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
        {/* النقطة الخضراء المتحركة */}
        <div className="relative">
          <div className={`w-3 h-3 rounded-full ${status.isConnected ? 'bg-green-500' : 'bg-red-400'}`}></div>
          {status.isConnected && (
            <div className="w-3 h-3 bg-green-500 rounded-full absolute top-0 animate-ping opacity-75"></div>
          )}
        </div>
        <span className={`text-sm font-semibold ${status.isConnected ? 'text-green-700' : 'text-red-600'}`}>
          {status.isLoading ? 'جاري الفحص... (Checking)' : status.isConnected ? 'البوت متصل ويعمل (Connected)' : 'البوت غير متصل (Disconnected)'}
        </span>
        <span className="text-gray-300 hidden sm:inline">|</span>
        <span className="text-sm text-gray-500">
          {status.lastMessage}
        </span>
        <span className="text-gray-300 hidden sm:inline">|</span>
        <span className="text-sm text-gray-500 font-mono" dir="ltr">
          {status.phone !== '—' ? `+${status.phone.replace('+', '')}` : '—'}
        </span>
      </div>

      {/* يمين: زر إعادة فحص */}
      <button 
        onClick={checkConnection}
        className="text-sm text-primary-600 hover:text-primary-800 hover:bg-primary-50 px-3 py-1 rounded-lg transition-colors border border-primary-200 whitespace-nowrap"
      >
        إعادة فحص
      </button>

    </div>
  );
};

export default ConnectionStatus;
