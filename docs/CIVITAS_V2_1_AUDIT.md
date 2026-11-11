# CIVITAS ESTATE & MAINTENANCE
## Operations & Financial Management System — Version 2.1 Technical & Financial Audit
**Document ID:** `CIVITAS-V2.1-AUDIT`  
**Date:** November 11, 2026  
**Prepared By:** Senior Engineering, Cybersecurity, Chartered Accountancy & Internal Audit Team  
**Baseline Commit:** `f7da9ce` (Backed up to `Civitas_Operations_System_Full_Backup_2026-11-11.zip` and `Civitas_Ops_Backup_2026-11-11.json`)

---

## 1. Executive Summary & Existing Architecture Assessment

### 1.1 Application Architecture
- **Frontend & Runtime Stack:** TypeScript (`^5.7.0`) + Vite (`^6.2.0`), zero heavy frontend framework dependencies, compiled with strict TypeScript checking (`tsc --noEmit && vite build`).
- **Core Modules:**
  - [`src/types.ts`](file:///F:/PROJECTS/civitas-operations-system/src/types.ts): 30 strongly-typed operational, financial, asset, grant, property inspection, governance, and user entities.
  - [`src/seed.ts`](file:///F:/PROJECTS/civitas-operations-system/src/seed.ts): Default settings, 16 standard service catalog items across *Civitas Fix*, *Civitas Care*, and *Civitas Property Watch*, NEIP/Founder funding planning lines, 8 NEIP grant budget categories, 11 compliance prompts, and 5 default user roles.
  - [`src/calculations.ts`](file:///F:/PROJECTS/civitas-operations-system/src/calculations.ts): Pure functional recalculation pipeline computing derived fields, margins, depreciation, job costs, and flags across all 30 registers.
  - [`src/management-accounts.ts`](file:///F:/PROJECTS/civitas-operations-system/src/management-accounts.ts): 12-month Management Accounts engine (Revenue by division, Direct Costs, Gross Contribution, Opex, EBITDA, Straight-Line Depreciation, Operating Profit, Capex, Cash Flow, and Receivables/Payables).
  - [`src/checks.ts`](file:///F:/PROJECTS/civitas-operations-system/src/checks.ts): 52 automated internal control checks, 6 cross-register reconciliation control totals, and 9 executive management alerts.
  - [`src/store.ts`](file:///F:/PROJECTS/civitas-operations-system/src/store.ts): Reactive state container (`OpsStore`), CRUD mutators, period close snapshots, authentication, and persistence.
  - [`src/reports.ts`](file:///F:/PROJECTS/civitas-operations-system/src/reports.ts): Printable A4 HTML generators for Quotations, Tax Invoices / Receipts, Monthly Management Reports, and Ghana WhatsApp dispatch links.
  - [`src/main.ts`](file:///F:/PROJECTS/civitas-operations-system/src/main.ts): Single-page UI controller managing the Landing Portal, Login Screen, and 11-module Sidebar Dashboard.

### 1.2 Existing Features Functioning Correctly (Must Be Preserved)
1. **30-Register Relational Recalculation Engine:** Automatic propagation from Quote Lines → Quotes → Jobs → Assignments/Expenses → Invoices → Payments → Management Accounts.
2. **Core Accounting Invariants:**
   - Revenue is recognized from net non-cancelled Invoices (`amountBeforeTax - creditNoteAmount`), never from Quotes or Cash Receipts.
   - Field contractor labour is counted once via `assignments` (never double-counted in `expenses`), separating contract artisans from salaried staff.
   - Working Capital Reserve (`GH₵22,000` NEIP Category H) is held as cash and never expensed.
   - Straight-line monthly depreciation (`(purchaseCost - residualValue) / (usefulLifeYears * 12)`).
3. **52 Internal Control Checks & 6 Reconciliation Totals:** Real-time detection of unbilled completed jobs, cost overruns, missing receipts, unreconciled payments, and expired compliance items.
4. **Civitas Brand Identity & Print Studio:** Dark green (`#075545`) and orange (`#FF5800`) branding, A4 Quotations, Invoices, Monthly Reports, and Ghana WhatsApp integration (`+233`).

---

## 2. Verified Security, Financial Control & Data Integrity Vulnerabilities

Every issue below was verified directly against the Version 2.0 codebase (`commit f7da9ce`):

| ID | Vulnerability / Control Weakness | Affected Files & Functions | Business & Financial Impact | Severity | Recommended V2.1 Correction | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **V-01** | **Unrestricted Account Switching & Impersonation (`loginAsUser`)** | [`src/store.ts`](file:///F:/PROJECTS/civitas-operations-system/src/store.ts#L935-L957) (`loginAsUser`), [`src/main.ts`](file:///F:/PROJECTS/civitas-operations-system/src/main.ts#L2383-L2395) (`#selectQuickSwitchUser`, `.btn-switch-to-user`, `.role-switch-card`) | Any user can switch into the `Founder / CEO` account with one click without entering a password/PIN, completely bypassing authentication and segregation of duties. | **CRITICAL** | Remove public unauthenticated `loginAsUser()`. Require credential verification for all production logins. Isolate Demo Sandbox mode from Production mode. | **P0 (Immediate)** |
| **V-02** | **Plaintext Credentials Stored & Displayed in UI** | [`src/seed.ts`](file:///F:/PROJECTS/civitas-operations-system/src/seed.ts#L117-L183) (`pinCode`), [`src/main.ts`](file:///F:/PROJECTS/civitas-operations-system/src/main.ts#L345-L355) (`renderLoginScreen`, `renderUsersAndGovernanceTab`) | User PINs/passwords are stored in plaintext in `localStorage` and rendered visibly on the Login screen and User Directory table (`PIN: 2026`). | **CRITICAL** | Replace plaintext `pinCode` storage with salted SHA-256/PBKDF2 password hashes (`passwordHash`). Never render credentials or PINs in the UI. | **P0 (Immediate)** |
| **V-03** | **Missing Brute-Force Lockout & Session Expiration** | [`src/store.ts`](file:///F:/PROJECTS/civitas-operations-system/src/store.ts#L915-L933) (`authenticateUser`, `loadSessionUser`) | Unlimited failed login guesses are allowed; active sessions in `sessionStorage` never expire when a workstation is left unattended. | **HIGH** | Implement failed attempt counter (lock account for 15 minutes after 5 failed attempts) and automatic 30-minute session inactivity expiration. | **P0 (Immediate)** |
| **V-04** | **Missing Store-Level RBAC Authorization & Segregation of Duties** | [`src/store.ts`](file:///F:/PROJECTS/civitas-operations-system/src/store.ts#L498-L1036) (`approveExpense`, `rejectExpense`, `closePeriod`, `addUser`, `updateUser`, `addInvoice`, etc.) | Permissions were only enforced by hiding buttons in the UI (`main.ts`). Calling `opsStore.approveExpense()` or `opsStore.closePeriod()` succeeded regardless of the logged-in user's role. | **CRITICAL** | Enforce strict action-based RBAC permissions inside `OpsStore` for every mutator. Enforce Segregation of Duties on expense approvals (`Draft → Submitted → Approved → Paid`). | **P0 (Immediate)** |
| **V-05** | **Closed Accounting Periods Not Protected Against Modification** | [`src/store.ts`](file:///F:/PROJECTS/civitas-operations-system/src/store.ts#L632-L682) (`addInvoice`, `addPayment`, `addExpense`, `addAssignment`) | Transactions can still be added or edited inside a closed accounting month (`status === 'Closed'`), only raising a passive warning flag after the fact. | **CRITICAL** | Actively block any creation or modification of Invoices, Payments, Expenses, or Assignments in a closed month. Add controlled `reopenPeriod(month, reason)` restricted to `Founder / CEO`. | **P0 (Immediate)** |
| **V-06** | **Audit Log Truncation at 500 Entries & Overwrite on Import** | [`src/store.ts`](file:///F:/PROJECTS/civitas-operations-system/src/store.ts#L490-L492) (`logAction`), [`src/store.ts`](file:///F:/PROJECTS/civitas-operations-system/src/store.ts#L1046-L1054) (`loadState`) | `if (this.state.auditLogs.length > 500) this.state.auditLogs.pop()` permanently deletes historical financial audit records. Importing a JSON file overwrites existing audit logs. | **CRITICAL** | Remove the 500-entry cap. Add `userId`, `previousValue`, `newValue`, `reason`, and tamper-evident hash chaining (`entryHash`). Preserve and append audit logs during imports. | **P0 (Immediate)** |
| **V-07** | **Exclusive Reliance on Browser `localStorage` Without Server Persistence** | [`src/store.ts`](file:///F:/PROJECTS/civitas-operations-system/src/store.ts#L216-L225) (`saveToStorage`) | Clearing browser data or switching devices loses company financial records; no automated server-side backup exists. | **CRITICAL** | Implement a Server-Side Transactional Persistence & Automated Backup API (`/api/state`, `/api/backup`, `/api/restore`) writing to `data/civitas_db.json` and `backups/`, plus Supabase PostgreSQL migration DDL (`docs/supabase_schema.sql`). | **P0 (Immediate)** |
| **V-08** | **Unvalidated JSON Import & Missing Duplicate/Reference Guards** | [`src/main.ts`](file:///F:/PROJECTS/civitas-operations-system/src/main.ts#L2334-L2341), [`src/store.ts`](file:///F:/PROJECTS/civitas-operations-system/src/store.ts#L506-L682) | Importing malformed JSON or duplicate IDs corrupts state; store mutators allow duplicate `invoiceNo`, duplicate `paymentId`, or negative amounts. | **HIGH** | Implement `validateAndInspectDataset()` checking schema integrity, duplicate IDs, orphaned foreign keys, and financial reconciliation totals before import or mutation. | **P1 (High)** |
| **V-09** | **Manual Re-Entry Across the Operations Workflow** | [`src/main.ts`](file:///F:/PROJECTS/civitas-operations-system/src/main.ts) (Sales, Quotes, Jobs, Invoices tabs) | Staff must manually re-enter customer, property, and pricing details when moving from Enquiry → Quote → Job → Invoice → Payment. | **MEDIUM** | Add 1-click workflow progression actions (`Convert Enquiry → Quote`, `Approve Quote → Schedule Job`, `Complete Job → Generate Invoice`, `Settle Contractor Assignment`). | **P1 (High)** |
| **V-10** | **Financial Statement Scope & Funding Scenario Disclosure** | [`src/management-accounts.ts`](file:///F:/PROJECTS/civitas-operations-system/src/management-accounts.ts), [`src/seed.ts`](file:///F:/PROJECTS/civitas-operations-system/src/seed.ts#L69-L90) | Management accounts need explicit disclosure of single-entry operational sub-ledger basis vs. full IFRS double-entry GL, and clear separation of GH₵80k/GH₵18k planning scenarios from actual cash. | **MEDIUM** | Add explicit accounting basis disclosures, configurable Ghana Revenue Authority (GRA) tax rates, and clear separation of Projected Funding Scenarios vs. Actual Cash Received. | **P1 (High)** |

---

## 3. Version 2.1 Implementation Sequence & Rollback Strategy

1. **Stage 1 — Baseline & Backup (Completed):** Full repository committed to Git (`f7da9ce`) and backed up to Desktop and workspace (`Civitas_Operations_System_Full_Backup_2026-11-11.zip` and `Civitas_Ops_Backup_2026-11-11.json`).
2. **Stage 2 — Security, Authentication & RBAC Engine (`src/security.ts` & `src/store.ts`):** Salted credential hashing, lockout controls, session expiry, removal of production account impersonation, and strict backend/store RBAC matrix.
3. **Stage 3 — Server Persistence, Data Validation & Automated Backup (`vite.config.ts`, `src/security.ts`, `docs/supabase_schema.sql`):** Local transactional server storage (`data/civitas_db.json`), rotating server backups (`backups/`), pre-import validation, and PostgreSQL schema readiness.
4. **Stage 4 — Financial Controls & Accounting Hardening (`src/store.ts`, `src/calculations.ts`):** Closed-period write protection, controlled period reopening with mandatory reason, 4-stage expense workflow (`Draft → Submitted → Approved/Rejected → Paid`) with Segregation of Duties, duplicate payment prevention, and credit note support.
5. **Stage 5 & 6 — Operations Workflow Automation & Executive Dashboard (`src/store.ts`, `src/main.ts`):** One-click Enquiry → Quote → Job → Invoice → Payment progression and enhanced 12-indicator Executive Dashboard.
6. **Stage 7 & 8 — Comprehensive QA Test Suite & Documentation (`src/ops.test.ts`, `docs/`):** Security, Financial, Data Integrity, and Operational automated tests plus Changelog, Test Report, Deployment Guide, and User Guide.
