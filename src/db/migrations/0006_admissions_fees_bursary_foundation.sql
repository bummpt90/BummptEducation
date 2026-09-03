-- =========================================================================
-- BummptEducation — Phase 6 Database Migration
-- Migration 0006: Admissions, Fee Structures, Invoicing, Payments & Bursary Foundation
-- =========================================================================

-- 1. Enhance Admissions Applications with Academic Session, Class & Decision Tracking
ALTER TABLE admission_applications
  ADD COLUMN IF NOT EXISTS academic_session_id UUID REFERENCES academic_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS admission_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS decision VARCHAR(50) DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS decision_notes TEXT,
  ADD COLUMN IF NOT EXISTS decision_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Backfill default session if available
UPDATE admission_applications
SET academic_session_id = (SELECT id FROM academic_sessions WHERE is_current = TRUE LIMIT 1)
WHERE academic_session_id IS NULL;

-- Expand status check constraint to support both existing title case and standardized uppercase
ALTER TABLE admission_applications DROP CONSTRAINT IF EXISTS admission_applications_status_check;
ALTER TABLE admission_applications ADD CONSTRAINT admission_applications_status_check
  CHECK (UPPER(status) IN (
    'PENDING REVIEW', 
    'ENTRANCE EXAM SCHEDULED', 
    'DEVELOPMENTAL SCREENING SCHEDULED', 
    'PASSED - ADMITTED', 
    'WAITLISTED', 
    'REJECTED',
    'APPLIED',
    'UNDER_REVIEW',
    'ACCEPTED',
    'WITHDRAWN',
    'ENROLLED'
  ));

CREATE INDEX IF NOT EXISTS idx_admissions_school_session ON admission_applications(school_id, academic_session_id);
CREATE INDEX IF NOT EXISTS idx_admissions_class ON admission_applications(class_id);
CREATE INDEX IF NOT EXISTS idx_admissions_student ON admission_applications(student_id);

-- 2. Create School-Scoped Fee Structures Table
CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
    academic_term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES fee_categories(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (UPPER(status) IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, academic_session_id, academic_term_id, class_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_fee_structures_school_session ON fee_structures(school_id, academic_session_id, academic_term_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_class ON fee_structures(class_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_category ON fee_structures(category_id);

-- 3. Create Student Fee Assessments Table
CREATE TABLE IF NOT EXISTS student_fee_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
    academic_term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE SET NULL,
    category_id UUID NOT NULL REFERENCES fee_categories(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    due_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (UPPER(status) IN ('PENDING', 'INVOICED', 'PAID', 'PARTIALLY_PAID', 'WAIVED', 'CANCELLED')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_fee_assessments_lookup ON student_fee_assessments(school_id, student_id, academic_term_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_assessments_status ON student_fee_assessments(status);

-- 4. Enhance Fee Invoices & Create Line Items
ALTER TABLE fee_invoices
  ADD COLUMN IF NOT EXISTS academic_session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

UPDATE fee_invoices fi
SET academic_session_id = t.session_id
FROM academic_terms t
WHERE fi.term_id = t.id AND fi.academic_session_id IS NULL;

ALTER TABLE fee_invoices DROP CONSTRAINT IF EXISTS fee_invoices_status_check;
ALTER TABLE fee_invoices ADD CONSTRAINT fee_invoices_status_check
  CHECK (UPPER(status) IN ('FULLY PAID', 'PAID', 'PARTIAL', 'PARTIALLY PAID', 'UNPAID', 'OVERDUE', 'CANCELLED'));

CREATE TABLE IF NOT EXISTS fee_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES fee_invoices(id) ON DELETE CASCADE,
    category_id UUID REFERENCES fee_categories(id) ON DELETE SET NULL,
    fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE SET NULL,
    assessment_id UUID REFERENCES student_fee_assessments(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_invoice_items_invoice ON fee_invoice_items(invoice_id);

-- 5. Enhance Fee Payments Ledger
ALTER TABLE fee_payments
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100),
  ADD COLUMN IF NOT EXISTS academic_session_id UUID REFERENCES academic_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recorded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'COMPLETED';

ALTER TABLE fee_payments ALTER COLUMN class_level DROP NOT NULL;
ALTER TABLE fee_payments ALTER COLUMN arm DROP NOT NULL;
ALTER TABLE fee_payments ALTER COLUMN collected_by DROP NOT NULL;
ALTER TABLE fee_payments ALTER COLUMN payment_method DROP NOT NULL;

ALTER TABLE fee_payments DROP CONSTRAINT IF EXISTS fee_payments_payment_method_check;
ALTER TABLE fee_payments ADD CONSTRAINT fee_payments_payment_method_check
  CHECK (payment_method IS NULL OR UPPER(payment_method) IN (
    'BANK TRANSFER', 'POS', 'CASH / BANK TELLER', 'ONLINE GATEWAY', 
    'BANK_TRANSFER', 'CASH', 'ONLINE_GATEWAY', 'CHEQUE', 'TELLER'
  ));

ALTER TABLE fee_payments DROP CONSTRAINT IF EXISTS fee_payments_status_check;
ALTER TABLE fee_payments ADD CONSTRAINT fee_payments_status_check
  CHECK (UPPER(status) IN ('FULLY PAID', 'PAID', 'PARTIAL', 'PARTIALLY PAID', 'UNPAID', 'COMPLETED', 'PENDING', 'FAILED', 'REVERSED', 'CANCELLED'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_fee_payments_payment_ref ON fee_payments(payment_reference) WHERE payment_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fee_payments_school ON fee_payments(school_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_invoice ON fee_payments(invoice_id);

-- 6. Bursary & Scholarship Ledger
CREATE TABLE IF NOT EXISTS bursary_awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
    academic_term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
    award_type VARCHAR(100) NOT NULL, -- e.g. 'MERIT_SCHOLARSHIP', 'INDIGENT_BURSARY', 'STAFF_CHILD_REBATE', 'STATE_SUBVENTION'
    award_amount NUMERIC(12,2) NOT NULL CHECK (award_amount >= 0),
    percentage NUMERIC(5,2) CHECK (percentage >= 0 AND percentage <= 100),
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED' 
      CHECK (UPPER(status) IN ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED')),
    reason TEXT NOT NULL,
    invoice_id UUID REFERENCES fee_invoices(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approval_date TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bursary_school_student ON bursary_awards(school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_bursary_status ON bursary_awards(status);

-- 7. Server-Authoritative Financial Audit Trail
CREATE TABLE IF NOT EXISTS financial_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    amount NUMERIC(12,2),
    details JSONB,
    ip_address VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fin_audit_school ON financial_audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_fin_audit_entity ON financial_audit_logs(entity_type, entity_id);
