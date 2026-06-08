import { auth } from '@/lib/auth/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils/date';
import {
  FileText,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Users,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardCharts } from '@/components/analytics/DashboardCharts';

async function getDashboardData(organizationId: string) {
  const supabase = createSupabaseServerClient();

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [contractsResult, dealsResult, expiringResult, activitiesResult, customerCountResult] =
    await Promise.all([
      // 今月の新規契約
      supabase
        .from('contracts')
        .select('id, commission_amount', { count: 'exact' })
        .eq('organization_id', organizationId)
        .gte('created_at', thisMonthStart),
      // 案件（ステージ別）
      supabase
        .from('deals')
        .select('stage', { count: 'exact' })
        .eq('organization_id', organizationId)
        .not('stage', 'in', '("closed_won","closed_lost")'),
      // 満期が近い契約（30日以内）
      supabase
        .from('contracts')
        .select('id, customer_id, policy_number, insurance_company, end_date, customers(last_name, first_name)')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .lte('end_date', thirtyDaysLater)
        .gte('end_date', now.toISOString().split('T')[0])
        .order('end_date', { ascending: true })
        .limit(5),
      // 最近の活動
      supabase
        .from('activities')
        .select('id, type, title, activity_date, customers(last_name, first_name)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5),
      // 顧客総数
      supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId),
    ]);

  const totalCommission =
    contractsResult.data?.reduce((sum, c) => sum + (c.commission_amount ?? 0), 0) ?? 0;

  const dealStages = dealsResult.data ?? [];
  const funnelData = [
    { stage: 'lead', label: '見込み', count: dealStages.filter((d) => d.stage === 'lead').length },
    { stage: 'contact', label: '接触済み', count: dealStages.filter((d) => d.stage === 'contact').length },
    { stage: 'proposal', label: '提案中', count: dealStages.filter((d) => d.stage === 'proposal').length },
    { stage: 'negotiation', label: '交渉中', count: dealStages.filter((d) => d.stage === 'negotiation').length },
  ];

  return {
    newContractsCount: contractsResult.count ?? 0,
    totalCommission,
    activeDealsCount: dealsResult.count ?? 0,
    customerCount: customerCountResult.count ?? 0,
    expiringContracts: expiringResult.data ?? [],
    recentActivities: activitiesResult.data ?? [],
    funnelData,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const data = await getDashboardData(session.user.organization_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-sm text-gray-500">InsureHub 保険代理店管理システム</p>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">今月の新規契約</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.newContractsCount}件</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">顧客総数</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.customerCount}名</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">進行中案件</CardTitle>
            <Briefcase className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeDealsCount}件</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">今月の手数料</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalCommission)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* 案件ファネル */}
        <div className="col-span-2">
          <DashboardCharts funnelData={data.funnelData} />
        </div>

        {/* 満期アラート */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              満期アラート
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.expiringContracts.length === 0 ? (
              <p className="text-sm text-gray-400">満期が近い契約はありません</p>
            ) : (
              data.expiringContracts.map((contract: any) => {
                const days = daysUntil(contract.end_date);
                const customer = contract.customers;
                return (
                  <div key={contract.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {customer?.last_name} {customer?.first_name} 様
                      </p>
                      <p className="text-xs text-gray-400">
                        {contract.insurance_company} / {formatDate(contract.end_date)}
                      </p>
                    </div>
                    <Badge
                      variant={days !== null && days <= 7 ? 'destructive' : 'warning'}
                      className="text-xs"
                    >
                      {days}日後
                    </Badge>
                  </div>
                );
              })
            )}
            <Link
              href="/contracts?filter=expiring"
              className="block text-center text-xs text-blue-600 hover:underline mt-2"
            >
              すべて見る
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 最近の活動 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近の活動</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentActivities.length === 0 ? (
            <p className="text-sm text-gray-400">活動記録がありません</p>
          ) : (
            <div className="space-y-2">
              {data.recentActivities.map((activity: any) => (
                <div key={activity.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    {activity.customers && (
                      <p className="text-xs text-gray-500">
                        {activity.customers.last_name} {activity.customers.first_name} 様
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(activity.activity_date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
