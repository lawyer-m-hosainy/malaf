import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setDismissed(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && !dismissed && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white shadow-md w-full"
          dir="rtl"
        >
          <div className="container mx-auto px-4 py-2.5 flex items-center justify-center gap-3 relative">
            <WifiOff size={18} />
            <span className="text-sm font-bold">
              أنت الآن في وضع عدم الاتصال، يمكنك استعراض الجلسات المحفوظة.
            </span>
            <button 
              onClick={() => setDismissed(true)} 
              className="absolute left-4 top-1/2 -translate-y-1/2 p-1 hover:bg-amber-600 rounded-full transition-colors"
              aria-label="إغلاق"
              title="إغلاق التنبيه"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
