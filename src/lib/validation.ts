/**
 * Formats a given phone string into the standard Saudi format (+9665XXXXXXXX)
 * @param phone - The raw phone string
 * @returns The formatted phone string
 */
export const formatSaudiPhone = (phone: string): string => {
  // Remove spaces, hyphens, and parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');
  
  if (cleaned.startsWith('05')) {
    return '+9665' + cleaned.slice(2);
  }
  
  if (cleaned.startsWith('9665')) {
    return '+' + cleaned;
  }
  
  if (cleaned.startsWith('+9665')) {
    return cleaned;
  }
  
  // If it's a 9 digit number starting with 5 (e.g. 5xxxxxxxx)
  if (cleaned.length === 9 && cleaned.startsWith('5')) {
    return '+966' + cleaned;
  }
  
  return cleaned; // return as is if no rules applied (will be caught by the Schema validation)
};
