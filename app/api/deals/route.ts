import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { dealSchema } from '@/lib/validations/deal';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAuditLog } from '@/lib/utils/audit';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseServerClient();
  const { searchParams } = req.nextUrl;

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const perPage = Math.min(100, Number(searchParams.get('perPage')) || 50);
  const stage = searchParams.get('stage');
  const customerId = searchParams.get('customer_id');
  const from = (page - 1) * perPage;

  let query = supabase
    .from('deals')
    .select(
      'id, title, insurance_type, stage, expected_amount, expected_close_date, customer_id, assigned_staff_id, customers(last_name, first_name), staff:assigned_staff_id(name)',
      { count: 'exact' }
    )
    .eq('organization_id', session.user.organization_id)
    .range(from, from + perPage - 1)
    .order('created_at', { ascending: false });

  if (stage) query = query.eq('stage', stage);
  if (customerId) query = query.eq('customer_id', customerId);

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

  const result = dealSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('deals')
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
    action: 'deal.create',
    target_type: 'deal',
    target_id: data.id,
    ip_address: req.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json({ data }, { status: 201 });
}
