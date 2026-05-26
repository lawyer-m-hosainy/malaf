/**
 * Formats a given phone string into the standard Egyptian format (+201XXXXXXXXX)
 * @param phone - The raw phone string
 * @returns The formatted phone string
 */
export const formatEgyptPhone = (phone: string): string => {
  // Remove spaces, hyphens, and parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');
  
  // Local Egyptian mobile starts with 01
  if (cleaned.startsWith('01')) {
    return '+20' + cleaned.slice(1);
  }
  
  // International starts with 201
  if (cleaned.startsWith('201')) {
    return '+' + cleaned;
  }
  
  if (cleaned.startsWith('+201')) {
    return cleaned;
  }
  
  // If it's a 10 digit number starting with 1 (e.g. 1xxxxxxxx)
  if (cleaned.length === 10 && cleaned.startsWith('1')) {
    return '+20' + cleaned;
  }
  
  return cleaned; 
};
