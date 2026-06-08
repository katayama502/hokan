import { createSupabaseAdminClient } from '@/lib/supabase/server';

interface AuditLogParams {
  staff_id: string;
  org_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  ip_address?: string;
  user_agent?: string;
  diff?: Record<string, unknown>;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  const supabase = createSupabaseAdminClient();

  await supabase.from('audit_logs').insert({
    org_id: params.org_id,
    staff_id: params.staff_id,
    action: params.action,
    target_type: params.target_type,
    target_id: params.target_id,
    ip_address: params.ip_address,
    user_agent: params.user_agent,
    diff: params.diff,
  });
}
