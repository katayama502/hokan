import { auth } from '@/lib/auth/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

const INTENT_STATUS_LABELS = {
  draft: '下書き',
  submitted: '提出済み',
  signed: '署名済み',
  completed: '完了',
};

const INTENT_STATUS_VARIANTS: Record<string, 'secondary' | 'info' | 'success' | 'default'> = {
  draft: 'secondary',
  submitted: 'info',
  signed: 'success',
  completed: 'default',
};

async function getIntentRecords(organizationId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('intent_records')
    .select('id, status, recommended_product, created_at, customers(last_name, first_name), staff:staff_id(name)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return [];
  return data ?? [];
}

export default async function IntentPage() {
  const session = await auth();
  if (!session) return null;

  const records = await getIntentRecords(session.user.organization_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">意向把握</h1>
          <p className="text-sm text-gray-500">全 {records.length} 件</p>
        </div>
        <Button asChild>
          <Link href="/intent/new">
            <Plus className="h-4 w-4" />
            新規作成
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">顧客名</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">担当者</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">ステータス</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">推奨商品</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">作成日</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  意向把握記録がありません
                </td>
              </tr>
            ) : (
              records.map((record: any) => (
                <tr key={record.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {record.customers
                      ? `${record.customers.last_name} ${record.customers.first_name}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{record.staff?.name ?? '-'}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={INTENT_STATUS_VARIANTS[record.status] ?? 'secondary'}
                      className="text-xs"
                    >
                      {INTENT_STATUS_LABELS[record.status as keyof typeof INTENT_STATUS_LABELS]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{record.recommended_product ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(record.created_at)}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/intent/${record.id}`}>詳細</Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
