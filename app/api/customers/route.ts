import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { customerSchema } from '@/lib/validations/customer';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAuditLog } from '@/lib/utils/audit';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  const { searchParams } = req.nextUrl;

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const perPage = Math.min(100, Number(searchParams.get('perPage')) || 20);
  const search = searchParams.get('search')?.slice(0, 100) ?? '';

  const from = (page - 1) * perPage;

  let query = supabase
    .from('customers')
    .select('*, staff:assigned_staff_id(name)', { count: 'exact' })
    .eq('organization_id', session.user.organization_id)
    .range(from, from + perPage - 1)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(
      `last_name.ilike.%${search}%,first_name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ data, count, page, perPage });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = customerSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('customers')
    .insert({
      ...result.data,
      organization_id: session.user.organization_id,
      assigned_staff_id: result.data.assigned_staff_id ?? session.user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  await createAuditLog({
    staff_id: session.user.id,
    org_id: session.user.organization_id,
    action: 'customer.create',
    target_type: 'customer',
    target_id: data.id,
    ip_address: req.headers.get('x-forwarded-for') ?? undefined,
    user_agent: req.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ data }, { status: 201 });
}
