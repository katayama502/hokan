import { z } from 'zod';

export const customerSchema = z.object({
  last_name: z.string().min(1, '姓は必須です').max(50),
  first_name: z.string().min(1, '名は必須です').max(50),
  last_name_kana: z.string().max(50).optional(),
  first_name_kana: z.string().max(50).optional(),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が正しくありません')
    .optional()
    .or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
  phone: z
    .string()
    .regex(/^[\d\-\+\(\)\s]{0,20}$/, '電話番号の形式が正しくありません')
    .optional()
    .or(z.literal('')),
  email: z.string().email('メールアドレスの形式が正しくありません').max(255).optional().or(z.literal('')),
  postal_code: z
    .string()
    .regex(/^\d{7}$/, '郵便番号は7桁の数字で入力してください')
    .optional()
    .or(z.literal('')),
  prefecture: z.string().max(10).optional(),
  address: z.string().max(200).optional(),
  occupation: z.string().max(100).optional(),
  annual_income: z.number().int().min(0).max(999999999).optional(),
  memo: z.string().max(2000).optional(),
  tags: z.array(z.string().max(20)).max(10).optional(),
  assigned_staff_id: z.string().uuid().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
