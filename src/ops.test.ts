/**
 * CIVITAS ESTATE & MAINTENANCE
 * Operations & Financial Control System — Version 2.1 Comprehensive QA Test Suite
 * Verifying Core Accounting Rules, Security & RBAC, Financial Controls, Data Integrity, and End-to-End Operations.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { OpsStore } from './store.ts';
import { createDemoState } from './demo-data.ts';
import { roundMoney } from './calculations.ts';

describe('Civitas Operations & Financial Control System — Version 2.1 Suite', () => {

  // ==========================================
  // 1. CORE ACCOUNTING INVARIANTS (REGRESSION)
  // ==========================================
  it('Rule 1: Revenue is not cash; funding is not revenue', () => {
    const store = new OpsStore();
    store.loadState(createDemoState());
    const mgmt = store.getManagementAccounts();

    assert.strictEqual(mgmt.yearTotal.totalRevenue, 1380.00); // 650 + 450 + 280
    assert.strictEqual(mgmt.yearTotal.cashReceivedCustomers, 1380.00);
    assert.strictEqual(mgmt.yearTotal.fundingReceived, 0.00); // Funding planning scenarios (GH₵80k / GH₵18k) are never revenue or cash until received
  });

  it('Rule 2: Field labour is counted once; person-days tracked separately from salaried staff', () => {
    const store = new OpsStore();
    store.loadState(createDemoState());
    const state = store.getState();

    const indOrTempAssignments = state.assignments.filter(
      a => a.workerType === 'Independent contractor' || a.workerType === 'Temporary worker'
    );
    const totalPersonDays = indOrTempAssignments.reduce((s, a) => s + (a.personDays || 0), 0);
    assert.ok(totalPersonDays > 0, 'Person-days must be tracked');

    const mgmt = store.getManagementAccounts();
    const sumAssignments = state.assignments.reduce((s, a) => s + (a.amount || 0), 0);
    assert.strictEqual(mgmt.yearTotal.directLabour, roundMoney(sumAssignments));
  });

  it('Rule 3: Straight-line depreciation calculates accurately', () => {
    const store = new OpsStore();
    store.loadState(createDemoState());
    const state = store.getState();

    const asset = state.assets.find(a => a.assetId === 'AS0001');
    assert.ok(asset, 'Asset AS0001 must exist');
    assert.strictEqual(asset!.depreciable, 'Yes');
    assert.strictEqual(asset!.purchaseCost, 2200);
    assert.strictEqual(asset!.residualValue, 200);
    assert.strictEqual(asset!.usefulLifeYears, 4);
    assert.strictEqual(asset!.monthlyDepreciation, 41.67);
  });

  it('Rule 4: Working capital reserve is held as cash and not an operating expense', () => {
    const store = new OpsStore();
    store.loadState(createDemoState());
    const state = store.getState();

    const reserveCat = state.grantBudget.find(c => c.grantCategory === 'Working capital reserve');
    assert.ok(reserveCat, 'Reserve category must exist');
    assert.strictEqual(reserveCat!.budget, 22000);
    assert.strictEqual(reserveCat!.spentFromNEIP, 0);
  });

  it('Rule 5: 52 Control Checks and 6 Reconciliation Totals evaluate cleanly', () => {
    const store = new OpsStore();
    store.loadState(createDemoState());
    const evaluation = store.getChecksEvaluation();

    assert.strictEqual(evaluation.checks.length, 52, 'Must evaluate exactly 52 control checks');
    assert.strictEqual(evaluation.controlTotals.length, 6, 'Must evaluate 6 reconciliation control totals');

    evaluation.controlTotals.forEach(t => {
      assert.strictEqual(t.status, 'RECONCILED', `Control total ${t.name} must be RECONCILED`);
      assert.strictEqual(t.countOrValue, 0.00, `Difference for ${t.name} must be 0.00`);
    });
  });

  it('Rule 6: Closed months flag subsequent modifications (tamper-evident control)', () => {
    const store = new OpsStore();
    store.loadState(createDemoState());

    let period = store.getState().periodClose.find(p => p.month === '2026-03-01');
    assert.ok(period, 'March 2026 must be in close register');
    assert.strictEqual(period!.status, 'Closed');
    assert.strictEqual(period!.changedFlag, '');

    store.addInvoice({
      invoiceNo: 'INV9999',
      customerId: 'C0001',
      invoiceDate: '2026-03-25',
      amountBeforeTax: 500,
      cancelled: 'No'
    });

    period = store.getState().periodClose.find(p => p.month === '2026-03-01');
    assert.strictEqual(period?.changedFlag, 'Records changed after close', 'System must flag late modifications to closed months');
  });

  // ==========================================
  // 2. SECURITY & AUTHENTICATION TESTS (PHASE 2)
  // ==========================================
  it('Security 1: Only Founder exists initially; Founder can add & delete users; credentials are salted and hashed', () => {
    const store = new OpsStore();
    store.loadState(createDemoState());

    const users = store.getUsers();
    assert.strictEqual(users.length, 1, 'Only the Founder / CEO (U0001) should exist initially');
    assert.strictEqual(users[0].userId, 'U0001');
    assert.strictEqual(users[0].role, 'Founder / CEO');
    users.forEach(u => {
      assert.strictEqual(u.pinCode, undefined, `User ${u.userId} must not retain plaintext pinCode`);
      assert.ok(u.passwordHash?.startsWith('cv21$'), `User ${u.userId} must store salted passwordHash`);
    });

    // Attempting passwordless account switching in production mode must throw
    assert.throws(
      () => store.loginAsUser('U0001'),
      /Security Policy Violation: Unrestricted account switching is disabled in production/,
      'Passwordless loginAsUser must be blocked in production'
    );

    // Sign in as Founder and add a staff user from the dashboard store
    store.authenticateUser('admin@civitasestate.com', '2026');
    store.addUser({
      userId: 'U0002',
      fullName: 'Ama Osei',
      email: 'operations@civitasestate.com',
      phone: '+233 55 506 2589',
      role: 'Operations Coordinator',
      department: 'Service Operations',
      pinCode: '1111',
      status: 'Active',
      createdDate: '2026-01-15'
    });
    assert.strictEqual(store.getUsers().length, 2);

    // Primary Founder (U0001) cannot be deleted, but U0002 can be deleted by Founder
    assert.throws(() => store.deleteUser('U0001'), /Primary Founder \/ CEO account \(U0001\) cannot be deleted/);
    store.deleteUser('U0002');
    assert.strictEqual(store.getUsers().length, 1);
  });

  it('Security 2: Brute-force protection locks account after 5 failed login attempts and blocks suspended users', () => {
    const store = new OpsStore();
    store.loadState(createDemoState());

    // Founder logs in and provisions U0002 (Operations) and U0004 (Field Supervisor)
    store.authenticateUser('admin@civitasestate.com', '2026');
    store.addUser({
      userId: 'U0002',
      fullName: 'Ama Osei',
      email: 'operations@civitasestate.com',
      phone: '+233 55 506 2589',
      role: 'Operations Coordinator',
      department: 'Service Operations',
      pinCode: '1111',
      status: 'Active',
      createdDate: '2026-01-15'
    });
    store.addUser({
      userId: 'U0004',
      fullName: 'Yaw Asante',
      email: 'field@civitasestate.com',
      phone: '+233 27 409 8812',
      role: 'Field Supervisor',
      department: 'Field Operations',
      pinCode: '3333',
      status: 'Active',
      createdDate: '2026-02-10'
    });

    // 5 failed attempts on U0002 (Ama Osei)
    for (let i = 1; i <= 4; i++) {
      const res = store.authenticateUser('operations@civitasestate.com', '9999');
      assert.strictEqual(res.success, false);
    }
    const fifth = store.authenticateUser('operations@civitasestate.com', '9999');
    assert.strictEqual(fifth.success, false);
    assert.ok(fifth.error?.includes('Account locked for 15 minutes'), 'Must lock account on 5th failed attempt');

    // Even with the correct PIN ('1111'), login must be rejected while locked
    const whileLocked = store.authenticateUser('operations@civitasestate.com', '1111');
    assert.strictEqual(whileLocked.success, false);
    assert.ok(whileLocked.error?.includes('Account temporarily locked'));

    // Authenticate as CEO and suspend U0004
    const ceoAuth = store.authenticateUser('admin@civitasestate.com', '2026');
    assert.strictEqual(ceoAuth.success, true);
    store.updateUser('U0004', { status: 'Suspended' });

    const suspendedAuth = store.authenticateUser('field@civitasestate.com', '3333');
    assert.strictEqual(suspendedAuth.success, false);
    assert.ok(suspendedAuth.error?.includes('suspended'));
  });

  it('Security 3: Role-Based Access Control (RBAC) and session expiration are strictly enforced at the store layer', () => {
    const store = new OpsStore();
    store.loadState(createDemoState());

    // Founder provisions Internal Auditor (U0005) and Finance Officer (U0003)
    store.authenticateUser('admin@civitasestate.com', '2026');
    store.addUser({
      userId: 'U0005',
      fullName: 'Abena Danquah',
      email: 'audit@civitasestate.com',
      phone: '+233 50 611 4400',
      role: 'Board / Internal Auditor',
      department: 'Board & Audit',
      pinCode: '4444',
      status: 'Active',
      createdDate: '2026-03-01'
    });
    store.addUser({
      userId: 'U0003',
      fullName: 'Kofi Boateng',
      email: 'finance@civitasestate.com',
      phone: '+233 24 812 3901',
      role: 'Finance & Accounts Officer',
      department: 'Finance & Control',
      pinCode: '2222',
      status: 'Active',
      createdDate: '2026-02-01'
    });

    // Sign in as Read-Only Internal Auditor (U0005, PIN 4444)
    const auditorAuth = store.authenticateUser('audit@civitasestate.com', '4444');
    assert.strictEqual(auditorAuth.success, true);

    assert.throws(
      () => store.addCustomer({
        customerId: 'C0999',
        customerName: 'Unauthorized Client',
        category: 'Homeowner',
        phone: '0240000000',
        email: '',
        preferredChannel: 'WhatsApp',
        area: 'East Legon',
        leadSource: 'WhatsApp',
        dateAcquired: '2026-06-01',
        relationshipOwner: 'Audit',
        consentRecorded: 'Yes',
        closed: 'No'
      }),
      /Access Denied: Role 'Board \/ Internal Auditor' is not authorized/,
      'Internal Auditor must be blocked from creating records'
    );

    // Sign in as Finance Officer (U0003, PIN 2222)
    store.authenticateUser('finance@civitasestate.com', '2222');
    assert.throws(
      () => store.closePeriod('2026-05-01'),
      /Access Denied: Role 'Finance & Accounts Officer' is not authorized for 'CLOSE_PERIOD'/,
      'Finance Officer must be blocked from closing accounting periods'
    );

    // Expire session and verify subsequent action is blocked
    store.setSessionExpiresAtForTest(Date.now() - 1000);
    assert.throws(
      () => store.addInvoice({
        invoiceNo: 'INV0888',
        customerId: 'C0001',
        invoiceDate: '2026-06-01',
        amountBeforeTax: 300
      }),
      /Authentication Required/,
      'Expired session must block mutations'
    );
  });

  // ==========================================
  // 3. FINANCIAL CONTROLS & ACCOUNTING TESTS (PHASE 4)
  // ==========================================
  it('Financial 1: Expense approval workflow, non-CEO self-approval prevention, and CEO sign-off', () => {
    const store = new OpsStore();
    store.loadState(createDemoState());

    // Founder provisions Finance Officer (U0003, PIN 2222)
    store.authenticateUser('admin@civitasestate.com', '2026');
    store.addUser({
      userId: 'U0003',
      fullName: 'Kofi Boateng',
      email: 'finance@civitasestate.com',
      phone: '+233 24 812 3901',
      role: 'Finance & Accounts Officer',
      department: 'Finance & Control',
      pinCode: '2222',
      status: 'Active',
      createdDate: '2026-02-01'
    });

    // Authenticate as Finance Officer (Kofi Boateng, U0003, PIN 2222)
    const finAuth = store.authenticateUser('finance@civitasestate.com', '2222');
    assert.strictEqual(finAuth.success, true);

    // Even if Finance Officer tries to pass approvalStatus: 'Approved' on a GH₵850 expense, store forces 'Pending' & 'Unpaid'
    store.addExpense({
      expenseId: 'EX0999',
      expenseDate: '2026-05-12',
      supplier: 'Accra Plumbing Depot',
      category: 'Direct materials',
      jobId: 'J0001',
      amount: 850,
      paymentMethod: 'Mobile money',
      paymentStatus: 'Paid',
      approvalStatus: 'Approved',
      evidenceReference: 'INV-APD-999',
      fundingSource: 'Operations (customer receipts)'
    });

    const recordedExp = store.getState().expenses.find(e => e.expenseId === 'EX0999');
    assert.strictEqual(recordedExp?.approvalStatus, 'Pending', 'Non-CEO expense > GH₵500 must be forced to Pending');
    assert.strictEqual(recordedExp?.paymentStatus, 'Unpaid', 'Pending expense cannot be marked Paid prior to approval');

    // Finance officer cannot approve the expense or pay it before approval
    assert.throws(() => store.approveExpense('EX0999'), /Access Denied/);
    assert.throws(() => store.markExpensePaid('EX0999', 'Mobile money', 'MOMO-999'), /must be Approved before payment/);

    // Check #8 must flag 1 unapproved expense
    let check8 = store.getChecksEvaluation().checks.find(c => c.checkNumber === 8);
    assert.strictEqual(check8?.status, 'ATTENTION');

    // Authenticate as Founder / CEO (U0001, PIN 2026) and approve
    store.authenticateUser('admin@civitasestate.com', '2026');
    store.approveExpense('EX0999');

    const approvedExp = store.getState().expenses.find(e => e.expenseId === 'EX0999');
    assert.strictEqual(approvedExp?.approvalStatus, 'Approved');
    assert.ok(approvedExp?.approvedBy?.includes('Isaac Agya Koomson'));

    // Now Finance Officer or CEO can mark it Paid
    store.markExpensePaid('EX0999', 'Mobile money', 'MOMO-999');
    assert.strictEqual(store.getState().expenses.find(e => e.expenseId === 'EX0999')?.paymentStatus, 'Paid');

    check8 = store.getChecksEvaluation().checks.find(c => c.checkNumber === 8);
    assert.strictEqual(check8?.status, 'OK');
  });

  it('Financial 2: Closed accounting period actively blocks modifications until reopened with a documented reason', () => {
    const store = new OpsStore();
    store.loadState(createDemoState());
    store.authenticateUser('admin@civitasestate.com', '2026');

    // March 2026 (2026-03-01) is Closed in demo state
    assert.throws(
      () => store.addInvoice({
        invoiceNo: 'INV0777',
        customerId: 'C0001',
        invoiceDate: '2026-03-15',
        amountBeforeTax: 400
      }),
      /Accounting period 2026-03-01 is CLOSED/,
      'Must block adding an invoice into a closed accounting period'
    );

    // Reopening without a valid reason must fail
    assert.throws(
      () => store.reopenPeriod('2026-03-01', 'abc'),
      /documented business reason/,
      'Reopening period requires at least 5 characters reason'
    );

    // Authorized reopen with documented reason succeeds
    store.reopenPeriod('2026-03-01', 'Late vendor adjustment authorized by executive review');
    store.addInvoice({
      invoiceNo: 'INV0777',
      customerId: 'C0001',
      invoiceDate: '2026-03-15',
      amountBeforeTax: 400
    });
    assert.ok(store.getState().invoices.some(i => i.invoiceNo === 'INV0777'));
  });

  it('Financial 3: Partial invoice payments, outstanding balance accuracy, and duplicate payment prevention', () => {
    const store = new OpsStore();
    store.loadState(createDemoState());
    store.authenticateUser('admin@civitasestate.com', '2026');

    store.addInvoice({
      invoiceNo: 'INV0500',
      customerId: 'C0001',
      invoiceDate: '2026-06-10',
      amountBeforeTax: 1000,
      cancelled: 'No'
    });

    // Record partial payment of GH₵400
    store.addPayment({
      paymentId: 'PAY0501',
      paymentDate: '2026-06-11',
      invoiceNo: 'INV0500',
      amount: 400,
      method: 'Mobile money',
      reference: 'MOMO-TX-5001',
      reconciliationStatus: 'Reconciled'
    });

    let inv = store.getState().invoices.find(i => i.invoiceNo === 'INV0500')!;
    assert.strictEqual(inv.paymentsReceived, 400);
    assert.strictEqual(inv.balance, 600);
    assert.strictEqual(inv.status, 'Part paid');

    // Attempting to record the exact same payment reference and amount again must be blocked
    assert.throws(
      () => store.addPayment({
        paymentId: 'PAY0502',
        paymentDate: '2026-06-11',
        invoiceNo: 'INV0500',
        amount: 400,
        method: 'Mobile money',
        reference: 'MOMO-TX-5001',
        reconciliationStatus: 'Unreconciled'
      }),
      /Duplicate payment blocked/,
      'Duplicate payment reference must be blocked'
    );

    // Record remaining balance of GH₵600
    store.addPayment({
      paymentId: 'PAY0503',
      paymentDate: '2026-06-12',
      invoiceNo: 'INV0500',
      amount: 600,
      method: 'Bank transfer',
      reference: 'BNK-TX-5002',
      reconciliationStatus: 'Reconciled'
    });

    inv = store.getState().invoices.find(i => i.invoiceNo === 'INV0500')!;
    assert.strictEqual(inv.balance, 0);
    assert.strictEqual(inv.status, 'Paid');
  });

  // ==========================================
  // 4. DATA INTEGRITY & AUDIT TRAIL TESTS (PHASES 3 & 8)
  // ==========================================
  it('Data Integrity 1: Unlimited audit log retention (>500 entries) and hash-chain verification', () => {
    const store = new OpsStore();
    store.loadState(createDemoState());
    store.authenticateUser('admin@civitasestate.com', '2026');

    for (let i = 1; i <= 520; i++) {
      store.updateCustomer('C0001', { feedbackNotes: `Audit stress test iteration ${i}` });
    }

    assert.ok(store.getState().auditLogs.length > 520, 'Audit log must not truncate at 500 entries');
    const chainStatus = store.verifyAuditTrailIntegrity();
    assert.strictEqual(chainStatus.valid, true, 'Cryptographic audit hash chain must verify cleanly');
  });

  it('Data Integrity 2: Dataset validator rejects corrupted imports and duplicate IDs', () => {
    const store = new OpsStore();
    store.loadState(createDemoState());
    store.authenticateUser('admin@civitasestate.com', '2026');

    assert.throws(
      () => store.addCustomer({
        customerId: 'C0001',
        customerName: 'Duplicate ID Client',
        category: 'Homeowner',
        phone: '0241112222',
        email: '',
        preferredChannel: 'WhatsApp',
        area: 'East Legon',
        leadSource: 'WhatsApp',
        dateAcquired: '2026-06-01',
        relationshipOwner: 'Admin',
        consentRecorded: 'Yes',
        closed: 'No'
      }),
      /Duplicate Customer ID: C0001/,
      'Duplicate Customer ID must be rejected'
    );

    const badDataset: any = { settings: {}, customers: [{ customerId: 'C1' }, { customerId: 'C1' }] };
    const report = store.validateDataset(badDataset);
    assert.strictEqual(report.valid, false);
    assert.ok(report.errors.length > 0);
  });

  // ==========================================
  // 5. END-TO-END OPERATIONAL WORKFLOW TEST (PHASE 6)
  // ==========================================
  it('Operations Workflow: Enquiry -> Quote -> Job -> Contractor Assignment -> Completion & Invoice -> Payment', () => {
    const store = new OpsStore();
    store.loadState(createDemoState());
    store.authenticateUser('admin@civitasestate.com', '2026');

    // 1. Log new customer enquiry
    store.addEnquiry({
      enquiryId: 'E0900',
      enquiryDate: '2026-07-01',
      contactName: 'Dr. Kwesi Mensah',
      phone: '0249998888',
      area: 'Cantonments & Labone',
      leadSource: 'Referral',
      serviceInterest: 'AC servicing',
      notes: 'Full servicing of 3 split AC units',
      qualified: 'Yes',
      stage: 'New Enquiry'
    });

    // 2. Convert Enquiry -> Quote (S14 AC servicing @ GH₵450)
    const quote = store.convertEnquiryToQuote('E0900', 'S14', 1);
    assert.strictEqual(quote.status, 'Sent');
    assert.strictEqual(quote.netOfDiscount, 450);

    // 3. Approve Quote -> Schedule Job
    const job = store.approveQuoteAndCreateJob(quote.quoteId, '2026-07-03');
    assert.strictEqual(job.status, 'Scheduled');
    assert.strictEqual(job.quotedAmount, 450);

    // 4. Assign Field Technician (W0001, GH₵150) & settle contractor payment
    store.addAssignment({
      assignmentId: 'A0900',
      jobId: job.jobId,
      contractorId: 'W0001',
      assignmentDate: '2026-07-03',
      payBasis: 'Per day',
      quantity: 1,
      rate: 150,
      paymentStatus: 'Unpaid'
    });
    store.payContractorAssignment('A0900', 'Mobile money', 'MOMO-ARTISAN-900', '2026-07-03');

    // 5. Complete Job -> Generate Tax Invoice
    const inv = store.completeJobAndGenerateInvoice(job.jobId, '2026-07-04');
    assert.strictEqual(inv.amountBeforeTax, 450);

    // 6. Record Customer Payment
    store.addPayment({
      paymentId: 'PAY0900',
      paymentDate: '2026-07-04',
      invoiceNo: inv.invoiceNo,
      amount: 450,
      method: 'Mobile money',
      reference: 'MOMO-CUST-900',
      reconciliationStatus: 'Reconciled'
    });

    // Verify Job Profitability (Gross Profit = 450 - 150 = 300; Gross Margin = 300 / 450 = 67%)
    const finalJob = store.getState().jobs.find(j => j.jobId === job.jobId)!;
    assert.strictEqual(finalJob.invoicedNet, 450);
    assert.strictEqual(finalJob.actualLabour, 150);
    assert.strictEqual(finalJob.jobContribution, 300);
    assert.strictEqual(finalJob.marginPct, 0.67);
  });

  it('Smart Document Upload: Auto-creates Quotation, Tax Invoice, Payment Receipt, and Expense entries while keeping all 6 Reconciliations at 0.00', () => {
    const store = new OpsStore();
    store.loadState(createDemoState());
    store.authenticateUser('admin@civitasestate.com', '2026');

    // 1. Upload Quotation for a brand new client
    const qRes = store.autoPostUploadedDocument({
      docType: 'quotation',
      partyName: 'Nana Ama Danquah',
      description: 'Full villa electrical surge protection & panel upgrade',
      amount: 2400,
      date: '2026-07-05',
      category: 'Electrical',
      area: 'Airport Residential',
      fileName: 'Quote_NanaAma_2400.pdf'
    });
    assert.strictEqual(qRes.documentType, 'quote');
    assert.ok(store.getState().quotes.some(q => q.quoteId === qRes.primaryId && q.netOfDiscount === 2400));

    // 2. Upload Tax Invoice for the same client
    const invRes = store.autoPostUploadedDocument({
      docType: 'invoice',
      partyName: 'Nana Ama Danquah',
      description: 'Full villa electrical surge protection & panel upgrade',
      amount: 2400,
      date: '2026-07-06',
      category: 'Electrical',
      area: 'Airport Residential',
      fileName: 'Invoice_NanaAma_2400.pdf'
    });
    assert.strictEqual(invRes.documentType, 'invoice');
    assert.ok(store.getState().invoices.some(i => i.invoiceNo === invRes.primaryId && i.amountBeforeTax === 2400));

    // 3. Upload Official Payment Receipt (auto-matches the open invoice or creates backing invoice if needed)
    const recRes = store.autoPostUploadedDocument({
      docType: 'payment_receipt',
      partyName: 'Nana Ama Danquah',
      description: 'Settlement of Electrical Surge Protection Invoice',
      amount: 2400,
      date: '2026-07-06',
      paymentMethod: 'Mobile Money',
      reference: 'MOMO-UPL-9901',
      fileName: 'Receipt_NanaAma_2400.pdf'
    });
    assert.strictEqual(recRes.documentType, 'receipt');
    assert.ok(store.getState().payments.some(p => p.paymentId === recRes.primaryId && p.amount === 2400));

    // 4. Upload Supplier Expense Receipt
    const expRes = store.autoPostUploadedDocument({
      docType: 'expense_receipt',
      partyName: 'Electroland Ghana Ltd',
      description: 'Schneider surge arrestors & breaker switches',
      amount: 850,
      date: '2026-07-06',
      category: 'Materials',
      paymentMethod: 'Mobile Money',
      reference: 'SUP-INV-7712',
      fileName: 'Electroland_Receipt_850.jpg'
    });
    assert.strictEqual(expRes.documentType, 'expense');
    assert.ok(store.getState().expenses.some(e => e.expenseId === expRes.primaryId && e.amount === 850));

    // Verify all 6 Reconciliation Control Totals remain RECONCILED (0.00 diff)
    const evaluation = store.getChecksEvaluation();
    evaluation.controlTotals.forEach(t => {
      assert.strictEqual(t.status, 'RECONCILED', `Control total ${t.name} must remain RECONCILED after smart upload`);
      assert.strictEqual(t.countOrValue, 0.00, `Difference for ${t.name} must remain 0.00`);
    });
  });

  it('Capital, Grants, Loans & Founder Drawings: Proper equity, debt, and contra-equity treatment with grant ring-fencing', () => {
    const store = new OpsStore();
    store.loadState(createDemoState());
    store.authenticateUser('admin@civitasestate.com', '2026');

    const beforeAcct = store.getManagementAccounts();
    const baseRevenue = beforeAcct.yearTotal.totalRevenue;
    const baseOpex = beforeAcct.yearTotal.totalOpex;
    const baseCash = beforeAcct.yearTotal.closingCash;

    // 1. Founder injects additional GH₵15,000 equity capital
    store.addFundingLine({
      fundingId: 'FND0010',
      dateReceived: '2026-07-10',
      source: 'Founder capital',
      status: 'Received',
      amountRequested: 15000,
      amountApproved: 15000,
      amountReceived: 15000,
      lenderOrGrantor: 'Isaac Agya Koomson (Founder)',
      description: 'Additional Q3 working capital injection',
      reportingConditions: 'Working Capital',
      paymentMethod: 'Bank transfer',
      documentReference: 'EQ-INJ-2026-07',
      notes: 'Expansion working capital'
    });

    // 2. Receive Other Grant / Donor fund of GH₵10,000
    store.addFundingLine({
      fundingId: 'FND0011',
      dateReceived: '2026-07-12',
      source: 'Other Grant / Donor',
      status: 'Received',
      amountRequested: 10000,
      amountApproved: 10000,
      amountReceived: 10000,
      lenderOrGrantor: 'Mastercard Foundation SME Fund',
      description: 'Green estate maintenance equipment co-grant',
      reportingConditions: 'Tools & Equipment',
      paymentMethod: 'Bank transfer',
      documentReference: 'MCF-GRT-2026-01',
      notes: 'Restricted equipment grant'
    });

    // 3. Draw down a Bank / Microfinance Loan of GH₵8,000
    store.addFundingLine({
      fundingId: 'FND0012',
      dateReceived: '2026-07-15',
      source: 'Bank / Microfinance Loan',
      status: 'Received',
      amountRequested: 8000,
      amountApproved: 8000,
      amountReceived: 8000,
      lenderOrGrantor: 'Ecobank SME Facility',
      description: 'Short-term working capital facility',
      reportingConditions: 'Working Capital',
      paymentMethod: 'Bank transfer',
      documentReference: 'ECO-LN-2026-01',
      notes: 'Revolving credit drawdown'
    });

    // 4. Repay GH₵3,000 of Loan Principal (reduces Loans Payable to GH₵5,000)
    store.addFundingLine({
      fundingId: 'FND0013',
      dateReceived: '2026-07-20',
      source: 'Loan repayment',
      status: 'Received',
      amountRequested: 3000,
      amountApproved: 3000,
      amountReceived: 3000,
      lenderOrGrantor: 'Ecobank SME Facility',
      description: 'First principal installment repayment',
      reportingConditions: 'Debt Service / Loan Repayment',
      paymentMethod: 'Bank transfer',
      documentReference: 'ECO-REP-2026-01',
      notes: 'Loan principal reduction'
    });

    // Guardrail check: Attempting to repay GH₵6,000 principal when only GH₵5,000 is outstanding must be blocked
    assert.throws(
      () => store.addFundingLine({
        fundingId: 'FND0014-BAD',
        dateReceived: '2026-07-21',
        source: 'Loan repayment',
        status: 'Received',
        amountRequested: 6000,
        amountApproved: 6000,
        amountReceived: 6000,
        description: 'Excess principal repayment',
        reportingConditions: 'Debt Service / Loan Repayment',
        documentReference: 'ECO-REP-BAD',
        notes: 'Should fail'
      }),
      /exceeds outstanding Loans Payable/,
      'Over-repayment of loan principal must be blocked'
    );

    // 5. Record Founder Drawing / Withdrawal of GH₵2,500 (Contra-Equity)
    store.addFundingLine({
      fundingId: 'FND0014',
      dateReceived: '2026-07-25',
      source: 'Founder drawing',
      status: 'Received',
      amountRequested: 2500,
      amountApproved: 2500,
      amountReceived: 2500,
      lenderOrGrantor: 'Isaac Agya Koomson (Founder)',
      description: 'Founder personal drawing',
      reportingConditions: 'Founder Drawings / Distribution',
      paymentMethod: 'Bank transfer',
      documentReference: 'DRW-2026-07',
      notes: 'Approved founder equity withdrawal'
    });

    // Guardrail check: Attempting to withdraw GH₵100,000 (breaching ring-fenced grant cash & reserve) must be blocked
    assert.throws(
      () => store.addFundingLine({
        fundingId: 'FND0015-BAD',
        dateReceived: '2026-07-26',
        source: 'Founder drawing',
        status: 'Received',
        amountRequested: 100000,
        amountApproved: 100000,
        amountReceived: 100000,
        description: 'Excessive founder withdrawal touching grant funds',
        reportingConditions: 'Founder Drawings / Distribution',
        documentReference: 'DRW-BAD-01',
        notes: 'Should fail ring-fence check'
      }),
      /exceeds Unrestricted Withdrawable Cash/,
      'Founder drawing that breaches ring-fenced grant cash or minimum reserve must be blocked'
    );

    const afterAcct = store.getManagementAccounts();
    // P&L must be 100% untouched by equity, grants, loans, principal repayments, or drawings
    assert.strictEqual(afterAcct.yearTotal.totalRevenue, baseRevenue, 'Financing transactions must not distort P&L revenue');
    assert.strictEqual(afterAcct.yearTotal.totalOpex, baseOpex, 'Founder drawings & principal repayments must not distort P&L operating expenses');

    // Verify Balance Sheet & Financing Cash Flow lines
    assert.strictEqual(afterAcct.yearTotal.founderCapitalIn, beforeAcct.yearTotal.founderCapitalIn + 15000);
    assert.strictEqual(afterAcct.yearTotal.grantsReceived, beforeAcct.yearTotal.grantsReceived + 10000);
    assert.strictEqual(afterAcct.yearTotal.loansReceived, 8000);
    assert.strictEqual(afterAcct.yearTotal.loanPrincipalRepaid, 3000);
    assert.strictEqual(afterAcct.yearTotal.loansPayable, 5000);
    assert.strictEqual(afterAcct.yearTotal.founderDrawingsOut, 2500);
    assert.strictEqual(afterAcct.yearTotal.netFounderEquity, roundMoney(beforeAcct.yearTotal.netFounderEquity + 15000 - 2500));
    // Net cash change = +15,000 (capital) + 10,000 (grant) + 8,000 (loan) - 3,000 (repaid) - 2,500 (drawing) = +27,500
    assert.strictEqual(afterAcct.yearTotal.closingCash, baseCash + 27500);

    // Verify all 6 Reconciliation Control Totals remain RECONCILED (0.00 diff)
    const evaluation = store.getChecksEvaluation();
    evaluation.controlTotals.forEach(t => {
      assert.strictEqual(t.status, 'RECONCILED', `Control total ${t.name} must remain RECONCILED`);
      assert.strictEqual(t.countOrValue, 0.00, `Difference for ${t.name} must remain 0.00`);
    });
  });

});
