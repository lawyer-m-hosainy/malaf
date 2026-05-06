import React, { useState } from "react";
import { Beaker, Send, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


interface TestResult {
  success: boolean;
  message: string;
}

export default function BotTester() {
  const [testMessage, setTestMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleTest = async () => {
    if (!testMessage.trim()) return;

    setIsSending(true);
    setTestResult(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setTestResult({ 
        success: true, 
        message: 'تم إرسال الرسالة التجريبية بنجاح! تحقق من واتساب.' 
      });
      setTestMessage("");
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: 'خطأ: تأكد من إعدادات البوت والاتصال بالشبكة.' 
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <CardHeader className="pb-4 px-0 pt-0">
        <div className="flex items-center gap-2">
          <Beaker className="w-5 h-5 text-purple-600" />
          <CardTitle className="text-lg font-bold text-gray-800">اختبار البوت</CardTitle>
        </div>
        <CardDescription className="text-sm text-gray-500">
          أرسل رسالة تجريبية لرقمك للتأكد من عمل البوت وتلقيه للرسائل
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 px-0 pb-0">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input 
              placeholder="اكتب رسالة تجريبية... مثلاً: موعد جلستي القادمة متى؟" 
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              disabled={isSending}
              onKeyDown={(e) => e.key === 'Enter' && handleTest()}
            />
          </div>
          <Button 
            onClick={handleTest} 
            disabled={isSending || !testMessage.trim()}
            className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-xl flex items-center gap-2 transition-colors min-w-[140px]"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                إرسال تجربة
              </>
            )}
          </Button>
        </div>

        {testResult && (
          <div 
            className={`border rounded-lg p-4 flex items-center gap-3 ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400' 
                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
            <div className="text-sm font-medium">
              {testResult.message}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
