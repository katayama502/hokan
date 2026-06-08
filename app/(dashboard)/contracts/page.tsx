import { auth } from '@/lib/auth/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { formatDate, formatCurrency, daysUntil } from '@/lib/utils/date';
import { INSURANCE_TYPE_LABELS, CONTRACT_STATUS_LABELS } from '@/lib/utils/labels';

interface SearchParams {
  filter?: string;
  page?: string;
}

async function getContracts(organizationId: string, filter: string, page: number) {
  const supabase = createSupabaseServerClient();
  const perPage = 20;
  const from = (page - 1) * perPage;

  let query = supabase
    .from('contracts')
    .select(
      'id, policy_number, insurance_company, product_name, insurance_type, status, end_date, premium_monthly, premium_annual, customer_id, customers(last_name, first_name)',
      { count: 'exact' }
    )
    .eq('organization_id', organizationId)
    .range(from, from + perPage - 1)
    .order('end_date', { ascending: true });

  if (filter === 'expiring') {
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    query = query.lte('end_date', thirtyDaysLater).gte('end_date', today).eq('status', 'active');
  }

  const { data, error, count } = await query;
  if (error) return { contracts: [], total: 0 };
  return { contracts: data ?? [], total: count ?? 0 };
}

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session) return null;

  const filter = searchParams.filter ?? '';
  const page = Math.max(1, Number(searchParams.page) || 1);
  const { contracts, total } = await getContracts(session.user.organization_id, filter, page);
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">契約管理</h1>
          <p className="text-sm text-gray-500">全 {total} 件</p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === 'expiring' ? 'default' : 'outline'} asChild>
            <Link href="/contracts?filter=expiring">満期アラート</Link>
          </Button>
          <Button variant={!filter ? 'default' : 'outline'} asChild>
            <Link href="/contracts">すべて</Link>
          </Button>
          <Button asChild>
            <Link href="/contracts/new">
              <Plus className="h-4 w-4" />
              契約追加
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">顧客名</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">保険種別</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">保険会社/商品</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">証券番号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">ステータス</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">満期日</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">保険料</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  契約が見つかりません
                </td>
              </tr>
            ) : (
              contracts.map((contract: any) => {
                const days = daysUntil(contract.end_date);
                const isExpiring = days !== null && days >= 0 && days <= 30;
                const customer = contract.customers;
                return (
                  <tr
                    key={contract.id}
                    className={`border-b hover:bg-gray-50 transition-colors ${isExpiring ? 'bg-yellow-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      {customer ? (
                        <Link
                          href={`/customers/${contract.customer_id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {customer.last_name} {customer.first_name}
                        </Link>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {INSURANCE_TYPE_LABELS[contract.insurance_type as keyof typeof INSURANCE_TYPE_LABELS] ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {contract.insurance_company} / {contract.product_name}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{contract.policy_number}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={contract.status === 'active' ? 'success' : 'secondary'}
                        className="text-xs"
                      >
                        {CONTRACT_STATUS_LABELS[contract.status as keyof typeof CONTRACT_STATUS_LABELS]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{formatDate(contract.end_date)}</span>
                        {isExpiring && (
                          <Badge variant="warning" className="text-xs">
                            {days}日後
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {contract.premium_monthly
                        ? `月払 ${formatCurrency(contract.premium_monthly)}`
                        : contract.premium_annual
                        ? `年払 ${formatCurrency(contract.premium_annual)}`
                        : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-gray-500">
              {(page - 1) * 20 + 1}〜{Math.min(page * 20, total)} / {total}件
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/contracts?page=${page - 1}${filter ? `&filter=${filter}` : ''}`}>前へ</Link>
                </Button>
              )}
              {page < totalPages && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/contracts?page=${page + 1}${filter ? `&filter=${filter}` : ''}`}>次へ</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
