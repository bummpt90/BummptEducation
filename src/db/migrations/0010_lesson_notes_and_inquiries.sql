-- ============================================================================
-- BummptEducation — Migration 0010: Lesson Notes & Teacher Inquiries Relational Storage
-- Phase: 8D
-- 
-- Creates & hardens:
-- 1. lesson_notes (Curriculum modules, notes, topics, objectives, evaluations, downloads)
-- 2. lesson_inquiries (Parent-teacher question & answer consultation desk)
-- 3. lesson_note_audit_logs (Immutable audit trail for curriculum operations)
-- ============================================================================

-- 1. LESSON NOTES TABLE
CREATE TABLE IF NOT EXISTS lesson_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    teacher_name VARCHAR(255),
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    class_level VARCHAR(50) NOT NULL,
    arm VARCHAR(50) NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    subject_name VARCHAR(255),
    academic_session_id UUID REFERENCES academic_sessions(id) ON DELETE SET NULL,
    academic_term_id UUID REFERENCES academic_terms(id) ON DELETE SET NULL,
    term_id UUID REFERENCES academic_terms(id) ON DELETE SET NULL,
    term VARCHAR(50),
    academic_year VARCHAR(50),
    week_number INT NOT NULL CHECK (week_number >= 1 AND week_number <= 20),
    title VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    sub_topics TEXT[] NOT NULL DEFAULT '{}',
    learning_objectives TEXT[] NOT NULL DEFAULT '{}',
    instructional_materials TEXT[] NOT NULL DEFAULT '{}',
    content_summary TEXT NOT NULL,
    content_body TEXT NOT NULL,
    evaluation_questions TEXT[] NOT NULL DEFAULT '{}',
    key_terms TEXT[] NOT NULL DEFAULT '{}',
    pdf_file_name VARCHAR(255),
    pdf_file_size VARCHAR(50),
    pdf_url TEXT,
    download_count INT NOT NULL DEFAULT 0 CHECK (download_count >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Published' CHECK (status IN ('Published', 'Draft', 'Archived')),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all required columns exist in lesson_notes even if created in earlier migration
ALTER TABLE lesson_notes ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE lesson_notes ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE lesson_notes ADD COLUMN IF NOT EXISTS teacher_name VARCHAR(255);
ALTER TABLE lesson_notes ADD COLUMN IF NOT EXISTS subject_name VARCHAR(255);
ALTER TABLE lesson_notes ADD COLUMN IF NOT EXISTS academic_session_id UUID REFERENCES academic_sessions(id) ON DELETE SET NULL;
ALTER TABLE lesson_notes ADD COLUMN IF NOT EXISTS academic_term_id UUID REFERENCES academic_terms(id) ON DELETE SET NULL;
ALTER TABLE lesson_notes ADD COLUMN IF NOT EXISTS term VARCHAR(50);
ALTER TABLE lesson_notes ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50);
ALTER TABLE lesson_notes ALTER COLUMN teacher_id DROP NOT NULL;
ALTER TABLE lesson_notes ALTER COLUMN subject_id DROP NOT NULL;
ALTER TABLE lesson_notes ALTER COLUMN term_id DROP NOT NULL;

-- Indexes for lesson_notes
CREATE INDEX IF NOT EXISTS idx_lesson_notes_school_id ON lesson_notes(school_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_org_id ON lesson_notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_teacher_id ON lesson_notes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_class_id ON lesson_notes(class_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_subject_id ON lesson_notes(subject_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_term_session ON lesson_notes(academic_session_id, academic_term_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_class_term_week ON lesson_notes(class_id, academic_term_id, week_number);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_arm_level ON lesson_notes(arm, class_level);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_status ON lesson_notes(status);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_created_at ON lesson_notes(created_at DESC);


-- 2. TEACHER INQUIRIES & LESSON FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS lesson_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    lesson_note_id UUID NOT NULL REFERENCES lesson_notes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    student_name VARCHAR(255),
    parent_id UUID REFERENCES parent_guardians(id) ON DELETE SET NULL,
    parent_name VARCHAR(255) NOT NULL,
    guardian_phone VARCHAR(50),
    question TEXT NOT NULL,
    teacher_reply TEXT,
    reply TEXT,
    replied_by_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    replied_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    replied_by_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Answered', 'Closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    replied_at TIMESTAMPTZ
);

-- Indexes for lesson_inquiries
CREATE INDEX IF NOT EXISTS idx_lesson_inquiries_school_id ON lesson_inquiries(school_id);
CREATE INDEX IF NOT EXISTS idx_lesson_inquiries_org_id ON lesson_inquiries(organization_id);
CREATE INDEX IF NOT EXISTS idx_lesson_inquiries_note_id ON lesson_inquiries(lesson_note_id);
CREATE INDEX IF NOT EXISTS idx_lesson_inquiries_student_id ON lesson_inquiries(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_inquiries_parent_id ON lesson_inquiries(parent_id);
CREATE INDEX IF NOT EXISTS idx_lesson_inquiries_staff_id ON lesson_inquiries(replied_by_staff_id);
CREATE INDEX IF NOT EXISTS idx_lesson_inquiries_status ON lesson_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_lesson_inquiries_created_at ON lesson_inquiries(created_at DESC);


-- 3. LESSON NOTE SECURITY AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS lesson_note_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    lesson_note_id UUID REFERENCES lesson_notes(id) ON DELETE SET NULL,
    inquiry_id UUID REFERENCES lesson_inquiries(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lesson_note_audit_logs
CREATE INDEX IF NOT EXISTS idx_lesson_audit_school ON lesson_note_audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_lesson_audit_note ON lesson_note_audit_logs(lesson_note_id);
CREATE INDEX IF NOT EXISTS idx_lesson_audit_inquiry ON lesson_note_audit_logs(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_lesson_audit_user ON lesson_note_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_audit_action ON lesson_note_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_lesson_audit_created ON lesson_note_audit_logs(created_at DESC);
