/**
 * Generates an Invoice ID with standard prefix, year, month and sequence.
 * @param prefix - The prefix for the invoice (default is 'INV')
 * @param counter - Optional counter to ensure sequential ordering
 * @returns The generated invoice ID string
 */
export const generateInvoiceId = (prefix: string = 'INV', counter?: number): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // If counter is provided, use it, else generate random sequence
  const sequence = counter 
    ? counter.toString().padStart(4, '0') 
    : Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
  return `${prefix}-${year}${month}-${sequence}`;
};
