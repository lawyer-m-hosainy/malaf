/**
 * Calculates VAT for a given amount, factoring in any commercial discount.
 * @param amount - The base amount before VAT
 * @param discount - Commercial discount applied before VAT calculation
 * @param rate - VAT rate (default is 14% / 0.14 — Egyptian rate)
 * @returns The calculated VAT amount
 */
export const calculateVAT = (amount: number, discount: number = 0, rate: number = 0.14): number => {
  if (amount < 0) throw new Error("Amount cannot be negative");
  if (discount < 0 || discount > amount) throw new Error("Invalid discount amount");
  if (rate !== 0.14) throw new Error("VAT rate must be exactly 14% (0.14) for Egyptian tax compliance");
  
  const taxableAmount = amount - discount;
  return Number((taxableAmount * rate).toFixed(2));
};

/**
 * Calculates the total amount including VAT, after discount.
 * @param amount - The base amount before VAT
 * @param discount - Commercial discount applied
 * @param rate - VAT rate (default is 14% / 0.14 — Egyptian rate)
 * @returns The total amount to be paid
 */
export const calculateTotalWithVAT = (amount: number, discount: number = 0, rate: number = 0.14): number => {
  const taxableAmount = amount - discount;
  return taxableAmount + calculateVAT(amount, discount, rate);
};
