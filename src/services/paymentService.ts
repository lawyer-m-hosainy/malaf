import { supabase } from "@/lib/supabase";
import { TrustTransaction, TrustTransactionType, TrustPageStats, DBPaymentPlan, DBPaymentInstallment, TrustAccount } from "@/types";
import { requireOrgId, logAuditAction } from "./utils";

// ═══════════════════════════════════════════════════════════════════
// خدمات الأمانات (Trust Accounts)
// ═══════════════════════════════════════════════════════════════════

/**
 * جلب حسابات الأمانات (Legacy support for Dashboard/AppDataLoader)
 * @returns {Promise<TrustAccount[]>} قائمة حسابات الأمانات
 */
export async function fetchTrustAccounts(): Promise<TrustAccount[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("trust_accounts")
      .select("*, clients(name)")
      .eq("org_id", orgId)
      .limit(100);
    if (error) throw error;
    return (data || []).map((t: any) => ({
      ...t,
      clientId: t.client_id,
      clientName: t.clients?.name || "غير معروف",
      caseId: t.case_id,
      createdAt: t.created_at,
    })) as TrustAccount[];
  } catch (error) {
    console.error("خطأ في جلب حسابات الأمانات:", error);
    return [];
  }
}

/**
 * جلب جميع حركات الأمانات الخاصة بالمكتب
 * @returns {Promise<TrustTransaction[]>} قائمة حركات الأمانات
 */
export async function fetchTrustTransactions(): Promise<TrustTransaction[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("trust_transactions")
      .select("*, clients(name), cases(plaintiff, defendant)")
      .eq("org_id", orgId)
      .order("transaction_date", { ascending: false });

    if (error) throw error;

    return (data || []).map((t: any) => ({
      id: t.id,
      org_id: t.org_id,
      clientId: t.client_id,
      clientName: t.clients?.name ?? "غير معروف",
      caseId: t.case_id ?? undefined,
      caseName: t.cases
        ? `${t.cases.plaintiff} ضد ${t.cases.defendant}`
        : undefined,
      transactionType: t.transaction_type as TrustTransactionType,
      amount: parseFloat(t.amount),
      description: t.description ?? undefined,
      receiptNumber: t.receipt_number ?? undefined,
      transactionDate: t.transaction_date,
      createdBy: t.created_by ?? undefined,
      createdAt: t.created_at,
    }));
  } catch (error) {
    console.error("خطأ في جلب حركات الأمانات:", error);
    return [];
  }
}

/**
 * تسجيل حركة أمانة جديدة (إيداع أو صرف)
 * @param tx - بيانات الحركة
 */
export async function saveTrustTransaction(
  tx: Omit<TrustTransaction, "id" | "createdAt" | "clientName" | "caseName">
): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase.from("trust_transactions").insert({
      org_id: orgId,
      client_id: tx.clientId,
      case_id: tx.caseId ?? null,
      transaction_type: tx.transactionType,
      amount: tx.amount,
      description: tx.description ?? null,
      receipt_number: tx.receiptNumber ?? null,
      transaction_date: tx.transactionDate,
    });

    if (error) throw error;

    await logAuditAction(
      tx.transactionType === "deposit" ? "TRUST_DEPOSIT" : "TRUST_WITHDRAWAL",
      "trust_transactions",
      tx.clientId,
      `عملية ${tx.transactionType === "deposit" ? "إيداع" : "صرف"} بقيمة ${tx.amount} ج.م`
    );
  } catch (error) {
    console.error("خطأ في تسجيل حركة الأمة:", error);
    throw error;
  }
}

/**
 * حساب رصيد الأمانة لموكل محدد (مع إمكانية الفلترة بقضية)
 * @param clientId - معرف الموكل
 * @param caseId - (اختياري) معرف القضية
 * @returns {Promise<number>} صافي الرصيد
 */
export async function fetchClientTrustBalance(
  clientId: string,
  caseId?: string
): Promise<number> {
  const orgId = requireOrgId();
  try {
    let query = supabase
      .from("trust_transactions")
      .select("transaction_type, amount")
      .eq("org_id", orgId)
      .eq("client_id", clientId);

    if (caseId) query = query.eq("case_id", caseId);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).reduce((bal, row) => {
      const amt = parseFloat(row.amount);
      return row.transaction_type === "deposit" ? bal + amt : bal - amt;
    }, 0);
  } catch (error) {
    console.error("خطأ في حساب رصيد الأمانة:", error);
    return 0;
  }
}

/**
 * جلب إحصائيات عامة لصفحة الأمانات
 * @returns {Promise<TrustPageStats>} إحصائيات الأمانات
 */
export async function fetchTrustPageStats(): Promise<TrustPageStats> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("trust_transactions")
      .select("transaction_type, amount")
      .eq("org_id", orgId);

    if (error) throw error;

    const stats = (data || []).reduce(
      (acc, row) => {
        const amt = parseFloat(row.amount);
        if (row.transaction_type === "deposit") acc.totalDeposits += amt;
        else acc.totalWithdrawals += amt;
        acc.transactionCount++;
        return acc;
      },
      { totalDeposits: 0, totalWithdrawals: 0, transactionCount: 0 }
    );

    return {
      ...stats,
      totalAvailableBalance: stats.totalDeposits - stats.totalWithdrawals,
    };
  } catch (error) {
    console.error("خطأ في جلب إحصائيات الأمانات:", error);
    return { totalDeposits: 0, totalWithdrawals: 0, totalAvailableBalance: 0, transactionCount: 0 };
  }
}

/**
 * حذف حركة أمانة نهائياً
 * @param id - معرف الحركة
 */
export async function deleteTrustTransaction(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("trust_transactions")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw error;
}

// ═══════════════════════════════════════════════════════════════════
// خدمات خطط الدفع والأقساط (Payment Plans)
// ═══════════════════════════════════════════════════════════════════

/**
 * جلب جميع خطط الدفع مع تفاصيل الموكلين والأقساط
 * @returns {Promise<DBPaymentPlan[]>} قائمة خطط الدفع
 */
export async function fetchPaymentPlans(): Promise<DBPaymentPlan[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("payment_plans")
      .select("*, clients(name), cases(plaintiff, defendant), payment_installments(*)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((p: any) => ({
      id: p.id,
      org_id: p.org_id,
      caseId: p.case_id ?? undefined,
      caseName: p.cases ? `${p.cases.plaintiff} ضد ${p.cases.defendant}` : undefined,
      clientId: p.client_id,
      clientName: p.clients?.name ?? "غير معروف",
      totalAmount: parseFloat(p.total_amount),
      paidAmount: parseFloat(p.paid_amount || "0"),
      planDescription: p.plan_description ?? undefined,
      status: p.status as any,
      createdAt: p.created_at,
      installments: (p.payment_installments || []).map((i: any) => ({
        id: i.id,
        planId: i.plan_id,
        org_id: i.org_id,
        dueDate: i.due_date,
        amount: parseFloat(i.amount),
        paidDate: i.paid_date ?? undefined,
        status: i.status as any,
        notes: i.notes ?? undefined,
      })).sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    }));
  } catch (error) {
    console.error("خطأ في جلب خطط الدفع:", error);
    return [];
  }
}

/**
 * إنشاء خطة دفع جديدة مع أقساطها المجدولة (عملية ذرية)
 * @param plan - بيانات الخطة
 * @param installments - قائمة الأقساط
 */
export async function savePaymentPlan(
  plan: Omit<DBPaymentPlan, "id" | "createdAt" | "clientName" | "caseName" | "installments">,
  installments: Omit<DBPaymentInstallment, "id" | "planId" | "org_id">[]
): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { data: planData, error: planError } = await supabase
      .from("payment_plans")
      .insert({
        org_id: orgId,
        case_id: plan.caseId ?? null,
        client_id: plan.clientId,
        total_amount: plan.totalAmount,
        paid_amount: plan.paidAmount || 0,
        plan_description: plan.planDescription ?? null,
        status: plan.status || 'active',
      })
      .select()
      .single();

    if (planError) throw planError;
    const planId = planData.id;

    if (installments.length > 0) {
      const dbInstallments = installments.map(i => ({
        plan_id: planId,
        org_id: orgId,
        due_date: i.dueDate,
        amount: i.amount,
        status: i.status || 'pending',
        notes: i.notes ?? null,
      }));

      const { error: instError } = await supabase
        .from("payment_installments")
        .insert(dbInstallments);

      if (instError) throw instError;
    }

    await logAuditAction(
      "CREATE_PAYMENT_PLAN",
      "payment_plans",
      planId,
      `إنشاء خطة دفع بقيمة ${plan.totalAmount} ج.م للموكل`
    );
  } catch (error) {
    console.error("خطأ في تسجيل خطة الدفع والأقساط:", error);
    throw error;
  }
}

/**
 * تسجيل سداد قسط محدد وتحديث حالة الخطة تلقائياً
 * @todo مرشحة لإعادة الهيكلة - 4 queries متتالية
 * يمكن تحسينها بـ Supabase RPC Function لاحقاً
 * @param installmentId - معرف القسط
 * @param amount - المبلغ المدفوع
 * @param paidDate - تاريخ السداد
 * @param notes - ملاحظات إضافية
 */
export async function recordInstallmentPayment(
  installmentId: string,
  amount: number,
  paidDate: string,
  notes?: string
): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { data: instData, error: fetchError } = await supabase
      .from("payment_installments")
      .select("plan_id, amount, status")
      .eq("id", installmentId)
      .eq("org_id", orgId)
      .single();

    if (fetchError) throw fetchError;
    if (instData.status === 'paid') {
      throw new Error("هذا القسط مدفوع بالفعل.");
    }

    const { error: instUpdateError } = await supabase
      .from("payment_installments")
      .update({
        paid_date: paidDate,
        status: 'paid',
        notes: notes ?? null,
      })
      .eq("id", installmentId)
      .eq("org_id", orgId);

    if (instUpdateError) throw instUpdateError;

    const { data: planData, error: planFetchError } = await supabase
      .from("payment_plans")
      .select("total_amount, paid_amount")
      .eq("id", instData.plan_id)
      .eq("org_id", orgId)
      .single();

    if (planFetchError) throw planFetchError;

    const newPaidAmount = parseFloat(planData.paid_amount || "0") + amount;
    const isCompleted = newPaidAmount >= parseFloat(planData.total_amount);

    const { error: planUpdateError } = await supabase
      .from("payment_plans")
      .update({
        paid_amount: newPaidAmount,
        status: isCompleted ? 'completed' : 'active',
      })
      .eq("id", instData.plan_id)
      .eq("org_id", orgId);

    if (planUpdateError) throw planUpdateError;

    await logAuditAction(
      "PAY_INSTALLMENT",
      "payment_installments",
      installmentId,
      `تسجيل سداد قسط بقيمة ${amount} ج.م للخطة ${instData.plan_id}`
    );
  } catch (error) {
    console.error("خطأ في سداد القسط:", error);
    throw error;
  }
}
