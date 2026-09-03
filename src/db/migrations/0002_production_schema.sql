-- BummptEducation Database Migration
-- Version: 0002
-- Name: production_schema
-- Description: Complete production PostgreSQL schema for Multi-School, Academic Broadsheet,
-- 40/60 Continuous Assessment, 13-Week Attendance, Bursary/Invoicing, Lesson Notes,
-- Benue State 23 LGAs Telemetry, and Ministry Directives.

-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Core Organization & Multi-Tenant Updates
ALTER TABLE schools ADD COLUMN IF NOT EXISTS established_year INT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS vice_principal_academic VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_schools_org ON schools(organization_id);
CREATE INDEX IF NOT EXISTS idx_schools_zone ON schools(senatorial_zone);

-- 3. Academic Sessions & Terms
CREATE TABLE IF NOT EXISTS academic_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_name VARCHAR(50) UNIQUE NOT NULL, -- e.g. '2024/2025', '2025/2026', '2026/2027'
    is_current BOOLEAN DEFAULT FALSE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_academic_sessions_current ON academic_sessions(is_current);

CREATE TABLE IF NOT EXISTS academic_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
    term_name VARCHAR(50) NOT NULL CHECK (term_name IN ('1st Term', '2nd Term', '3rd Term')),
    is_current BOOLEAN DEFAULT FALSE,
    resumption_date DATE NOT NULL,
    vacation_date DATE NOT NULL,
    statutory_school_days INT DEFAULT 65 CHECK (statutory_school_days > 0),
    next_term_resumption DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (session_id, term_name)
);
CREATE INDEX IF NOT EXISTS idx_academic_terms_session ON academic_terms(session_id);
CREATE INDEX IF NOT EXISTS idx_academic_terms_current ON academic_terms(is_current);

-- 4. Users (Future Auth & RBAC Engine)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 5. Classes & Classrooms
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    level VARCHAR(50) NOT NULL,
    arm VARCHAR(50) NOT NULL CHECK (arm IN ('kindergarten', 'primary', 'secondary')),
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    classroom_block VARCHAR(150),
    capacity INT DEFAULT 30,
    form_master_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (school_id, level, name)
);
CREATE INDEX IF NOT EXISTS idx_classes_school_arm ON classes(school_id, arm);
CREATE INDEX IF NOT EXISTS idx_classes_level ON classes(level);

-- 6. Staff & Faculty
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    staff_id_number VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    staff_type VARCHAR(50) NOT NULL CHECK (staff_type IN ('Teaching', 'Non-Teaching')),
    department_id VARCHAR(50),
    arm VARCHAR(50) NOT NULL,
    designation VARCHAR(150) NOT NULL,
    role VARCHAR(100) NOT NULL,
    assigned_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    qualifications TEXT,
    trcn_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave', 'Resigned', 'Suspended')),
    date_joined DATE,
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (school_id, staff_id_number)
);
CREATE INDEX IF NOT EXISTS idx_staff_school ON staff(school_id);
CREATE INDEX IF NOT EXISTS idx_staff_assigned_class ON staff(assigned_class_id);
CREATE INDEX IF NOT EXISTS idx_staff_id_number ON staff(staff_id_number);

-- Deferred Form Master Foreign Key on Classes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_classes_form_master'
    ) THEN
        ALTER TABLE classes 
        ADD CONSTRAINT fk_classes_form_master 
        FOREIGN KEY (form_master_id) REFERENCES staff(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 7. Students & Pupils
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    admission_number VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female')),
    date_of_birth DATE NOT NULL,
    current_class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    arm VARCHAR(50) NOT NULL CHECK (arm IN ('kindergarten', 'primary', 'secondary')),
    house VARCHAR(100),
    guardian_name VARCHAR(255) NOT NULL,
    guardian_phone VARCHAR(50) NOT NULL,
    guardian_email VARCHAR(255),
    address TEXT,
    state_of_origin VARCHAR(100),
    date_enrolled DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Withdrawn', 'Graduated', 'Suspended')),
    is_prefect BOOLEAN DEFAULT FALSE,
    prefect_role VARCHAR(150),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (school_id, admission_number)
);
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(current_class_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_admission ON students(admission_number);

-- 8. Parent Guardians, Student Links & Access PINs
CREATE TABLE IF NOT EXISTS parent_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    relationship VARCHAR(100),
    occupation VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parent_guardians_phone ON parent_guardians(phone);

CREATE TABLE IF NOT EXISTS parent_student_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES parent_guardians(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    relationship VARCHAR(100) NOT NULL,
    is_primary_guardian BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (parent_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student ON parent_student_links(student_id);

CREATE TABLE IF NOT EXISTS parent_access_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    pin_hash VARCHAR(255) NOT NULL,
    parent_phone VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, parent_phone)
);
CREATE INDEX IF NOT EXISTS idx_parent_pins_student ON parent_access_pins(student_id);

-- 9. Subjects & Class Subject Allocations
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    department_id VARCHAR(50) NOT NULL,
    arm VARCHAR(50) NOT NULL,
    applicable_levels TEXT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_subjects_department ON subjects(department_id);

CREATE TABLE IF NOT EXISTS class_subject_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    academic_term_id UUID REFERENCES academic_terms(id) ON DELETE CASCADE,
    periods_per_week INT DEFAULT 4 CHECK (periods_per_week > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (class_id, subject_id, academic_term_id)
);
CREATE INDEX IF NOT EXISTS idx_allocations_class ON class_subject_allocations(class_id);
CREATE INDEX IF NOT EXISTS idx_allocations_teacher ON class_subject_allocations(teacher_id);

-- 10. 40/60 Continuous Assessment Scores
CREATE TABLE IF NOT EXISTS assessment_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
    ca1 NUMERIC(5,2) DEFAULT 0 CHECK (ca1 >= 0 AND ca1 <= 10),
    ca2 NUMERIC(5,2) DEFAULT 0 CHECK (ca2 >= 0 AND ca2 <= 10),
    assignment NUMERIC(5,2) DEFAULT 0 CHECK (assignment >= 0 AND assignment <= 10),
    attendance NUMERIC(5,2) DEFAULT 0 CHECK (attendance >= 0 AND attendance <= 10),
    total_ca NUMERIC(5,2) GENERATED ALWAYS AS (ca1 + ca2 + assignment + attendance) STORED,
    exam_score NUMERIC(5,2) DEFAULT 0 CHECK (exam_score >= 0 AND exam_score <= 60),
    total_score NUMERIC(5,2) GENERATED ALWAYS AS (ca1 + ca2 + assignment + attendance + exam_score) STORED,
    grade VARCHAR(10),
    remark VARCHAR(150),
    position_in_subject INT,
    class_min NUMERIC(5,2),
    class_max NUMERIC(5,2),
    class_average NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, subject_id, term_id)
);
CREATE INDEX IF NOT EXISTS idx_assessments_lookup ON assessment_scores(class_id, term_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_assessments_student ON assessment_scores(student_id, term_id);

-- 11. Terminal Report Cards & Early Years Milestones
CREATE TABLE IF NOT EXISTS report_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
    total_score_obtained NUMERIC(7,2) NOT NULL DEFAULT 0,
    total_possible_score NUMERIC(7,2) NOT NULL DEFAULT 0,
    overall_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    position_in_class INT NOT NULL DEFAULT 1,
    total_students_in_class INT NOT NULL DEFAULT 1,
    class_average NUMERIC(5,2) NOT NULL DEFAULT 0,
    class_highest NUMERIC(5,2),
    class_lowest NUMERIC(5,2),
    gpa NUMERIC(4,2),
    affective_domain JSONB NOT NULL DEFAULT '{}'::jsonb,
    psychomotor_domain JSONB NOT NULL DEFAULT '{}'::jsonb,
    early_years_milestones JSONB,
    attendance_summary JSONB,
    form_tutor_remark TEXT,
    form_tutor_name VARCHAR(255),
    form_tutor_signature_date DATE,
    sports_master_remark TEXT,
    sports_master_name VARCHAR(255),
    guidance_counselor_remark TEXT,
    guidance_counselor_name VARCHAR(255),
    principal_remark TEXT,
    principal_name VARCHAR(255),
    principal_title VARCHAR(150),
    promotional_status VARCHAR(150) DEFAULT 'N/A',
    next_term_begins DATE,
    next_term_fees_estimate VARCHAR(100),
    approval_status VARCHAR(50) DEFAULT 'Draft' CHECK (approval_status IN ('Draft', 'Approved & Published', 'Requires Correction')),
    is_parent_viewable BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, term_id)
);
CREATE INDEX IF NOT EXISTS idx_report_cards_lookup ON report_cards(class_id, term_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_student ON report_cards(student_id);

CREATE TABLE IF NOT EXISTS early_years_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
    domain VARCHAR(100) NOT NULL,
    skill VARCHAR(255) NOT NULL,
    mastery VARCHAR(50) NOT NULL CHECK (mastery IN ('Exceeding', 'Proficient', 'Developing', 'Emerging')),
    rating_score INT NOT NULL CHECK (rating_score BETWEEN 1 AND 4),
    teacher_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, term_id, domain, skill)
);
CREATE INDEX IF NOT EXISTS idx_ey_milestones_student ON early_years_milestones(student_id, term_id);

-- 12. 13-Week / 65-Day Attendance Register
CREATE TABLE IF NOT EXISTS term_calendar_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
    calendar_date DATE NOT NULL,
    week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 13),
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')),
    day_number_in_term INT NOT NULL CHECK (day_number_in_term BETWEEN 1 AND 65),
    is_school_day BOOLEAN DEFAULT TRUE,
    is_holiday BOOLEAN DEFAULT FALSE,
    holiday_name VARCHAR(150),
    is_mid_term_break BOOLEAN DEFAULT FALSE,
    label VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (term_id, calendar_date)
);
CREATE INDEX IF NOT EXISTS idx_term_calendar_lookup ON term_calendar_days(term_id, calendar_date);

CREATE TABLE IF NOT EXISTS daily_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    day_number_in_term INT NOT NULL CHECK (day_number_in_term BETWEEN 1 AND 65),
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused', 'Present', 'Absent', 'Late', 'Excused')),
    arrival_time VARCHAR(20),
    reason TEXT,
    note TEXT,
    marked_by_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, attendance_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_attendance_class_date ON daily_attendance(class_id, term_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_daily_attendance_student ON daily_attendance(student_id, term_id);

CREATE TABLE IF NOT EXISTS attendance_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    times_school_opened INT NOT NULL DEFAULT 65,
    times_present INT NOT NULL DEFAULT 0,
    times_absent INT NOT NULL DEFAULT 0,
    times_late INT NOT NULL DEFAULT 0,
    times_excused INT NOT NULL DEFAULT 0,
    attendance_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    punctuality_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    consecutive_present_streak INT NOT NULL DEFAULT 0,
    unexcused_absences INT NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Satisfactory' CHECK (status IN ('Outstanding', 'Satisfactory', 'Needs Improvement', 'Critical Warning')),
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, term_id)
);
CREATE INDEX IF NOT EXISTS idx_attendance_summaries_class ON attendance_summaries(class_id, term_id);

CREATE TABLE IF NOT EXISTS class_attendance_session_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 13),
    total_enrolled INT NOT NULL DEFAULT 0,
    present_count INT NOT NULL DEFAULT 0,
    absent_count INT NOT NULL DEFAULT 0,
    late_count INT NOT NULL DEFAULT 0,
    excused_count INT NOT NULL DEFAULT 0,
    today_attendance_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    cumulative_attendance_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    boys_attendance_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    girls_attendance_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    form_master_verified BOOLEAN DEFAULT FALSE,
    verified_by_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (class_id, term_id, session_date)
);
CREATE INDEX IF NOT EXISTS idx_class_session_summaries ON class_attendance_session_summaries(class_id, term_id, session_date);

-- 13. Fees, Bursary & Financial Ledgers
CREATE TABLE IF NOT EXISTS fee_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fee_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_level VARCHAR(50) NOT NULL,
    arm VARCHAR(50) NOT NULL,
    term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (school_id, class_level, term_id)
);
CREATE INDEX IF NOT EXISTS idx_fee_schedules_lookup ON fee_schedules(school_id, class_level, term_id);

CREATE TABLE IF NOT EXISTS fee_schedule_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_schedule_id UUID NOT NULL REFERENCES fee_schedules(id) ON DELETE CASCADE,
    category_id UUID REFERENCES fee_categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    is_compulsory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fee_schedule_items_schedule ON fee_schedule_items(fee_schedule_id);

CREATE TABLE IF NOT EXISTS fee_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
    total_billed NUMERIC(12,2) NOT NULL CHECK (total_billed >= 0),
    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'Unpaid' CHECK (status IN ('Fully Paid', 'Partial', 'Unpaid', 'Overdue', 'Cancelled')),
    issue_date DATE NOT NULL,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, term_id, invoice_number)
);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_student ON fee_invoices(student_id, term_id);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_status ON fee_invoices(status);

CREATE TABLE IF NOT EXISTS fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES fee_invoices(id) ON DELETE SET NULL,
    term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
    class_level VARCHAR(50) NOT NULL,
    arm VARCHAR(50) NOT NULL,
    amount_paid NUMERIC(12,2) NOT NULL CHECK (amount_paid > 0),
    total_billed NUMERIC(12,2) NOT NULL CHECK (total_billed >= 0),
    balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('Bank Transfer', 'POS', 'Cash / Bank Teller', 'Online Gateway')),
    bank_reference VARCHAR(150),
    status VARCHAR(50) NOT NULL CHECK (status IN ('Fully Paid', 'Partial', 'Unpaid')),
    collected_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_receipt ON fee_payments(receipt_number);

-- 14. Admissions Applications
CREATE TABLE IF NOT EXISTS admission_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    application_number VARCHAR(100) UNIQUE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    applied_class VARCHAR(50) NOT NULL,
    arm VARCHAR(50) NOT NULL,
    guardian_name VARCHAR(255) NOT NULL,
    guardian_phone VARCHAR(50) NOT NULL,
    guardian_email VARCHAR(255),
    previous_school VARCHAR(255),
    developmental_readiness_score NUMERIC(5,2),
    immunization_completed BOOLEAN DEFAULT FALSE,
    toilet_trained BOOLEAN DEFAULT FALSE,
    entrance_exam_score NUMERIC(5,2),
    interview_score NUMERIC(5,2),
    status VARCHAR(100) NOT NULL DEFAULT 'Pending Review' CHECK (status IN (
        'Pending Review', 
        'Entrance Exam Scheduled', 
        'Developmental Screening Scheduled', 
        'Passed - Admitted', 
        'Waitlisted', 
        'Rejected'
    )),
    submitted_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admissions_school_status ON admission_applications(school_id, status);
CREATE INDEX IF NOT EXISTS idx_admissions_number ON admission_applications(application_number);

-- 15. Lesson Notes & Parent Feedback
CREATE TABLE IF NOT EXISTS lesson_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_level VARCHAR(50) NOT NULL,
    arm VARCHAR(50) NOT NULL,
    term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
    week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 13),
    title VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    sub_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
    learning_objectives TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    instructional_materials TEXT[] DEFAULT ARRAY[]::TEXT[],
    content_summary TEXT NOT NULL,
    content_body TEXT NOT NULL,
    evaluation_questions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    key_terms TEXT[] DEFAULT ARRAY[]::TEXT[],
    pdf_url TEXT,
    pdf_file_name VARCHAR(255),
    pdf_file_size VARCHAR(50),
    download_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Published' CHECK (status IN ('Published', 'Draft', 'Archived')),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_lookup ON lesson_notes(school_id, subject_id, class_level, term_id, week_number);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_teacher ON lesson_notes(teacher_id);

CREATE TABLE IF NOT EXISTS lesson_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_note_id UUID NOT NULL REFERENCES lesson_notes(id) ON DELETE CASCADE,
    parent_name VARCHAR(255) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    guardian_phone VARCHAR(50),
    question TEXT NOT NULL,
    reply TEXT,
    replied_by_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Answered')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lesson_feedbacks_note ON lesson_feedbacks(lesson_note_id);
CREATE INDEX IF NOT EXISTS idx_lesson_feedbacks_status ON lesson_feedbacks(status);

-- 16. State HQ / Benue 23 LGAs Telemetry & Directives
CREATE TABLE IF NOT EXISTS lga_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lga VARCHAR(100) UNIQUE NOT NULL,
    zone VARCHAR(100) NOT NULL,
    headquarters VARCHAR(150) NOT NULL,
    education_secretary VARCHAR(255) NOT NULL,
    total_government_schools INT DEFAULT 0,
    total_student_population INT DEFAULT 0,
    total_teacher_count INT DEFAULT 0,
    average_pass_rate NUMERIC(5,2) DEFAULT 0,
    subvention_disbursed_naira NUMERIC(14,2) DEFAULT 0,
    priority_flag VARCHAR(50) DEFAULT 'Normal' CHECK (priority_flag IN ('Normal', 'Needs Attention', 'Intervention Required', 'Excellence Zone')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lga_metadata_zone ON lga_metadata(zone);

CREATE TABLE IF NOT EXISTS teacher_performance_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    term_id UUID REFERENCES academic_terms(id) ON DELETE CASCADE,
    attendance_rate NUMERIC(5,2) DEFAULT 0,
    punctuality_score NUMERIC(5,2) DEFAULT 0,
    lesson_note_submission_rate NUMERIC(5,2) DEFAULT 0,
    curriculum_coverage_rate NUMERIC(5,2) DEFAULT 0,
    trcn_compliance_rate NUMERIC(5,2) DEFAULT 0,
    qualification_breakdown JSONB DEFAULT '{}'::jsonb,
    top_performing_departments TEXT[] DEFAULT ARRAY[]::TEXT[],
    teacher_deficit_subjects TEXT[] DEFAULT ARRAY[]::TEXT[],
    average_weekly_workload_periods NUMERIC(5,2) DEFAULT 0,
    last_vetting_date DATE,
    staff_commendation_count INT DEFAULT 0,
    staff_query_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (school_id, term_id)
);
CREATE INDEX IF NOT EXISTS idx_teacher_kpis_school ON teacher_performance_kpis(school_id);

CREATE TABLE IF NOT EXISTS student_performance_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    term_id UUID REFERENCES academic_terms(id) ON DELETE CASCADE,
    overall_pass_rate NUMERIC(5,2) DEFAULT 0,
    average_score NUMERIC(5,2) DEFAULT 0,
    waec_benchmark_pass_rate NUMERIC(5,2) DEFAULT 0,
    bece_pass_rate NUMERIC(5,2) DEFAULT 0,
    attendance_rate NUMERIC(5,2) DEFAULT 0,
    dropout_risk_count INT DEFAULT 0,
    gender_parity_index NUMERIC(4,2) DEFAULT 1.0,
    grade_distribution JSONB DEFAULT '{}'::jsonb,
    science_enrollment_percentage NUMERIC(5,2) DEFAULT 0,
    top_performing_subjects TEXT[] DEFAULT ARRAY[]::TEXT[],
    subjects_requiring_intervention TEXT[] DEFAULT ARRAY[]::TEXT[],
    scholarship_recipients_count INT DEFAULT 0,
    is_primary_school BOOLEAN DEFAULT FALSE,
    primary_school_leaving_pass_rate NUMERIC(5,2),
    national_common_entrance_pass_rate NUMERIC(5,2),
    early_grade_reading_index NUMERIC(5,2),
    early_grade_math_index NUMERIC(5,2),
    school_feeding_compliance_rate NUMERIC(5,2),
    transition_to_junior_secondary_rate NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (school_id, term_id)
);
CREATE INDEX IF NOT EXISTS idx_student_kpis_school ON student_performance_kpis(school_id);

CREATE TABLE IF NOT EXISTS inspection_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    inspector_name VARCHAR(255) NOT NULL,
    inspector_title VARCHAR(150) NOT NULL,
    inspection_date DATE NOT NULL,
    state_ranking INT,
    total_schools_in_state INT,
    lga_ranking INT,
    total_schools_in_lga INT,
    accreditation_status VARCHAR(100) NOT NULL,
    infrastructure_rating JSONB NOT NULL DEFAULT '{}'::jsonb,
    key_intervention_alerts TEXT[] DEFAULT ARRAY[]::TEXT[],
    inspection_remarks TEXT NOT NULL,
    governor_brief_recommendation TEXT,
    governor_priority_flag VARCHAR(100) NOT NULL DEFAULT 'Normal Operations',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inspection_reports_school ON inspection_reports(school_id);

CREATE TABLE IF NOT EXISTS governing_body_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    review_date DATE NOT NULL,
    reviewer_name VARCHAR(255) NOT NULL,
    accreditation_status VARCHAR(100) NOT NULL,
    infrastructure_rating JSONB NOT NULL DEFAULT '{}'::jsonb,
    key_intervention_alerts TEXT[] DEFAULT ARRAY[]::TEXT[],
    hq_inspection_remarks TEXT NOT NULL,
    governor_brief_recommendation TEXT,
    governor_priority_flag VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_governing_body_reviews_school ON governing_body_reviews(school_id);

CREATE TABLE IF NOT EXISTS ministry_directives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority VARCHAR(100) NOT NULL,
    target_audience VARCHAR(150) NOT NULL,
    target_lga VARCHAR(100),
    target_school_name VARCHAR(255),
    issued_by VARCHAR(255) NOT NULL,
    issuing_office VARCHAR(255) NOT NULL,
    issued_date DATE NOT NULL,
    effective_date DATE NOT NULL,
    content TEXT NOT NULL,
    action_required TEXT NOT NULL,
    status VARCHAR(100) DEFAULT 'Broadcasted & Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ministry_directives_ref ON ministry_directives(reference_number);

CREATE TABLE IF NOT EXISTS hq_dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    official_ref_number VARCHAR(100) UNIQUE NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_role VARCHAR(150) NOT NULL,
    school_name VARCHAR(255) NOT NULL,
    lga VARCHAR(100) NOT NULL,
    zone VARCHAR(100) NOT NULL,
    channel_id VARCHAR(100) NOT NULL,
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('update', 'complaint', 'request', 'directive', 'executive')),
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    content TEXT NOT NULL,
    attachment_name VARCHAR(255),
    attachment_url TEXT,
    status VARCHAR(50) DEFAULT 'received' CHECK (status IN ('received', 'in-review', 'forwarded-to-head', 'approved', 'resolved')),
    is_escalated_to_commissioner BOOLEAN DEFAULT FALSE,
    hq_response_content TEXT,
    hq_responder_name VARCHAR(255),
    hq_responder_role VARCHAR(150),
    hq_responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hq_dispatches_ref ON hq_dispatches(official_ref_number);
CREATE INDEX IF NOT EXISTS idx_hq_dispatches_school ON hq_dispatches(school_id);
CREATE INDEX IF NOT EXISTS idx_hq_dispatches_lga ON hq_dispatches(lga);

CREATE TABLE IF NOT EXISTS hq_dispatch_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispatch_id UUID NOT NULL REFERENCES hq_dispatches(id) ON DELETE CASCADE,
    responder_name VARCHAR(255) NOT NULL,
    responder_role VARCHAR(150) NOT NULL,
    reply_content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hq_replies_dispatch ON hq_dispatch_replies(dispatch_id);

-- 17. Student Leadership & Organogram Hierarchy
CREATE TABLE IF NOT EXISTS student_leadership_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    portfolio VARCHAR(150) NOT NULL,
    candidate_student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    voter_student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
    ballot_hash VARCHAR(255) NOT NULL,
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (voter_student_id, portfolio, academic_session_id)
);
CREATE INDEX IF NOT EXISTS idx_leadership_votes_lookup ON student_leadership_votes(school_id, portfolio, academic_session_id);

CREATE TABLE IF NOT EXISTS organogram_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_key VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    holder_name VARCHAR(255) NOT NULL,
    wing VARCHAR(100) NOT NULL,
    arm VARCHAR(50),
    reports_to_node_key VARCHAR(100),
    description TEXT NOT NULL,
    responsibilities TEXT[] DEFAULT ARRAY[]::TEXT[],
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_organogram_wing ON organogram_nodes(wing);
