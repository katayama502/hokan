import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseServerClient();
  const orgId = session.user.organization_id;

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [thisMonth, lastMonth, expiring, deals] = await Promise.all([
    supabase
      .from('contracts')
      .select('id, commission_amount', { count: 'exact' })
      .eq('organization_id', orgId)
      .gte('created_at', thisMonthStart),
    supabase
      .from('contracts')
      .select('id, commission_amount', { count: 'exact' })
      .eq('organization_id', orgId)
      .gte('created_at', lastMonthStart)
      .lt('created_at', thisMonthStart),
    supabase
      .from('contracts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .lte('end_date', thirtyDaysLater)
      .gte('end_date', now.toISOString().split('T')[0]),
    supabase
      .from('deals')
      .select('stage', { count: 'exact' })
      .eq('organization_id', orgId)
      .in('stage', ['closed_won', 'closed_lost']),
  ]);

  const thisMonthCommission =
    thisMonth.data?.reduce((s, c) => s + (c.commission_amount ?? 0), 0) ?? 0;
  const lastMonthCommission =
    lastMonth.data?.reduce((s, c) => s + (c.commission_amount ?? 0), 0) ?? 0;

  const closedWon = deals.data?.filter((d) => d.stage === 'closed_won').length ?? 0;
  const total = deals.count ?? 0;
  const conversionRate = total > 0 ? Math.round((closedWon / total) * 100) : 0;

  return NextResponse.json({
    new_contracts_count: thisMonth.count ?? 0,
    new_contracts_change: (thisMonth.count ?? 0) - (lastMonth.count ?? 0),
    conversion_rate: conversionRate,
    expiring_soon_count: expiring.count ?? 0,
    total_commission: thisMonthCommission,
    total_commission_change: thisMonthCommission - lastMonthCommission,
  });
}
