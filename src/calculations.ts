/**
 * CIVITAS ESTATE & MAINTENANCE
 * Calculation Engine & Spreadsheet-Equivalent Formulas
 * Faithfully reproducing all 195+ calculated columns and financial rules.
 */

import type {
  Customer,
  Property,
  Enquiry,
  ServiceItem,
  Quote,
  QuoteLine,
  Job,
  Assignment,
  Contractor,
  Invoice,
  Payment,
  Expense,
  BudgetItem,
  FundingLine,
  GrantBudgetCategory,
  Commitment,
  PurchaseRequest,
  Asset,
  MaintenanceLog,
  BoardMeeting,
  AdvisoryRecommendation,
  ManagementDecision,
  ActionItem,
  RiskItem,
  ComplianceItem,
  Incident,
  FinancialReconciliation,
  PeriodCloseRecord,
  PropertyInspection,
  SystemSettings,
  ExpenseClass
} from './types.ts';

export const EXPENSE_CATEGORIES_CLASS: Record<string, ExpenseClass> = {
  'Direct materials': 'Direct',
  'Direct transport': 'Direct',
  'Equipment (capital)': 'Capex',
  'Marketing and customer acquisition': 'Opex',
  'Workforce training and safety': 'Opex',
  'Regulatory compliance': 'Opex',
  'Digital operations': 'Opex',
  'Branding and materials': 'Opex',
  'Administration and communication': 'Opex',
  'Insurance': 'Opex',
  'Professional fees': 'Opex',
  'Salaries and employer pension': 'Opex',
  'Other operating expense': 'Opex',
  'Field labour (assignments)': 'Direct' // Only in budget; actual goes to Assignments
};

// Date utilities
export function parseDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export function daysDiff(d1: Date, d2: Date): number {
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.floor((utc1 - utc2) / (1000 * 60 * 60 * 24));
}

export function formatYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getEffectiveReportDate(settings: SystemSettings): Date {
  if (settings.reportDateOverride) {
    const d = parseDate(settings.reportDateOverride);
    if (d) return d;
  }
  return new Date();
}

export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

// ==========================================
// 1. RECALCULATE QUOTATION LINES & QUOTES
// ==========================================
export function calculateQuoteLines(
  lines: QuoteLine[],
  services: ServiceItem[]
): QuoteLine[] {
  const serviceMap = new Map(services.map(s => [s.serviceId, s]));
  const quoteLineCountMap = new Map<string, number>();

  return lines.map(line => {
    const s = serviceMap.get(line.serviceId);
    const count = (quoteLineCountMap.get(line.quoteId) || 0) + 1;
    quoteLineCountMap.set(line.quoteId, count);

    const serviceName = s ? s.service : '';
    const description = line.customDescription && line.customDescription.trim() !== '' 
      ? line.customDescription 
      : serviceName;

    const unitPrice = line.priceOverride !== undefined && line.priceOverride !== null
      ? line.priceOverride
      : (s ? s.standardPrice : 0);

    const unitCost = line.costOverride !== undefined && line.costOverride !== null
      ? line.costOverride
      : (s ? s.standardDirectCost : 0);

    const lineTotal = roundMoney(line.quantity * unitPrice);
    const lineCost = roundMoney(line.quantity * unitCost);
    const lineContribution = roundMoney(lineTotal - lineCost);

    let lineFlag: 'Unknown service' | 'Inactive service' | '' = '';
    if (!s) {
      lineFlag = 'Unknown service';
    } else if (s.active === 'No') {
      lineFlag = 'Inactive service';
    }

    return {
      ...line,
      lineNo: count,
      service: serviceName,
      description,
      unitPrice,
      lineTotal,
      unitCost,
      lineCost,
      lineContribution,
      lineKey: `${line.quoteId}|${count}`,
      lineFlag
    };
  });
}

export function calculateQuotes(
  quotes: Quote[],
  quoteLines: QuoteLine[],
  customers: Customer[],
  jobs: Job[],
  settings: SystemSettings
): Quote[] {
  const customerMap = new Map(customers.map(c => [c.customerId, c]));
  const jobMap = new Map(jobs.filter(j => j.quoteId).map(j => [j.quoteId!, j]));
  const today = getEffectiveReportDate(settings);
  const taxRateEff = settings.applyTax === 'Yes' ? settings.taxRate : 0.0;

  return quotes.map(q => {
    const c = customerMap.get(q.customerId);
    const j = jobMap.get(q.quoteId);

    const lines = quoteLines.filter(l => l.quoteId === q.quoteId);
    const subtotal = roundMoney(lines.reduce((sum, l) => sum + (l.lineTotal || 0), 0));
    const estimatedDirectCost = roundMoney(lines.reduce((sum, l) => sum + (l.lineCost || 0), 0));

    const discountAmount = q.discountAmount || 0;
    const netOfDiscount = roundMoney(subtotal - discountAmount);
    const tax = roundMoney(netOfDiscount * taxRateEff);
    const total = roundMoney(netOfDiscount + tax);

    const estimatedContribution = roundMoney(netOfDiscount - estimatedDirectCost);
    const marginPct = netOfDiscount > 0 ? roundMoney(estimatedContribution / netOfDiscount) : 0;

    // Dates & validity
    let validUntil = '';
    let expiryFlag: 'Quote expired' | '' = '';
    const qDate = parseDate(q.quoteDate);
    if (qDate) {
      const validUntilDate = new Date(qDate);
      validUntilDate.setDate(validUntilDate.getDate() + settings.quoteValidityDays);
      validUntil = formatYMD(validUntilDate);

      if (q.status === 'Sent' && validUntilDate < today) {
        expiryFlag = 'Quote expired';
      }
    }

    // Flags
    let marginFlag: 'Below minimum margin' | '' = '';
    if (netOfDiscount > 0 && marginPct < settings.minimumMargin) {
      marginFlag = 'Below minimum margin';
    }

    let discountFlag: 'Discount not approved' | '' = '';
    if (discountAmount > 0 && q.discountApproval !== 'Approved') {
      discountFlag = 'Discount not approved';
    }

    const idNumber = parseInt(q.quoteId.replace(/\D/g, ''), 10) || 0;

    return {
      ...q,
      customerName: c ? c.customerName : 'Customer not found',
      validUntil,
      subtotal,
      estimatedDirectCost,
      netOfDiscount,
      tax,
      total,
      estimatedContribution,
      marginPct,
      marginFlag,
      discountFlag,
      expiryFlag,
      jobId: j ? j.jobId : '',
      idNumber
    };
  });
}

// ==========================================
// 2. RECALCULATE ASSIGNMENTS & CONTRACTORS
// ==========================================
export function calculateAssignments(
  assignments: Assignment[],
  contractors: Contractor[],
  jobs: Job[]
): Assignment[] {
  const contractorMap = new Map(contractors.map(w => [w.contractorId, w]));
  const jobMap = new Map(jobs.map(j => [j.jobId, j]));

  return assignments.map(a => {
    const c = contractorMap.get(a.contractorId);
    const j = jobMap.get(a.jobId);

    const amount = roundMoney((a.quantity || 0) * (a.rate || 0));
    const isIndOrTemp = c && (c.workerType === 'Independent contractor' || c.workerType === 'Temporary worker');
    const personDays = isIndOrTemp ? a.quantity : 0;
    const unpaidAmount = a.paymentStatus === 'Paid' ? 0 : amount;

    let verificationFlag: 'Contractor not found' | 'Unverified contractor' | '' = '';
    if (!c) {
      verificationFlag = 'Contractor not found';
    } else if (c.vettingStatus !== 'Verified' || c.trainingStatus === 'None' || !c.trainingStatus) {
      verificationFlag = 'Unverified contractor';
    }

    let rateFlag: 'Rate above agreed' | '' = '';
    if (c && c.agreedRate && c.agreedRate > 0 && a.rate > c.agreedRate) {
      rateFlag = 'Rate above agreed';
    }

    let jobFlag: 'Job not found' | '' = '';
    if (!j) {
      jobFlag = 'Job not found';
    }

    const idNumber = parseInt(a.assignmentId.replace(/\D/g, ''), 10) || 0;

    return {
      ...a,
      contractorName: c ? c.contractorName : 'Contractor not found',
      workerType: c ? c.workerType : undefined,
      trade: c ? c.trade : undefined,
      agreedRate: c ? c.agreedRate : undefined,
      amount,
      personDays,
      unpaidAmount,
      verificationFlag,
      rateFlag,
      jobFlag,
      idNumber
    };
  });
}

export function calculateContractors(
  contractors: Contractor[],
  assignments: Assignment[]
): Contractor[] {
  return contractors.map(w => {
    const myAssignments = assignments.filter(a => a.contractorId === w.contractorId);
    const count = myAssignments.length;
    const personDays = myAssignments.reduce((sum, a) => sum + (a.personDays || 0), 0);
    const totalAssigned = roundMoney(myAssignments.reduce((sum, a) => sum + (a.amount || 0), 0));
    const totalUnpaid = roundMoney(myAssignments.reduce((sum, a) => sum + (a.unpaidAmount || 0), 0));

    const ratedAssignments = myAssignments.filter(a => typeof a.rating === 'number' && a.rating > 0);
    const averageRating = ratedAssignments.length > 0
      ? roundMoney(ratedAssignments.reduce((sum, a) => sum + a.rating!, 0) / ratedAssignments.length)
      : null;

    let lastAssignmentDate = '';
    myAssignments.forEach(a => {
      if (a.assignmentDate && (!lastAssignmentDate || a.assignmentDate > lastAssignmentDate)) {
        lastAssignmentDate = a.assignmentDate;
      }
    });

    const isEligible = w.vettingStatus === 'Verified' &&
      w.trainingStatus !== 'None' &&
      !!w.trainingStatus &&
      w.status === 'Active';

    const idNumber = parseInt(w.contractorId.replace(/\D/g, ''), 10) || 0;

    return {
      ...w,
      assignments: count,
      personDays,
      totalAssigned,
      totalUnpaid,
      averageRating,
      lastAssignmentDate,
      eligibility: isEligible ? 'Eligible' : 'Not eligible',
      idNumber
    };
  });
}

// ==========================================
// 3. RECALCULATE EXPENSES
// ==========================================
export function calculateExpenses(
  expenses: Expense[],
  jobs: Job[],
  purchaseReqs: PurchaseRequest[],
  settings: SystemSettings
): Expense[] {
  const jobMap = new Map(jobs.map(j => [j.jobId, j]));
  const prMap = new Map(purchaseReqs.map(pr => [pr.requestId, pr]));

  // Duplicate detection map: supplier + supplierReference + amount
  const dupMap = new Map<string, number>();
  expenses.forEach(e => {
    if (e.supplier && e.supplierReference && e.supplierReference.trim() !== '') {
      const key = `${e.supplier.trim().toLowerCase()}|${e.supplierReference.trim().toLowerCase()}|${e.amount}`;
      dupMap.set(key, (dupMap.get(key) || 0) + 1);
    }
  });

  return expenses.map(e => {
    const expenseClass = EXPENSE_CATEGORIES_CLASS[e.category] || 'Opex';

    let evidenceFlag: 'No evidence' | '' = '';
    if (e.amount > 0 && (!e.evidenceReference || e.evidenceReference.trim() === '')) {
      evidenceFlag = 'No evidence';
    }

    let approvalFlag: 'Approval required' | 'Paid without approval' | '' = '';
    if (e.amount > settings.spendingApprovalThreshold) {
      if (e.approvalStatus !== 'Approved') {
        approvalFlag = e.paymentStatus === 'Paid' ? 'Paid without approval' : 'Approval required';
      }
    }

    let directCostFlag: 'Direct cost without job' | '' = '';
    if (expenseClass === 'Direct' && (!e.jobId || e.jobId.trim() === '')) {
      directCostFlag = 'Direct cost without job';
    }

    let jobFlag: 'Job not found' | '' = '';
    if (e.jobId && e.jobId.trim() !== '' && !jobMap.has(e.jobId)) {
      jobFlag = 'Job not found';
    }

    let duplicateFlag: 'Duplicate entry' | '' = '';
    if (e.supplier && e.supplierReference && e.supplierReference.trim() !== '') {
      const key = `${e.supplier.trim().toLowerCase()}|${e.supplierReference.trim().toLowerCase()}|${e.amount}`;
      if ((dupMap.get(key) || 0) > 1) {
        duplicateFlag = 'Duplicate entry';
      }
    }

    let grantFlag: 'Grant category missing' | '' = '';
    if (e.fundingSource === 'NEIP funding' && (!e.grantCategory || e.grantCategory.trim() === '')) {
      grantFlag = 'Grant category missing';
    }

    let requestFlag: 'No purchase request' | '' = '';
    if (
      e.amount > settings.spendingApprovalThreshold &&
      e.category !== 'Salaries and employer pension' &&
      (!e.purchaseRequestId || e.purchaseRequestId.trim() === '')
    ) {
      requestFlag = 'No purchase request';
    }

    const idNumber = parseInt(e.expenseId.replace(/\D/g, ''), 10) || 0;

    return {
      ...e,
      class: expenseClass,
      evidenceFlag,
      approvalFlag,
      directCostFlag,
      duplicateFlag,
      jobFlag,
      grantFlag,
      requestFlag,
      idNumber
    };
  });
}

// ==========================================
// 4. RECALCULATE JOBS
// ==========================================
export function calculateJobs(
  jobs: Job[],
  quotes: Quote[],
  customers: Customer[],
  services: ServiceItem[],
  properties: Property[],
  assignments: Assignment[],
  expenses: Expense[],
  invoices: Invoice[],
  settings: SystemSettings
): Job[] {
  const quoteMap = new Map(quotes.map(q => [q.quoteId, q]));
  const customerMap = new Map(customers.map(c => [c.customerId, c]));
  const serviceMap = new Map(services.map(s => [s.serviceId, s]));
  const propertyMap = new Map(properties.map(p => [p.propertyId, p]));
  const today = getEffectiveReportDate(settings);

  return jobs.map(j => {
    const q = j.quoteId ? quoteMap.get(j.quoteId) : undefined;
    const c = customerMap.get(j.customerId);
    const s = serviceMap.get(j.serviceId);
    const p = j.propertyId ? propertyMap.get(j.propertyId) : undefined;

    const customerName = c ? c.customerName : 'Customer not found';
    const division = s ? s.division : undefined;
    const area = p ? p.area : '';

    const quotedAmount = q
      ? (q.netOfDiscount || 0)
      : (j.manualQuotedAmount || 0);

    const estimatedDirectCost = roundMoney(
      (j.estimatedLabour || 0) + (j.estimatedMaterials || 0) + (j.estimatedTransport || 0)
    );

    // Actual costs from registers
    const myAssignments = assignments.filter(a => a.jobId === j.jobId);
    const actualLabour = roundMoney(myAssignments.reduce((sum, a) => sum + (a.amount || 0), 0));

    const myExpenses = expenses.filter(e => e.jobId === j.jobId);
    const actualMaterials = roundMoney(
      myExpenses.filter(e => e.category === 'Direct materials').reduce((sum, e) => sum + e.amount, 0)
    );
    const actualTransport = roundMoney(
      myExpenses.filter(e => e.category === 'Direct transport').reduce((sum, e) => sum + e.amount, 0)
    );
    const actualDirectCost = roundMoney(actualLabour + actualMaterials + actualTransport);

    // Invoiced revenue
    const myInvoices = invoices.filter(inv => inv.jobId === j.jobId && inv.cancelled !== 'Yes');
    const invoicedNet = roundMoney(myInvoices.reduce((sum, inv) => sum + (inv.netRevenue || 0), 0));

    const isJobInvoiced = invoicedNet > 0;
    const jobContribution = isJobInvoiced ? roundMoney(invoicedNet - actualDirectCost) : null;
    const marginPct = isJobInvoiced && invoicedNet > 0 && jobContribution !== null
      ? roundMoney(jobContribution / invoicedNet)
      : null;

    // Effective Due Date
    let effectiveDueDate = '';
    if (j.dueDate && j.dueDate.trim() !== '') {
      effectiveDueDate = j.dueDate;
    } else if (j.scheduledDate && j.scheduledDate.trim() !== '') {
      const sDate = parseDate(j.scheduledDate);
      if (sDate) {
        sDate.setDate(sDate.getDate() + settings.defaultJobDurationDays);
        effectiveDueDate = formatYMD(sDate);
      }
    }

    // Overdue Flag
    let overdueFlag: 'Overdue' | '' = '';
    const closedOrAccepted = ['Accepted by customer', 'Invoiced', 'Paid', 'Closed', 'Cancelled'].includes(j.status);
    if (!closedOrAccepted && effectiveDueDate) {
      const effDate = parseDate(effectiveDueDate);
      if (effDate && effDate < today) {
        overdueFlag = 'Overdue';
      }
    }

    // Cost Overrun Flag
    let costOverrunFlag: 'Cost overrun' | '' = '';
    if (estimatedDirectCost > 0 && actualDirectCost > estimatedDirectCost * (1 + settings.costOverrunTolerance)) {
      costOverrunFlag = 'Cost overrun';
    }

    // Evidence Flag
    let evidenceFlag: 'Missing evidence' | '' = '';
    if (['Accepted by customer', 'Invoiced', 'Paid', 'Closed'].includes(j.status)) {
      if (!j.evidenceReference || j.evidenceReference.trim() === '') {
        evidenceFlag = 'Missing evidence';
      }
    }

    // Unbilled Flag
    let unbilledFlag: 'Completed not billed' | '' = '';
    if (['Accepted by customer', 'Closed'].includes(j.status)) {
      if (invoicedNet <= 0) {
        unbilledFlag = 'Completed not billed';
      }
    }

    // Margin Flag
    let marginFlag: 'Below minimum margin' | '' = '';
    if (marginPct !== null && marginPct < settings.minimumMargin) {
      marginFlag = 'Below minimum margin';
    }

    // Days to complete & On time
    let daysToComplete: number | null = null;
    let onTime: 'Yes' | 'No' | '' = '';
    if (j.completionDate && j.requestDate) {
      const cDate = parseDate(j.completionDate);
      const rDate = parseDate(j.requestDate);
      if (cDate && rDate) {
        daysToComplete = daysDiff(cDate, rDate);
      }
    }
    if (j.completionDate && effectiveDueDate) {
      const cDate = parseDate(j.completionDate);
      const effDate = parseDate(effectiveDueDate);
      if (cDate && effDate) {
        onTime = cDate <= effDate ? 'Yes' : 'No';
      }
    }

    const idNumber = parseInt(j.jobId.replace(/\D/g, ''), 10) || 0;

    return {
      ...j,
      customerName,
      division,
      quotedAmount,
      estimatedDirectCost,
      actualLabour,
      actualMaterials,
      actualTransport,
      actualDirectCost,
      invoicedNet,
      jobContribution,
      marginPct,
      effectiveDueDate,
      overdueFlag,
      costOverrunFlag,
      evidenceFlag,
      unbilledFlag,
      marginFlag,
      area,
      daysToComplete,
      onTime,
      idNumber
    };
  });
}

// ==========================================
// 5. RECALCULATE INVOICES & PAYMENTS
// ==========================================
export function calculateInvoices(
  invoices: Invoice[],
  payments: Payment[],
  customers: Customer[],
  jobs: Job[],
  settings: SystemSettings
): Invoice[] {
  const customerMap = new Map(customers.map(c => [c.customerId, c]));
  const jobMap = new Map(jobs.map(j => [j.jobId, j]));
  const today = getEffectiveReportDate(settings);
  const taxRateEff = settings.applyTax === 'Yes' ? settings.taxRate : 0.0;

  return invoices.map(inv => {
    const c = customerMap.get(inv.customerId);
    const j = inv.jobId ? jobMap.get(inv.jobId) : undefined;

    const customerName = c ? c.customerName : 'Customer not found';
    const division = j ? j.division : inv.divisionIfNoJob;
    const leadSource = c ? c.leadSource : undefined;

    // Due date
    let dueDate = '';
    if (inv.dueDateOverride && inv.dueDateOverride.trim() !== '') {
      dueDate = inv.dueDateOverride;
    } else if (inv.invoiceDate && inv.invoiceDate.trim() !== '') {
      const invDate = parseDate(inv.invoiceDate);
      if (invDate) {
        const terms = inv.termsDays !== undefined && inv.termsDays !== null ? inv.termsDays : settings.defaultPaymentTermsDays;
        invDate.setDate(invDate.getDate() + terms);
        dueDate = formatYMD(invDate);
      }
    }

    const amountBeforeTax = inv.amountBeforeTax || 0;
    const creditNoteAmount = inv.creditNoteAmount || 0;
    const tax = roundMoney(amountBeforeTax * taxRateEff);
    const total = roundMoney(amountBeforeTax + tax);
    const creditNoteTotal = roundMoney(creditNoteAmount * (1 + taxRateEff));

    const isCancelled = inv.cancelled === 'Yes';
    const netRevenue = isCancelled ? 0 : roundMoney(amountBeforeTax - creditNoteAmount);

    // Payments received against this invoice
    const myPayments = payments.filter(p => p.invoiceNo === inv.invoiceNo);
    const paymentsReceived = roundMoney(myPayments.reduce((sum, p) => sum + (p.amount || 0), 0));

    const balance = isCancelled ? 0 : roundMoney(total - creditNoteTotal - paymentsReceived);

    // Days overdue
    let daysOverdue = 0;
    if (balance > 0.005 && dueDate) {
      const dDate = parseDate(dueDate);
      if (dDate) {
        daysOverdue = Math.max(0, daysDiff(today, dDate));
      }
    }

    // Status
    let status: 'Cancelled' | 'Overpaid' | 'Paid' | 'Part paid' | 'Issued' | 'Overdue';
    if (isCancelled) {
      status = 'Cancelled';
    } else if (balance < -0.005) {
      status = 'Overpaid';
    } else if (balance <= 0.005) {
      status = 'Paid';
    } else if (paymentsReceived > 0) {
      status = 'Part paid';
    } else if (daysOverdue > 0) {
      status = 'Overdue';
    } else {
      status = 'Issued';
    }

    // Ageing bucket
    let ageingBucket: 'Cancelled' | 'Settled' | 'Current' | '1-30 days' | '31-60 days' | '61-90 days' | 'Over 90 days';
    if (isCancelled) {
      ageingBucket = 'Cancelled';
    } else if (balance <= 0.005) {
      ageingBucket = 'Settled';
    } else if (daysOverdue === 0) {
      ageingBucket = 'Current';
    } else if (daysOverdue <= 30) {
      ageingBucket = '1-30 days';
    } else if (daysOverdue <= 60) {
      ageingBucket = '31-60 days';
    } else if (daysOverdue <= 90) {
      ageingBucket = '61-90 days';
    } else {
      ageingBucket = 'Over 90 days';
    }

    // Flags
    let missingInfoFlag: 'Missing information' | '' = '';
    if (
      !inv.customerId ||
      !inv.invoiceDate ||
      inv.amountBeforeTax === undefined ||
      (!inv.jobId && !inv.subscriptionId && !inv.divisionIfNoJob)
    ) {
      missingInfoFlag = 'Missing information';
    }

    let overpaidFlag: 'Overpaid' | '' = '';
    if (balance < -0.005) {
      overpaidFlag = 'Overpaid';
    }

    const idNumber = parseInt(inv.invoiceNo.replace(/\D/g, ''), 10) || 0;

    return {
      ...inv,
      customerName,
      division,
      dueDate,
      tax,
      total,
      creditNoteTotal,
      netRevenue,
      paymentsReceived,
      balance,
      daysOverdue,
      status,
      ageingBucket,
      missingInfoFlag,
      overpaidFlag,
      leadSource,
      idNumber
    };
  });
}

export function calculatePayments(
  payments: Payment[],
  invoices: Invoice[],
  customers: Customer[],
  settings: SystemSettings
): Payment[] {
  const invoiceMap = new Map(invoices.map(inv => [inv.invoiceNo, inv]));
  const customerMap = new Map(customers.map(c => [c.customerId, c]));
  const today = getEffectiveReportDate(settings);

  // Duplicate reference detection
  const refCountMap = new Map<string, number>();
  payments.forEach(p => {
    if (p.reference && p.reference.trim() !== '') {
      const ref = p.reference.trim().toLowerCase();
      refCountMap.set(ref, (refCountMap.get(ref) || 0) + 1);
    }
  });

  return payments.map(p => {
    const inv = invoiceMap.get(p.invoiceNo);
    const customerId = inv ? inv.customerId : undefined;
    const c = customerId ? customerMap.get(customerId) : undefined;
    const customerName = c ? c.customerName : (inv ? inv.customerName : undefined);

    let invoiceFlag: 'Invoice not found' | '' = '';
    if (!inv) {
      invoiceFlag = 'Invoice not found';
    }

    let duplicateFlag: 'Duplicate reference' | '' = '';
    if (p.reference && p.reference.trim() !== '') {
      const ref = p.reference.trim().toLowerCase();
      if ((refCountMap.get(ref) || 0) > 1) {
        duplicateFlag = 'Duplicate reference';
      }
    }

    let unreconciledFlag: 'Not reconciled' | '' = '';
    if (p.reconciliationStatus !== 'Reconciled' && p.paymentDate) {
      const payDate = parseDate(p.paymentDate);
      if (payDate) {
        const days = daysDiff(today, payDate);
        if (days > settings.unreconciledPaymentGraceDays) {
          unreconciledFlag = 'Not reconciled';
        }
      }
    }

    const idNumber = parseInt(p.paymentId.replace(/\D/g, ''), 10) || 0;

    return {
      ...p,
      customerId,
      customerName,
      duplicateFlag,
      invoiceFlag,
      unreconciledFlag,
      idNumber
    };
  });
}

// ==========================================
// 6. RECALCULATE CUSTOMERS & PROPERTIES
// ==========================================
export function calculateCustomers(
  customers: Customer[],
  properties: Property[],
  jobs: Job[],
  invoices: Invoice[],
  payments: Payment[],
  settings: SystemSettings
): Customer[] {
  const today = getEffectiveReportDate(settings);

  return customers.map(c => {
    const myProperties = properties.filter(p => p.customerId === c.customerId);
    const myJobs = jobs.filter(j => j.customerId === c.customerId);
    const myInvoices = invoices.filter(inv => inv.customerId === c.customerId && inv.cancelled !== 'Yes');
    const myPayments = payments.filter(p => p.customerId === c.customerId);

    const propCount = myProperties.length;
    const jobCount = myJobs.length;
    const totalBilled = roundMoney(myInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0));
    const totalPaid = roundMoney(myPayments.reduce((sum, p) => sum + p.amount, 0));
    const outstanding = roundMoney(myInvoices.reduce((sum, inv) => sum + (inv.balance || 0), 0));

    let lastServiceDate = '';
    myJobs.forEach(j => {
      if (j.completionDate && (!lastServiceDate || j.completionDate > lastServiceDate)) {
        lastServiceDate = j.completionDate;
      }
    });

    let lastInvoiceDate = '';
    myInvoices.forEach(inv => {
      if (inv.invoiceDate && (!lastInvoiceDate || inv.invoiceDate > lastInvoiceDate)) {
        lastInvoiceDate = inv.invoiceDate;
      }
    });

    const ratedJobs = myJobs.filter(j => typeof j.customerRating === 'number' && j.customerRating > 0);
    const averageRating = ratedJobs.length > 0
      ? roundMoney(ratedJobs.reduce((sum, j) => sum + j.customerRating!, 0) / ratedJobs.length)
      : null;

    // Status: Closed, Prospect, Active, Dormant
    let status: 'Prospect' | 'Active' | 'Dormant' | 'Closed' = 'Prospect';
    if (c.closed === 'Yes') {
      status = 'Closed';
    } else if (totalBilled === 0) {
      status = 'Prospect';
    } else if (!lastInvoiceDate) {
      status = 'Dormant';
    } else {
      const invDate = parseDate(lastInvoiceDate);
      if (invDate && daysDiff(today, invDate) <= settings.customerDormantDays) {
        status = 'Active';
      } else {
        status = 'Dormant';
      }
    }

    const idNumber = parseInt(c.customerId.replace(/\D/g, ''), 10) || 0;

    return {
      ...c,
      properties: propCount,
      jobs: jobCount,
      totalBilled,
      totalPaid,
      outstanding,
      lastServiceDate,
      lastInvoiceDate,
      averageRating,
      status,
      idNumber
    };
  });
}

export function calculateProperties(
  properties: Property[],
  customers: Customer[],
  jobs: Job[],
  inspections: PropertyInspection[],
  settings: SystemSettings
): Property[] {
  const customerMap = new Map(customers.map(c => [c.customerId, c]));
  const today = getEffectiveReportDate(settings);

  return properties.map(p => {
    const c = customerMap.get(p.customerId);
    const customerName = c ? c.customerName : 'Customer not found';

    const myJobs = jobs.filter(j => j.propertyId === p.propertyId);
    const myInspections = inspections.filter(i => i.propertyId === p.propertyId);

    let lastJobDate = '';
    myJobs.forEach(j => {
      if (j.completionDate && (!lastJobDate || j.completionDate > lastJobDate)) {
        lastJobDate = j.completionDate;
      }
    });

    let lastInspectionDate = '';
    myInspections.forEach(i => {
      if (i.inspectionDate && (!lastInspectionDate || i.inspectionDate > lastInspectionDate)) {
        lastInspectionDate = i.inspectionDate;
      }
    });

    let inspectionFlag: 'Inspection overdue' | '' = '';
    if (p.active === 'Yes' && p.nextInspectionDate && p.nextInspectionDate.trim() !== '') {
      const nDate = parseDate(p.nextInspectionDate);
      if (nDate && nDate < today) {
        inspectionFlag = 'Inspection overdue';
      }
    }

    const idNumber = parseInt(p.propertyId.replace(/\D/g, ''), 10) || 0;

    return {
      ...p,
      customerName,
      jobs: myJobs.length,
      lastJobDate,
      lastInspectionDate,
      inspectionFlag,
      idNumber
    };
  });
}

// ==========================================
// 7. ENQUIRIES
// ==========================================
export function calculateEnquiries(
  enquiries: Enquiry[],
  quotes: Quote[],
  settings: SystemSettings
): Enquiry[] {
  const quoteMap = new Map(quotes.map(q => [q.quoteId, q]));
  const today = getEffectiveReportDate(settings);

  return enquiries.map(e => {
    const q = e.quoteId ? quoteMap.get(e.quoteId) : undefined;
    const quoteValue = q ? (q.netOfDiscount || 0) : 0;

    let daysOpen: number | null = null;
    const isClosed = ['Accepted', 'Declined', 'Job Scheduled'].includes(e.stage);
    if (!isClosed && e.enquiryDate) {
      const eDate = parseDate(e.enquiryDate);
      if (eDate) {
        daysOpen = Math.max(0, daysDiff(today, eDate));
      }
    }

    let outcomeGroup: 'Open' | 'Won' | 'Lost' = 'Open';
    if (['Accepted', 'Job Scheduled'].includes(e.stage)) {
      outcomeGroup = 'Won';
    } else if (e.stage === 'Declined') {
      outcomeGroup = 'Lost';
    }

    let daysToQuote: number | null = null;
    if (q && q.quoteDate && e.enquiryDate) {
      const qDate = parseDate(q.quoteDate);
      const eDate = parseDate(e.enquiryDate);
      if (qDate && eDate) {
        daysToQuote = daysDiff(qDate, eDate);
      }
    }

    const idNumber = parseInt(e.enquiryId.replace(/\D/g, ''), 10) || 0;

    return {
      ...e,
      daysOpen,
      outcomeGroup,
      quoteValue,
      daysToQuote,
      idNumber
    };
  });
}

// ==========================================
// 8. ASSETS & DEPRECIATION
// ==========================================
export function calculateAssets(
  assets: Asset[],
  expenses: Expense[],
  settings: SystemSettings
): Asset[] {
  const expenseMap = new Map(expenses.map(e => [e.expenseId, e]));
  const today = getEffectiveReportDate(settings);

  return assets.map(a => {
    const isDepreciable = a.depreciationMethod === 'Straight-line' && a.purchaseCost >= settings.capitalThreshold;
    const depreciable = isDepreciable ? 'Yes' : 'No';

    let startMonth = '';
    let endMonth = '';
    let monthlyDepreciation = 0;
    let monthsDepreciated = 0;
    let accumulatedDepreciation = 0;
    let netBookValue = 0;

    const usefulYears = a.usefulLifeYears || settings.defaultUsefulLifeYears;
    const totalMonths = Math.round(usefulYears * 12);
    const residual = a.residualValue || 0;

    const pDate = parseDate(a.purchaseDate);
    if (pDate && isDepreciable) {
      startMonth = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}-01`;
      monthlyDepreciation = totalMonths > 0 ? roundMoney((a.purchaseCost - residual) / totalMonths) : 0;

      // End month = startMonth + totalMonths or disposal month
      const sMonthDate = new Date(pDate.getFullYear(), pDate.getMonth(), 1);
      const normalEndDate = new Date(sMonthDate);
      normalEndDate.setMonth(normalEndDate.getMonth() + totalMonths);

      let effectiveEndDate = normalEndDate;
      if (a.disposalDate) {
        const dDate = parseDate(a.disposalDate);
        if (dDate && dDate < normalEndDate) {
          effectiveEndDate = new Date(dDate.getFullYear(), dDate.getMonth(), 1);
        }
      }
      endMonth = `${effectiveEndDate.getFullYear()}-${String(effectiveEndDate.getMonth() + 1).padStart(2, '0')}-01`;

      // Months depreciated up to report date (month start) or effectiveEndDate
      const reportMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const capDate = reportMonthDate < effectiveEndDate ? reportMonthDate : effectiveEndDate;

      if (capDate > sMonthDate) {
        const yDiff = capDate.getFullYear() - sMonthDate.getFullYear();
        const mDiff = capDate.getMonth() - sMonthDate.getMonth();
        monthsDepreciated = Math.max(0, yDiff * 12 + mDiff);
      } else {
        monthsDepreciated = 0;
      }

      accumulatedDepreciation = roundMoney(Math.min(a.purchaseCost - residual, monthsDepreciated * monthlyDepreciation));
      if (a.status === 'Disposed' || a.status === 'Lost') {
        netBookValue = 0;
      } else {
        netBookValue = roundMoney(a.purchaseCost - accumulatedDepreciation);
      }
    } else {
      netBookValue = a.status === 'Disposed' || a.status === 'Lost' ? 0 : a.purchaseCost;
    }

    const grantAsset = a.fundingSource === 'NEIP funding' ? 'Yes' : 'No';

    let warrantyFlag: 'Warranty expired' | 'Warranty expiring' | '' = '';
    if (a.warrantyExpiry && a.warrantyExpiry.trim() !== '') {
      const wDate = parseDate(a.warrantyExpiry);
      if (wDate) {
        if (wDate < today) {
          warrantyFlag = 'Warranty expired';
        } else if (daysDiff(wDate, today) <= settings.daysWarningExpiry) {
          warrantyFlag = 'Warranty expiring';
        }
      }
    }

    let expenseLinkFlag: 'No expense linked' | 'Expense not found' | '' = '';
    if (!a.expenseId || a.expenseId.trim() === '') {
      expenseLinkFlag = 'No expense linked';
    } else if (!expenseMap.has(a.expenseId)) {
      expenseLinkFlag = 'Expense not found';
    }

    const idNumber = parseInt(a.assetId.replace(/\D/g, ''), 10) || 0;

    return {
      ...a,
      depreciable,
      startMonth,
      endMonth,
      monthlyDepreciation,
      monthsDepreciated,
      accumulatedDepreciation,
      netBookValue,
      grantAsset,
      warrantyFlag,
      expenseLinkFlag,
      idNumber
    };
  });
}

// ==========================================
// 9. RECALCULATE FUNDING, COMMITMENTS & PURCHASE REQUESTS
// ==========================================
export function calculateFunding(fundingLines: FundingLine[]): FundingLine[] {
  return fundingLines.map(f => {
    let cashFlag: 'Received but no date' | 'Received more than approved' | '' = '';
    if (f.amountReceived > 0 && (!f.dateReceived || f.dateReceived.trim() === '')) {
      cashFlag = 'Received but no date';
    } else if (f.amountApproved > 0 && f.amountReceived > f.amountApproved) {
      cashFlag = 'Received more than approved';
    }

    const idNumber = parseInt(f.fundingId.replace(/\D/g, ''), 10) || 0;
    return { ...f, cashFlag, idNumber };
  });
}

export function calculateCommitments(
  commitments: Commitment[],
  expenses: Expense[]
): Commitment[] {
  const expenseMap = new Map(expenses.map(e => [e.expenseId, e]));

  return commitments.map(cm => {
    const activeAmount = cm.status === 'Committed' ? cm.amount : 0;

    let linkFlag: 'Fulfilled: add Expense ID' | 'Expense not found' | '' = '';
    if (cm.status === 'Fulfilled' && (!cm.expenseId || cm.expenseId.trim() === '')) {
      linkFlag = 'Fulfilled: add Expense ID';
    } else if (cm.expenseId && cm.expenseId.trim() !== '' && !expenseMap.has(cm.expenseId)) {
      linkFlag = 'Expense not found';
    }

    const idNumber = parseInt(cm.commitmentId.replace(/\D/g, ''), 10) || 0;
    return { ...cm, activeAmount, linkFlag, idNumber };
  });
}

export function calculatePurchaseRequests(
  reqs: PurchaseRequest[],
  expenses: Expense[],
  settings: SystemSettings
): PurchaseRequest[] {
  return reqs.map(pr => {
    const quotesRequired = pr.estimatedAmount > settings.spendingApprovalThreshold
      ? settings.quotesRequiredAboveThreshold
      : 1;

    const myExpenses = expenses.filter(e => e.purchaseRequestId === pr.requestId);
    const spent = roundMoney(myExpenses.reduce((sum, e) => sum + e.amount, 0));

    let quotesFlag: 'Too few quotes' | '' = '';
    if ((pr.quotesObtained || 0) < quotesRequired) {
      quotesFlag = 'Too few quotes';
    }

    let approvalFlag: 'Spent without approval' | '' = '';
    if (spent > 0 && pr.approvalStatus !== 'Approved' && pr.estimatedAmount > settings.spendingApprovalThreshold) {
      approvalFlag = 'Spent without approval';
    }

    let overspendFlag: 'Over estimate' | '' = '';
    if (spent > pr.estimatedAmount * 1.1) {
      overspendFlag = 'Over estimate';
    }

    const idNumber = parseInt(pr.requestId.replace(/\D/g, ''), 10) || 0;

    return {
      ...pr,
      quotesRequired,
      spent,
      quotesFlag,
      approvalFlag,
      overspendFlag,
      idNumber
    };
  });
}

export function calculateGrantBudget(
  categories: GrantBudgetCategory[],
  commitments: Commitment[],
  expenses: Expense[],
  fundingLines: FundingLine[]
): GrantBudgetCategory[] {
  const neipFundingReceived = fundingLines
    .filter(f => f.source === 'NEIP funding')
    .reduce((sum, f) => sum + (f.amountReceived || 0), 0);

  return categories.map(cat => {
    const myCommitments = commitments.filter(cm => cm.grantCategory === cat.grantCategory);
    const committed = roundMoney(myCommitments.reduce((sum, cm) => sum + (cm.activeAmount || 0), 0));

    const myExpenses = expenses.filter(e => e.grantCategory === cat.grantCategory && e.paymentStatus === 'Paid');
    const spentFromNEIP = roundMoney(
      myExpenses.filter(e => e.fundingSource === 'NEIP funding').reduce((sum, e) => sum + e.amount, 0)
    );
    const spentFromOtherSources = roundMoney(
      myExpenses.filter(e => e.fundingSource !== 'NEIP funding').reduce((sum, e) => sum + e.amount, 0)
    );

    const availableBudget = roundMoney(cat.budget - spentFromNEIP - committed);
    const usedPct = cat.budget > 0 ? roundMoney((spentFromNEIP + committed) / cat.budget) : 0;

    let budgetFlag: 'Over budget' | 'Reserve drawn' | 'Pre-funding spending without cash' | '' = '';
    if (availableBudget < 0) {
      budgetFlag = 'Over budget';
    } else if (cat.grantCategory === 'Working capital reserve' && spentFromNEIP > 0) {
      budgetFlag = 'Reserve drawn';
    } else if (neipFundingReceived === 0 && spentFromNEIP > 0) {
      budgetFlag = 'Pre-funding spending without cash';
    }

    return {
      ...cat,
      committed,
      spentFromNEIP,
      spentFromOtherSources,
      availableBudget,
      usedPct,
      budgetFlag
    };
  });
}

// ==========================================
// 10. RECALCULATE GOVERNANCE & RISK MODULES
// ==========================================
export function calculateBoardMeetings(
  meetings: BoardMeeting[],
  recommendations: AdvisoryRecommendation[],
  settings: SystemSettings
): BoardMeeting[] {
  const today = getEffectiveReportDate(settings);

  return meetings.map(m => {
    const myRecs = recommendations.filter(r => r.meetingId === m.meetingId);
    const recommendationsRaised = myRecs.length;
    const stillOpen = myRecs.filter(r => r.status === 'Open' || r.status === 'In progress').length;
    const attendancePct = m.membersInvited > 0 ? roundMoney(m.membersPresent / m.membersInvited) : 0;

    let minutesFlag: 'Minutes missing' | '' = '';
    const mDate = parseDate(m.meetingDate);
    if (mDate && mDate <= today && (!m.minutesReference || m.minutesReference.trim() === '')) {
      minutesFlag = 'Minutes missing';
    }

    let quorumFlag: 'Below quorum' | '' = '';
    if (settings.boardQuorum && settings.boardQuorum > 0 && m.membersPresent < settings.boardQuorum) {
      quorumFlag = 'Below quorum';
    }

    const idNumber = parseInt(m.meetingId.replace(/\D/g, ''), 10) || 0;

    return {
      ...m,
      attendancePct,
      recommendationsRaised,
      stillOpen,
      minutesFlag,
      quorumFlag,
      idNumber
    };
  });
}

export function calculateAdvisoryRecommendations(
  recs: AdvisoryRecommendation[],
  settings: SystemSettings
): AdvisoryRecommendation[] {
  const today = getEffectiveReportDate(settings);

  return recs.map(r => {
    let overdueFlag: 'Overdue' | '' = '';
    if ((r.status === 'Open' || r.status === 'In progress') && r.dueDate && r.dueDate.trim() !== '') {
      const dDate = parseDate(r.dueDate);
      if (dDate && dDate < today) {
        overdueFlag = 'Overdue';
      }
    }

    let responseFlag: 'Response overdue' | '' = '';
    if (!r.managementResponse || r.managementResponse === 'Pending') {
      const recDate = parseDate(r.recommendationDate);
      if (recDate && daysDiff(today, recDate) > settings.daysAllowedResponse) {
        responseFlag = 'Response overdue';
      }
    }

    const idNumber = parseInt(r.recId.replace(/\D/g, ''), 10) || 0;

    return { ...r, overdueFlag, responseFlag, idNumber };
  });
}

export function calculateDecisions(
  decisions: ManagementDecision[],
  settings: SystemSettings
): ManagementDecision[] {
  const today = getEffectiveReportDate(settings);

  return decisions.map(d => {
    let reviewFlag: 'Review due' | '' = '';
    if (d.status === 'In force' && d.reviewDate && d.reviewDate.trim() !== '') {
      const rDate = parseDate(d.reviewDate);
      if (rDate && rDate < today) {
        reviewFlag = 'Review due';
      }
    }

    const idNumber = parseInt(d.decisionId.replace(/\D/g, ''), 10) || 0;
    return { ...d, reviewFlag, idNumber };
  });
}

export function calculateActions(
  actions: ActionItem[],
  settings: SystemSettings
): ActionItem[] {
  const today = getEffectiveReportDate(settings);

  return actions.map(a => {
    let overdueFlag: 'Overdue' | '' = '';
    let daysOverdue = 0;
    if ((a.status === 'Open' || a.status === 'In progress') && a.deadline) {
      const dDate = parseDate(a.deadline);
      if (dDate && dDate < today) {
        overdueFlag = 'Overdue';
        daysOverdue = daysDiff(today, dDate);
      }
    }

    let lateCompletionFlag: 'Completed late' | '' = '';
    if (a.status === 'Done' && a.completedDate && a.deadline) {
      const cDate = parseDate(a.completedDate);
      const dDate = parseDate(a.deadline);
      if (cDate && dDate && cDate > dDate) {
        lateCompletionFlag = 'Completed late';
      }
    }

    const idNumber = parseInt(a.actionId.replace(/\D/g, ''), 10) || 0;

    return { ...a, overdueFlag, daysOverdue, lateCompletionFlag, idNumber };
  });
}

export function calculateRisks(
  risks: RiskItem[],
  settings: SystemSettings
): RiskItem[] {
  const today = getEffectiveReportDate(settings);

  return risks.map(r => {
    const score = (r.probability || 1) * (r.impact || 1);
    let rating: 'Low' | 'Medium' | 'High' | 'Critical';
    if (score >= 16) rating = 'Critical';
    else if (score >= 10) rating = 'High';
    else if (score >= 5) rating = 'Medium';
    else rating = 'Low';

    let reviewFlag: 'Review overdue' | '' = '';
    if ((r.status === 'Open' || r.status === 'Accepted') && r.nextReviewDate) {
      const rDate = parseDate(r.nextReviewDate);
      if (rDate && rDate < today) {
        reviewFlag = 'Review overdue';
      }
    }

    let mitigationFlag: 'High risk: no mitigation or owner' | '' = '';
    if ((rating === 'High' || rating === 'Critical') && r.status === 'Open') {
      if (!r.mitigation || r.mitigation.trim() === '' || !r.owner || r.owner.trim() === '') {
        mitigationFlag = 'High risk: no mitigation or owner';
      }
    }

    const idNumber = parseInt(r.riskId.replace(/\D/g, ''), 10) || 0;

    return { ...r, score, rating, reviewFlag, mitigationFlag, idNumber };
  });
}

export function calculateCompliance(
  items: ComplianceItem[],
  settings: SystemSettings
): ComplianceItem[] {
  const today = getEffectiveReportDate(settings);

  return items.map(cp => {
    let daysToExpiry: number | null = null;
    let expiryFlag: 'Expired or overdue' | 'Expiring soon' | '' = '';

    if (cp.expiryOrDueDate && cp.status !== 'Not required' && cp.status !== 'Closed') {
      const eDate = parseDate(cp.expiryOrDueDate);
      if (eDate) {
        daysToExpiry = daysDiff(eDate, today);
        if (eDate < today) {
          expiryFlag = 'Expired or overdue';
        } else if (daysToExpiry <= settings.daysWarningExpiry) {
          expiryFlag = 'Expiring soon';
        }
      }
    }

    let pendingFlag: 'Evidence not yet held' | '' = '';
    if (cp.status === 'Pending' && (!cp.referenceOrEvidence || cp.referenceOrEvidence.trim() === '')) {
      pendingFlag = 'Evidence not yet held';
    }

    const idNumber = parseInt(cp.itemId.replace(/\D/g, ''), 10) || 0;

    return { ...cp, daysToExpiry, expiryFlag, pendingFlag, idNumber };
  });
}

export function calculateIncidents(
  incidents: Incident[],
  settings: SystemSettings
): Incident[] {
  const today = getEffectiveReportDate(settings);

  return incidents.map(inc => {
    let daysOpen = 0;
    if (inc.status === 'Open' && inc.incidentDate) {
      const iDate = parseDate(inc.incidentDate);
      if (iDate) {
        daysOpen = Math.max(0, daysDiff(today, iDate));
      }
    }

    let agingFlag: 'Open too long' | '' = '';
    if (daysOpen > settings.daysIncidentOpenMax) {
      agingFlag = 'Open too long';
    }

    let actionFlag: 'No corrective action' | '' = '';
    if ((inc.severity === 'Medium' || inc.severity === 'High') && (!inc.actionId || inc.actionId.trim() === '')) {
      actionFlag = 'No corrective action';
    }

    const idNumber = parseInt(inc.incidentId.replace(/\D/g, ''), 10) || 0;

    return { ...inc, daysOpen, agingFlag, actionFlag, idNumber };
  });
}

export function calculateReconciliations(
  recons: FinancialReconciliation[]
): FinancialReconciliation[] {
  return recons.map(rc => {
    const difference = roundMoney((rc.statementBalance || 0) - (rc.bookBalance || 0));

    let differenceFlag: 'Unexplained difference' | '' = '';
    if (Math.abs(difference) > 0.01 && (!rc.reconcilingItems || rc.reconcilingItems.trim() === '')) {
      differenceFlag = 'Unexplained difference';
    }

    let reviewFlag: 'Not reviewed' | '' = '';
    if (!rc.reviewedBy || rc.reviewedBy.trim() === '') {
      reviewFlag = 'Not reviewed';
    }

    const idNumber = parseInt(rc.reconId.replace(/\D/g, ''), 10) || 0;

    return { ...rc, difference, differenceFlag, reviewFlag, idNumber };
  });
}

export function calculatePeriodClose(
  periods: PeriodCloseRecord[],
  invoices: Invoice[],
  payments: Payment[],
  expenses: Expense[],
  assignments: Assignment[],
  openCheckCount: number
): PeriodCloseRecord[] {
  return periods.map(p => {
    const pDate = parseDate(p.month);
    let invoicesNow = 0;
    let paymentsNow = 0;
    let expensesNow = 0;
    let assignmentsNow = 0;

    if (pDate) {
      const year = pDate.getFullYear();
      const month = pDate.getMonth();
      const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      invoicesNow = invoices.filter(inv => inv.invoiceDate >= startStr && inv.invoiceDate <= endStr).length;
      paymentsNow = payments.filter(pay => pay.paymentDate >= startStr && pay.paymentDate <= endStr).length;
      expensesNow = expenses.filter(exp => exp.expenseDate >= startStr && exp.expenseDate <= endStr).length;
      assignmentsNow = assignments.filter(a => a.assignmentDate >= startStr && a.assignmentDate <= endStr).length;
    }

    let changedFlag: 'Records changed after close' | '' = '';
    if (p.status === 'Closed') {
      if (
        invoicesNow !== (p.invoicesAtClose || 0) ||
        paymentsNow !== (p.paymentsAtClose || 0) ||
        expensesNow !== (p.expensesAtClose || 0) ||
        assignmentsNow !== (p.assignmentsAtClose || 0)
      ) {
        changedFlag = 'Records changed after close';
      }
    }

    let closeFlag: 'Closed with open items' | '' = '';
    if (p.status === 'Closed' && (p.openCheckItemsAtClose || 0) > 0) {
      closeFlag = 'Closed with open items';
    }

    return {
      ...p,
      invoicesNow,
      paymentsNow,
      expensesNow,
      assignmentsNow,
      changedFlag,
      closeFlag
    };
  });
}

// ==========================================
// 11. PROPERTY INSPECTIONS
// ==========================================
export function calculateInspections(
  inspections: PropertyInspection[],
  properties: Property[]
): PropertyInspection[] {
  const propertyMap = new Map(properties.map(p => [p.propertyId, p]));

  return inspections.map(ins => {
    const p = propertyMap.get(ins.propertyId);
    const customerName = p ? p.customerName : 'Property not found';

    const areas = [
      ins.roofAndCeiling,
      ins.plumbing,
      ins.electrical,
      ins.doorsLocksWindows,
      ins.dampAndPests,
      ins.compoundAndExterior
    ];

    const issuesFound = areas.filter(a => a === 'Fair' || a === 'Poor').length;
    const poorItems = areas.filter(a => a === 'Poor').length;

    let conditionRating: 'Good' | 'Fair' | 'Poor';
    if (poorItems > 0) {
      conditionRating = 'Poor';
    } else if (issuesFound > 0) {
      conditionRating = 'Fair';
    } else {
      conditionRating = 'Good';
    }

    let reportFlag: 'Issued report incomplete' | 'Report ready to issue' | '' = '';
    if (ins.reportStatus === 'Issued') {
      if (!ins.observations || !ins.photosFolderReference || ins.observations.trim() === '' || ins.photosFolderReference.trim() === '') {
        reportFlag = 'Issued report incomplete';
      }
    } else if (ins.reportStatus === 'Draft') {
      if (ins.observations && ins.photosFolderReference && ins.observations.trim() !== '' && ins.photosFolderReference.trim() !== '') {
        reportFlag = 'Report ready to issue';
      }
    }

    const idNumber = parseInt(ins.inspectionId.replace(/\D/g, ''), 10) || 0;

    return {
      ...ins,
      customerName,
      issuesFound,
      poorItems,
      conditionRating,
      reportFlag,
      idNumber
    };
  });
}

// ==========================================
// 12. MAINTENANCE LOGS
// ==========================================
export function calculateMaintenance(
  logs: MaintenanceLog[],
  assets: Asset[],
  settings: SystemSettings
): MaintenanceLog[] {
  const assetMap = new Map(assets.map(a => [a.assetId, a]));
  const today = getEffectiveReportDate(settings);

  // Latest log date per asset
  const latestDatePerAsset = new Map<string, string>();
  logs.forEach(l => {
    if (!latestDatePerAsset.has(l.assetId) || l.maintenanceDate > latestDatePerAsset.get(l.assetId)!) {
      latestDatePerAsset.set(l.assetId, l.maintenanceDate);
    }
  });

  return logs.map(l => {
    const a = assetMap.get(l.assetId);
    const assetDescription = a ? a.description : 'Asset not found';

    let overdueFlag: 'Maintenance overdue' | '' = '';
    const isLatest = latestDatePerAsset.get(l.assetId) === l.maintenanceDate;
    if (isLatest && l.nextDueDate && l.nextDueDate.trim() !== '') {
      const nDate = parseDate(l.nextDueDate);
      if (nDate && nDate < today) {
        overdueFlag = 'Maintenance overdue';
      }
    }

    const idNumber = parseInt(l.logId.replace(/\D/g, ''), 10) || 0;

    return {
      ...l,
      assetDescription,
      overdueFlag,
      idNumber
    };
  });
}
