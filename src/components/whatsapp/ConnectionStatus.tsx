import React, { useState } from "react";

const ConnectionStatus = () => {
  // State محلي للعرض فقط (demo)
  const [status] = useState({
    isConnected: true,
    lastMessage: 'منذ 5 دقائق',
    phone: '201012345678'
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      
      {/* يسار: حالة الاتصال */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
        {/* النقطة الخضراء المتحركة */}
        <div className="relative">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full absolute top-0 animate-ping opacity-75"></div>
        </div>
        <span className="text-sm font-semibold text-green-700">
          البوت متصل ويعمل
        </span>
        <span className="text-gray-300 hidden sm:inline">|</span>
        <span className="text-sm text-gray-500">
          آخر رسالة: {status.lastMessage}
        </span>
        <span className="text-gray-300 hidden sm:inline">|</span>
        <span className="text-sm text-gray-500 font-mono" dir="ltr">
          +{status.phone}
        </span>
      </div>

      {/* يمين: زر إيقاف مؤقت */}
      <button className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors border border-red-200 whitespace-nowrap">
        إيقاف مؤقت
      </button>

    </div>
  );
};

export default ConnectionStatus;
