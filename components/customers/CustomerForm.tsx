'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { customerSchema, type CustomerInput } from '@/lib/validations/customer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Customer } from '@/types';

interface Props {
  customer?: Customer;
}

export function CustomerForm({ customer }: Props) {
  const router = useRouter();
  const isEdit = !!customer;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer
      ? {
          last_name: customer.last_name,
          first_name: customer.first_name,
          last_name_kana: customer.last_name_kana ?? '',
          first_name_kana: customer.first_name_kana ?? '',
          birth_date: customer.birth_date ?? '',
          gender: customer.gender,
          phone: customer.phone ?? '',
          email: customer.email ?? '',
          postal_code: customer.postal_code ?? '',
          prefecture: customer.prefecture ?? '',
          address: customer.address ?? '',
          occupation: customer.occupation ?? '',
          memo: customer.memo ?? '',
          tags: customer.tags ?? [],
        }
      : {},
  });

  const onSubmit = async (data: CustomerInput) => {
    const url = isEdit ? `/api/customers/${customer.id}` : '/api/customers';
    const method = isEdit ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      toast.error('保存に失敗しました');
      return;
    }

    const json = await res.json();
    toast.success(isEdit ? '顧客情報を更新しました' : '顧客を登録しました');
    router.push(`/customers/${json.data.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="last_name">姓 *</Label>
            <Input id="last_name" {...register('last_name')} />
            {errors.last_name && (
              <p className="text-xs text-red-500">{errors.last_name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="first_name">名 *</Label>
            <Input id="first_name" {...register('first_name')} />
            {errors.first_name && (
              <p className="text-xs text-red-500">{errors.first_name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name_kana">姓（ふりがな）</Label>
            <Input id="last_name_kana" {...register('last_name_kana')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="first_name_kana">名（ふりがな）</Label>
            <Input id="first_name_kana" {...register('first_name_kana')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="birth_date">生年月日</Label>
            <Input id="birth_date" type="date" {...register('birth_date')} />
          </div>
          <div className="space-y-1.5">
            <Label>性別</Label>
            <Select
              defaultValue={customer?.gender}
              onValueChange={(v) => setValue('gender', v as 'male' | 'female' | 'other')}
            >
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">男性</SelectItem>
                <SelectItem value="female">女性</SelectItem>
                <SelectItem value="other">その他</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 連絡先 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">連絡先</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone">電話番号</Label>
            <Input id="phone" type="tel" placeholder="090-0000-0000" {...register('phone')} />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="postal_code">郵便番号（ハイフンなし7桁）</Label>
            <Input id="postal_code" placeholder="1234567" maxLength={7} {...register('postal_code')} />
            {errors.postal_code && (
              <p className="text-xs text-red-500">{errors.postal_code.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prefecture">都道府県</Label>
            <Input id="prefecture" {...register('prefecture')} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="address">住所</Label>
            <Input id="address" {...register('address')} />
          </div>
        </CardContent>
      </Card>

      {/* 職業・年収 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">その他</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="occupation">職業</Label>
            <Input id="occupation" {...register('occupation')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="annual_income">年収（万円）</Label>
            <Input
              id="annual_income"
              type="number"
              {...register('annual_income', { valueAsNumber: true })}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="memo">メモ</Label>
            <textarea
              id="memo"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('memo')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          キャンセル
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '保存中...' : isEdit ? '更新する' : '登録する'}
        </Button>
      </div>
    </form>
  );
}
