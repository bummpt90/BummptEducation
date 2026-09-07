-- ============================================================================
-- BummptEducation Database Migration: 0008_parent_identity_and_access.sql
-- Phase 8B: Parent & Guardian Identity, Server-Authoritative Report Access
-- ============================================================================

-- 1. Extend parent_guardians with user identity and tenant scoping
ALTER TABLE parent_guardians ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE parent_guardians ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE parent_guardians ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE parent_guardians ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_parent_guardians_user ON parent_guardians(user_id);
CREATE INDEX IF NOT EXISTS idx_parent_guardians_school ON parent_guardians(school_id);
CREATE INDEX IF NOT EXISTS idx_parent_guardians_org ON parent_guardians(organization_id);

-- 2. Extend parent_student_links with status, tenant scoping, and administrative tracking
ALTER TABLE parent_student_links ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE parent_student_links ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE parent_student_links ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Revoked', 'Pending'));
ALTER TABLE parent_student_links ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE parent_student_links ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
ALTER TABLE parent_student_links ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE parent_student_links ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent ON parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student ON parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_school ON parent_student_links(school_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_status ON parent_student_links(status);

-- 3. Extend parent_access_pins with tenant scoping, rate limits, and audit links
ALTER TABLE parent_access_pins ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES parent_guardians(id) ON DELETE CASCADE;
ALTER TABLE parent_access_pins ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE parent_access_pins ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE parent_access_pins ADD COLUMN IF NOT EXISTS failed_attempts INT DEFAULT 0;
ALTER TABLE parent_access_pins ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE parent_access_pins ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_parent_pins_parent ON parent_access_pins(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_pins_school ON parent_access_pins(school_id);
CREATE INDEX IF NOT EXISTS idx_parent_pins_student ON parent_access_pins(student_id);

-- 4. Dedicated Parent Security & Access Audit Log
CREATE TABLE IF NOT EXISTS parent_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES parent_guardians(id) ON DELETE SET NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    term_id UUID REFERENCES academic_terms(id) ON DELETE SET NULL,
    ip_address VARCHAR(100),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parent_logs_student ON parent_access_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_logs_parent ON parent_access_logs(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_logs_school ON parent_access_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_parent_logs_action ON parent_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_parent_logs_created ON parent_access_logs(created_at DESC);
