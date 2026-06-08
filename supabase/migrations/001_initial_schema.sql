-- ============================================================
-- InsureHub 初期スキーマ
-- Supabase SQL Editor で実行してください
-- ============================================================

-- ============================================================
-- 組織（代理店）
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 募集人（スタッフ）
-- ============================================================
CREATE TYPE IF NOT EXISTS staff_role AS ENUM ('admin', 'manager', 'agent');

CREATE TABLE IF NOT EXISTS staff (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  role            staff_role NOT NULL DEFAULT 'agent',
  license_number  TEXT,
  license_expiry  DATE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_organization ON staff(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);

-- ============================================================
-- 顧客
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  last_name         TEXT NOT NULL,
  first_name        TEXT NOT NULL,
  last_name_kana    TEXT,
  first_name_kana   TEXT,
  birth_date        DATE,
  gender            TEXT CHECK (gender IN ('male', 'female', 'other')),
  phone             TEXT,
  email             TEXT,
  postal_code       TEXT,
  prefecture        TEXT,
  address           TEXT,
  occupation        TEXT,
  annual_income     INTEGER,
  family_members    JSONB DEFAULT '[]',
  memo              TEXT,
  tags              TEXT[] DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_organization ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_staff       ON customers(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_customers_name        ON customers(last_name, first_name);

-- ============================================================
-- 保険契約
-- ============================================================
CREATE TYPE IF NOT EXISTS insurance_type AS ENUM (
  'life', 'nonlife', 'medical', 'cancer',
  'accident', 'fire', 'auto', 'other'
);

CREATE TYPE IF NOT EXISTS contract_status AS ENUM (
  'active', 'expired', 'cancelled', 'pending'
);

CREATE TABLE IF NOT EXISTS contracts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id       UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  assigned_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  policy_number     TEXT NOT NULL,
  insurance_company TEXT NOT NULL,
  product_name      TEXT NOT NULL,
  insurance_type    insurance_type NOT NULL,
  status            contract_status NOT NULL DEFAULT 'active',
  start_date        DATE NOT NULL,
  end_date          DATE,
  premium_monthly   INTEGER,
  premium_annual    INTEGER,
  coverage_amount   BIGINT,
  commission_rate   NUMERIC(5,2),
  commission_amount INTEGER,
  memo              TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_customer     ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date     ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_organization ON contracts(organization_id);

-- ============================================================
-- 案件（商談）
-- ============================================================
CREATE TYPE IF NOT EXISTS deal_stage AS ENUM (
  'lead', 'contact', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
);

CREATE TABLE IF NOT EXISTS deals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id         UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  assigned_staff_id   UUID REFERENCES staff(id) ON DELETE SET NULL,
  title               TEXT NOT NULL,
  insurance_type      insurance_type,
  stage               deal_stage NOT NULL DEFAULT 'lead',
  expected_amount     INTEGER,
  expected_close_date DATE,
  lost_reason         TEXT,
  memo                TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_customer     ON deals(customer_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage        ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_organization ON deals(organization_id);

-- ============================================================
-- 活動履歴
-- ============================================================
CREATE TYPE IF NOT EXISTS activity_type AS ENUM (
  'call', 'visit', 'email', 'meeting', 'note', 'task'
);

CREATE TABLE IF NOT EXISTS activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staff_id        UUID REFERENCES staff(id) ON DELETE SET NULL,
  customer_id     UUID REFERENCES customers(id) ON DELETE CASCADE,
  deal_id         UUID REFERENCES deals(id) ON DELETE CASCADE,
  type            activity_type NOT NULL,
  title           TEXT NOT NULL,
  content         TEXT,
  activity_date   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date        TIMESTAMPTZ,
  is_completed    BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_customer ON activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal     ON activities(deal_id);

-- ============================================================
-- 意向把握記録
-- ============================================================
CREATE TYPE IF NOT EXISTS intent_status AS ENUM (
  'draft', 'submitted', 'signed', 'completed'
);

CREATE TABLE IF NOT EXISTS intent_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id         UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  deal_id             UUID REFERENCES deals(id) ON DELETE SET NULL,
  staff_id            UUID REFERENCES staff(id) ON DELETE SET NULL,
  status              intent_status NOT NULL DEFAULT 'draft',
  hearing_data        JSONB NOT NULL DEFAULT '{}',
  comparison_data     JSONB DEFAULT '{}',
  recommended_product TEXT,
  customer_signature  TEXT,
  signed_at           TIMESTAMPTZ,
  pdf_url             TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intent_customer ON intent_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_intent_deal     ON intent_records(deal_id);

-- ============================================================
-- セミナー・イベント
-- ============================================================
CREATE TYPE IF NOT EXISTS event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');

CREATE TABLE IF NOT EXISTS events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      UUID REFERENCES staff(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  location        TEXT,
  is_online       BOOLEAN DEFAULT FALSE,
  online_url      TEXT,
  start_at        TIMESTAMPTZ NOT NULL,
  end_at          TIMESTAMPTZ NOT NULL,
  capacity        INTEGER,
  status          event_status NOT NULL DEFAULT 'draft',
  public_token    UUID DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_organization ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_start_at     ON events(start_at);

-- ============================================================
-- イベント参加者
-- ============================================================
CREATE TYPE IF NOT EXISTS participant_status AS ENUM ('registered', 'attended', 'absent', 'cancelled');

CREATE TABLE IF NOT EXISTS event_participants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  customer_id   UUID REFERENCES customers(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  status        participant_status NOT NULL DEFAULT 'registered',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participants_event    ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_customer ON event_participants(customer_id);

-- ============================================================
-- 操作ログ（監査用）
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
  staff_id    UUID REFERENCES staff(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   UUID,
  ip_address  INET,
  user_agent  TEXT,
  diff        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_staff   ON audit_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
