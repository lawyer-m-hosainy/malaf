import { Case, Deadline } from "@/types";

export type CaseWorkflowStage = "intake" | "pleadings" | "hearing" | "judgment" | "closed";

const allowedStatusTransitions: Record<string, string[]> = {
  "تحت الدراسة": ["متداولة", "مغلقة"],
  "متداولة": ["مغلقة", "محفوظة", "محكوم فيها"],
  "محكوم فيها": ["مستأنفة", "طعن", "تنفيذ", "حكم نهائي"],  // R7-FIX
  "مستأنفة": ["محكوم فيها", "متداولة", "طعن"],              // R7-FIX
  "طعن": ["متداولة", "حكم نهائي", "تنفيذ"],                 // R7-FIX
  "تنفيذ": ["مغلقة"],                                        // R7-FIX
  "مغلقة": [],
  "محفوظة": ["متداولة"],
  "حكم نهائي": ["تنفيذ", "مغلقة"],
};

/**
 * يتحقق مما إذا كان الانتقال بين حالتين في سير القضية مسموحاً به.
 * 
 * @param {string} from - الحالة الحالية للقضية
 * @param {string} to - الحالة المستهدفة للانتقال
 * @returns {boolean} هل الانتقال مسموح به
 */
export function canTransitionCaseStatus(from: Case["status"], to: Case["status"]) {
  return from === to || allowedStatusTransitions[from].includes(to);
}

/**
 * يربط حالة القضية بمرحلة سير العمل المقابلة لها.
 * 
 * @param {string} status - حالة القضية
 * @returns {CaseWorkflowStage} مرحلة سير العمل المقابلة
 */
export function mapCaseStatusToStage(status: Case["status"]): CaseWorkflowStage {
  if (status === "تحت الدراسة") return "intake";
  if (status === "متداولة") return "hearing";
  return "closed";
}

/**
 * يتحقق من صلاحية تاريخ الموعد النهائي (يجب أن يكون في المستقبل ولا يكون تاريخاً تالفاً).
 * 
 * @param {string} date - سلسلة تاريخ الموعد النهائي
 * @throws {Error} عند تلف التاريخ أو كونه في الماضي
 */
export function assertDeadlineDate(date: string) {
  const selected = new Date(date);
  if (Number.isNaN(selected.getTime())) {
    throw new Error("INVALID_DEADLINE_DATE");
  }

  const now = new Date();
  const selectedDay = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (selectedDay < today) {
    throw new Error("PAST_DEADLINE_NOT_ALLOWED");
  }
}

/**
 * يقوم بتحديث حالات المواعيد النهائية وإضافة حالة "متأخر" (overdue) للمواعيد الفائتة غير المكتملة.
 * 
 * @param {Deadline[]} deadlines - مصفوفة المواعيد النهائية المراد معالجتها
 * @returns {Deadline[]} مصفوفة المواعيد بعد التحديث
 */
export function enrichDeadlineStatuses(deadlines: Deadline[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return deadlines.map((d) => {
    const dd = new Date(d.date);
    const day = new Date(dd.getFullYear(), dd.getMonth(), dd.getDate());
    if (d.status === "completed") return d;
    if (!Number.isNaN(dd.getTime()) && day < today) {
      return { ...d, status: "overdue" as const };
    }
    return d;
  });
}
