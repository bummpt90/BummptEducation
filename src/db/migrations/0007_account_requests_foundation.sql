-- =========================================================================
-- BummptEducation — Database Migration
-- Version: 0007
-- Name: account_requests_foundation
-- Description: Controlled Account Requests, Approval Ledger, and Password Reset Foundation
-- =========================================================================

-- 1. Create user_account_requests Table
CREATE TABLE IF NOT EXISTS user_account_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    requested_school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    surname VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    requested_role VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance & Scoping Indexes
CREATE INDEX IF NOT EXISTS idx_account_requests_status ON user_account_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_requests_school ON user_account_requests(requested_school_id);
CREATE INDEX IF NOT EXISTS idx_account_requests_email ON user_account_requests(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_account_requests_created ON user_account_requests(created_at DESC);
