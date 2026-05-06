import { supabase } from "@/lib/supabase";
import { getCurrentTenantId } from "@/lib/tenant";

export const demoClients = [
  {
    name: "شركة الأفق للتطوير العقاري",
    type: "منشأة",
    phone: "+201012345678",
    email: "legal@alofoq-realestate.com.eg",
    commercialRegistration: "123456",
  },
  {
    name: "محمود عبد الرحمن سعيد",
    type: "فرد",
    phone: "+201122334455",
    email: "mahmoud.s@example.com",
    nationalId: "28501010123456",
  },
  {
    name: "مجموعة النيل للتجارة",
    type: "منشأة",
    phone: "+201200112233",
    email: "info@nile-trading.com.eg",
    commercialRegistration: "789012",
  }
];

export const demoCases = [
  {
    court: "محكمة استئناف القاهرة",
    plaintiff: "شركة الأفق للتطوير العقاري",
    defendant: "شركة البناء الحديث",
    status: "نشطة",
    case_number: "452",
    case_year: "2023",
  },
  {
    court: "المحكمة الاقتصادية",
    plaintiff: "مجموعة النيل للتجارة",
    defendant: "بنك الاستثمار العربي",
    status: "تحت الدراسة",
    case_number: "89",
    case_year: "2024",
  },
  {
    court: "محكمة الأسرة بالمعادي",
    plaintiff: "فاطمة حسن علي",
    defendant: "محمود عبد الرحمن سعيد",
    status: "مغلقة",
    case_number: "1120",
    case_year: "2022",
  }
];

export const demoInvoices = [
  {
    amount: 25000,
    total: 28500, // +14% VAT
    status: "unpaid",
    date: new Date().toISOString().split('T')[0],
  },
  {
    amount: 15000,
    total: 17100, // +14% VAT
    status: "paid",
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }
];

export async function seedInvestorDemo() {
  const orgId = getCurrentTenantId();
  if (!orgId) {
    console.error("No tenant ID found for seeding");
    return false;
  }
  
  console.log("Seeding realistic Egyptian legal data for investor demo...");
  // In a real application, we would use legalDataService.ts functions here to properly encrypt and save.
  // This file acts as a static mock source for the demo mode.
  
  return {
    clients: demoClients,
    cases: demoCases,
    invoices: demoInvoices
  };
}
