import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { customerSchema } from '@/lib/validations/customer';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAuditLog } from '@/lib/utils/audit';
import { canDeleteCustomers } from '@/lib/utils/rbac';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('customers')
    .select('*, staff:assigned_staff_id(id, name)')
    .eq('id', params.id)
    .eq('organization_id', session.user.organization_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = customerSchema.partial().safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('customers')
    .update({ ...result.data, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('organization_id', session.user.organization_id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  await createAuditLog({
    staff_id: session.user.id,
    org_id: session.user.organization_id,
    action: 'customer.update',
    target_type: 'customer',
    target_id: params.id,
    ip_address: req.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!canDeleteCustomers(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', params.id)
    .eq('organization_id', session.user.organization_id);

  if (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }

  await createAuditLog({
    staff_id: session.user.id,
    org_id: session.user.organization_id,
    action: 'customer.delete',
    target_type: 'customer',
    target_id: params.id,
    ip_address: req.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json({ success: true });
}
