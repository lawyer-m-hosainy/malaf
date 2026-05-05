import { create } from 'zustand';

export type CriminalCaseType = 'جناية' | 'جنحة' | 'مخالفة' | 'قضية أحداث' | 'قضية أمن دولة';

export interface PoliceReport {
  reportNumber: string;
  policeStation: string;
  date: string;
  incidentType: string;
  accused: string;
  victim: string;
}

export interface Prosecution {
  prosecutionNumber: string;
  prosecutionOffice: string;
  investigator: string;
  transferDate: string;
  decision: 'حفظ' | 'إحالة للمحكمة' | 'تصرف آخر' | 'قيد التحقيق';
}

export interface CourtRegistration {
  caseNumber: string;
  court: string;
  circuit: string;
  officialCharge: string;
}

export interface Trial {
  // Can link to sessions/experts
  notes: string;
}

export interface VerdictAndAppeal {
  verdict: string;
  verdictDate: string;
  appealDeadlineDays: number;
  appealStatus: string;
}

export interface CriminalCase {
  id: string;
  caseType: CriminalCaseType;
  currentStage: 1 | 2 | 3 | 4 | 5;
  policeReport: PoliceReport;
  prosecution?: Prosecution;
  courtRegistration?: CourtRegistration;
  trial?: Trial;
  verdictAndAppeal?: VerdictAndAppeal;
}

interface CriminalState {
  criminalCases: CriminalCase[];
}

export const useCriminalStore = create<CriminalState>((set) => ({
  criminalCases: [
    {
      id: "CRIM-001",
      caseType: "جنحة",
      currentStage: 2,
      policeReport: {
        reportNumber: "4502 إداري",
        policeStation: "قسم الدقي",
        date: "2026-04-10",
        incidentType: "مشاجرة وضرب",
        accused: "أحمد سيد محمود",
        victim: "محمود علي إبراهيم",
      },
      prosecution: {
        prosecutionNumber: "220 حصر",
        prosecutionOffice: "نيابة الدقي الجزئية",
        investigator: "وكيل النيابة / عمر خالد",
        transferDate: "2026-04-11",
        decision: "قيد التحقيق"
      }
    },
    {
      id: "CRIM-002",
      caseType: "جناية",
      currentStage: 4,
      policeReport: {
        reportNumber: "1120 جنايات",
        policeStation: "قسم العجوزة",
        date: "2026-01-05",
        incidentType: "اختلاس أموال عامة",
        accused: "سمير جلال عبدالعزيز",
        victim: "شركة النيل للأدوية",
      },
      prosecution: {
        prosecutionNumber: "55 حصر أموال عامة",
        prosecutionOffice: "نيابة الأموال العامة العليا",
        investigator: "رئيس النيابة / طارق سعد",
        transferDate: "2026-01-10",
        decision: "إحالة للمحكمة"
      },
      courtRegistration: {
        caseNumber: "154/2026 جنايات العجوزة",
        court: "محكمة جنايات الجيزة",
        circuit: "الدائرة 5 جنايات",
        officialCharge: "اختلاس أموال عامة والإضرار العمدي"
      },
      trial: {
        notes: "تم التأجيل لسماع الشهود ومناقشة تقرير لجنة الخبراء."
      }
    }
  ]
}));
