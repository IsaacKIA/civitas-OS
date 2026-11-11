-- ============================================================================
-- CIVITAS ESTATE & MAINTENANCE — VERSION 2.1 POSTGRESQL / SUPABASE SCHEMA DDL
-- Purpose: Optional Managed PostgreSQL Cloud Persistence & Row-Level Security
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. SYSTEM USERS & RBAC
CREATE TABLE IF NOT EXISTS civitas_users (
  user_id VARCHAR(16) PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'Founder / CEO',
    'Operations Coordinator',
    'Finance & Accounts Officer',
    'Field Supervisor',
    'Board / Internal Auditor'
  )),
  department TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
  created_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_login TEXT,
  notes TEXT
);

-- 2. CUSTOMERS & PROPERTIES
CREATE TABLE IF NOT EXISTS civitas_customers (
  customer_id VARCHAR(16) PRIMARY KEY,
  customer_name TEXT NOT NULL,
  category TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  preferred_channel TEXT NOT NULL,
  area TEXT NOT NULL,
  lead_source TEXT NOT NULL,
  first_contact_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS civitas_properties (
  property_id VARCHAR(16) PRIMARY KEY,
  customer_id VARCHAR(16) NOT NULL REFERENCES civitas_customers(customer_id),
  property_type TEXT NOT NULL,
  area TEXT NOT NULL,
  address_or_description TEXT NOT NULL,
  gps_or_landmark TEXT,
  occupancy_or_use TEXT NOT NULL,
  active TEXT NOT NULL DEFAULT 'Yes'
);

-- 3. QUOTATIONS, JOBS, ASSIGNMENTS, INVOICES, PAYMENTS, EXPENSES
CREATE TABLE IF NOT EXISTS civitas_jobs (
  job_id VARCHAR(16) PRIMARY KEY,
  quote_id VARCHAR(16),
  customer_id VARCHAR(16) NOT NULL REFERENCES civitas_customers(customer_id),
  property_id VARCHAR(16) NOT NULL REFERENCES civitas_properties(property_id),
  division TEXT NOT NULL,
  service_id VARCHAR(16) NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  due_date DATE,
  completed_date DATE,
  status TEXT NOT NULL,
  quality_result TEXT NOT NULL DEFAULT 'Not inspected',
  rework_or_complaint TEXT NOT NULL DEFAULT 'No',
  quoted_price NUMERIC(12,2) DEFAULT 0,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS civitas_invoices (
  invoice_no VARCHAR(16) PRIMARY KEY,
  customer_id VARCHAR(16) NOT NULL REFERENCES civitas_customers(customer_id),
  job_id VARCHAR(16) REFERENCES civitas_jobs(job_id),
  invoice_date DATE NOT NULL,
  amount_before_tax NUMERIC(12,2) NOT NULL CHECK (amount_before_tax >= 0),
  credit_note_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (credit_note_amount >= 0),
  cancelled TEXT NOT NULL DEFAULT 'No',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS civitas_payments (
  payment_id VARCHAR(16) PRIMARY KEY,
  payment_date DATE NOT NULL,
  invoice_no VARCHAR(16) NOT NULL REFERENCES civitas_invoices(invoice_no),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL,
  reference TEXT,
  received_by TEXT,
  reconciliation_status TEXT NOT NULL DEFAULT 'Unreconciled',
  reconciled_date DATE,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS civitas_expenses (
  expense_id VARCHAR(16) PRIMARY KEY,
  expense_date DATE NOT NULL,
  supplier TEXT NOT NULL,
  supplier_reference TEXT,
  category TEXT NOT NULL,
  job_id VARCHAR(16) REFERENCES civitas_jobs(job_id),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'Unpaid',
  approval_status TEXT NOT NULL DEFAULT 'Pending',
  submitted_by TEXT,
  submitted_at TIMESTAMPTZ,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  self_approval_override_reason TEXT,
  evidence_reference TEXT,
  funding_source TEXT
);

-- 4. ACCOUNTING PERIOD CLOSE & IMMUTABLE AUDIT LOGS
CREATE TABLE IF NOT EXISTS civitas_period_close (
  month DATE PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('Open', 'Closed')),
  closed_by TEXT,
  closed_date DATE,
  invoices_at_close INT DEFAULT 0,
  payments_at_close INT DEFAULT 0,
  expenses_at_close INT DEFAULT 0,
  assignments_at_close INT DEFAULT 0,
  open_check_items_at_close INT DEFAULT 0,
  reopened_by TEXT,
  reopened_date DATE,
  reopen_reason TEXT
);

CREATE TABLE IF NOT EXISTS civitas_audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  details TEXT,
  previous_value TEXT,
  new_value TEXT,
  reason TEXT,
  auth_reference TEXT,
  entry_hash TEXT NOT NULL
);

-- Prevent UPDATE or DELETE on civitas_audit_logs by ordinary users
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_audit_logs ON civitas_audit_logs;
CREATE TRIGGER trg_immutable_audit_logs
BEFORE UPDATE OR DELETE ON civitas_audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();
