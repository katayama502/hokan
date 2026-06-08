import { InsuranceType, ContractStatus, DealStage, ActivityType } from '@/types';

export const INSURANCE_TYPE_LABELS: Record<InsuranceType, string> = {
  life: '生命保険',
  nonlife: '損害保険',
  medical: '医療保険',
  cancer: 'がん保険',
  accident: '傷害保険',
  fire: '火災保険',
  auto: '自動車保険',
  other: 'その他',
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  active: '有効',
  expired: '満期',
  cancelled: '解約',
  pending: '審査中',
};

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  lead: '見込み',
  contact: '接触済み',
  proposal: '提案中',
  negotiation: '交渉中',
  closed_won: '成約',
  closed_lost: '失注',
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: '電話',
  visit: '訪問',
  email: 'メール',
  meeting: '面談',
  note: 'メモ',
  task: 'タスク',
};
