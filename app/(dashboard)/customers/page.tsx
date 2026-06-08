import { auth } from '@/lib/auth/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import { CustomerSearch } from '@/components/customers/CustomerSearch';

interface SearchParams {
  search?: string;
  page?: string;
}

async function getCustomers(
  organizationId: string,
  search: string,
  page: number
) {
  const supabase = createSupabaseServerClient();
  const perPage = 20;
  const from = (page - 1) * perPage;

  let query = supabase
    .from('customers')
    .select(
      'id, last_name, first_name, phone, email, tags, created_at, assigned_staff_id, staff:assigned_staff_id(name)',
      { count: 'exact' }
    )
    .eq('organization_id', organizationId)
    .range(from, from + perPage - 1)
    .order('created_at', { ascending: false });

  if (search) {
    const s = search.slice(0, 100);
    query = query.or(
      `last_name.ilike.%${s}%,first_name.ilike.%${s}%,last_name_kana.ilike.%${s}%,first_name_kana.ilike.%${s}%,email.ilike.%${s}%`
    );
  }

  const { data, error, count } = await query;
  if (error) return { customers: [], total: 0 };

  return { customers: data ?? [], total: count ?? 0 };
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session) return null;

  const search = (searchParams.search ?? '').slice(0, 100);
  const page = Math.max(1, Number(searchParams.page) || 1);

  const { customers, total } = await getCustomers(
    session.user.organization_id,
    search,
    page
  );

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">顧客管理</h1>
          <p className="text-sm text-gray-500">全 {total} 名</p>
        </div>
        <Button asChild>
          <Link href="/customers/new">
            <Plus className="h-4 w-4" />
            新規顧客登録
          </Link>
        </Button>
      </div>

      {/* 検索 */}
      <CustomerSearch defaultSearch={search} />

      {/* テーブル */}
      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">氏名</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">担当者</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">電話番号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">メール</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">タグ</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">登録日</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  顧客が見つかりません
                </td>
              </tr>
            ) : (
              customers.map((customer: any) => (
                <tr key={customer.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {customer.last_name} {customer.first_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {customer.staff?.name ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{customer.phone ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{customer.email ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(customer.tags ?? []).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(customer.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/customers/${customer.id}`}>詳細</Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-gray-500">
              {(page - 1) * 20 + 1}〜{Math.min(page * 20, total)} / {total}件
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/customers?page=${page - 1}${search ? `&search=${search}` : ''}`}>
                    前へ
                  </Link>
                </Button>
              )}
              {page < totalPages && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/customers?page=${page + 1}${search ? `&search=${search}` : ''}`}>
                    次へ
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
