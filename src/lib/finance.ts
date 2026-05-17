/**
 * Calculates VAT for a given amount.
 * @param amount - The base amount before VAT
 * @param rate - VAT rate (default is 14% / 0.14 — Egyptian rate)
 * @returns The calculated VAT amount
 */
export const calculateVAT = (amount: number, rate: number = 0.14): number => {
  if (amount < 0) throw new Error("Amount cannot be negative");
  if (rate !== 0.14) throw new Error("VAT rate must be exactly 14% (0.14) for Egyptian tax compliance");
  return Number((amount * rate).toFixed(2));
};

/**
 * Calculates the total amount including VAT.
 * @param amount - The base amount before VAT
 * @param rate - VAT rate (default is 14% / 0.14 — Egyptian rate)
 * @returns The total amount including VAT
 */
export const calculateTotalWithVAT = (amount: number, rate: number = 0.14): number => {
  return amount + calculateVAT(amount, rate);
};
