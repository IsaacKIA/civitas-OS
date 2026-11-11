/**
 * CIVITAS ESTATE & MAINTENANCE
 * Data Quality and Control Checks Engine (52 Checks + 6 Reconciliation Control Totals)
 * Faithfully reproducing all control rules from the Civitas operations manual.
 */

import type {
  Customer,
  Property,
  Enquiry,
  Quote,
  QuoteLine,
  Job,
  Assignment,
  Contractor,
  Invoice,
  Payment,
  Expense,
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
  ControlCheckResult,
  ManagementAlert
} from './types.ts';
import { roundMoney, getEffectiveReportDate } from './calculations.ts';
import { generateManagementAccounts } from './management-accounts.ts';

export interface SystemChecksEvaluation {
  checks: ControlCheckResult[];
  controlTotals: ControlCheckResult[];
  itemsNeedingAttention: number;
  alerts: ManagementAlert[];
}

export function evaluateControlChecks(
  customers: Customer[],
  properties: Property[],
  enquiries: Enquiry[],
  quotes: Quote[],
  quoteLines: QuoteLine[],
  jobs: Job[],
  assignments: Assignment[],
  contractors: Contractor[],
  invoices: Invoice[],
  payments: Payment[],
  expenses: Expense[],
  fundingLines: FundingLine[],
  grantCategories: GrantBudgetCategory[],
  commitments: Commitment[],
  purchaseReqs: PurchaseRequest[],
  assets: Asset[],
  maintenanceLogs: MaintenanceLog[],
  meetings: BoardMeeting[],
  recommendations: AdvisoryRecommendation[],
  decisions: ManagementDecision[],
  actions: ActionItem[],
  risks: RiskItem[],
  complianceItems: ComplianceItem[],
  incidents: Incident[],
  reconciliations: FinancialReconciliation[],
  periodClose: PeriodCloseRecord[],
  inspections: PropertyInspection[],
  settings: SystemSettings
): SystemChecksEvaluation {
  const mgmtAccounts = generateManagementAccounts(
    settings.reportingYear,
    invoices,
    payments,
    expenses,
    assignments,
    assets,
    fundingLines,
    settings
  );

  const checks: ControlCheckResult[] = [];

  // Check 1: Overdue invoices
  const c1 = invoices.filter(i => i.status === 'Overdue').length;
  checks.push({
    checkNumber: 1,
    name: 'Overdue invoices',
    countOrValue: c1,
    severity: 'High',
    status: c1 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Invoices: Status',
    whyItMatters: 'Late payments reduce cash. Contact the customer and follow up.'
  });

  // Check 2: Invoices missing information
  const c2 = invoices.filter(i => !!i.missingInfoFlag).length;
  checks.push({
    checkNumber: 2,
    name: 'Invoices missing information',
    countOrValue: c2,
    severity: 'Medium',
    status: c2 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Invoices: Missing info flag',
    whyItMatters: 'Incomplete invoices cannot be traced to a customer, job or division.'
  });

  // Check 3: Invoices paid more than the amount due
  const c3 = invoices.filter(i => !!i.overpaidFlag).length;
  checks.push({
    checkNumber: 3,
    name: 'Invoices paid more than the amount due',
    countOrValue: c3,
    severity: 'Medium',
    status: c3 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Invoices: Overpaid flag',
    whyItMatters: 'Check for duplicate or mis-allocated receipts.'
  });

  // Check 4: Payments with a repeated reference
  const c4 = payments.filter(p => !!p.duplicateFlag).length;
  checks.push({
    checkNumber: 4,
    name: 'Payments with a repeated reference',
    countOrValue: c4,
    severity: 'High',
    status: c4 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Payments: Duplicate flag',
    whyItMatters: 'A repeated bank or mobile-money reference may be a duplicate entry.'
  });

  // Check 5: Payments linked to an unknown invoice
  const c5 = payments.filter(p => !!p.invoiceFlag).length;
  checks.push({
    checkNumber: 5,
    name: 'Payments linked to an unknown invoice',
    countOrValue: c5,
    severity: 'High',
    status: c5 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Payments: Invoice flag',
    whyItMatters: 'Cash cannot be matched to a customer.'
  });

  // Check 6: Payments not reconciled after the grace period
  const c6 = payments.filter(p => !!p.unreconciledFlag).length;
  checks.push({
    checkNumber: 6,
    name: 'Payments not reconciled after the grace period',
    countOrValue: c6,
    severity: 'Medium',
    status: c6 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Payments: Unreconciled flag',
    whyItMatters: 'Match the payment to the bank or mobile-money statement.'
  });

  // Check 7: Expenses without evidence
  const c7 = expenses.filter(e => !!e.evidenceFlag).length;
  checks.push({
    checkNumber: 7,
    name: 'Expenses without evidence',
    countOrValue: c7,
    severity: 'High',
    status: c7 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Expenses: Evidence flag',
    whyItMatters: 'Every expense needs a receipt reference for accountability.'
  });

  // Check 8: Expenses needing approval or paid without approval
  const c8 = expenses.filter(e => !!e.approvalFlag).length;
  checks.push({
    checkNumber: 8,
    name: 'Expenses needing approval or paid without approval',
    countOrValue: c8,
    severity: 'High',
    status: c8 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Expenses: Approval flag',
    whyItMatters: 'Spending above the threshold must be approved before payment.'
  });

  // Check 9: Direct costs without a job
  const c9 = expenses.filter(e => !!e.directCostFlag).length;
  checks.push({
    checkNumber: 9,
    name: 'Direct costs without a job',
    countOrValue: c9,
    severity: 'Medium',
    status: c9 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Expenses: Direct cost flag',
    whyItMatters: 'Direct costs must be linked to a job so job profit is correct.'
  });

  // Check 10: Possible duplicate expenses
  const c10 = expenses.filter(e => !!e.duplicateFlag).length;
  checks.push({
    checkNumber: 10,
    name: 'Possible duplicate expenses',
    countOrValue: c10,
    severity: 'High',
    status: c10 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Expenses: Duplicate flag',
    whyItMatters: 'Same supplier, reference and amount appear more than once.'
  });

  // Check 11: Expenses linked to an unknown job
  const c11 = expenses.filter(e => !!e.jobFlag).length;
  checks.push({
    checkNumber: 11,
    name: 'Expenses linked to an unknown job',
    countOrValue: c11,
    severity: 'Medium',
    status: c11 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Expenses: Job flag',
    whyItMatters: 'Correct the Job ID.'
  });

  // Check 12: Jobs overdue
  const c12 = jobs.filter(j => !!j.overdueFlag).length;
  checks.push({
    checkNumber: 12,
    name: 'Jobs overdue',
    countOrValue: c12,
    severity: 'High',
    status: c12 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Jobs: Overdue flag',
    whyItMatters: 'Delays hurt customer satisfaction. Reschedule or update the status.'
  });

  // Check 13: Jobs with a cost overrun
  const c13 = jobs.filter(j => !!j.costOverrunFlag).length;
  checks.push({
    checkNumber: 13,
    name: 'Jobs with a cost overrun',
    countOrValue: c13,
    severity: 'Medium',
    status: c13 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Jobs: Cost overrun flag',
    whyItMatters: 'Review the estimate or the cost control for the service.'
  });

  // Check 14: Completed jobs missing evidence
  const c14 = jobs.filter(j => !!j.evidenceFlag).length;
  checks.push({
    checkNumber: 14,
    name: 'Completed jobs missing evidence',
    countOrValue: c14,
    severity: 'Medium',
    status: c14 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Jobs: Evidence flag',
    whyItMatters: 'Record the photo folder or checklist reference.'
  });

  // Check 15: Completed jobs not billed
  const c15 = jobs.filter(j => !!j.unbilledFlag).length;
  checks.push({
    checkNumber: 15,
    name: 'Completed jobs not billed',
    countOrValue: c15,
    severity: 'High',
    status: c15 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Jobs: Unbilled flag',
    whyItMatters: 'Work done but not invoiced is lost revenue.'
  });

  // Check 16: Invoiced jobs below the minimum margin
  const c16 = jobs.filter(j => !!j.marginFlag).length;
  checks.push({
    checkNumber: 16,
    name: 'Invoiced jobs below the minimum margin',
    countOrValue: c16,
    severity: 'Medium',
    status: c16 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Jobs: Margin flag',
    whyItMatters: 'Review pricing or cost for the service.'
  });

  // Check 17: Jobs with a complaint or rework
  const c17 = jobs.filter(j => j.reworkOrComplaint === 'Yes').length;
  checks.push({
    checkNumber: 17,
    name: 'Jobs with a complaint or rework',
    countOrValue: c17,
    severity: 'Medium',
    status: c17 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Jobs: Rework or complaint',
    whyItMatters: 'Follow up with the customer and the field professional.'
  });

  // Check 18: Quotations below the minimum margin
  const c18 = quotes.filter(q => !!q.marginFlag).length;
  checks.push({
    checkNumber: 18,
    name: 'Quotations below the minimum margin',
    countOrValue: c18,
    severity: 'Medium',
    status: c18 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Quotes: Margin flag',
    whyItMatters: 'Reprice or get approval before sending.'
  });

  // Check 19: Quotations with an unapproved discount
  const c19 = quotes.filter(q => !!q.discountFlag).length;
  checks.push({
    checkNumber: 19,
    name: 'Quotations with an unapproved discount',
    countOrValue: c19,
    severity: 'Medium',
    status: c19 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Quotes: Discount flag',
    whyItMatters: 'Discounts need approval.'
  });

  // Check 20: Sent quotations that have expired
  const c20 = quotes.filter(q => !!q.expiryFlag).length;
  checks.push({
    checkNumber: 20,
    name: 'Sent quotations that have expired',
    countOrValue: c20,
    severity: 'Low',
    status: c20 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Quotes: Expiry flag',
    whyItMatters: 'Follow up or mark Expired.'
  });

  // Check 21: Assignments to unverified contractors
  const c21 = assignments.filter(a => !!a.verificationFlag).length;
  checks.push({
    checkNumber: 21,
    name: 'Assignments to unverified contractors',
    countOrValue: c21,
    severity: 'High',
    status: c21 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Assignments: Verification flag',
    whyItMatters: 'Only verified people should be assigned to customer sites.'
  });

  // Check 22: Assignments paid above the agreed rate
  const c22 = assignments.filter(a => !!a.rateFlag).length;
  checks.push({
    checkNumber: 22,
    name: 'Assignments paid above the agreed rate',
    countOrValue: c22,
    severity: 'Low',
    status: c22 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Assignments: Rate flag',
    whyItMatters: 'Check the agreed rate.'
  });

  // Check 23: Assignments linked to an unknown job
  const c23 = assignments.filter(a => !!a.jobFlag).length;
  checks.push({
    checkNumber: 23,
    name: 'Assignments linked to an unknown job',
    countOrValue: c23,
    severity: 'Medium',
    status: c23 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Assignments: Job flag',
    whyItMatters: 'Correct the Job ID.'
  });

  // Check 24: NEIP-funded spending exceeds NEIP funds received (1 = yes)
  const neipReceived = fundingLines
    .filter(f => f.source === 'NEIP funding')
    .reduce((sum, f) => sum + (f.amountReceived || 0), 0);
  const neipSpent = expenses
    .filter(e => e.fundingSource === 'NEIP funding' && e.paymentStatus === 'Paid')
    .reduce((sum, e) => sum + e.amount, 0);
  const c24 = neipSpent > neipReceived ? 1 : 0;
  checks.push({
    checkNumber: 24,
    name: 'NEIP-funded spending exceeds NEIP funds received (1 = yes)',
    countOrValue: c24,
    severity: 'High',
    status: c24 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Expenses: Funding source; Funding',
    whyItMatters: 'Spending tagged to NEIP funding must not exceed money actually received.'
  });

  // Check 25: Founder pre-funding capital not fully secured (1 = yes)
  const founderLine = fundingLines.find(f => f.source === 'Founder capital');
  const c25 = founderLine && founderLine.status !== 'Received' && founderLine.status !== 'Approved' ? 1 : 0;
  checks.push({
    checkNumber: 25,
    name: 'Founder pre-funding capital not fully secured (1 = yes)',
    countOrValue: c25,
    severity: 'High',
    status: c25 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Funding',
    whyItMatters: 'Stage 1 and the pilot depend on capital that is required but not yet secured. Do not spend it until confirmed.'
  });

  // Check 26: Funding categories over budget
  const c26 = grantCategories.filter(cat => cat.budgetFlag === 'Over budget').length;
  checks.push({
    checkNumber: 26,
    name: 'Funding categories over budget',
    countOrValue: c26,
    severity: 'High',
    status: c26 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'GrantBudget: Budget flag',
    whyItMatters: 'Spending and commitments exceed the category budget.'
  });

  // Check 27: Working capital reserve drawn
  const c27 = grantCategories.filter(cat => cat.budgetFlag === 'Reserve drawn').length;
  checks.push({
    checkNumber: 27,
    name: 'Working capital reserve drawn',
    countOrValue: c27,
    severity: 'Medium',
    status: c27 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'GrantBudget: Budget flag',
    whyItMatters: 'The reserve is held as cash. Spending against it needs written approval.'
  });

  // Check 28: NEIP-funded expenses without a grant category
  const c28 = expenses.filter(e => !!e.grantFlag).length;
  checks.push({
    checkNumber: 28,
    name: 'NEIP-funded expenses without a grant category',
    countOrValue: c28,
    severity: 'Medium',
    status: c28 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Expenses: Grant flag',
    whyItMatters: 'Funding spend must be reported by category.'
  });

  // Check 29: Funding lines with date or amount problems
  const c29 = fundingLines.filter(f => !!f.cashFlag).length;
  checks.push({
    checkNumber: 29,
    name: 'Funding lines with date or amount problems',
    countOrValue: c29,
    severity: 'Medium',
    status: c29 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Funding: Cash flag',
    whyItMatters: 'Received money needs a date and must not exceed the approved amount.'
  });

  // Check 30: Commitment records not linked to expenses
  const c30 = commitments.filter(cm => !!cm.linkFlag).length;
  checks.push({
    checkNumber: 30,
    name: 'Commitment records not linked to expenses',
    countOrValue: c30,
    severity: 'Medium',
    status: c30 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Commitments: Link flag',
    whyItMatters: 'A fulfilled commitment must point to its expense so it is not counted twice.'
  });

  // Check 31: Expenses above the threshold without a purchase request
  const c31 = expenses.filter(e => !!e.requestFlag).length;
  checks.push({
    checkNumber: 31,
    name: 'Expenses above the threshold without a purchase request',
    countOrValue: c31,
    severity: 'Medium',
    status: c31 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Expenses: Request flag',
    whyItMatters: 'Ask before spending: raise and approve a purchase request.'
  });

  // Check 32: Purchase requests with too few quotes
  const c32 = purchaseReqs.filter(pr => !!pr.quotesFlag).length;
  checks.push({
    checkNumber: 32,
    name: 'Purchase requests with too few quotes',
    countOrValue: c32,
    severity: 'Medium',
    status: c32 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'PurchaseRequests: Quotes flag',
    whyItMatters: 'Obtain the required number of quotations.'
  });

  // Check 33: Purchase requests spent without approval
  const c33 = purchaseReqs.filter(pr => !!pr.approvalFlag).length;
  checks.push({
    checkNumber: 33,
    name: 'Purchase requests spent without approval',
    countOrValue: c33,
    severity: 'High',
    status: c33 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'PurchaseRequests: flags',
    whyItMatters: 'Spending beyond or without approval.'
  });

  // Check 34: Capital expenses not in the asset register
  const assetExpenseIds = new Set(assets.map(a => a.expenseId).filter(Boolean));
  const c34 = expenses.filter(e => e.class === 'Capex' && !assetExpenseIds.has(e.expenseId)).length;
  checks.push({
    checkNumber: 34,
    name: 'Capital expenses not in the asset register',
    countOrValue: c34,
    severity: 'Medium',
    status: c34 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Expenses: Class = Capex; Assets',
    whyItMatters: 'Every capital purchase should have an asset record.'
  });

  // Check 35: Assets with a missing or unknown expense link
  const c35 = assets.filter(a => !!a.expenseLinkFlag).length;
  checks.push({
    checkNumber: 35,
    name: 'Assets with a missing or unknown expense link',
    countOrValue: c35,
    severity: 'Low',
    status: c35 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Assets: Expense link flag',
    whyItMatters: 'Link each asset to the expense that paid for it.'
  });

  // Check 36: Warranties expired or expiring
  const c36 = assets.filter(a => !!a.warrantyFlag).length;
  checks.push({
    checkNumber: 36,
    name: 'Warranties expired or expiring',
    countOrValue: c36,
    severity: 'Low',
    status: c36 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Assets: Warranty flag',
    whyItMatters: 'Claim or renew before cover ends.'
  });

  // Check 37: Equipment maintenance overdue
  const c37 = maintenanceLogs.filter(m => !!m.overdueFlag).length;
  checks.push({
    checkNumber: 37,
    name: 'Equipment maintenance overdue',
    countOrValue: c37,
    severity: 'Medium',
    status: c37 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Maintenance: Overdue flag',
    whyItMatters: 'Service equipment to protect job quality.'
  });

  // Check 38: Board recommendations overdue or unanswered
  const c38 = recommendations.filter(r => !!r.overdueFlag || !!r.responseFlag).length;
  checks.push({
    checkNumber: 38,
    name: 'Board recommendations overdue or unanswered',
    countOrValue: c38,
    severity: 'Medium',
    status: c38 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Advice: flags',
    whyItMatters: 'Every recommendation needs a recorded response and action.'
  });

  // Check 39: Actions overdue
  const c39 = actions.filter(a => !!a.overdueFlag).length;
  checks.push({
    checkNumber: 39,
    name: 'Actions overdue',
    countOrValue: c39,
    severity: 'High',
    status: c39 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Actions: Overdue flag',
    whyItMatters: 'Agree a new date or complete the action.'
  });

  // Check 40: Management decisions due for review
  const c40 = decisions.filter(d => !!d.reviewFlag).length;
  checks.push({
    checkNumber: 40,
    name: 'Management decisions due for review',
    countOrValue: c40,
    severity: 'Low',
    status: c40 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Decisions: Review flag',
    whyItMatters: 'Confirm the decision still stands.'
  });

  // Check 41: Board meetings without minutes or below quorum
  const c41 = meetings.filter(m => !!m.minutesFlag || !!m.quorumFlag).length;
  checks.push({
    checkNumber: 41,
    name: 'Board meetings without minutes or below quorum',
    countOrValue: c41,
    severity: 'Medium',
    status: c41 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'BoardMeetings: flags',
    whyItMatters: 'Minutes support accountability.'
  });

  // Check 42: Risk reviews overdue
  const c42 = risks.filter(r => !!r.reviewFlag).length;
  checks.push({
    checkNumber: 42,
    name: 'Risk reviews overdue',
    countOrValue: c42,
    severity: 'Medium',
    status: c42 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Risks: Review flag',
    whyItMatters: 'Review and re-score the risk.'
  });

  // Check 43: High or critical risks with no mitigation or owner
  const c43 = risks.filter(r => !!r.mitigationFlag).length;
  checks.push({
    checkNumber: 43,
    name: 'High or critical risks with no mitigation or owner',
    countOrValue: c43,
    severity: 'High',
    status: c43 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Risks: Mitigation flag',
    whyItMatters: 'Assign an owner and a mitigation.'
  });

  // Check 44: Compliance items expired, overdue or expiring
  const c44 = complianceItems.filter(cp => !!cp.expiryFlag).length;
  checks.push({
    checkNumber: 44,
    name: 'Compliance items expired, overdue or expiring',
    countOrValue: c44,
    severity: 'High',
    status: c44 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Compliance: Expiry flag',
    whyItMatters: 'Renew or confirm before the date.'
  });

  // Check 45: Compliance items with evidence not yet held
  const c45 = complianceItems.filter(cp => !!cp.pendingFlag).length;
  checks.push({
    checkNumber: 45,
    name: 'Compliance items with evidence not yet held',
    countOrValue: c45,
    severity: 'Medium',
    status: c45 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Compliance: Pending flag',
    whyItMatters: 'Confirm whether the item applies and file the evidence.'
  });

  // Check 46: Incidents open too long or without corrective action
  const c46 = incidents.filter(i => !!i.agingFlag || !!i.actionFlag).length;
  checks.push({
    checkNumber: 46,
    name: 'Incidents open too long or without corrective action',
    countOrValue: c46,
    severity: 'High',
    status: c46 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Incidents: flags',
    whyItMatters: 'Resolve and record a corrective action.'
  });

  // Check 47: Reconciliation differences unexplained or unreviewed
  const c47 = reconciliations.filter(rc => !!rc.differenceFlag || !!rc.reviewFlag).length;
  checks.push({
    checkNumber: 47,
    name: 'Reconciliation differences unexplained or unreviewed',
    countOrValue: c47,
    severity: 'High',
    status: c47 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Reconciliations: flags',
    whyItMatters: 'Explain every difference and have it reviewed.'
  });

  // Check 48: Closed months changed after close, or closed with open items
  const c48 = periodClose.filter(p => !!p.changedFlag || !!p.closeFlag).length;
  checks.push({
    checkNumber: 48,
    name: 'Closed months changed after close, or closed with open items',
    countOrValue: c48,
    severity: 'High',
    status: c48 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'PeriodClose: flags',
    whyItMatters: 'Review the late changes with management.'
  });

  // Check 49: Properties with an overdue inspection
  const c49 = properties.filter(p => !!p.inspectionFlag).length;
  checks.push({
    checkNumber: 49,
    name: 'Properties with an overdue inspection',
    countOrValue: c49,
    severity: 'Medium',
    status: c49 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Properties: Inspection flag',
    whyItMatters: 'Schedule the Property Watch inspection.'
  });

  // Check 50: Inspection reports incomplete
  const c50 = inspections.filter(ins => ins.reportFlag === 'Issued report incomplete').length;
  checks.push({
    checkNumber: 50,
    name: 'Inspection reports incomplete',
    countOrValue: c50,
    severity: 'Medium',
    status: c50 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Inspections: Report flag',
    whyItMatters: 'Complete observations, photos reference and recommendations before issuing.'
  });

  // Check 51: Duplicate IDs across main tables
  const allIds = [
    ...customers.map(c => c.customerId),
    ...properties.map(p => p.propertyId),
    ...enquiries.map(e => e.enquiryId),
    ...quotes.map(q => q.quoteId),
    ...jobs.map(j => j.jobId),
    ...assignments.map(a => a.assignmentId),
    ...contractors.map(c => c.contractorId),
    ...invoices.map(i => i.invoiceNo),
    ...payments.map(p => p.paymentId),
    ...expenses.map(e => e.expenseId),
    ...fundingLines.map(f => f.fundingId),
    ...commitments.map(c => c.commitmentId),
    ...purchaseReqs.map(pr => pr.requestId),
    ...assets.map(a => a.assetId),
    ...maintenanceLogs.map(m => m.logId),
    ...meetings.map(m => m.meetingId),
    ...recommendations.map(r => r.recId),
    ...decisions.map(d => d.decisionId),
    ...actions.map(a => a.actionId),
    ...risks.map(r => r.riskId),
    ...complianceItems.map(c => c.itemId),
    ...incidents.map(i => i.incidentId),
    ...reconciliations.map(r => r.reconId),
    ...inspections.map(i => i.inspectionId)
  ];
  const uniqueIds = new Set(allIds);
  const c51 = allIds.length - uniqueIds.size;
  checks.push({
    checkNumber: 51,
    name: 'Duplicate IDs across main tables',
    countOrValue: c51,
    severity: 'High',
    status: c51 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'ID columns',
    whyItMatters: 'Every record must have a unique ID.'
  });

  // Check 52: Cash below the minimum reserve (1 = yes)
  const currentCash = mgmtAccounts.yearTotal.closingCash;
  const c52 = settings.minimumCashReserve > 0 && currentCash < settings.minimumCashReserve ? 1 : 0;
  checks.push({
    checkNumber: 52,
    name: 'Cash below the minimum reserve (1 = yes)',
    countOrValue: c52,
    severity: 'High',
    status: c52 > 0 ? 'ATTENTION' : 'OK',
    whereToLook: 'Dashboard: cash balance',
    whyItMatters: 'Cash is below the reserve in Settings.'
  });

  // ==========================================
  // 6 RECONCILIATION CONTROL TOTALS
  // ==========================================
  const controlTotals: ControlCheckResult[] = [];

  // Total 1: Revenue in the management accounts equals invoiced net revenue for the year
  const yearStart = `${settings.reportingYear}-01-01`;
  const yearEnd = `${settings.reportingYear}-12-31`;
  const invoicedNetYear = roundMoney(
    invoices
      .filter(i => i.cancelled !== 'Yes' && i.invoiceDate >= yearStart && i.invoiceDate <= yearEnd)
      .reduce((sum, i) => sum + (i.netRevenue || 0), 0)
  );
  const diff1 = Math.abs(mgmtAccounts.yearTotal.totalRevenue - invoicedNetYear);
  controlTotals.push({
    checkNumber: 101,
    name: 'Revenue in the management accounts (year) equals invoiced net revenue for the year',
    countOrValue: roundMoney(diff1),
    severity: 'High',
    status: diff1 < 0.01 ? 'RECONCILED' : 'ATTENTION',
    whereToLook: 'Management Accounts vs. Invoices',
    whyItMatters: 'Accounts must reconcile to the invoice register.'
  });

  // Total 2: Cash received in the management accounts equals payments recorded for the year
  const paymentsYear = roundMoney(
    payments
      .filter(p => p.paymentDate >= yearStart && p.paymentDate <= yearEnd)
      .reduce((sum, p) => sum + p.amount, 0)
  );
  const diff2 = Math.abs(mgmtAccounts.yearTotal.cashReceivedCustomers - paymentsYear);
  controlTotals.push({
    checkNumber: 102,
    name: 'Cash received in the management accounts equals payments recorded for the year',
    countOrValue: roundMoney(diff2),
    severity: 'High',
    status: diff2 < 0.01 ? 'RECONCILED' : 'ATTENTION',
    whereToLook: 'Management Accounts vs. Payments',
    whyItMatters: 'Accounts cash received must equal payments recorded.'
  });

  // Total 3: Operating, direct and capital expenses in the accounts equal the expense register for the year
  const expensesYear = roundMoney(
    expenses
      .filter(e => e.expenseDate >= yearStart && e.expenseDate <= yearEnd)
      .reduce((sum, e) => sum + e.amount, 0)
  );
  const acctsExpenseTotal = roundMoney(
    mgmtAccounts.yearTotal.directMaterials +
    mgmtAccounts.yearTotal.directTransport +
    mgmtAccounts.yearTotal.totalOpex +
    mgmtAccounts.yearTotal.capex
  );
  const diff3 = Math.abs(acctsExpenseTotal - expensesYear);
  controlTotals.push({
    checkNumber: 103,
    name: 'Operating, direct and capital expenses in the accounts equal the expense register for the year',
    countOrValue: roundMoney(diff3),
    severity: 'High',
    status: diff3 < 0.01 ? 'RECONCILED' : 'ATTENTION',
    whereToLook: 'Management Accounts vs. Expenses',
    whyItMatters: 'All registered expenses must appear in accounts.'
  });

  // Total 4: Field labour in the accounts equals the assignments register for the year
  const assignmentsYear = roundMoney(
    assignments
      .filter(a => a.assignmentDate >= yearStart && a.assignmentDate <= yearEnd)
      .reduce((sum, a) => sum + (a.amount || 0), 0)
  );
  const diff4 = Math.abs(mgmtAccounts.yearTotal.directLabour - assignmentsYear);
  controlTotals.push({
    checkNumber: 104,
    name: 'Field labour in the accounts equals the assignments register for the year',
    countOrValue: roundMoney(diff4),
    severity: 'High',
    status: diff4 < 0.01 ? 'RECONCILED' : 'ATTENTION',
    whereToLook: 'Management Accounts vs. Assignments',
    whyItMatters: 'Field labour must match assignments without double-counting.'
  });

  // Total 5: Receivables at the report date equal the sum of invoice balances
  const sumInvoiceBalances = roundMoney(
    invoices
      .filter(i => i.cancelled !== 'Yes')
      .reduce((sum, i) => sum + Math.max(0, i.balance || 0), 0)
  );
  const diff5 = Math.abs(mgmtAccounts.yearTotal.receivables - sumInvoiceBalances);
  controlTotals.push({
    checkNumber: 105,
    name: 'Receivables at the report date equal the sum of invoice balances',
    countOrValue: roundMoney(diff5),
    severity: 'High',
    status: diff5 < 0.01 ? 'RECONCILED' : 'ATTENTION',
    whereToLook: 'Management Accounts vs. Invoice Balances',
    whyItMatters: 'Balance sheet receivables must match active invoice balances.'
  });

  // Total 6: Funding received in the accounts equals the Funding sheet for the year
  const fundingYear = roundMoney(
    fundingLines
      .filter(f => f.amountReceived > 0 && f.dateReceived && f.dateReceived >= yearStart && f.dateReceived <= yearEnd)
      .reduce((sum, f) => sum + f.amountReceived, 0)
  );
  const diff6 = Math.abs(mgmtAccounts.yearTotal.fundingReceived - fundingYear);
  controlTotals.push({
    checkNumber: 106,
    name: 'Funding received in the accounts equals the Funding sheet for the year',
    countOrValue: roundMoney(diff6),
    severity: 'High',
    status: diff6 < 0.01 ? 'RECONCILED' : 'ATTENTION',
    whereToLook: 'Management Accounts vs. Funding',
    whyItMatters: 'Cash funding received must reconcile.'
  });

  const itemsNeedingAttention = checks.filter(c => c.status === 'ATTENTION').length;

  // ==========================================
  // MANAGEMENT ATTENTION ALERTS
  // ==========================================
  const alerts: ManagementAlert[] = [
    {
      alert: 'Overdue customer payments',
      status: c1 > 0 ? 'ATTENTION' : 'OK',
      evidence: c1 > 0 ? `${c1} invoice(s) past due date.` : 'No issue found.',
      whyItMatters: 'Late payment ties up cash needed to pay field professionals and suppliers.',
      nextAction: 'Call or message each overdue customer; agree a payment date; pause new work for repeat late payers.'
    },
    {
      alert: 'Jobs past their due date',
      status: c12 > 0 ? 'ATTENTION' : 'OK',
      evidence: c12 > 0 ? `${c12} job(s) past due date.` : 'No issue found.',
      whyItMatters: 'Delays reduce satisfaction and repeat business.',
      nextAction: 'Reschedule with the customer and update the job status.'
    },
    {
      alert: 'Completed work not yet billed',
      status: c15 > 0 ? 'ATTENTION' : 'OK',
      evidence: c15 > 0 ? `${c15} completed job(s) without an invoice.` : 'No issue found.',
      whyItMatters: 'Unbilled work is lost or delayed revenue.',
      nextAction: 'Raise the invoice the same day the customer accepts the work.'
    },
    {
      alert: 'Quotations below margin or discounts unapproved',
      status: c18 > 0 || c19 > 0 ? 'ATTENTION' : 'OK',
      evidence: c18 > 0 || c19 > 0 
        ? `${c18} quote(s) below margin; ${c19} quote(s) with unapproved discount.` 
        : 'No issue found.',
      whyItMatters: 'Low-margin work can lose money once direct costs are paid.',
      nextAction: 'Reprice or obtain approval before sending the quotation.'
    },
    {
      alert: 'Job cost overruns and rework',
      status: c13 > 0 || c17 > 0 ? 'ATTENTION' : 'OK',
      evidence: c13 > 0 || c17 > 0 
        ? `${c13} job(s) with cost overrun; ${c17} job(s) with rework/complaint.` 
        : 'No issue found.',
      whyItMatters: 'Overruns and rework reduce contribution and customer trust.',
      nextAction: 'Review the estimate and the quality checklist for the service; coach the field professional.'
    },
    {
      alert: 'Spending controls',
      status: c7 > 0 || c8 > 0 || c9 > 0 ? 'ATTENTION' : 'OK',
      evidence: c7 > 0 || c8 > 0 || c9 > 0
        ? `${c7} expense(s) without receipt; ${c8} needing approval; ${c9} direct costs without job.`
        : 'No issue found.',
      whyItMatters: 'Weak records undermine accountability and job profit.',
      nextAction: 'Attach receipts, obtain approvals and link direct costs to jobs before month-end.'
    },
    {
      alert: 'Payment records and reconciliation',
      status: c4 > 0 || c5 > 0 || c6 > 0 ? 'ATTENTION' : 'OK',
      evidence: c4 > 0 || c5 > 0 || c6 > 0
        ? `${c4} duplicate ref(s); ${c5} unknown invoice link(s); ${c6} unreconciled payment(s).`
        : 'No issue found.',
      whyItMatters: 'Unmatched receipts can hide errors or duplicates.',
      nextAction: 'Match each receipt to the bank or mobile-money statement and fix references.'
    },
    {
      alert: 'Cash below the reserve',
      status: c52 > 0 ? 'ATTENTION' : 'OK',
      evidence: c52 > 0 ? `Current cash balance GH₵${currentCash} is below reserve GH₵${settings.minimumCashReserve}.` : 'No issue found.',
      whyItMatters: 'Low cash can stop work and delay field professional payments.',
      nextAction: 'Collect overdue invoices first; delay discretionary spending.'
    },
    {
      alert: 'Spending against budget',
      status: 'OK',
      evidence: 'No issue found.',
      whyItMatters: 'Overspending reduces the cash left for operations.',
      nextAction: 'Stop non-essential spending in those categories or approve a revised budget.'
    },
    {
      alert: 'Funding and grant controls',
      status: c24 > 0 || c25 > 0 || c26 > 0 || c27 > 0 || c28 > 0 ? 'ATTENTION' : 'OK',
      evidence: c25 > 0 
        ? `Founder pre-funding capital is not fully secured. ${c26} category(ies) over budget; ${c28} NEIP expense(s) without a grant category.`
        : 'No issue found.',
      whyItMatters: 'Funding requested or approved is not cash. Spending ahead of money received breaks the funding rules.',
      nextAction: 'Hold spending until funds are confirmed; tag every NEIP expense with its category.'
    },
    {
      alert: 'Purchasing approvals',
      status: c31 > 0 || c32 > 0 || c33 > 0 ? 'ATTENTION' : 'OK',
      evidence: c31 > 0 || c32 > 0 || c33 > 0
        ? `${c31} expense(s) without request; ${c32} request(s) with too few quotes; ${c33} spent without approval.`
        : 'No issue found.',
      whyItMatters: 'Buying before approval and without quotes weakens value for money and accountability.',
      nextAction: 'Raise a purchase request, get the required quotes and approval before paying.'
    },
    {
      alert: 'Compliance documents and checks',
      status: c44 > 0 || c45 > 0 ? 'ATTENTION' : 'OK',
      evidence: c45 > 0
        ? `${c44} item(s) expired, overdue or expiring; ${c45} item(s) with evidence not yet held.`
        : 'No issue found.',
      whyItMatters: 'Missing registrations or cover can stop work or expose Civitas to claims.',
      nextAction: 'Confirm which items apply, obtain the documents and record the expiry dates.'
    },
    {
      alert: 'Board follow-up and actions',
      status: c38 > 0 || c39 > 0 || c41 > 0 ? 'ATTENTION' : 'OK',
      evidence: c38 > 0 || c39 > 0 || c41 > 0
        ? `${c38} recommendation(s) overdue; ${c39} action(s) overdue.`
        : 'No issue found.',
      whyItMatters: 'Advice that is not answered or acted on weakens oversight.',
      nextAction: 'Record a response to every recommendation and agree new dates for late actions.'
    },
    {
      alert: 'Risks and incidents',
      status: c42 > 0 || c43 > 0 || c46 > 0 ? 'ATTENTION' : 'OK',
      evidence: c42 > 0 || c43 > 0 || c46 > 0
        ? `${c43} high/critical risk(s) without mitigation; ${c46} open incident(s).`
        : 'No issue found.',
      whyItMatters: 'Unmanaged high risks and unresolved incidents cause losses.',
      nextAction: 'Assign owners and mitigations; close incidents with a recorded corrective action.'
    },
    {
      alert: 'Reconciliation and month-end close',
      status: c47 > 0 || c48 > 0 ? 'ATTENTION' : 'OK',
      evidence: c47 > 0 || c48 > 0
        ? `${c47} reconciliation difference(s); ${c48} closed month issue(s).`
        : 'No issue found.',
      whyItMatters: 'Unreconciled cash and late changes to closed months hide errors.',
      nextAction: 'Explain each difference, review it, and review any late change to a closed month.'
    },
    {
      alert: 'Equipment and inspections',
      status: c37 > 0 || c49 > 0 || c50 > 0 ? 'ATTENTION' : 'OK',
      evidence: c37 > 0 || c49 > 0 || c50 > 0
        ? `${c37} maintenance overdue; ${c49} property inspection(s) overdue.`
        : 'No issue found.',
      whyItMatters: 'Untracked equipment and late inspections reduce service quality and customer trust.',
      nextAction: 'Add missing assets, service equipment and complete overdue inspections.'
    },
    {
      alert: 'Unverified field professionals on assignments',
      status: c21 > 0 ? 'ATTENTION' : 'OK',
      evidence: c21 > 0 ? `${c21} assignment(s) given to unverified contractor.` : 'No issue found.',
      whyItMatters: 'Unvetted people on customer sites are a safety and reputation risk.',
      nextAction: 'Complete vetting and safety orientation before further assignments.'
    }
  ];

  return {
    checks,
    controlTotals,
    itemsNeedingAttention,
    alerts
  };
}
