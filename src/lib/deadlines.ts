import { addDays, isFriday, addDays as fnsAddDays, parseISO, format } from 'date-fns';
import { EGYPT_DEADLINES } from '../types/case';

export type CaseDeadlineType = 'استئناف مدني' | 'طعن بالنقض' | 'معارضة جنائية' | 'استئناف جنائي' | 'طعن إداري';

interface DeadlineResult {
  deadlineDate: Date;
  deadlineDateStr: string;
  isRecess: boolean;
  notes: string;
}

/**
 * Calculates Egyptian legal deadlines based on court judgment dates.
 * Skips Fridays and considers the judicial recess (July 1 - Oct 1).
 */
export function calculateEgyptDeadline(
  judgmentDateStr: string,
  type: CaseDeadlineType
): DeadlineResult {
  const judgmentDate = parseISO(judgmentDateStr);
  let daysToAdd = 0;

  switch (type) {
    case 'استئناف مدني':
      daysToAdd = EGYPT_DEADLINES.APPEAL_CIVIL; // 40
      break;
    case 'طعن بالنقض':
      daysToAdd = EGYPT_DEADLINES.CASSATION; // 60
      break;
    case 'معارضة جنائية':
    case 'استئناف جنائي':
      daysToAdd = 10;
      break;
    case 'طعن إداري':
      daysToAdd = EGYPT_DEADLINES.ADMIN_APPEAL; // 60
      break;
  }

  let finalDate = fnsAddDays(judgmentDate, daysToAdd);

  // If it falls on a Friday, move to Saturday
  if (isFriday(finalDate)) {
    finalDate = fnsAddDays(finalDate, 1);
  }

  // Check Judicial Recess (July 1 - Oct 1)
  const month = finalDate.getMonth() + 1; // 1-12
  const isRecess = month >= 7 && month <= 9;
  
  // Note: During recess, deadlines technically pause or extend, 
  // but for simplicity we flag it so the lawyer is aware.
  let notes = isRecess ? 'تنبيه: الميعاد يقع خلال العطلة القضائية (تمتد المواعيد)' : '';

  return {
    deadlineDate: finalDate,
    deadlineDateStr: format(finalDate, 'yyyy-MM-dd'),
    isRecess,
    notes,
  };
}
