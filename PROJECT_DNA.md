# PROJECT DNA - Saudi Legal SaaS (الأصل)

هذا الملف يحتوي على تشريح كامل للمشروع الأصلي (السعودي) بناءً على المرحلة A من الـ Super Prompt، ليكون المرجع الأساسي لبناء النظام المصري "ميزان".

---

## A1. هيكل المجلدات والمحاور الأساسية

من خلال تحليل المشروع، تم تحديد الهيكل التالي:

### 1. الشاشات (Pages/Views):
- `App.tsx`: يحتوي على الـ Routing (React Router) وحماية المسارات (ProtectedRoute / PermissionGate).
- `Dashboard.tsx`: الشاشة الرئيسية (إحصائيات، جلسات اليوم، تنبيهات).
- `Cases.tsx` / `CaseDetailsPanel.tsx`: إدارة القضايا وتفاصيلها الممتدة.
- `Clients.tsx`: إدارة الموكلين وملف الموكل المتكامل (إحصائيات الموكل).
- `SessionsRoll.tsx`: رول الجلسات مع التمييز اللوني وتنبيهات الاستئناف/الطعون.
- `Calendar.tsx`, `Finance.tsx`, `Team.tsx`, `Tasks.tsx`, `Settings.tsx`: شاشات الإدارة العامة.

### 2. المكونات المشتركة (Components):
- `components/layout/`: يحتوي على الهيكل الأساسي (`RootLayout` و `Sidebar`).
- `components/ui/`: مكتبة مكونات `shadcn/ui` (Dialog, Button, Select, Table, Badge).
- `views/cases-components/`: مكونات خاصة بالقضايا (إضافة جلسة، إضافة مهام، المخطط الزمني Timeline).

### 3. إدارة الحالة (Store):
مبنية باستخدام **Zustand**:
- `useCasesStore.ts`
- `useClientsStore.ts`
- `useAuthStore.ts`
- `useTeamStore.ts`
- `useFinanceStore.ts`

### 4. الخدمات والاتصال بقاعدة البيانات (Services):
- `legalDataService.ts`: الطبقة المسؤولة عن التواصل المباشر مع Firebase (جلب القضايا، المعاملات Transactions، العدادات Counters).

---

## A3. استخراج DNA المشروع

### أ. نماذج البيانات (Data Models) والعلاقات

**1. Collection: `cases` (القضايا)**
- **الحقول الرئيسية:**
  - `id`: string
  - `clientId`: string (علاقة مباشرة مع `clients`)
  - `plaintiff` / `defendant`: string (أسماء الأطراف)
  - `court`: KSACourtType (المحكمة العامة، التجارية، إلخ)
  - `type`: string (تصنيف القضية)
  - `status`: 'متداولة' | 'مغلقة' | 'تحت الدراسة' | 'محفوظة'
  - `circulationCode`: string (كود التداول T-XXXX)
  - `archiveCode`: string (كود الحفظ H-XXXX)
  - `automatedNumber`: string (الرقم الآلي)
  - `circuit`: string (الدائرة)
  - `clientRole`: 'مدعي' | 'مدعى عليه'

**2. Collection: `clients` (الموكلون)**
- **الحقول الرئيسية:**
  - `id`: string
  - `type`: 'فرد' | 'منشأة'
  - `name`: string
  - `nationalId` / `commercialRegistration`: string
  - `phone`: string

**3. Collection: `sessions` (الجلسات)**
- `caseId`: string (مرتبط بالقضية)
- `date` / `time`: string
- `notes`: string

**4. Collection: `counters` (عدادات الأكواد)**
- `circulation`: `{ lastValue: number }`
- `archive`: `{ lastValue: number }`

---

### ب. منطق العمل الفريد (Business Logic)

1. **نظام الأكواد التسلسلي (Auto-Counters):** 
   - استخدام `runTransaction` في Firestore لضمان توليد أكواد فريدة (T-XXXX للقضايا المتداولة، و H-XXXX للمحفوظة) دون تعارض.
2. **قفل القضايا (Read-Only Mode):** 
   - عند تغيير حالة القضية إلى "محفوظة"، تختفي جميع أزرار التعديل وإضافة الجلسات والمهام والمستندات برمجياً، وتبقى البيانات للعرض فقط.
3. **رول الجلسات وتنبيهات المواعيد:** 
   - تمييز المواعيد النهائية والطعون (مثل الاستئناف/التمييز) في رول الجلسات بلون أحمر تحذيري مع حساب الأيام المتبقية تلقائياً في الشاشة الرئيسية.
4. **الترتيب الزمني المعكوس:** 
   - المخطط الزمني (Timeline) الخاص بالجلسات يُعرض بشكل تنازلي (الأحدث أولاً) لتسهيل متابعة القضية.

---

### ج. التقنيات والمكتبات (Tech Stack)

- **Framework:** React 19 (Vite) + TypeScript
- **Styling:** Tailwind CSS + Tailwind Merge + clsx
- **UI Components:** Shadcn UI + Radix UI
- **State Management:** Zustand
- **Database / Auth:** Firebase (Firestore + Auth)
- **Routing:** React Router DOM (v7)
- **Icons:** Lucide-React
- **Dates Handling:** date-fns

---

### د. نمط الكود (Coding Patterns)

1. **Custom Hooks:** فصل المنطق المعقد عن الواجهة (مثل `useClientsLogic`).
2. **Modular Components:** تقسيم شاشة تفاصيل القضية إلى مكونات صغيرة (Panel, Timeline, SummaryCards).
3. **Strict TypeScript:** استخدام Interfaces صارمة وتجنب `any`.
4. **Soft Deletes & State:** التعامل مع التحديثات المباشرة في Zustand بعد كل عملية ناجحة في Firebase لتقليل طلبات القراءة (Read operations).

---
*تمت عملية التحليل بنجاح بناءً على توجيهات المرحلة A.*
