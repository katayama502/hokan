import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { contractSchema } from '@/lib/validations/contract';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAuditLog } from '@/lib/utils/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('contracts')
    .select('*, customers(id, last_name, first_name)')
    .eq('id', params.id)
    .eq('organization_id', session.user.organization_id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
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

  const result = contractSchema.partial().safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('contracts')
    .update({ ...result.data, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('organization_id', session.user.organization_id)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

  await createAuditLog({
    staff_id: session.user.id,
    org_id: session.user.organization_id,
    action: 'contract.update',
    target_type: 'contract',
    target_id: params.id,
  });

  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', params.id)
    .eq('organization_id', session.user.organization_id);

  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 });

  await createAuditLog({
    staff_id: session.user.id,
    org_id: session.user.organization_id,
    action: 'contract.delete',
    target_type: 'contract',
    target_id: params.id,
  });

  return NextResponse.json({ success: true });
}
