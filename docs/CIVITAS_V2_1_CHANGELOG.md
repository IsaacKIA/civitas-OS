# CIVITAS ESTATE & MAINTENANCE
## Operations & Financial Management System — Version 2.1 Upgrade Summary & Changelog
**Release Version:** `2.1.0`  
**Release Date:** November 11, 2026  

---

## 1. Security Improvements (Phase Two)
- **Salted Cryptographic Credential Hashing ([`src/security.ts`](file:///F:/PROJECTS/civitas-operations-system/src/security.ts#L18-L62)):** Replaced plaintext `pinCode` storage with multi-round salted key derivation (`cv21$<USER_ID>$<HEX_DIGEST>`). Plaintext PINs are automatically stripped upon load/save (`sanitizeUsersCredentials`) and are never rendered in the Login Portal or User Directory.
- **Elimination of Unrestricted Account Impersonation ([`src/store.ts`](file:///F:/PROJECTS/civitas-operations-system/src/store.ts#L1661-L1697)):** Disabled passwordless `loginAsUser()` switching in Production mode. Any attempt to switch accounts without valid credentials throws a `Security Policy Violation` and records a `SECURITY_ALERT` in the audit trail.
- **Isolated Demo Sandbox Mode ([`src/store.ts`](file:///F:/PROJECTS/civitas-operations-system/src/store.ts#L185-L216)):** Separated demonstration/training data (`civitas_ops_demo_sandbox_v2_1`) from production records (`civitas_ops_store_v2_prod`).
- **Brute-Force Lockout & Session Timeout ([`src/store.ts`](file:///F:/PROJECTS/civitas-operations-system/src/store.ts#L1580-L1659)):** Added a 5-attempt failed login counter that locks the target account for 15 minutes (`lockedUntil`) and enforced a 30-minute idle session timeout (`SESSION_DURATION_MS`).
- **Store-Level Role-Based Access Control ([`src/security.ts`](file:///F:/PROJECTS/civitas-operations-system/src/security.ts#L84-L168), [`src/store.ts`](file:///F:/PROJECTS/civitas-operations-system/src/store.ts#L368-L396)):** Enforced granular action permissions (`MANAGE_USERS`, `APPROVE_EXPENSE`, `CLOSE_PERIOD`, `REOPEN_PERIOD`, `MANAGE_INVOICES_PAYMENTS`, `PAY_EXPENSE_OR_CONTRACTOR`, etc.) across all mutators.

## 2. Accounting & Financial Controls (Phases Four & Five)
- **Active Closed Accounting Period Protection ([`src/store.ts`](file:///F:/PROJECTS/civitas-operations-system/src/store.ts#L403-L423)):** Blocked adding or editing Invoices, Payments, Expenses, or Contractor Assignments dated inside a `'Closed'` accounting month.
- **Controlled Period Reopening ([`src/store.ts`](file:///F:/PROJECTS/civitas-operations-system/src/store.ts#L1407-L1432)):** Added `reopenPeriod(month, reason)` restricted to the `Founder / CEO`, requiring a documented business reason and recording `reopenedBy`, `reopenedDate`, and `reopenReason`.
- **Hardened Expense Workflow & Segregation of Duties ([`src/store.ts`](file:///F:/PROJECTS/civitas-operations-system/src/store.ts#L789-L905)):**
  - Enforced `Draft / Submitted -> Pending -> Approved / Rejected -> Paid` lifecycle.
  - Prevented non-CEO staff from self-approving expenses or marking unapproved expenses (`> GH₵500`) as `Paid`.
  - Added `markExpensePaid()` separating approval from payment disbursement.
  - Added documented `Lean Staffing Structure Executive Exception` audit logging when the Founder/CEO both prepares and approves an expense.
- **Duplicate ID & Duplicate Payment Prevention ([`src/store.ts`](file:///F:/PROJECTS/civitas-operations-system/src/store.ts#L735-L775)):** Blocked duplicate primary keys across all core registers and blocked duplicate payments sharing the same payment method, reference, and amount.
- **Funding Scenario & Financial Statement Disclosures ([`src/main.ts`](file:///F:/PROJECTS/civitas-operations-system/src/main.ts#L1302-L1320)):** Explicitly separated `GH₵80,000` NEIP and `GH₵18,000` Founder planning scenarios from actual cash (`GH₵0.00`), added configurable Ghana Revenue Authority (GRA) tax display, and disclosed the single-entry operational sub-ledger basis of the Management Accounts.

## 3. Data Persistence, Validation & Audit Trail (Phases Three & Eight)
- **Server-Side Transactional Persistence & Automated Daily Backups ([`vite.config.ts`](file:///F:/PROJECTS/civitas-operations-system/vite.config.ts)):** Added `/api/state` and `/api/backups` endpoints performing atomic writes to `data/civitas_db.json` and automatic daily rotating backups to `backups/civitas_auto_backup_YYYY-MM-DD.json`.
- **PostgreSQL / Supabase Cloud Schema ([`docs/supabase_schema.sql`](file:///F:/PROJECTS/civitas-operations-system/docs/supabase_schema.sql)):** Provided full relational DDL with foreign-key constraints and an immutable database trigger preventing `UPDATE` or `DELETE` on `civitas_audit_logs`.
- **Pre-Import Dataset Validation ([`src/security.ts`](file:///F:/PROJECTS/civitas-operations-system/src/security.ts#L194-L355)):** Added `validateAndInspectDataset()` to verify schema structure, primary key uniqueness, referential integrity, and financial totals prior to restoring backups.
- **Unlimited Tamper-Evident Audit Trail ([`src/store.ts`](file:///F:/PROJECTS/civitas-operations-system/src/store.ts#L604-L664)):** Removed the legacy 500-entry truncation limit, preserved existing audit logs across imports/resets, and chained every entry with a cryptographic hash (`entryHash`).

## 4. Operations Workflow & Executive Dashboard (Phases Six & Seven)
- **1-Click End-to-End Job Lifecycle ([`src/store.ts`](file:///F:/PROJECTS/civitas-operations-system/src/store.ts#L1435-L1562)):**
  - `convertEnquiryToQuote()` (`→ Create Quote`)
  - `approveQuoteAndCreateJob()` (`✓ Approve & Book Job`)
  - `completeJobAndGenerateInvoice()` (`✓ Complete & Invoice`)
  - `payContractorAssignment()` (`₵ Pay Artisan`)
- **Executive Pulse Banner ([`src/main.ts`](file:///F:/PROJECTS/civitas-operations-system/src/main.ts#L1125-L1156)):** Added the 3 core executive pulse indicators (*Are we getting customers?*, *Are we completing profitable jobs?*, *Are we collecting enough cash to operate?*) and all 12 primary KPIs.

## 5. Features Preserved & Known Limitations
- **Preserved:** All 30 operational registers, 52 automated control checks, 6 reconciliation totals, Civitas dark green/terracotta branding, A4 PDF print studio, and Ghana WhatsApp dispatch links.
- **Known Limitations:**
  1. Management accounts are reconciled from operational registers (single-entry sub-ledgers) rather than a full double-entry chart of accounts; statutory year-end IFRS financial statements and GRA tax filings require Chartered Accountant review.
  2. When deployed as a static bundle without the Node/Vite persistence middleware or Supabase backend, browser storage serves as the local fallback until synced or exported via `Backup JSON`.
