import { auth } from '@/lib/auth/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { formatDate, formatCurrency, daysUntil } from '@/lib/utils/date';
import { CONTRACT_STATUS_LABELS, INSURANCE_TYPE_LABELS } from '@/lib/utils/labels';
import { Plus, Edit, AlertTriangle } from 'lucide-react';
import { DeleteCustomerButton } from '@/components/customers/DeleteCustomerButton';

async function getCustomerDetail(id: string, organizationId: string) {
  const supabase = createSupabaseServerClient();

  const { data: customer, error } = await supabase
    .from('customers')
    .select(`
      *,
      staff:assigned_staff_id(id, name)
    `)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single();

  if (error || !customer) return null;

  const [contractsResult, dealsResult, activitiesResult] = await Promise.all([
    supabase
      .from('contracts')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('deals')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('activities')
      .select('*, staff:staff_id(name)')
      .eq('customer_id', id)
      .order('activity_date', { ascending: false })
      .limit(20),
  ]);

  return {
    customer,
    contracts: contractsResult.data ?? [],
    deals: dealsResult.data ?? [],
    activities: activitiesResult.data ?? [],
  };
}

const DEAL_STAGE_LABELS: Record<string, string> = {
  lead: '見込み',
  contact: '接触済み',
  proposal: '提案中',
  negotiation: '交渉中',
  closed_won: '成約',
  closed_lost: '失注',
};

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) return null;

  const result = await getCustomerDetail(params.id, session.user.organization_id);
  if (!result) notFound();

  const { customer, contracts, deals, activities } = result;

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: '顧客管理', href: '/customers' },
          { label: `${customer.last_name} ${customer.first_name}` },
        ]}
      />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {customer.last_name} {customer.first_name}
          </h1>
          {(customer.last_name_kana || customer.first_name_kana) && (
            <p className="text-sm text-gray-500">
              {customer.last_name_kana} {customer.first_name_kana}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/customers/${customer.id}/edit`}>
              <Edit className="h-4 w-4" />
              編集
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/deals/new?customer_id=${customer.id}`}>
              <Plus className="h-4 w-4" />
              案件作成
            </Link>
          </Button>
          <DeleteCustomerButton customerId={customer.id} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">生年月日</span>
              <span>{formatDate(customer.birth_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">性別</span>
              <span>
                {customer.gender === 'male'
                  ? '男性'
                  : customer.gender === 'female'
                  ? '女性'
                  : customer.gender === 'other'
                  ? 'その他'
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">電話番号</span>
              <span>{customer.phone ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">メール</span>
              <span className="truncate max-w-[160px]">{customer.email ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">住所</span>
              <span className="text-right max-w-[160px]">
                {customer.prefecture || customer.address
                  ? `${customer.prefecture ?? ''}${customer.address ?? ''}`
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">職業</span>
              <span>{customer.occupation ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">担当者</span>
              <span>{(customer.staff as any)?.name ?? '-'}</span>
            </div>
            {customer.tags && customer.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap pt-1">
                {customer.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* タブコンテンツ */}
        <div className="col-span-2">
          <Tabs defaultValue="contracts">
            <TabsList>
              <TabsTrigger value="contracts">
                契約一覧 ({contracts.length})
              </TabsTrigger>
              <TabsTrigger value="deals">
                案件 ({deals.length})
              </TabsTrigger>
              <TabsTrigger value="activities">活動履歴</TabsTrigger>
            </TabsList>

            {/* 契約一覧 */}
            <TabsContent value="contracts" className="space-y-3 mt-4">
              <div className="flex justify-end">
                <Button size="sm" asChild>
                  <Link href={`/contracts/new?customer_id=${customer.id}`}>
                    <Plus className="h-3.5 w-3.5" />
                    契約追加
                  </Link>
                </Button>
              </div>
              {contracts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">契約がありません</p>
              ) : (
                contracts.map((contract: any) => {
                  const days = daysUntil(contract.end_date);
                  const isExpiring = days !== null && days >= 0 && days <= 30;
                  return (
                    <div key={contract.id} className="rounded-lg border p-4 bg-white">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {INSURANCE_TYPE_LABELS[contract.insurance_type as keyof typeof INSURANCE_TYPE_LABELS] ?? contract.insurance_type}
                            </span>
                            <span className="text-gray-400">/</span>
                            <span>{contract.insurance_company}</span>
                            <Badge
                              variant={contract.status === 'active' ? 'success' : 'secondary'}
                              className="text-xs"
                            >
                              {CONTRACT_STATUS_LABELS[contract.status as keyof typeof CONTRACT_STATUS_LABELS]}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            証券番号: {contract.policy_number} / {contract.product_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {contract.start_date && `開始: ${formatDate(contract.start_date)}`}
                            {contract.end_date && ` / 満期: ${formatDate(contract.end_date)}`}
                            {contract.premium_monthly &&
                              ` / 月払: ${formatCurrency(contract.premium_monthly)}`}
                          </p>
                        </div>
                        {isExpiring && (
                          <Badge variant="warning" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {days}日後満期
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            {/* 案件 */}
            <TabsContent value="deals" className="space-y-3 mt-4">
              {deals.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">案件がありません</p>
              ) : (
                deals.map((deal: any) => (
                  <div key={deal.id} className="rounded-lg border p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{deal.title}</p>
                        <p className="text-sm text-gray-500">
                          {DEAL_STAGE_LABELS[deal.stage]}
                          {deal.expected_amount &&
                            ` / 見込み: ${formatCurrency(deal.expected_amount)}`}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/deals/${deal.id}`}>詳細</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* 活動履歴 */}
            <TabsContent value="activities" className="mt-4">
              {activities.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">活動記録がありません</p>
              ) : (
                <div className="space-y-2">
                  {activities.map((activity: any) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 rounded-lg border p-3 bg-white"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.title}</p>
                        {activity.content && (
                          <p className="text-sm text-gray-500 mt-0.5">{activity.content}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(activity.activity_date)}
                          {activity.staff?.name && ` / ${activity.staff.name}`}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* メモ */}
      {customer.memo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">メモ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{customer.memo}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
