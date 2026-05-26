import { supabase } from "@/lib/supabase";
import { fetchCases } from "./caseService";
import { fetchClients } from "./clientService";
import { fetchInvoices } from "./financeService";

/**
 * خدمة معالجة طلبات أصحاب البيانات (PDPL 151/2020)
 */
export const dataSubjectService = {
  /**
   * طلب الوصول (Access Request) - تجميع كل بيانات المستخدم
   */
  async exportUserData(userId: string) {
    try {
      const [cases, clients, invoices] = await Promise.all([
        fetchCases(),
        fetchClients(),
        fetchInvoices(),
      ]);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const exportData = {
        generatedAt: new Date().toISOString(),
        profile,
        cases,
        clients,
        invoices,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error("Export failed:", error);
      throw new Error("فشل في تجميع البيانات. يرجى المحاولة لاحقاً.");
    }
  },

  /**
   * طلب الحذف (Erasure Request) - حذف نهائي (وليس ناعم)
   */
  async deleteUserData(userId: string, orgId: string) {
    try {
      // 1. حذف الملفات من Storage
      const { data: files } = await supabase.storage.from("documents").list(orgId);
      if (files && files.length > 0) {
        await supabase.storage.from("documents").remove(files.map(f => `${orgId}/${f.name}`));
      }

      // 2. حذف السجلات من قاعدة البيانات (تعتمد على CASCADE في Postgres)
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", orgId);

      if (error) throw error;

      return { success: true, message: "تم حذف جميع البيانات والملفات بنجاح." };
    } catch (error) {
      console.error("Deletion failed:", error);
      throw new Error("فشل في حذف البيانات. يرجى التواصل مع الدعم الفني.");
    }
  }
};
