import { Case, Deadline } from "@/types";

export type CaseWorkflowStage = "intake" | "pleadings" | "hearing" | "judgment" | "closed";

const allowedStatusTransitions: Record<Case["status"], Case["status"][]> = {
  "تحت الدراسة": ["متداولة", "مغلقة"],
  "متداولة": ["مغلقة", "محفوظة"],
  "مغلقة": ["متداولة"],
  "محفوظة": ["متداولة"]
};

export function canTransitionCaseStatus(from: Case["status"], to: Case["status"]) {
  return from === to || allowedStatusTransitions[from].includes(to);
}

export function mapCaseStatusToStage(status: Case["status"]): CaseWorkflowStage {
  if (status === "تحت الدراسة") return "intake";
  if (status === "متداولة") return "hearing";
  return "closed";
}

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
