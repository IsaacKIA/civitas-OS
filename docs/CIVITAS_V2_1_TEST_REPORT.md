# CIVITAS ESTATE & MAINTENANCE
## Operations & Financial Management System — Version 2.1 QA Test Report
**Document ID:** `CIVITAS-V2.1-TEST-REPORT`  
**Execution Date:** November 11, 2026  
**Test Runner:** Node.js Built-In Test Runner (`node --test src/ops.test.ts`) + TypeScript Compiler (`tsc --noEmit`) + Vite Production Bundler (`vite build`)  

---

## 1. Execution Summary

| Suite / Verification Gate | Command Executed | Total Checks | Passed | Failed | Duration | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **TypeScript Static Type Check** | `npx tsc --noEmit` | All 12 modules | 12 | 0 | ~1.4s | **PASS** |
| **Automated QA Test Suite** | `npm test` (`node --test src/ops.test.ts`) | 15 | 15 | 0 | 862.9ms | **PASS** |
| **Production Bundle Build** | `npm run build` | `dist/` assets | 1 | 0 | ~1.8s | **PASS** |

---

## 2. Detailed Automated Test Results ([`src/ops.test.ts`](file:///F:/PROJECTS/civitas-operations-system/src/ops.test.ts))

### Category A: Core Accounting Regression Tests
1. **`Rule 1: Revenue is not cash; funding is not revenue`** — **PASS (21.6ms)**  
   Verified `totalRevenue === GH₵1,380.00`, `cashReceivedCustomers === GH₵1,380.00`, and `fundingReceived === GH₵0.00` (confirming `GH₵80,000` NEIP and `GH₵18,000` Founder planning lines are not counted as revenue or cash).
2. **`Rule 2: Field labour is counted once; person-days tracked separately from salaried staff`** — **PASS (7.6ms)**  
   Verified contractor assignments calculate person-days accurately and match `directLabour` in Management Accounts 1:1.
3. **`Rule 3: Straight-line depreciation calculates accurately`** — **PASS (2.2ms)**  
   Verified Asset `AS0001` (`GH₵2,200` cost, `GH₵200` residual value, `4` years useful life) computes `GH₵41.67/month`.
4. **`Rule 4: Working capital reserve is held as cash and not an operating expense`** — **PASS (4.8ms)**  
   Verified NEIP Category H (`GH₵22,000`) has `spentFromNEIP === 0`.
5. **`Rule 5: 52 Control Checks and 6 Reconciliation Totals evaluate cleanly`** — **PASS (2.8ms)**  
   Verified all 52 control checks execute and all 6 cross-register control totals report `RECONCILED` with `0.00` difference.
6. **`Rule 6: Closed months flag subsequent modifications (tamper-evident control)`** — **PASS (6.3ms)**  
   Verified Check #51 flags `Records changed after close` if underlying transaction counts diverge from close snapshot.

### Category B: Security, Authentication & RBAC Tests
7. **`Security 1: Credentials are salted and hashed (never stored in plaintext) and impersonation is blocked`** — **PASS (2.1ms)**  
   Verified `u.pinCode === undefined` and `u.passwordHash` begins with `cv21$` across all 5 users, and verified passwordless `loginAsUser('U0001')` throws `Security Policy Violation`.
8. **`Security 2: Brute-force protection locks account after 5 failed login attempts and blocks suspended users`** — **PASS (10.6ms)**  
   Verified 5 consecutive failed logins lock the account for 15 minutes (rejecting even valid PINs while locked) and suspended accounts cannot authenticate.
9. **`Security 3: Role-Based Access Control (RBAC) and session expiration are strictly enforced at the store layer`** — **PASS (2.7ms)**  
   Verified `Board / Internal Auditor` is blocked from creating customers, `Finance & Accounts Officer` is blocked from `closePeriod`, and expired sessions throw `Authentication Required`.

### Category C: Financial Controls & Accounting Tests
10. **`Financial 1: Expense approval workflow, non-CEO self-approval prevention, and CEO sign-off`** — **PASS (8.7ms)**  
    Verified a `GH₵850` expense recorded by the Finance Officer is forced to `Pending` and `Unpaid`, cannot be approved or paid by non-CEO roles, triggers Control Check #8, and clears once approved by the `Founder / CEO` and settled via `markExpensePaid()`.
11. **`Financial 2: Closed accounting period actively blocks modifications until reopened with a documented reason`** — **PASS (3.4ms)**  
    Verified authenticated users cannot insert invoices into closed month `2026-03-01`, `reopenPeriod` rejects short/empty reasons, and authorized reopening with a documented reason allows the adjustment.
12. **`Financial 3: Partial invoice payments, outstanding balance accuracy, and duplicate payment prevention`** — **PASS (4.1ms)**  
    Verified a `GH₵400` partial payment on a `GH₵1,000` invoice sets `balance = 600` (`Part paid`), blocks duplicate payment with identical reference `MOMO-TX-5001`, and settles to `balance = 0` (`Paid`) upon final `GH₵600` receipt.

### Category D: Data Integrity & Audit Trail Tests
13. **`Data Integrity 1: Unlimited audit log retention (>500 entries) and hash-chain verification`** — **PASS (263.7ms)**  
    Executed 520 sequential updates, confirmed `auditLogs.length > 520` (no truncation at 500), and verified `verifyAuditTrailIntegrity().valid === true`.
14. **`Data Integrity 2: Dataset validator rejects corrupted imports and duplicate IDs`** — **PASS (1.4ms)**  
    Verified `addCustomer` rejects duplicate ID `C0001` and `validateDataset` rejects malformed/duplicate JSON payloads.

### Category E: End-to-End Operational Workflow Test
15. **`Operations Workflow: Enquiry -> Quote -> Job -> Contractor Assignment -> Completion & Invoice -> Payment`** — **PASS (8.5ms)**  
    Verified complete 1-click progression from `E0900` → Quote (`GH₵450`) → Scheduled Job → Artisan Assignment (`GH₵150`) & Settlement → Tax Invoice (`GH₵450`) → Customer Payment (`GH₵450`), yielding `Job Gross Profit = GH₵300.00` and `Gross Margin = 67%`.

---

## 3. Unresolved Failures
- **None (`0` failures across all 15 automated test suites and static build checks).**

