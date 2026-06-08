import { auth } from '@/lib/auth/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/date';
import { AnalyticsCharts } from '@/components/analytics/AnalyticsCharts';

async function getAnalyticsData(organizationId: string) {
  const supabase = createSupabaseServerClient();

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [contractsResult, dealsResult, staffResult, renewalData] = await Promise.all([
    supabase
      .from('contracts')
      .select('insurance_type, commission_amount, status')
      .eq('organization_id', organizationId),
    supabase
      .from('deals')
      .select('stage, expected_amount')
      .eq('organization_id', organizationId),
    supabase
      .from('staff')
      .select('id, name')
      .eq('organization_id', organizationId)
      .eq('is_active', true),
    supabase
      .from('contracts')
      .select('end_date')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .gte('end_date', sixMonthsAgo.toISOString().split('T')[0])
      .order('end_date', { ascending: true }),
  ]);

  // 保険種別分布
  const typeMap: Record<string, number> = {};
  for (const c of contractsResult.data ?? []) {
    typeMap[c.insurance_type] = (typeMap[c.insurance_type] ?? 0) + 1;
  }

  // 手数料合計
  const totalCommission = (contractsResult.data ?? []).reduce(
    (sum, c) => sum + (c.commission_amount ?? 0),
    0
  );

  // 案件ステージ集計
  const stageMap: Record<string, number> = {};
  let closedWon = 0;
  let closedLost = 0;
  for (const d of dealsResult.data ?? []) {
    if (d.stage === 'closed_won') closedWon++;
    else if (d.stage === 'closed_lost') closedLost++;
    else stageMap[d.stage] = (stageMap[d.stage] ?? 0) + 1;
  }
  const conversionRate =
    closedWon + closedLost > 0
      ? Math.round((closedWon / (closedWon + closedLost)) * 100)
      : 0;

  // 月別満期件数
  const monthlyRenewals: Record<string, number> = {};
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyRenewals[key] = 0;
  }
  for (const c of renewalData.data ?? []) {
    const d = new Date(c.end_date);
    const key = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (key in monthlyRenewals) {
      monthlyRenewals[key]++;
    }
  }

  return {
    totalCommission,
    conversionRate,
    closedWon,
    totalContracts: contractsResult.count ?? contractsResult.data?.length ?? 0,
    typeDistribution: Object.entries(typeMap).map(([type, count]) => ({ type, count })),
    monthlyRenewals: Object.entries(monthlyRenewals).map(([month, count]) => ({
      month,
      count,
    })),
    funnelData: [
      { stage: 'lead', label: '見込み', count: stageMap['lead'] ?? 0 },
      { stage: 'contact', label: '接触済み', count: stageMap['contact'] ?? 0 },
      { stage: 'proposal', label: '提案中', count: stageMap['proposal'] ?? 0 },
      { stage: 'negotiation', label: '交渉中', count: stageMap['negotiation'] ?? 0 },
      { stage: 'closed_won', label: '成約', count: closedWon },
    ],
  };
}

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session) return null;

  const data = await getAnalyticsData(session.user.organization_id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">分析・レポート</h1>

      {/* KPIカード */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">総手数料</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalCommission)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">成約率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.conversionRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">成約件数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.closedWon}件</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">総契約数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalContracts}件</div>
          </CardContent>
        </Card>
      </div>

      <AnalyticsCharts
        funnelData={data.funnelData}
        monthlyRenewals={data.monthlyRenewals}
        typeDistribution={data.typeDistribution}
      />
    </div>
  );
}
