import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Copy, CheckCircle, Clock, AlertCircle, Smartphone, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ══════════ CONFIG — غيّر هذه البيانات فقط ══════════
const PAYMENT_CONFIG = {
  instapay: { number: "01142099605", name: "محمد الحسيني", label: "InstaPay" },
  vodafone_cash: { number: "01142099605", name: "محمد الحسيني", label: "فودافون كاش" },
  orange_cash: { number: "01142099605", name: "محمد الحسيني", label: "اورنج كاش" },
  etisalat_cash: { number: "01142099605", name: "محمد الحسيني", label: "اتصالات كاش" },
} as const;
// ════════════════════════════════════════════════════

const PLAN_NAMES: Record<string, string> = {
  basic: "الأساسية",
  advanced: "المتقدمة", 
  enterprise: "المؤسسات",
};

const schema = z.object({
  transferMethod: z.enum(["instapay", "vodafone_cash", "orange_cash", "etisalat_cash"]),
  transferReference: z
    .string()
    .min(4, "رقم العملية يجب أن يكون 4 أحرف على الأقل")
    .max(50, "رقم العملية طويل جداً")
    .regex(/^[a-zA-Z0-9\-_]+$/, "رقم العملية يحتوي على أحرف غير مسموحة"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  plan: "basic" | "advanced" | "enterprise";
  amount: number;
  billingCycle: "monthly" | "yearly";
  onSuccess: () => void;
  onCancel: () => void;
}

export function InstapayCheckout({ plan, amount, billingCycle, onSuccess, onCancel }: Props) {
  const [step, setStep] = useState<"choose" | "transfer" | "submit" | "success">("choose");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { transferMethod: "instapay" },
  });

  const selectedMethod = watch("transferMethod") as keyof typeof PAYMENT_CONFIG;
  const config = PAYMENT_CONFIG[selectedMethod];

  const copyNumber = async () => {
    await navigator.clipboard.writeText(config.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/payment/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await import("@/lib/supabase")).supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
        },
        body: JSON.stringify({
          plan,
          billingCycle,
          amount,
          transferReference: data.transferReference,
          transferMethod: data.transferMethod,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.error || "حدث خطأ");
        return;
      }

      setStep("success");
    } catch {
      toast.error("حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step: اختيار طريقة الدفع ──
  if (step === "choose") {
    return (
      <div className="space-y-6 p-2">
        <div className="text-center space-y-1">
          <p className="text-2xl font-bold text-primary">{amount.toLocaleString("en-EG")} ج.م</p>
          <p className="text-sm text-muted-foreground">
            باقة {PLAN_NAMES[plan]} — {billingCycle === "monthly" ? "شهري" : "سنوي"}
          </p>
        </div>

        <div className="space-y-2">
          <Label>اختر طريقة الدفع</Label>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(PAYMENT_CONFIG) as Array<keyof typeof PAYMENT_CONFIG>).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => { setValue("transferMethod", method as keyof typeof PAYMENT_CONFIG); setStep("transfer"); }}
                className={`p-4 rounded-xl border-2 text-center transition-all hover:border-primary hover:bg-primary/5
                  ${selectedMethod === method ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <div className="text-2xl mb-1">
                  {method === "instapay" ? "🏦" : "📱"}
                </div>
                <div className="text-sm font-medium">{PAYMENT_CONFIG[method as keyof typeof PAYMENT_CONFIG].label}</div>
              </button>
            ))}
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={onCancel}>إلغاء</Button>
      </div>
    );
  }

  // ── Step: تفاصيل التحويل ──
  if (step === "transfer") {
    return (
      <div className="space-y-5 p-2">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
          <p className="font-semibold text-center">حوّل المبلغ التالي عبر {config.label}</p>

          <div className="text-center">
            <span className="text-3xl font-bold text-primary">{amount.toLocaleString("en-EG")}</span>
            <span className="text-lg mr-1">ج.م</span>
          </div>

          <div className="bg-background rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">رقم {config.label}</p>
                <p className="font-mono font-bold text-lg" dir="ltr">{config.number}</p>
                <p className="text-sm text-muted-foreground">{config.name}</p>
              </div>
              <Button size="sm" variant="outline" onClick={copyNumber}>
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "تم النسخ" : "نسخ"}
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 p-2 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>تأكد من إدخال المبلغ بالضبط ({amount.toLocaleString("en-EG")} ج.م) وحفظ رقم العملية</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setStep("submit")}>
            حوّلت المبلغ ✓
          </Button>
          <Button variant="outline" onClick={() => setStep("choose")}>رجوع</Button>
        </div>
      </div>
    );
  }

  // ── Step: إدخال رقم العملية ──
  if (step === "submit") {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-2">
        <div className="text-center space-y-1">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
          <p className="font-semibold">ممتاز! أدخل رقم العملية للتأكيد</p>
          <p className="text-sm text-muted-foreground">
            رقم العملية يظهر في إيصال التحويل على تطبيق البنك أو المحفظة
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transferReference">رقم العملية / Transaction Reference</Label>
          <Input
            id="transferReference"
            dir="ltr"
            placeholder="مثال: TXN123456789"
            className="text-center font-mono text-lg"
            {...register("transferReference")}
          />
          {errors.transferReference && (
            <p className="text-sm text-destructive">{errors.transferReference.message}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? "جارٍ الإرسال..." : "إرسال للمراجعة"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setStep("transfer")}>رجوع</Button>
        </div>
      </form>
    );
  }

  // ── Step: نجاح ──
  return (
    <div className="text-center space-y-4 p-4">
      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/40 rounded-full flex items-center justify-center mx-auto">
        <Clock className="w-8 h-8 text-amber-600" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold">طلبك قيد المراجعة</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          تم استلام طلبك بنجاح. سيتم التحقق من التحويل وتفعيل اشتراكك خلال <strong>24 ساعة</strong>.
        </p>
        <p className="text-xs text-muted-foreground">
          ستصلك إشعار فور التفعيل
        </p>
      </div>
      <Badge variant="outline" className="text-amber-600 border-amber-300">
        ⏳ قيد المراجعة
      </Badge>
      <Button className="w-full" onClick={onSuccess}>العودة للرئيسية</Button>
    </div>
  );
}
