import { z } from 'zod';

export const dealSchema = z.object({
  customer_id: z.string().uuid('顧客IDが正しくありません'),
  title: z.string().min(1, '案件タイトルは必須です').max(200),
  insurance_type: z
    .enum(['life', 'nonlife', 'medical', 'cancer', 'accident', 'fire', 'auto', 'other'])
    .optional(),
  stage: z
    .enum(['lead', 'contact', 'proposal', 'negotiation', 'closed_won', 'closed_lost'])
    .default('lead'),
  expected_amount: z.number().int().min(0).optional(),
  expected_close_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal('')),
  lost_reason: z.string().max(500).optional(),
  memo: z.string().max(2000).optional(),
  assigned_staff_id: z.string().uuid().optional(),
});

export type DealInput = z.infer<typeof dealSchema>;
