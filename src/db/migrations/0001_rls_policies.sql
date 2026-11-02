-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR TAPZIO MULTI-TENANCY
-- Enforces strict isolation even if table owner or connection is pooled
-- ====================================================================

-- 1. Departments Table
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments FORCE ROW LEVEL SECURITY;

CREATE POLICY departments_admin_all ON departments
    FOR ALL
    USING (current_setting('app.is_admin', true) = 'true');

CREATE POLICY departments_org_read ON departments
    FOR SELECT
    USING (organization_id = current_setting('app.current_org_id', true));

CREATE POLICY departments_org_write ON departments
    FOR ALL
    USING (
        organization_id = current_setting('app.current_org_id', true)
        AND current_setting('app.current_role', true) IN ('owner', 'admin')
    );

-- 2. Audit Logs Table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_admin_all ON audit_logs
    FOR ALL
    USING (current_setting('app.is_admin', true) = 'true');

CREATE POLICY audit_logs_org_read ON audit_logs
    FOR SELECT
    USING (
        organization_id = current_setting('app.current_org_id', true)
        AND current_setting('app.current_role', true) IN ('owner', 'admin')
    );

CREATE POLICY audit_logs_actor_read ON audit_logs
    FOR SELECT
    USING (actor_id = current_setting('app.current_user_id', true));

CREATE POLICY audit_logs_insert ON audit_logs
    FOR INSERT
    WITH CHECK (true);

-- 3. Profiles Table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

CREATE POLICY profiles_admin_all ON profiles
    FOR ALL
    USING (current_setting('app.is_admin', true) = 'true');

CREATE POLICY profiles_public_read ON profiles
    FOR SELECT
    USING (status = 'published');

CREATE POLICY profiles_owner_access ON profiles
    FOR ALL
    USING (owner_id = current_setting('app.current_user_id', true));

CREATE POLICY profiles_org_admin_access ON profiles
    FOR ALL
    USING (
        organization_id = current_setting('app.current_org_id', true)
        AND current_setting('app.current_role', true) IN ('owner', 'admin')
    );

-- 4. Cards Table
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards FORCE ROW LEVEL SECURITY;

CREATE POLICY cards_admin_all ON cards
    FOR ALL
    USING (current_setting('app.is_admin', true) = 'true');

CREATE POLICY cards_public_redirect ON cards
    FOR SELECT
    USING (true);

CREATE POLICY cards_owner_access ON cards
    FOR ALL
    USING (
        owner_user_id = current_setting('app.current_user_id', true)
        OR (
            organization_id = current_setting('app.current_org_id', true)
            AND current_setting('app.current_role', true) IN ('owner', 'admin')
        )
    );

