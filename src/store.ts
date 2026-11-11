/**
 * CIVITAS ESTATE & MAINTENANCE
 * Operations Platform Central Reactive Store & Transactional Engine
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
  SystemUser,
  UserRole
} from './types.ts';

import {
  DEFAULT_SETTINGS,
  DEFAULT_SERVICES,
  DEFAULT_FUNDING,
  DEFAULT_GRANT_BUDGET,
  DEFAULT_COMPLIANCE_PROMPTS,
  DEFAULT_USERS
} from './seed.ts';

import {
  calculateQuoteLines,
  calculateQuotes,
  calculateAssignments,
  calculateContractors,
  calculateExpenses,
  calculateJobs,
  calculateInvoices,
  calculatePayments,
  calculateCustomers,
  calculateProperties,
  calculateEnquiries,
  calculateAssets,
  calculateFunding,
  calculateCommitments,
  calculatePurchaseRequests,
  calculateGrantBudget,
  calculateBoardMeetings,
  calculateAdvisoryRecommendations,
  calculateDecisions,
  calculateActions,
  calculateRisks,
  calculateCompliance,
  calculateIncidents,
  calculateReconciliations,
  calculatePeriodClose,
  calculateInspections,
  calculateMaintenance
} from './calculations.ts';

import { generateManagementAccounts, type YearManagementAccounts } from './management-accounts.ts';
import { evaluateControlChecks, type SystemChecksEvaluation } from './checks.ts';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CLOSE_PERIOD' | 'IMPORT' | 'APPROVE' | 'REJECT' | 'LOGIN' | 'LOGOUT';
  entity: string;
  entityId: string;
  actor: string;
  details?: string;
}

export interface OpsDatabaseState {
  settings: SystemSettings;
  customers: Customer[];
  properties: Property[];
  enquiries: Enquiry[];
  services: ServiceItem[];
  quotes: Quote[];
  quoteLines: QuoteLine[];
  jobs: Job[];
  assignments: Assignment[];
  contractors: Contractor[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  budget: BudgetItem[];
  funding: FundingLine[];
  grantBudget: GrantBudgetCategory[];
  commitments: Commitment[];
  purchaseRequests: PurchaseRequest[];
  assets: Asset[];
  maintenance: MaintenanceLog[];
  boardMeetings: BoardMeeting[];
  advice: AdvisoryRecommendation[];
  decisions: ManagementDecision[];
  actions: ActionItem[];
  risks: RiskItem[];
  compliance: ComplianceItem[];
  incidents: Incident[];
  reconciliations: FinancialReconciliation[];
  periodClose: PeriodCloseRecord[];
  inspections: PropertyInspection[];
  users?: SystemUser[];
  auditLogs: AuditLogEntry[];
}

const STORAGE_KEY = 'civitas_ops_store_v2_prod';
const SESSION_USER_KEY = 'civitas_ops_active_user_v2';

export class OpsStore {
  private state: OpsDatabaseState;
  private currentUser: SystemUser | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadInitialState();
    if (!this.state.users || this.state.users.length === 0) {
      this.state.users = [...DEFAULT_USERS];
    }
    this.loadSessionUser();
    this.recalculateAll();
  }

  private loadSessionUser(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const savedUserId = window.sessionStorage.getItem(SESSION_USER_KEY);
        if (savedUserId && this.state.users) {
          const found = this.state.users.find(u => u.userId === savedUserId && u.status === 'Active');
          if (found) this.currentUser = found;
        }
      } catch {
        // ignore storage errors
      }
    }
  }

  private loadInitialState(): OpsDatabaseState {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...this.getEmptyState(),
            ...parsed,
            users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : [...DEFAULT_USERS],
            settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) }
          };
        }
      } catch (e) {
        console.warn('Failed to parse saved ops store:', e);
      }
    }
    return this.getEmptyState();
  }

  public getEmptyState(): OpsDatabaseState {
    return {
      settings: { ...DEFAULT_SETTINGS },
      customers: [],
      properties: [],
      enquiries: [],
      services: [...DEFAULT_SERVICES],
      quotes: [],
      quoteLines: [],
      jobs: [],
      assignments: [],
      contractors: [],
      invoices: [],
      payments: [],
      expenses: [],
      budget: [],
      funding: [...DEFAULT_FUNDING],
      grantBudget: [...DEFAULT_GRANT_BUDGET],
      commitments: [],
      purchaseRequests: [],
      assets: [],
      maintenance: [],
      boardMeetings: [],
      advice: [],
      decisions: [],
      actions: [],
      risks: [],
      compliance: [...DEFAULT_COMPLIANCE_PROMPTS],
      incidents: [],
      reconciliations: [],
      periodClose: [],
      inspections: [],
      users: [...DEFAULT_USERS],
      auditLogs: []
    };
  }

  public saveToStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {
        console.error('Failed to save ops store to localStorage:', e);
      }
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(cb => cb());
  }

  // ==========================================
  // ID GENERATION
  // ==========================================
  public getNextId(prefix: string, list: { [key: string]: any }[], idField: string, pad = 4): string {
    let max = 0;
    list.forEach(item => {
      const val = item[idField];
      if (typeof val === 'string' && val.startsWith(prefix)) {
        const num = parseInt(val.replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > max) max = num;
      }
    });
    return `${prefix}${String(max + 1).padStart(pad, '0')}`;
  }

  public nextCustomerId(): string { return this.getNextId('C', this.state.customers, 'customerId'); }
  public nextPropertyId(): string { return this.getNextId('P', this.state.properties, 'propertyId'); }
  public nextEnquiryId(): string { return this.getNextId('E', this.state.enquiries, 'enquiryId'); }
  public nextQuoteId(): string { return this.getNextId('Q', this.state.quotes, 'quoteId'); }
  public nextJobId(): string { return this.getNextId('J', this.state.jobs, 'jobId'); }
  public nextAssignmentId(): string { return this.getNextId('A', this.state.assignments, 'assignmentId'); }
  public nextContractorId(): string { return this.getNextId('W', this.state.contractors, 'contractorId'); }
  public nextInvoiceNo(): string { return this.getNextId('INV', this.state.invoices, 'invoiceNo'); }
  public nextPaymentId(): string { return this.getNextId('PAY', this.state.payments, 'paymentId'); }
  public nextExpenseId(): string { return this.getNextId('EXP', this.state.expenses, 'expenseId'); }
  public nextFundingId(): string { return this.getNextId('F', this.state.funding, 'fundingId'); }
  public nextCommitmentId(): string { return this.getNextId('CM', this.state.commitments, 'commitmentId'); }
  public nextPurchaseRequestId(): string { return this.getNextId('PR', this.state.purchaseRequests, 'requestId'); }
  public nextAssetId(): string { return this.getNextId('AS', this.state.assets, 'assetId'); }
  public nextMaintenanceLogId(): string { return this.getNextId('MT', this.state.maintenance, 'logId'); }
  public nextBoardMeetingId(): string { return this.getNextId('BM', this.state.boardMeetings, 'meetingId'); }
  public nextRecommendationId(): string { return this.getNextId('AD', this.state.advice, 'recId'); }
  public nextDecisionId(): string { return this.getNextId('DC', this.state.decisions, 'decisionId'); }
  public nextActionId(): string { return this.getNextId('AC', this.state.actions, 'actionId'); }
  public nextRiskId(): string { return this.getNextId('RK', this.state.risks, 'riskId'); }
  public nextComplianceItemId(): string { return this.getNextId('CP', this.state.compliance, 'itemId'); }
  public nextIncidentId(): string { return this.getNextId('IN', this.state.incidents, 'incidentId'); }
  public nextReconciliationId(): string { return this.getNextId('RC', this.state.reconciliations, 'reconId'); }
  public nextInspectionId(): string { return this.getNextId('IS', this.state.inspections, 'inspectionId'); }
  public nextUserId(): string { return this.getNextId('U', this.state.users || [], 'userId'); }

  // ==========================================
  // RECALCULATION PIPELINE
  // ==========================================
  public recalculateAll(): void {
    const s = this.state.settings;

    // 1. Quote Lines & Quotes
    this.state.quoteLines = calculateQuoteLines(this.state.quoteLines, this.state.services);
    this.state.quotes = calculateQuotes(
      this.state.quotes,
      this.state.quoteLines,
      this.state.customers,
      this.state.jobs,
      s
    );

    // 2. Assignments & Contractors
    this.state.assignments = calculateAssignments(
      this.state.assignments,
      this.state.contractors,
      this.state.jobs
    );
    this.state.contractors = calculateContractors(
      this.state.contractors,
      this.state.assignments
    );

    // 3. Purchase Requests & Expenses
    this.state.purchaseRequests = calculatePurchaseRequests(
      this.state.purchaseRequests,
      this.state.expenses,
      s
    );
    this.state.expenses = calculateExpenses(
      this.state.expenses,
      this.state.jobs,
      this.state.purchaseRequests,
      s
    );

    // 4. Jobs
    this.state.jobs = calculateJobs(
      this.state.jobs,
      this.state.quotes,
      this.state.customers,
      this.state.services,
      this.state.properties,
      this.state.assignments,
      this.state.expenses,
      this.state.invoices,
      s
    );

    // 5. Invoices & Payments
    this.state.invoices = calculateInvoices(
      this.state.invoices,
      this.state.payments,
      this.state.customers,
      this.state.jobs,
      s
    );
    this.state.payments = calculatePayments(
      this.state.payments,
      this.state.invoices,
      this.state.customers,
      s
    );

    // 6. Properties & Inspections
    this.state.inspections = calculateInspections(
      this.state.inspections,
      this.state.properties
    );
    this.state.properties = calculateProperties(
      this.state.properties,
      this.state.customers,
      this.state.jobs,
      this.state.inspections,
      s
    );

    // 7. Customers & Enquiries
    this.state.customers = calculateCustomers(
      this.state.customers,
      this.state.properties,
      this.state.jobs,
      this.state.invoices,
      this.state.payments,
      s
    );
    this.state.enquiries = calculateEnquiries(
      this.state.enquiries,
      this.state.quotes,
      s
    );

    // 8. Assets & Maintenance
    this.state.assets = calculateAssets(this.state.assets, this.state.expenses, s);
    this.state.maintenance = calculateMaintenance(this.state.maintenance, this.state.assets, s);

    // 9. Funding, Commitments & Grant Budget
    this.state.funding = calculateFunding(this.state.funding);
    this.state.commitments = calculateCommitments(this.state.commitments, this.state.expenses);
    this.state.grantBudget = calculateGrantBudget(
      this.state.grantBudget,
      this.state.commitments,
      this.state.expenses,
      this.state.funding
    );

    // 10. Governance: Board, Advice, Decisions, Actions, Risks, Compliance, Incidents, Reconciliations
    this.state.advice = calculateAdvisoryRecommendations(this.state.advice, s);
    this.state.boardMeetings = calculateBoardMeetings(this.state.boardMeetings, this.state.advice, s);
    this.state.decisions = calculateDecisions(this.state.decisions, s);
    this.state.actions = calculateActions(this.state.actions, s);
    this.state.risks = calculateRisks(this.state.risks, s);
    this.state.compliance = calculateCompliance(this.state.compliance, s);
    this.state.incidents = calculateIncidents(this.state.incidents, s);
    this.state.reconciliations = calculateReconciliations(this.state.reconciliations);

    // 11. Period Close
    const evaluation = this.getChecksEvaluation();
    this.state.periodClose = calculatePeriodClose(
      this.state.periodClose,
      this.state.invoices,
      this.state.payments,
      this.state.expenses,
      this.state.assignments,
      evaluation.itemsNeedingAttention
    );
  }

  // ==========================================
  // GETTERS
  // ==========================================
  public getState(): OpsDatabaseState {
    return this.state;
  }

  public getSettings(): SystemSettings {
    return this.state.settings;
  }

  public getManagementAccounts(year?: number): YearManagementAccounts {
    const targetYear = year || this.state.settings.reportingYear;
    return generateManagementAccounts(
      targetYear,
      this.state.invoices,
      this.state.payments,
      this.state.expenses,
      this.state.assignments,
      this.state.assets,
      this.state.funding,
      this.state.settings
    );
  }

  public getChecksEvaluation(): SystemChecksEvaluation {
    return evaluateControlChecks(
      this.state.customers,
      this.state.properties,
      this.state.enquiries,
      this.state.quotes,
      this.state.quoteLines,
      this.state.jobs,
      this.state.assignments,
      this.state.contractors,
      this.state.invoices,
      this.state.payments,
      this.state.expenses,
      this.state.funding,
      this.state.grantBudget,
      this.state.commitments,
      this.state.purchaseRequests,
      this.state.assets,
      this.state.maintenance,
      this.state.boardMeetings,
      this.state.advice,
      this.state.decisions,
      this.state.actions,
      this.state.risks,
      this.state.compliance,
      this.state.incidents,
      this.state.reconciliations,
      this.state.periodClose,
      this.state.inspections,
      this.state.settings
    );
  }

  // ==========================================
  // AUDIT & LOGGING
  // ==========================================
  public getActorLabel(overrideActor?: string): string {
    if (overrideActor && overrideActor !== 'Founder/CEO') return overrideActor;
    if (this.currentUser) {
      return `${this.currentUser.fullName} (${this.currentUser.role})`;
    }
    return overrideActor || 'Founder/CEO';
  }

  private logAction(action: AuditLogEntry['action'], entity: string, entityId: string, actor = 'Founder/CEO', details = '') {
    const resolvedActor = this.getActorLabel(actor);
    const entry: AuditLogEntry = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      entity,
      entityId,
      actor: resolvedActor,
      details
    };
    this.state.auditLogs.unshift(entry);
    if (this.state.auditLogs.length > 500) {
      this.state.auditLogs.pop();
    }
  }

  // ==========================================
  // GENERIC MUTATORS (CRUD)
  // ==========================================
  public updateSettings(partial: Partial<SystemSettings>, actor = 'Founder/CEO'): void {
    this.state.settings = { ...this.state.settings, ...partial };
    this.logAction('UPDATE', 'Settings', 'SYSTEM', actor, 'Updated system settings');
    this.recalculateAll();
    this.saveToStorage();
  }

  // Customers
  public addCustomer(c: Customer, actor = 'Founder/CEO'): void {
    this.state.customers.push(c);
    this.logAction('CREATE', 'Customer', c.customerId, actor, c.customerName);
    this.recalculateAll();
    this.saveToStorage();
  }

  public updateCustomer(id: string, partial: Partial<Customer>, actor = 'Founder/CEO'): void {
    const idx = this.state.customers.findIndex(c => c.customerId === id);
    if (idx >= 0) {
      this.state.customers[idx] = { ...this.state.customers[idx], ...partial };
      this.logAction('UPDATE', 'Customer', id, actor);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  // Properties
  public addProperty(p: Property, actor = 'Founder/CEO'): void {
    this.state.properties.push(p);
    this.logAction('CREATE', 'Property', p.propertyId, actor, p.addressOrDescription);
    this.recalculateAll();
    this.saveToStorage();
  }

  public updateProperty(id: string, partial: Partial<Property>, actor = 'Founder/CEO'): void {
    const idx = this.state.properties.findIndex(p => p.propertyId === id);
    if (idx >= 0) {
      this.state.properties[idx] = { ...this.state.properties[idx], ...partial };
      this.logAction('UPDATE', 'Property', id, actor);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  // Enquiries
  public addEnquiry(e: Enquiry, actor = 'Founder/CEO'): void {
    this.state.enquiries.push(e);
    this.logAction('CREATE', 'Enquiry', e.enquiryId, actor, e.contactName);
    this.recalculateAll();
    this.saveToStorage();
  }

  public updateEnquiry(id: string, partial: Partial<Enquiry>, actor = 'Founder/CEO'): void {
    const idx = this.state.enquiries.findIndex(e => e.enquiryId === id);
    if (idx >= 0) {
      this.state.enquiries[idx] = { ...this.state.enquiries[idx], ...partial };
      this.logAction('UPDATE', 'Enquiry', id, actor);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  // Quotations & Lines
  public addQuoteWithLines(q: Quote, lines: QuoteLine[], actor = 'Founder/CEO'): void {
    this.state.quotes.push(q);
    lines.forEach(l => this.state.quoteLines.push(l));
    this.logAction('CREATE', 'Quote', q.quoteId, actor, `Lines: ${lines.length}`);
    this.recalculateAll();
    this.saveToStorage();
  }

  public updateQuote(id: string, partial: Partial<Quote>, actor = 'Founder/CEO'): void {
    const idx = this.state.quotes.findIndex(q => q.quoteId === id);
    if (idx >= 0) {
      this.state.quotes[idx] = { ...this.state.quotes[idx], ...partial };
      this.logAction('UPDATE', 'Quote', id, actor);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  // Jobs
  public addJob(j: Job, actor = 'Founder/CEO'): void {
    this.state.jobs.push(j);
    this.logAction('CREATE', 'Job', j.jobId, actor, j.description);
    this.recalculateAll();
    this.saveToStorage();
  }

  public updateJob(id: string, partial: Partial<Job>, actor = 'Founder/CEO'): void {
    const idx = this.state.jobs.findIndex(j => j.jobId === id);
    if (idx >= 0) {
      this.state.jobs[idx] = { ...this.state.jobs[idx], ...partial };
      this.logAction('UPDATE', 'Job', id, actor);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  // Contractors & Assignments
  public addContractor(c: Contractor, actor = 'Founder/CEO'): void {
    this.state.contractors.push(c);
    this.logAction('CREATE', 'Contractor', c.contractorId, actor, c.contractorName);
    this.recalculateAll();
    this.saveToStorage();
  }

  public updateContractor(id: string, partial: Partial<Contractor>, actor = 'Founder/CEO'): void {
    const idx = this.state.contractors.findIndex(c => c.contractorId === id);
    if (idx >= 0) {
      this.state.contractors[idx] = { ...this.state.contractors[idx], ...partial };
      this.logAction('UPDATE', 'Contractor', id, actor);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  public addAssignment(a: Assignment, actor = 'Founder/CEO'): void {
    this.state.assignments.push(a);
    this.logAction('CREATE', 'Assignment', a.assignmentId, actor, `Job: ${a.jobId}, Contractor: ${a.contractorId}`);
    this.recalculateAll();
    this.saveToStorage();
  }

  public updateAssignment(id: string, partial: Partial<Assignment>, actor = 'Founder/CEO'): void {
    const idx = this.state.assignments.findIndex(a => a.assignmentId === id);
    if (idx >= 0) {
      this.state.assignments[idx] = { ...this.state.assignments[idx], ...partial };
      this.logAction('UPDATE', 'Assignment', id, actor);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  // Invoices & Payments
  public addInvoice(inv: Invoice, actor = 'Founder/CEO'): void {
    this.state.invoices.push(inv);
    this.logAction('CREATE', 'Invoice', inv.invoiceNo, actor, `Customer: ${inv.customerId}, Amount: ${inv.amountBeforeTax}`);
    this.recalculateAll();
    this.saveToStorage();
  }

  public updateInvoice(no: string, partial: Partial<Invoice>, actor = 'Founder/CEO'): void {
    const idx = this.state.invoices.findIndex(i => i.invoiceNo === no);
    if (idx >= 0) {
      this.state.invoices[idx] = { ...this.state.invoices[idx], ...partial };
      this.logAction('UPDATE', 'Invoice', no, actor);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  public addPayment(p: Payment, actor = 'Founder/CEO'): void {
    this.state.payments.push(p);
    this.logAction('CREATE', 'Payment', p.paymentId, actor, `Invoice: ${p.invoiceNo}, Amount: ${p.amount}`);
    this.recalculateAll();
    this.saveToStorage();
  }

  public updatePayment(id: string, partial: Partial<Payment>, actor = 'Founder/CEO'): void {
    const idx = this.state.payments.findIndex(p => p.paymentId === id);
    if (idx >= 0) {
      this.state.payments[idx] = { ...this.state.payments[idx], ...partial };
      this.logAction('UPDATE', 'Payment', id, actor);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  // Expenses
  public addExpense(e: Expense, actor = 'Founder/CEO'): void {
    this.state.expenses.push(e);
    this.logAction('CREATE', 'Expense', e.expenseId, actor, `Supplier: ${e.supplier}, Amount: ${e.amount}`);
    this.recalculateAll();
    this.saveToStorage();
  }

  public updateExpense(id: string, partial: Partial<Expense>, actor = 'Founder/CEO'): void {
    const idx = this.state.expenses.findIndex(e => e.expenseId === id);
    if (idx >= 0) {
      this.state.expenses[idx] = { ...this.state.expenses[idx], ...partial };
      this.logAction('UPDATE', 'Expense', id, actor);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  // Funding & Purchase Requests
  public updateFunding(id: string, partial: Partial<FundingLine>, actor = 'Founder/CEO'): void {
    const idx = this.state.funding.findIndex(f => f.fundingId === id);
    if (idx >= 0) {
      this.state.funding[idx] = { ...this.state.funding[idx], ...partial };
      this.logAction('UPDATE', 'Funding', id, actor);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  public addPurchaseRequest(pr: PurchaseRequest, actor = 'Founder/CEO'): void {
    this.state.purchaseRequests.push(pr);
    this.logAction('CREATE', 'PurchaseRequest', pr.requestId, actor, pr.item);
    this.recalculateAll();
    this.saveToStorage();
  }

  public updatePurchaseRequest(id: string, partial: Partial<PurchaseRequest>, actor = 'Founder/CEO'): void {
    const idx = this.state.purchaseRequests.findIndex(pr => pr.requestId === id);
    if (idx >= 0) {
      this.state.purchaseRequests[idx] = { ...this.state.purchaseRequests[idx], ...partial };
      this.logAction('UPDATE', 'PurchaseRequest', id, actor);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  // Assets & Maintenance
  public addAsset(a: Asset, actor = 'Founder/CEO'): void {
    this.state.assets.push(a);
    this.logAction('CREATE', 'Asset', a.assetId, actor, a.description);
    this.recalculateAll();
    this.saveToStorage();
  }

  public updateAsset(id: string, partial: Partial<Asset>, actor = 'Founder/CEO'): void {
    const idx = this.state.assets.findIndex(a => a.assetId === id);
    if (idx >= 0) {
      this.state.assets[idx] = { ...this.state.assets[idx], ...partial };
      this.logAction('UPDATE', 'Asset', id, actor);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  public addMaintenanceLog(m: MaintenanceLog, actor = 'Founder/CEO'): void {
    this.state.maintenance.push(m);
    this.logAction('CREATE', 'MaintenanceLog', m.logId, actor, `Asset: ${m.assetId}`);
    this.recalculateAll();
    this.saveToStorage();
  }

  // Inspections
  public addInspection(ins: PropertyInspection, actor = 'Founder/CEO'): void {
    this.state.inspections.push(ins);
    this.logAction('CREATE', 'Inspection', ins.inspectionId, actor, `Property: ${ins.propertyId}`);
    this.recalculateAll();
    this.saveToStorage();
  }

  public updateInspection(id: string, partial: Partial<PropertyInspection>, actor = 'Founder/CEO'): void {
    const idx = this.state.inspections.findIndex(i => i.inspectionId === id);
    if (idx >= 0) {
      this.state.inspections[idx] = { ...this.state.inspections[idx], ...partial };
      this.logAction('UPDATE', 'Inspection', id, actor);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  // Governance: Board, Advice, Decisions, Actions, Risks, Compliance, Incidents
  public addBoardMeeting(bm: BoardMeeting, actor = 'Founder/CEO'): void {
    this.state.boardMeetings.push(bm);
    this.logAction('CREATE', 'BoardMeeting', bm.meetingId, actor);
    this.recalculateAll();
    this.saveToStorage();
  }

  public addAdvice(ad: AdvisoryRecommendation, actor = 'Founder/CEO'): void {
    this.state.advice.push(ad);
    this.logAction('CREATE', 'Advice', ad.recId, actor, ad.recommendation);
    this.recalculateAll();
    this.saveToStorage();
  }

  public updateAdvice(id: string, partial: Partial<AdvisoryRecommendation>, actor = 'Founder/CEO'): void {
    const idx = this.state.advice.findIndex(a => a.recId === id);
    if (idx >= 0) {
      this.state.advice[idx] = { ...this.state.advice[idx], ...partial };
      this.logAction('UPDATE', 'Advice', id, actor);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  public addDecision(d: ManagementDecision, actor = 'Founder/CEO'): void {
    this.state.decisions.push(d);
    this.logAction('CREATE', 'Decision', d.decisionId, actor, d.decision);
    this.recalculateAll();
    this.saveToStorage();
  }

  public addAction(ac: ActionItem, actor = 'Founder/CEO'): void {
    this.state.actions.push(ac);
    this.logAction('CREATE', 'Action', ac.actionId, actor, ac.description);
    this.recalculateAll();
    this.saveToStorage();
  }

  public updateAction(id: string, partial: Partial<ActionItem>, actor = 'Founder/CEO'): void {
    const idx = this.state.actions.findIndex(a => a.actionId === id);
    if (idx >= 0) {
      this.state.actions[idx] = { ...this.state.actions[idx], ...partial };
      this.logAction('UPDATE', 'Action', id, actor);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  public addRisk(r: RiskItem, actor = 'Founder/CEO'): void {
    this.state.risks.push(r);
    this.logAction('CREATE', 'Risk', r.riskId, actor, r.riskDescription);
    this.recalculateAll();
    this.saveToStorage();
  }

  public updateRisk(id: string, partial: Partial<RiskItem>, actor = 'Founder/CEO'): void {
    const idx = this.state.risks.findIndex(r => r.riskId === id);
    if (idx >= 0) {
      this.state.risks[idx] = { ...this.state.risks[idx], ...partial };
      this.logAction('UPDATE', 'Risk', id, actor);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  public addCompliance(c: ComplianceItem, actor = 'Founder/CEO'): void {
    this.state.compliance.push(c);
    this.logAction('CREATE', 'Compliance', c.itemId, actor, c.item);
    this.recalculateAll();
    this.saveToStorage();
  }

  public updateCompliance(id: string, partial: Partial<ComplianceItem>, actor = 'Founder/CEO'): void {
    const idx = this.state.compliance.findIndex(c => c.itemId === id);
    if (idx >= 0) {
      this.state.compliance[idx] = { ...this.state.compliance[idx], ...partial };
      this.logAction('UPDATE', 'Compliance', id, actor);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  public addIncident(inc: Incident, actor = 'Founder/CEO'): void {
    this.state.incidents.push(inc);
    this.logAction('CREATE', 'Incident', inc.incidentId, actor, inc.description);
    this.recalculateAll();
    this.saveToStorage();
  }

  public updateIncident(id: string, partial: Partial<Incident>, actor = 'Founder/CEO'): void {
    const idx = this.state.incidents.findIndex(i => i.incidentId === id);
    if (idx >= 0) {
      this.state.incidents[idx] = { ...this.state.incidents[idx], ...partial };
      this.logAction('UPDATE', 'Incident', id, actor);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  // Reconciliations & Period Close
  public addReconciliation(rc: FinancialReconciliation, actor = 'Founder/CEO'): void {
    this.state.reconciliations.push(rc);
    this.logAction('CREATE', 'Reconciliation', rc.reconId, actor, `${rc.account} (${rc.monthEnd})`);
    this.recalculateAll();
    this.saveToStorage();
  }

  public closePeriod(month: string, closedBy = 'Founder/CEO'): void {
    const pDate = new Date(month);
    const year = pDate.getFullYear();
    const m = pDate.getMonth();
    const startStr = `${year}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, m + 1, 0).getDate();
    const endStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const invCount = this.state.invoices.filter(i => i.invoiceDate >= startStr && i.invoiceDate <= endStr).length;
    const payCount = this.state.payments.filter(p => p.paymentDate >= startStr && p.paymentDate <= endStr).length;
    const expCount = this.state.expenses.filter(e => e.expenseDate >= startStr && e.expenseDate <= endStr).length;
    const asnCount = this.state.assignments.filter(a => a.assignmentDate >= startStr && a.assignmentDate <= endStr).length;
    const evaluation = this.getChecksEvaluation();

    const record: PeriodCloseRecord = {
      month: startStr,
      status: 'Closed',
      closedBy,
      closedDate: new Date().toISOString().split('T')[0],
      invoicesAtClose: invCount,
      paymentsAtClose: payCount,
      expensesAtClose: expCount,
      assignmentsAtClose: asnCount,
      openCheckItemsAtClose: evaluation.itemsNeedingAttention
    };

    const existingIdx = this.state.periodClose.findIndex(p => p.month === startStr);
    if (existingIdx >= 0) {
      this.state.periodClose[existingIdx] = record;
    } else {
      this.state.periodClose.push(record);
    }

    this.logAction('CLOSE_PERIOD', 'PeriodClose', startStr, closedBy, `Invoices: ${invCount}, Payments: ${payCount}, Expenses: ${expCount}`);
    this.recalculateAll();
    this.saveToStorage();
  }

  // ==========================================
  // USER AUTHENTICATION, RBAC & GOVERNANCE
  // ==========================================
  public getUsers(): SystemUser[] {
    if (!this.state.users || this.state.users.length === 0) {
      this.state.users = [...DEFAULT_USERS];
    }
    return this.state.users;
  }

  public getCurrentUser(): SystemUser | null {
    return this.currentUser;
  }

  public authenticateUser(emailOrId: string, pinCode: string): { success: boolean; user?: SystemUser; error?: string } {
    const users = this.getUsers();
    const cleanInput = emailOrId.trim().toLowerCase();
    const found = users.find(
      u => u.email.toLowerCase() === cleanInput || u.userId.toLowerCase() === cleanInput
    );

    if (!found) {
      return { success: false, error: 'User account not found. Please check your email or user ID.' };
    }
    if (found.status !== 'Active') {
      return { success: false, error: 'This user account is currently suspended by Executive Governance.' };
    }
    if (found.pinCode !== pinCode.trim()) {
      return { success: false, error: 'Invalid security PIN / passcode.' };
    }

    return { success: true, user: this.loginAsUser(found.userId) || found };
  }

  public loginAsUser(userId: string): SystemUser | null {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.userId === userId);
    if (idx < 0) return null;
    const target = users[idx];
    if (target.status !== 'Active') return null;

    const nowStamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    target.lastLogin = nowStamp;
    this.currentUser = target;

    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(SESSION_USER_KEY, target.userId);
      } catch {
        // ignore
      }
    }

    this.logAction('LOGIN', 'UserSession', target.userId, `${target.fullName} (${target.role})`, `Authenticated into ${target.department}`);
    this.saveToStorage();
    return target;
  }

  public logout(): void {
    if (this.currentUser) {
      this.logAction('LOGOUT', 'UserSession', this.currentUser.userId, `${this.currentUser.fullName} (${this.currentUser.role})`, 'Ended active session');
    }
    this.currentUser = null;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem(SESSION_USER_KEY);
      } catch {
        // ignore
      }
    }
    this.notify();
  }

  public addUser(u: SystemUser, actor = 'Founder/CEO'): void {
    const users = this.getUsers();
    users.push(u);
    this.logAction('CREATE', 'SystemUser', u.userId, actor, `${u.fullName} (${u.role})`);
    this.saveToStorage();
  }

  public updateUser(userId: string, partial: Partial<SystemUser>, actor = 'Founder/CEO'): void {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.userId === userId);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...partial };
      if (this.currentUser && this.currentUser.userId === userId) {
        this.currentUser = users[idx].status === 'Active' ? users[idx] : null;
      }
      this.logAction('UPDATE', 'SystemUser', userId, actor, `Updated user status/profile`);
      this.saveToStorage();
    }
  }

  public approveExpense(expenseId: string, actor = 'Founder/CEO'): void {
    const idx = this.state.expenses.findIndex(e => e.expenseId === expenseId);
    if (idx >= 0) {
      const resolvedActor = this.getActorLabel(actor);
      this.state.expenses[idx] = {
        ...this.state.expenses[idx],
        approvalStatus: 'Approved',
        approvedBy: resolvedActor
      };
      this.logAction('APPROVE', 'Expense', expenseId, resolvedActor, `Approved expense of GH₵${this.state.expenses[idx].amount}`);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  public rejectExpense(expenseId: string, actor = 'Founder/CEO'): void {
    const idx = this.state.expenses.findIndex(e => e.expenseId === expenseId);
    if (idx >= 0) {
      const resolvedActor = this.getActorLabel(actor);
      this.state.expenses[idx] = {
        ...this.state.expenses[idx],
        approvalStatus: 'Rejected',
        approvedBy: resolvedActor
      };
      this.logAction('REJECT', 'Expense', expenseId, resolvedActor, `Rejected expense of GH₵${this.state.expenses[idx].amount}`);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  public approveQuoteDiscount(quoteId: string, actor = 'Founder/CEO'): void {
    const idx = this.state.quotes.findIndex(q => q.quoteId === quoteId);
    if (idx >= 0) {
      const resolvedActor = this.getActorLabel(actor);
      this.state.quotes[idx] = {
        ...this.state.quotes[idx],
        discountApproval: 'Approved'
      };
      this.logAction('APPROVE', 'Quote', quoteId, resolvedActor, `Approved quotation discount`);
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  // Backup & Restore
  public resetToEmpty(actor = 'Founder/CEO'): void {
    this.state = this.getEmptyState();
    this.logAction('IMPORT', 'Database', 'SYSTEM', actor, 'Reset database to empty production state');
    this.recalculateAll();
    this.saveToStorage();
  }

  public loadState(newState: OpsDatabaseState, actor = 'Founder/CEO'): void {
    this.state = {
      ...newState,
      users: Array.isArray(newState.users) && newState.users.length > 0 ? newState.users : [...DEFAULT_USERS]
    };
    this.logAction('IMPORT', 'Database', 'SYSTEM', actor, 'Imported database state');
    this.recalculateAll();
    this.saveToStorage();
  }
}

// Global Singleton Instance
export const opsStore = new OpsStore();
