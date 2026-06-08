import { z } from 'zod';

export const contractSchema = z.object({
  customer_id: z.string().uuid('顧客IDが正しくありません'),
  policy_number: z.string().min(1, '証券番号は必須です').max(100),
  insurance_company: z.string().min(1, '保険会社名は必須です').max(100),
  product_name: z.string().min(1, '商品名は必須です').max(100),
  insurance_type: z.enum([
    'life', 'nonlife', 'medical', 'cancer',
    'accident', 'fire', 'auto', 'other',
  ]),
  status: z.enum(['active', 'expired', 'cancelled', 'pending']).default('active'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が正しくありません'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が正しくありません')
    .optional()
    .or(z.literal('')),
  premium_monthly: z.number().int().min(0).optional(),
  premium_annual: z.number().int().min(0).optional(),
  coverage_amount: z.number().int().min(0).optional(),
  commission_rate: z.number().min(0).max(100).optional(),
  commission_amount: z.number().int().min(0).optional(),
  memo: z.string().max(2000).optional(),
  assigned_staff_id: z.string().uuid().optional(),
});

export type ContractInput = z.infer<typeof contractSchema>;
