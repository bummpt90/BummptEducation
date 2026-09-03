-- =========================================================================
-- BummptEducation — Migration 0005: Academic Operations Foundation
-- =========================================================================

-- 1. Enhance Class-Subject Allocations with Academic Session Reference & Indexes
ALTER TABLE class_subject_allocations 
  ADD COLUMN IF NOT EXISTS academic_session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE;

-- Backfill academic_session_id from academic_terms where academic_term_id is populated
UPDATE class_subject_allocations a
SET academic_session_id = t.session_id
FROM academic_terms t
WHERE a.academic_term_id = t.id AND a.academic_session_id IS NULL;

-- Default any remaining allocations to current session
UPDATE class_subject_allocations
SET academic_session_id = (SELECT id FROM academic_sessions WHERE is_current = TRUE LIMIT 1)
WHERE academic_session_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_allocations_school_session ON class_subject_allocations(school_id, academic_session_id);
CREATE INDEX IF NOT EXISTS idx_allocations_school_class ON class_subject_allocations(school_id, class_id);

-- 2. Enhance Daily Attendance with Session & User Audit Tracking
ALTER TABLE daily_attendance 
  ADD COLUMN IF NOT EXISTS academic_session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE;
ALTER TABLE daily_attendance 
  ADD COLUMN IF NOT EXISTS marked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE daily_attendance 
  ALTER COLUMN day_number_in_term DROP NOT NULL;
ALTER TABLE daily_attendance 
  ALTER COLUMN day_number_in_term SET DEFAULT 1;

-- Expand status constraint to accept uppercase and standard casing safely
ALTER TABLE daily_attendance DROP CONSTRAINT IF EXISTS daily_attendance_status_check;
ALTER TABLE daily_attendance ADD CONSTRAINT daily_attendance_status_check 
  CHECK (UPPER(status) IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED'));

-- Backfill academic_session_id from academic_terms where term_id is populated
UPDATE daily_attendance a
SET academic_session_id = t.session_id
FROM academic_terms t
WHERE a.term_id = t.id AND a.academic_session_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_daily_attendance_school_date ON daily_attendance(school_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_daily_attendance_session ON daily_attendance(academic_session_id);

-- 3. Create Continuous Assessments Table (Granular 40% CA records)
CREATE TABLE IF NOT EXISTS continuous_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
    academic_term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL, -- e.g. 'CA1', 'CA2', 'ASSIGNMENT', 'PROJECT', 'TEST', 'PRACTICAL'
    score NUMERIC(5,2) NOT NULL CHECK (score >= 0),
    max_score NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (max_score > 0 AND score <= max_score),
    weight_percentage NUMERIC(5,2) DEFAULT 10.00,
    recorded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recorded_by_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, subject_id, academic_term_id, assessment_type)
);

CREATE INDEX IF NOT EXISTS idx_ca_school_class_term ON continuous_assessments(school_id, class_id, academic_term_id);
CREATE INDEX IF NOT EXISTS idx_ca_student_term ON continuous_assessments(student_id, academic_term_id);
CREATE INDEX IF NOT EXISTS idx_ca_subject ON continuous_assessments(subject_id);

-- 4. Create Terminal Examinations Table (Granular 60% Terminal Exam records)
CREATE TABLE IF NOT EXISTS terminal_examinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
    academic_term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL CHECK (score >= 0),
    max_score NUMERIC(5,2) NOT NULL DEFAULT 60.00 CHECK (max_score > 0 AND score <= max_score),
    exam_date DATE,
    recorded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recorded_by_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, subject_id, academic_term_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_school_class_term ON terminal_examinations(school_id, class_id, academic_term_id);
CREATE INDEX IF NOT EXISTS idx_exam_student_term ON terminal_examinations(student_id, academic_term_id);
CREATE INDEX IF NOT EXISTS idx_exam_subject ON terminal_examinations(subject_id);

-- 5. Enhance Assessment Scores Composite Ledger Table
ALTER TABLE assessment_scores 
  ADD COLUMN IF NOT EXISTS academic_session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE;
ALTER TABLE assessment_scores 
  ADD COLUMN IF NOT EXISTS recorded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

UPDATE assessment_scores a
SET academic_session_id = t.session_id
FROM academic_terms t
WHERE a.term_id = t.id AND a.academic_session_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_assessment_scores_school_term ON assessment_scores(school_id, term_id);
CREATE INDEX IF NOT EXISTS idx_assessment_scores_class_term ON assessment_scores(class_id, term_id);
