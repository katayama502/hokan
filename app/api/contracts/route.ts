import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { contractSchema } from '@/lib/validations/contract';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAuditLog } from '@/lib/utils/audit';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseServerClient();
  const { searchParams } = req.nextUrl;

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const perPage = Math.min(100, Number(searchParams.get('perPage')) || 20);
  const customerId = searchParams.get('customer_id');
  const filter = searchParams.get('filter');
  const from = (page - 1) * perPage;

  let query = supabase
    .from('contracts')
    .select(
      'id, policy_number, insurance_company, product_name, insurance_type, status, start_date, end_date, premium_monthly, premium_annual, commission_amount, customer_id, customers(last_name, first_name)',
      { count: 'exact' }
    )
    .eq('organization_id', session.user.organization_id)
    .range(from, from + perPage - 1)
    .order('end_date', { ascending: true });

  if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  if (filter === 'expiring') {
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    query = query.lte('end_date', thirtyDaysLater).gte('end_date', today).eq('status', 'active');
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 });

  return NextResponse.json({ data, count, page, perPage });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = contractSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('contracts')
    .insert({
      ...result.data,
      organization_id: session.user.organization_id,
      assigned_staff_id: result.data.assigned_staff_id ?? session.user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 });

  await createAuditLog({
    staff_id: session.user.id,
    org_id: session.user.organization_id,
    action: 'contract.create',
    target_type: 'contract',
    target_id: data.id,
    ip_address: req.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json({ data }, { status: 201 });
}
