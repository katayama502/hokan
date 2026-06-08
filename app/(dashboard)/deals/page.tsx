import { auth } from '@/lib/auth/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { KanbanBoard } from '@/components/deals/KanbanBoard';
import { Deal } from '@/types';

async function getDeals(organizationId: string) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('deals')
    .select(
      'id, title, insurance_type, stage, expected_amount, expected_close_date, customer_id, customers(last_name, first_name), staff:assigned_staff_id(name)'
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data ?? []) as unknown as Deal[];
}

export default async function DealsPage() {
  const session = await auth();
  if (!session) return null;

  const deals = await getDeals(session.user.organization_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">案件管理</h1>
          <p className="text-sm text-gray-500">全 {deals.length} 件</p>
        </div>
        <Button asChild>
          <Link href="/deals/new">
            <Plus className="h-4 w-4" />
            新規案件
          </Link>
        </Button>
      </div>

      <KanbanBoard deals={deals} />
    </div>
  );
}
