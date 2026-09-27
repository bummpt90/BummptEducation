-- =========================================================================
-- BummptEducation — Phase 4 Database Migration
-- Migration 0004: Operational School, Staff & Student Data Foundation
-- =========================================================================

-- 1. Enhance Staff Table with Granular Identity & Tenant Columns
ALTER TABLE staff ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS surname VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Backfill staff organization_id from parent schools
UPDATE staff s
SET organization_id = sch.organization_id
FROM schools sch
WHERE s.school_id = sch.id AND s.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_staff_org ON staff(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(is_active);

-- 2. Enhance Students Table with Granular Identity, Tenant & Academic Session References
ALTER TABLE students ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS surname VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS current_academic_session_id UUID REFERENCES academic_sessions(id) ON DELETE RESTRICT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS current_academic_term_id UUID REFERENCES academic_terms(id) ON DELETE SET NULL;

-- Backfill students organization_id from parent schools
UPDATE students st
SET organization_id = sch.organization_id
FROM schools sch
WHERE st.school_id = sch.id AND st.organization_id IS NULL;

-- Update students status constraint to support expanded controlled lifecycle states:
-- ('Active', 'Admitted', 'Graduated', 'Withdrawn', 'Transferred', 'Suspended')
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_status_check;
ALTER TABLE students ADD CONSTRAINT students_status_check 
  CHECK (status IN ('Active', 'Admitted', 'Graduated', 'Withdrawn', 'Transferred', 'Suspended'));

CREATE INDEX IF NOT EXISTS idx_students_org ON students(organization_id);
CREATE INDEX IF NOT EXISTS idx_students_session ON students(current_academic_session_id);
CREATE INDEX IF NOT EXISTS idx_students_term ON students(current_academic_term_id);

-- 3. Create student_enrollments table for Longitudinal Academic Enrollment History
CREATE TABLE IF NOT EXISTS student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE RESTRICT,
    academic_term_id UUID REFERENCES academic_terms(id) ON DELETE SET NULL,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' 
      CHECK (status IN ('Active', 'Enrolled', 'Promoted', 'Repeated', 'Withdrawn', 'Transferred', 'Graduated')),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, academic_session_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_school_class ON student_enrollments(school_id, class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_session ON student_enrollments(academic_session_id);
