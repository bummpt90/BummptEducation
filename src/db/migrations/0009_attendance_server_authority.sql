-- =====================================================================
-- BummptEducation Database Migration 0009
-- Phase 8C: Attendance Server Authority & Historical Registry Synchronization
-- =====================================================================

-- 1. Extend daily_attendance with organization_id, academic_term_id, enrollment_id and timestamps
ALTER TABLE daily_attendance 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE daily_attendance 
  ADD COLUMN IF NOT EXISTS academic_term_id UUID REFERENCES academic_terms(id) ON DELETE CASCADE;

ALTER TABLE daily_attendance 
  ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES student_enrollments(id) ON DELETE SET NULL;

ALTER TABLE daily_attendance 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE daily_attendance 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill organization_id from schools table
UPDATE daily_attendance da
SET organization_id = s.organization_id
FROM schools s
WHERE da.school_id = s.id AND da.organization_id IS NULL;

-- Backfill academic_term_id from term_id
UPDATE daily_attendance
SET academic_term_id = term_id
WHERE academic_term_id IS NULL AND term_id IS NOT NULL;

-- Backfill term_id from academic_term_id if inverse was populated
UPDATE daily_attendance
SET term_id = academic_term_id
WHERE term_id IS NULL AND academic_term_id IS NOT NULL;

-- Backfill enrollment_id from student_enrollments where active enrollment matches student, class, session
UPDATE daily_attendance da
SET enrollment_id = se.id
FROM student_enrollments se
WHERE da.student_id = se.student_id 
  AND da.class_id = se.class_id 
  AND (da.academic_session_id = se.academic_session_id OR da.academic_session_id IS NULL)
  AND da.enrollment_id IS NULL;

-- 2. Ensure composite uniqueness constraint on (student_id, attendance_date)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'daily_attendance_student_date_unique'
    ) THEN
        -- Check if default unique exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conrelid = 'daily_attendance'::regclass AND contype = 'u'
        ) THEN
            ALTER TABLE daily_attendance 
            ADD CONSTRAINT daily_attendance_student_date_unique UNIQUE (student_id, attendance_date);
        END IF;
    END IF;
END $$;

-- 3. Performance & Multi-Tenant Indexes
CREATE INDEX IF NOT EXISTS idx_daily_attendance_org ON daily_attendance(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_attendance_school_class_date ON daily_attendance(school_id, class_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_daily_attendance_enrollment ON daily_attendance(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_daily_attendance_session_term ON daily_attendance(academic_session_id, academic_term_id);

-- 4. Attendance Security Audit Logs Table
CREATE TABLE IF NOT EXISTS attendance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    attendance_id UUID REFERENCES daily_attendance(id) ON DELETE SET NULL,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- RECORDED, BULK_RECORDED, MODIFIED, CORRECTION, UNAUTHORIZED_ATTEMPT
    performed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_role VARCHAR(50),
    ip_address VARCHAR(100),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_att_audit_school ON attendance_audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_att_audit_student ON attendance_audit_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_att_audit_class ON attendance_audit_logs(class_id);
CREATE INDEX IF NOT EXISTS idx_att_audit_action ON attendance_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_att_audit_created ON attendance_audit_logs(created_at DESC);
