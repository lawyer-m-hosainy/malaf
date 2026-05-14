import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}

export function LoadingSpinner({ text = "جاري التحميل...", className }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 space-y-4", className)}>
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
        {text}
      </p>
    </div>
  );
}

export function FullPageLoader({ text = "جاري التحميل..." }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-900">
      <LoadingSpinner text={text} />
    </div>
  );
}
