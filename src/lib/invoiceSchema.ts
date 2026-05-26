import { z } from 'zod';

/**
 * مخطط التحقق من الفاتورة الإلكترونية وفق معايير ETA
 */
export const invoiceSchema = z.object({
  issuer: z.object({
    type: z.enum(['B', 'P', 'F']),
    id: z.string().min(9),
    name: z.string().min(3),
    address: z.object({
      country: z.string().default('EG'),
      governorate: z.string(),
      regionCity: z.string(),
      street: z.string(),
      buildingNumber: z.string(),
    }),
  }),
  receiver: z.object({
    type: z.enum(['B', 'P', 'F']),
    id: z.string(),
    name: z.string(),
  }),
  documentType: z.literal('I'),
  documentTypeVersion: z.literal('1.0'),
  dateTimeIssued: z.string().datetime(), // ISO 8601
  taxpayerActivityCode: z.string(),
  internalID: z.string(),
  invoiceLines: z.array(z.object({
    description: z.string(),
    itemType: z.enum(['EGS', 'GS1']),
    itemCode: z.string(),
    unitType: z.string(),
    quantity: z.number().positive(),
    unitValue: z.object({
      currencySold: z.string().default('EGP'),
      amountEGP: z.number().nonnegative(),
    }),
    salesTotal: z.number().nonnegative(),
    taxableItems: z.array(z.object({
      taxType: z.string(),
      amount: z.number().nonnegative(),
      subType: z.string(),
      rate: z.number().nonnegative(),
    })),
    total: z.number().nonnegative(),
  })),
  totalAmount: z.number().nonnegative(),
}).refine((data) => {
  // التحقق من صحة الحساب الإجمالي
  const calculatedTotal = data.invoiceLines.reduce((acc, line) => acc + line.total, 0);
  return Math.abs(calculatedTotal - data.totalAmount) < 0.01;
}, {
  message: "إجمالي الفاتورة غير مطابق لمجموع البنود",
  path: ["totalAmount"],
});
