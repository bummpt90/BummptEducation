-- =========================================================================
-- BummptEducation Database Migration 0011
-- Phase 8E: Benue State HQ Telemetry, Ministry Directives & Inter-School Messaging
-- =========================================================================

-- 1. EXTEND hq_dispatches TABLE WITH TENANT SCOPING & BROADCAST METADATA
ALTER TABLE hq_dispatches ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE hq_dispatches ADD COLUMN IF NOT EXISTS target_school_id UUID REFERENCES schools(id) ON DELETE SET NULL;
ALTER TABLE hq_dispatches ADD COLUMN IF NOT EXISTS target_school_name VARCHAR(255);
ALTER TABLE hq_dispatches ADD COLUMN IF NOT EXISTS audience_type VARCHAR(50) NOT NULL DEFAULT 'SPECIFIC_SCHOOL';
ALTER TABLE hq_dispatches ADD COLUMN IF NOT EXISTS sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE hq_dispatches ADD COLUMN IF NOT EXISTS sender_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE hq_dispatches ADD COLUMN IF NOT EXISTS is_broadcast BOOLEAN DEFAULT FALSE;

-- Ensure constraints on audience_type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hq_dispatches_audience_type_check'
    ) THEN
        ALTER TABLE hq_dispatches ADD CONSTRAINT hq_dispatches_audience_type_check 
            CHECK (audience_type IN ('SPECIFIC_SCHOOL', 'ALL_SCHOOLS', 'ZONE', 'LGA'));
    END IF;
END $$;

-- Indexes for hq_dispatches
CREATE INDEX IF NOT EXISTS idx_hq_dispatches_target_school ON hq_dispatches(target_school_id);
CREATE INDEX IF NOT EXISTS idx_hq_dispatches_audience ON hq_dispatches(audience_type);
CREATE INDEX IF NOT EXISTS idx_hq_dispatches_channel ON hq_dispatches(channel_id);
CREATE INDEX IF NOT EXISTS idx_hq_dispatches_created ON hq_dispatches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hq_dispatches_sender_user ON hq_dispatches(sender_user_id);

-- 2. EXTEND hq_dispatch_replies TABLE
ALTER TABLE hq_dispatch_replies ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE hq_dispatch_replies ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE SET NULL;
ALTER TABLE hq_dispatch_replies ADD COLUMN IF NOT EXISTS sender_type VARCHAR(50) DEFAULT 'HQ';

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hq_dispatch_replies_sender_type_check'
    ) THEN
        ALTER TABLE hq_dispatch_replies ADD CONSTRAINT hq_dispatch_replies_sender_type_check 
            CHECK (sender_type IN ('HQ', 'SCHOOL_HEAD'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_hq_replies_user ON hq_dispatch_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_hq_replies_school ON hq_dispatch_replies(school_id);

-- 3. EXTEND ministry_directives TABLE
ALTER TABLE ministry_directives ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE ministry_directives ADD COLUMN IF NOT EXISTS target_school_id UUID REFERENCES schools(id) ON DELETE SET NULL;
ALTER TABLE ministry_directives ADD COLUMN IF NOT EXISTS issued_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ministry_directives ADD COLUMN IF NOT EXISTS audience_type VARCHAR(50) NOT NULL DEFAULT 'ALL_SCHOOLS';
ALTER TABLE ministry_directives ADD COLUMN IF NOT EXISTS target_zone VARCHAR(100);

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ministry_directives_audience_type_check'
    ) THEN
        ALTER TABLE ministry_directives ADD CONSTRAINT ministry_directives_audience_type_check 
            CHECK (audience_type IN ('ALL_SCHOOLS', 'SPECIFIC_SCHOOL', 'ZONE', 'LGA'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ministry_directives_audience ON ministry_directives(audience_type);
CREATE INDEX IF NOT EXISTS idx_ministry_directives_target_school ON ministry_directives(target_school_id);
CREATE INDEX IF NOT EXISTS idx_ministry_directives_target_lga ON ministry_directives(target_lga);
CREATE INDEX IF NOT EXISTS idx_ministry_directives_target_zone ON ministry_directives(target_zone);
CREATE INDEX IF NOT EXISTS idx_ministry_directives_created ON ministry_directives(created_at DESC);

-- 4. DIRECTIVE ACKNOWLEDGEMENTS TABLE
CREATE TABLE IF NOT EXISTS directive_acknowledgements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    directive_id UUID NOT NULL REFERENCES ministry_directives(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    head_name VARCHAR(255) NOT NULL,
    head_role VARCHAR(100) NOT NULL,
    notes TEXT,
    acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (directive_id, school_id)
);

CREATE INDEX IF NOT EXISTS idx_dir_ack_directive ON directive_acknowledgements(directive_id);
CREATE INDEX IF NOT EXISTS idx_dir_ack_school ON directive_acknowledgements(school_id);
CREATE INDEX IF NOT EXISTS idx_dir_ack_user ON directive_acknowledgements(user_id);

-- 5. HQ & MINISTRY SECURITY AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS hq_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    user_role VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    resource_id UUID,
    resource_type VARCHAR(50),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hq_audit_school ON hq_audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_hq_audit_user ON hq_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_hq_audit_action ON hq_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_hq_audit_created ON hq_audit_logs(created_at DESC);
