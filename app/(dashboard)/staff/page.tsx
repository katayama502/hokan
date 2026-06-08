import { auth } from '@/lib/auth/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, daysUntil } from '@/lib/utils/date';
import { ROLE_LABELS } from '@/lib/utils/rbac';
import { AlertTriangle, Plus } from 'lucide-react';
import { canManageStaff } from '@/lib/utils/rbac';
import Link from 'next/link';

async function getStaff(organizationId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('staff')
    .select('id, name, email, role, license_number, license_expiry, is_active, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data ?? [];
}

export default async function StaffPage() {
  const session = await auth();
  if (!session) return null;

  const staffList = await getStaff(session.user.organization_id);
  const canManage = canManageStaff(session.user.role);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">スタッフ管理</h1>
          <p className="text-sm text-gray-500">全 {staffList.length} 名</p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href="/staff/new">
              <Plus className="h-4 w-4" />
              スタッフ追加
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {staffList.map((staff: any) => {
          const licenseDays = daysUntil(staff.license_expiry);
          const isLicenseExpiring = licenseDays !== null && licenseDays >= 0 && licenseDays <= 90;

          return (
            <Card key={staff.id} className={!staff.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{staff.name}</CardTitle>
                  <div className="flex gap-1">
                    <Badge
                      variant={
                        staff.role === 'admin'
                          ? 'default'
                          : staff.role === 'manager'
                          ? 'info'
                          : 'secondary'
                      }
                      className="text-xs"
                    >
                      {ROLE_LABELS[staff.role as keyof typeof ROLE_LABELS]}
                    </Badge>
                    {!staff.is_active && (
                      <Badge variant="outline" className="text-xs">無効</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-gray-500">{staff.email}</p>
                {staff.license_number && (
                  <div>
                    <p className="text-gray-500">資格番号: {staff.license_number}</p>
                    {staff.license_expiry && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-gray-500">
                          更新期限: {formatDate(staff.license_expiry)}
                        </span>
                        {isLicenseExpiring && (
                          <Badge variant="warning" className="flex items-center gap-1 text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            {licenseDays}日後
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <p className="text-gray-400 text-xs">登録: {formatDate(staff.created_at)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
