import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowRight } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50 dark:bg-navy-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-white/10" dir="rtl">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex justify-center"
        >
          <div className="w-24 h-24 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center">
            <FileQuestion size={48} />
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-black text-navy-900 dark:text-white mb-4"
        >
          عذراً، الصفحة غير موجودة
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed"
        >
          يبدو أن الرابط الذي تحاول الوصول إليه غير موجود أو تم نقله. يرجى التأكد من الرابط أو العودة للوحة القيادة.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={() => navigate("/dashboard")}
            className="bg-primary-500 hover:bg-primary-600 text-white gap-2 px-8"
          >
            <Home size={18} />
            العودة للرئيسية
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="border-slate-200 dark:border-white/10 gap-2"
          >
            الصفحة السابقة
            <ArrowRight size={18} />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
