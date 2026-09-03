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

-- 4. Baseline Classes for Government College Makurdi (School B)
-- Ensures multi-school class scoping and cross-school boundary enforcement can be verified
INSERT INTO classes (school_id, level, arm, name, category, classroom_block, capacity)
VALUES
  ('3da67ba7-6b94-4269-ba90-85478c8dd456', 'JSS 1', 'secondary', 'JSS 1 Gold (Govt College Makurdi)', 'Junior Secondary', 'Block A', 40),
  ('3da67ba7-6b94-4269-ba90-85478c8dd456', 'JSS 2', 'secondary', 'JSS 2 Silver (Govt College Makurdi)', 'Junior Secondary', 'Block A', 40),
  ('3da67ba7-6b94-4269-ba90-85478c8dd456', 'JSS 3', 'secondary', 'JSS 3 Bronze (Govt College Makurdi)', 'Junior Secondary', 'Block B', 40),
  ('3da67ba7-6b94-4269-ba90-85478c8dd456', 'SSS 1', 'secondary', 'SSS 1 Science (Govt College Makurdi)', 'Senior Secondary', 'Science Wing', 35),
  ('3da67ba7-6b94-4269-ba90-85478c8dd456', 'SSS 2', 'secondary', 'SSS 2 Science (Govt College Makurdi)', 'Senior Secondary', 'Science Wing', 35),
  ('3da67ba7-6b94-4269-ba90-85478c8dd456', 'SSS 3', 'secondary', 'SSS 3 Finalist (Govt College Makurdi)', 'Senior Secondary', 'Science Wing', 35)
ON CONFLICT (school_id, level, name) DO NOTHING;
