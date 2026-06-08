import { z } from 'zod';

export const intentSchema = z.object({
  customer_id: z.string().uuid('顧客IDが正しくありません'),
  deal_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'submitted', 'signed', 'completed']).default('draft'),
  hearing_data: z.record(z.unknown()).default({}),
  comparison_data: z.record(z.unknown()).optional(),
  recommended_product: z.string().max(200).optional(),
});

export type IntentInput = z.infer<typeof intentSchema>;

export const hearingDataSchema = z.object({
  current_insurance: z.enum(['yes', 'no', 'unknown']).optional(),
  concerns: z.array(z.string()).optional(),
  budget_range: z.enum(['under_5000', '5000_10000', 'over_10000']).optional(),
  purpose: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export type HearingData = z.infer<typeof hearingDataSchema>;
