import { Case } from "@/types";

/**
 * Valid workflow transitions for KSA legal cases.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  'intake': ['pleadings', 'closed'],
  'pleadings': ['hearing', 'closed'],
  'hearing': ['judgment', 'pleadings', 'closed'],
  'judgment': ['closed'],
  'closed': [],
};

/**
 * Checks if a workflow stage transition is valid.
 */
export function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Calculates case age in days from creation date.
 */
export function calculateCaseAge(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Determines case risk level based on age and status.
 */
export function getCaseRiskLevel(caseItem: Case): 'low' | 'medium' | 'high' {
  const ageDays = calculateCaseAge(caseItem.createdAt);

  if (caseItem.status === 'مغلقة') return 'low';
  if (ageDays > 180) return 'high';
  if (ageDays > 90) return 'medium';
  return 'low';
}

/**
 * Groups cases by type and returns counts.
 */
export function getCaseDistribution(cases: Case[]): Record<string, number> {
  const dist: Record<string, number> = {};
  cases.forEach(c => {
    dist[c.type] = (dist[c.type] || 0) + 1;
  });
  return dist;
}

/**
 * Filters cases that are at risk (old and still active).
 */
export function getAtRiskCases(cases: Case[], thresholdDays: number = 120): Case[] {
  return cases.filter(c => c.status === 'متداولة' && calculateCaseAge(c.createdAt) > thresholdDays);
}

/**
 * Returns human-readable status label in Arabic.
 */
export function getStatusLabel(status: Case['status']): string {
  const labels: Record<string, string> = {
    'متداولة': 'قيد العمل',
    'مغلقة': 'منتهية',
    'تحت الدراسة': 'قيد المراجعة',
    'محفوظة': 'مؤرشفة',
  };
  return labels[status] || status;
}
