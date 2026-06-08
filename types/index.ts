// ============================================================
// 共通型定義
// ============================================================

export type StaffRole = 'admin' | 'manager' | 'agent';

export type InsuranceType =
  | 'life'
  | 'nonlife'
  | 'medical'
  | 'cancer'
  | 'accident'
  | 'fire'
  | 'auto'
  | 'other';

export type ContractStatus = 'active' | 'expired' | 'cancelled' | 'pending';

export type DealStage =
  | 'lead'
  | 'contact'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export type ActivityType =
  | 'call'
  | 'visit'
  | 'email'
  | 'meeting'
  | 'note'
  | 'task';

export type IntentStatus = 'draft' | 'submitted' | 'signed' | 'completed';

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export type ParticipantStatus =
  | 'registered'
  | 'attended'
  | 'absent'
  | 'cancelled';

// ============================================================
// エンティティ型
// ============================================================

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  role: StaffRole;
  license_number?: string;
  license_expiry?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  organization_id: string;
  assigned_staff_id?: string;
  last_name: string;
  first_name: string;
  last_name_kana?: string;
  first_name_kana?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  email?: string;
  postal_code?: string;
  prefecture?: string;
  address?: string;
  occupation?: string;
  annual_income?: number;
  family_members?: FamilyMember[];
  memo?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  // リレーション
  staff?: Pick<Staff, 'id' | 'name'>;
  contracts?: Contract[];
}

export interface FamilyMember {
  name: string;
  relationship: string;
  birth_date?: string;
}

export interface Contract {
  id: string;
  organization_id: string;
  customer_id: string;
  assigned_staff_id?: string;
  policy_number: string;
  insurance_company: string;
  product_name: string;
  insurance_type: InsuranceType;
  status: ContractStatus;
  start_date: string;
  end_date?: string;
  premium_monthly?: number;
  premium_annual?: number;
  coverage_amount?: number;
  commission_rate?: number;
  commission_amount?: number;
  memo?: string;
  created_at: string;
  updated_at: string;
  // リレーション
  customer?: Pick<Customer, 'id' | 'last_name' | 'first_name'>;
  staff?: Pick<Staff, 'id' | 'name'>;
}

export interface Deal {
  id: string;
  organization_id: string;
  customer_id: string;
  assigned_staff_id?: string;
  title: string;
  insurance_type?: InsuranceType;
  stage: DealStage;
  expected_amount?: number;
  expected_close_date?: string;
  lost_reason?: string;
  memo?: string;
  created_at: string;
  updated_at: string;
  // リレーション
  customer?: Pick<Customer, 'id' | 'last_name' | 'first_name'>;
  staff?: Pick<Staff, 'id' | 'name'>;
}

export interface Activity {
  id: string;
  organization_id: string;
  staff_id?: string;
  customer_id?: string;
  deal_id?: string;
  type: ActivityType;
  title: string;
  content?: string;
  activity_date: string;
  due_date?: string;
  is_completed: boolean;
  created_at: string;
  // リレーション
  staff?: Pick<Staff, 'id' | 'name'>;
}

export interface IntentRecord {
  id: string;
  organization_id: string;
  customer_id: string;
  deal_id?: string;
  staff_id?: string;
  status: IntentStatus;
  hearing_data: Record<string, unknown>;
  comparison_data?: Record<string, unknown>;
  recommended_product?: string;
  customer_signature?: string;
  signed_at?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
  // リレーション
  customer?: Pick<Customer, 'id' | 'last_name' | 'first_name'>;
}

export interface Event {
  id: string;
  organization_id: string;
  created_by?: string;
  title: string;
  description?: string;
  location?: string;
  is_online: boolean;
  online_url?: string;
  start_at: string;
  end_at: string;
  capacity?: number;
  status: EventStatus;
  public_token: string;
  created_at: string;
  updated_at: string;
  // リレーション
  participant_count?: number;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  customer_id?: string;
  name: string;
  email?: string;
  phone?: string;
  status: ParticipantStatus;
  registered_at: string;
}

// ============================================================
// API レスポンス型
// ============================================================

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  perPage: number;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

// ============================================================
// ダッシュボード型
// ============================================================

export interface KPISummary {
  new_contracts_count: number;
  new_contracts_change: number;
  conversion_rate: number;
  conversion_rate_change: number;
  expiring_soon_count: number;
  total_commission: number;
  total_commission_change: number;
}

export interface FunnelData {
  stage: DealStage;
  count: number;
}

export interface RenewalData {
  month: string;
  count: number;
}

// ============================================================
// Session拡張
// ============================================================

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      organization_id: string;
      role: StaffRole;
    };
  }

  interface User {
    id: string;
    organization_id: string;
    role: StaffRole;
  }
}

