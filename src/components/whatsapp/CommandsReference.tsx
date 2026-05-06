import React, { useState } from "react";
import { ChevronDown, ChevronUp, ClipboardList } from "lucide-react";

export default function CommandsReference() {
  const [isOpen, setIsOpen] = useState(true);

  const lawyerCommands = [
    { command: "جلسة", example: "جلسة 1045 تأجلت لـ 15/7", result: "تحديث القضية + إشعار للموكل" },
    { command: "موعد", example: "موعد 1045 15/7 الساعة 11", result: "إضافة للأجندة" },
    { command: "مصروف", example: "مصروف 350 رسوم قلم", result: "تسجيل في المالية" },
    { command: "فاتورة", example: "فاتورة 01012345678", result: "إرسال فاتورة PDF للموكل" },
    { command: "اليوم", example: "اليوم", result: "قائمة جلسات اليوم" },
    { command: "ذكرني", example: "ذكرني اتصل بأحمد الساعة 3", result: "تنبيه شخصي" },
    { command: "موكل جديد", example: "موكل جديد محمد 0100000", result: "إنشاء ملف مبدئي" },
  ];

  const clientCommands = [
    { input: "رقم قضيته", response: "آخر جلسة + القادمة" },
    { input: '"فاتورة"', response: "المبلغ المستحق" },
    { input: '"موعد"', response: "حجز استشارة" },
    { input: "صورة/PDF", response: "رفع في ملف القضية" },
    { input: "أي نص آخر", response: "يُحلَّل بالذكاء الاصطناعي" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm mb-6 overflow-hidden">
      {/* Header / Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">دليل الأوامر</h2>
          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full mr-2">
            جديد
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isOpen && (
        <div className="p-6 pt-0 border-t border-gray-100 dark:border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
            
            {/* أوامر المحامي */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 border-r-2 border-primary-500 pr-2">
                أوامر المحامي
              </h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-800">
                <table className="w-full text-sm text-right">
                  <thead className="bg-[#f0fdf4] dark:bg-emerald-950/30 text-[#15803d] dark:text-emerald-400">
                    <tr>
                      <th className="py-2 px-3 font-semibold w-1/5">الأمر</th>
                      <th className="py-2 px-3 font-semibold w-2/5">المثال</th>
                      <th className="py-2 px-3 font-semibold w-2/5">النتيجة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lawyerCommands.map((cmd, idx) => (
                      <tr 
                        key={idx} 
                        className={`border-t border-gray-100 dark:border-slate-800 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50'}`}
                      >
                        <td className="py-2 px-3">
                          <span className="font-mono bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-300 px-1.5 py-0.5 rounded text-xs">
                            {cmd.command}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400" dir="ltr">{cmd.example}</td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{cmd.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* استفسارات الموكل */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 border-r-2 border-primary-500 pr-2">
                استفسارات الموكل
              </h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-800">
                <table className="w-full text-sm text-right">
                  <thead className="bg-[#f0fdf4] dark:bg-emerald-950/30 text-[#15803d] dark:text-emerald-400">
                    <tr>
                      <th className="py-2 px-3 font-semibold w-1/2">ما يرسله</th>
                      <th className="py-2 px-3 font-semibold w-1/2">رد البوت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientCommands.map((cmd, idx) => (
                      <tr 
                        key={idx} 
                        className={`border-t border-gray-100 dark:border-slate-800 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50'}`}
                      >
                        <td className="py-2 px-3">
                          <span className="font-mono bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-300 px-1.5 py-0.5 rounded text-xs">
                            {cmd.input}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{cmd.response}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
