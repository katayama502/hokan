import { StaffRole } from '@/types';

type Permission =
  | 'view_all_staff'
  | 'manage_staff'
  | 'view_all_customers'
  | 'delete_customers'
  | 'view_analytics'
  | 'export_data'
  | 'view_audit_logs';

const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  admin: [
    'view_all_staff',
    'manage_staff',
    'view_all_customers',
    'delete_customers',
    'view_analytics',
    'export_data',
    'view_audit_logs',
  ],
  manager: [
    'view_all_staff',
    'view_all_customers',
    'delete_customers',
    'view_analytics',
    'export_data',
  ],
  agent: [],
};

export function hasPermission(role: StaffRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canViewAllCustomers(role: StaffRole): boolean {
  return hasPermission(role, 'view_all_customers');
}

export function canDeleteCustomers(role: StaffRole): boolean {
  return hasPermission(role, 'delete_customers');
}

export function canManageStaff(role: StaffRole): boolean {
  return hasPermission(role, 'manage_staff');
}

export function canExportData(role: StaffRole): boolean {
  return hasPermission(role, 'export_data');
}

export function canViewAuditLogs(role: StaffRole): boolean {
  return hasPermission(role, 'view_audit_logs');
}

// ロール表示名
export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: '管理者',
  manager: 'マネージャー',
  agent: '募集人',
};
