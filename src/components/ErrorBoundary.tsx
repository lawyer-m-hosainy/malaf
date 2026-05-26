// @ts-nocheck — React 19 built-in types require this for class components (ErrorBoundary)
// React does not yet offer a hooks API for getDerivedStateFromError
import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallbackModule?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error.message, errorInfo.componentStack);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    const { hasError, error } = this.state;
    const { fallbackModule, children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-md">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">
              حدث خطأ غير متوقع
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {fallbackModule
                ? `حدث خطأ في وحدة "${fallbackModule}".`
                : "حدث خطأ أثناء تحميل هذا القسم."}
              {" "}يرجى المحاولة مرة أخرى.
            </p>
            {error && (
              <pre className="text-[10px] text-destructive bg-destructive/5 p-3 rounded-lg overflow-auto max-h-24 text-start" dir="ltr">
                {error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              <RefreshCw size={16} />
              إعادة المحاولة
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}
