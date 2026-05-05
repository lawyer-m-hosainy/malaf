import { readFile } from "node:fs/promises";
import path from "node:path";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import { encryptField } from "../src/lib/encryption";

const DEMO_TENANT_ID = "demo-tenant";

async function loadFirebaseConfig() {
  const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
  const raw = await readFile(configPath, "utf8");
  return JSON.parse(raw);
}

function buildDemoClients() {
  const names = [
    "شركة الراجحي العقارية", "محمد بن سلمان العتيبي", "مؤسسة الحلول الرقمية", "خالد بن عبدالله السبيعي",
    "شركة الأفق للمقاولات", "نورة بنت فهد القحطاني", "مجموعة الشايع للتجارة", "علي بن حسن الزهراني",
    "شركة الطاقة المتكاملة", "أحمد بن محمود الحربي", "ليلى بنت يوسف الشمري", "مجموعة الطيار للسفر",
    "فهد بن عبدالعزيز الدوسري", "شركة الصحراء للبتروكيماويات", "مريم بنت صالح العمري", "مؤسسة النهضة التجارية",
    "سلطان بن نايف المطيري", "شركة التطوير العمراني", "هند بنت جاسم الفايز", "شركة النقل اللوجستي"
  ];
  
  return names.map((name, i) => ({
    id: `${i + 1}`,
    tenantId: DEMO_TENANT_ID,
    type: i % 2 === 0 ? "منشأة" : "فرد",
    name,
    commercialRegistration: i % 2 === 0 ? encryptField(`1010${100000 + i}`) : undefined,
    nationalId: i % 2 !== 0 ? encryptField(`10${22334455 + i}`) : undefined,
    vatNumber: i % 2 === 0 ? encryptField(`3000${12345600000 + i}`) : undefined,
    phone: `+9665${50000000 + i}`,
    email: `client${i + 1}@example.com`,
  }));
}

function buildDemoCases() {
  const cases = [];
  for (let i = 1; i <= 20; i++) {
    cases.push({
      id: `C-300${i}`,
      tenantId: DEMO_TENANT_ID,
      clientId: `${(i % 20) + 1}`,
      workflowStage: ["intake", "drafting", "hearing", "judgment"][i % 4],
      court: ["المحكمة التجارية", "المحكمة العامة", "المحكمة العمالية", "ديوان المظالم"][i % 4],
      type: ["تجاري", "عام", "عمالي", "إداري"][i % 4],
      plaintiff: i % 2 === 0 ? "الموكل" : "خصم الموكل",
      defendant: i % 2 !== 0 ? "الموكل" : "خصم الموكل",
      title: `قضية رقم ${i} للموكل`,
      status: i % 5 === 0 ? "مغلقة" : "نشطة",
      najizReferenceStatus: i % 3 === 0 ? "مربوط بناجز" : "غير مربوط",
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    });
  }
  return cases;
}

function buildDemoInvoices() {
  const invoices = [];
  for (let i = 1; i <= 15; i++) {
    const base = 2500 * i;
    const vat = base * 0.15;
    invoices.push({
      id: `INV-2026-00${i}`,
      tenantId: DEMO_TENANT_ID,
      clientId: `${(i % 20) + 1}`,
      clientName: `موكل رقم ${(i % 20) + 1}`,
      base,
      vat,
      total: base + vat,
      status: i % 3 === 0 ? "مدفوعة" : i % 3 === 1 ? "غير مدفوعة" : "جزئية",
      date: new Date(Date.now() - i * 172800000).toISOString(),
    });
  }
  return invoices;
}

function buildDemoTrustAccounts() {
  const accounts = [];
  for (let i = 1; i <= 10; i++) {
    accounts.push({
      id: `TA-400${i}`,
      tenantId: DEMO_TENANT_ID,
      clientId: `${(i % 20) + 1}`,
      clientName: `موكل رقم ${(i % 20) + 1}`,
      amount: 1000 * i,
      type: ["أمانة", "مقدم أتعاب", "مبلغ تنفيذ"][i % 3],
      status: "نشط",
      description: `وصف العملية رقم ${i}`,
      date: new Date(Date.now() - i * 432000000).toISOString().slice(0, 10),
    });
  }
  return accounts;
}

function buildDemoEnforcement() {
  const enf = [];
  for (let i = 1; i <= 8; i++) {
    enf.push({
      id: `E-500${i}`,
      tenantId: DEMO_TENANT_ID,
      caseId: `C-300${i}`,
      clientId: `${(i % 20) + 1}`,
      clientName: `موكل رقم ${(i % 20) + 1}`,
      debtorName: `المدين رقم ${i}`,
      amountClaimed: 15000 * i,
      amountCollected: 5000 * i,
      status: ["مفتوح", "تحت إجراء 46", "حجز/منع", "محصل"][i % 4],
      stageDeadline: new Date(Date.now() + i * 86400000).toISOString().slice(0, 10),
      actions: [{ id: "a1", title: "فتح طلب تنفيذ", date: "2024-01-01", type: "نظامي", performedBy: "النظام" }],
      orders: [{ id: "o1", type: "قرار 34", status: "منفذ", issuedAt: "2024-01-05" }],
      assets: [{ id: "as1", type: "حساب بنكي", description: "مصرف الراجحي", estimatedValue: 10000, isFrozen: true }]
    });
  }
  return enf;
}

function buildDemoTasks() {
  const tasks = [];
  for (let i = 1; i <= 15; i++) {
    tasks.push({
      id: `T-600${i}`,
      tenantId: DEMO_TENANT_ID,
      title: `مهمة رقم ${i}`,
      description: `تفاصيل المهمة رقم ${i}`,
      status: ["pending", "in_progress", "completed"][i % 3],
      priority: ["low", "medium", "high"][i % 3],
      dueDate: new Date(Date.now() + i * 86400000).toISOString(),
      assignedTo: `T${(i % 3) + 1}`,
    });
  }
  return tasks;
}

function buildDemoTeam() {
  return [
    { id: "T1", tenantId: DEMO_TENANT_ID, name: "د. عبدالمحسن القحطاني", role: "شريك مؤسس", email: "dr.qahtani@mohamy-pro.sa", avatar: "https://picsum.photos/seed/dr/200" },
    { id: "T2", tenantId: DEMO_TENANT_ID, name: "أ. سارة الشمري", role: "محامية استئناف", email: "s.shammari@mohamy-pro.sa", avatar: "https://picsum.photos/seed/sara/200" },
    { id: "T3", tenantId: DEMO_TENANT_ID, name: "أ. فيصل المطيري", role: "مستشار قانوني", email: "f.mutairi@mohamy-pro.sa", avatar: "https://picsum.photos/seed/faisal/200" },
  ];
}

async function seed() {
  const email = process.env.DEMO_ADMIN_EMAIL;
  const password = process.env.DEMO_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing DEMO_ADMIN_EMAIL or DEMO_ADMIN_PASSWORD environment variables.");
  }

  const cfg = await loadFirebaseConfig();
  const app = initializeApp(cfg);
  const auth = getAuth(app);
  const db = getFirestore(app, cfg.firestoreDatabaseId);

  console.log("Authenticating demo admin...");
  await signInWithEmailAndPassword(auth, email, password);

  const data = {
    clients: buildDemoClients(),
    cases: buildDemoCases(),
    invoices: buildDemoInvoices(),
    trustAccounts: buildDemoTrustAccounts(),
    enforcement: buildDemoEnforcement(),
    tasks: buildDemoTasks(),
    team: buildDemoTeam(),
  };

  for (const [collection, items] of Object.entries(data)) {
    console.log(`Seeding ${items.length} items into ${collection}...`);
    for (const item of items) {
      await setDoc(doc(db, collection, (item as any).id), item, { merge: true });
    }
  }

  console.log("Seed complete for all modules.");
}

seed().catch((err) => {
  console.error("Demo seed failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
