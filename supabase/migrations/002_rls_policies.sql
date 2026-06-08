-- ============================================================
-- Row Level Security（RLS）設定
-- OWASP A01: アクセス制御 — 組織をまたいだデータアクセス防止
-- ============================================================

ALTER TABLE customers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs      ENABLE ROW LEVEL SECURITY;

-- ヘルパー関数: 現在のユーザーの organization_id を返す
CREATE OR REPLACE FUNCTION current_org_id() RETURNS UUID AS $$
  SELECT organization_id FROM staff WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- 顧客テーブル
-- ============================================================
CREATE POLICY "customers_org_isolation" ON customers
  FOR ALL USING (organization_id = current_org_id());

-- ============================================================
-- 契約テーブル
-- ============================================================
CREATE POLICY "contracts_org_isolation" ON contracts
  FOR ALL USING (organization_id = current_org_id());

-- ============================================================
-- 案件テーブル
-- ============================================================
CREATE POLICY "deals_org_isolation" ON deals
  FOR ALL USING (organization_id = current_org_id());

-- ============================================================
-- 活動履歴テーブル
-- ============================================================
CREATE POLICY "activities_org_isolation" ON activities
  FOR ALL USING (organization_id = current_org_id());

-- ============================================================
-- 意向把握テーブル
-- ============================================================
CREATE POLICY "intent_records_org_isolation" ON intent_records
  FOR ALL USING (organization_id = current_org_id());

-- ============================================================
-- イベントテーブル
-- ============================================================
CREATE POLICY "events_org_isolation" ON events
  FOR ALL USING (organization_id = current_org_id());

-- イベント参加者: イベントの組織と一致するもの
CREATE POLICY "event_participants_org_isolation" ON event_participants
  FOR ALL USING (
    event_id IN (
      SELECT id FROM events WHERE organization_id = current_org_id()
    )
  );

-- 公開申込み（認証不要）: public_token によるアクセス
CREATE POLICY "event_participants_public_register" ON event_participants
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE status = 'published'
    )
  );

-- ============================================================
-- 監査ログ: 同組織のみ閲覧可
-- ============================================================
CREATE POLICY "audit_logs_org_isolation" ON audit_logs
  FOR SELECT USING (org_id = current_org_id());

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (org_id = current_org_id());
