/**
 * CIVITAS ESTATE & MAINTENANCE
 * Operations and Financial Control System - Core TypeScript Data Types
 * Phases 1 and 2: Operating System & Accountability
 */

// Dropdown / List Types
export type CustCat = 'Homeowner' | 'Tenant' | 'Landlord' | 'Short-let operator' | 'Property manager' | 'Small business' | 'Diaspora owner';
export type Channel = 'WhatsApp' | 'Telephone' | 'Email' | 'In person' | 'Website';
export type Area = 'East Legon' | 'Spintex' | 'Adenta' | 'Airport Residential' | 'Cantonments & Labone' | 'Dzorwulu & Roman Ridge' | 'Achimota & Dome' | 'Tema Community 25' | 'Communities 1 – 12' | 'Sakumono & Lashibi' | 'Community 18 – 20' | 'Other Accra' | 'Other Tema' | 'Prampram / Dawhenya';
export type LeadSource = 'WhatsApp' | 'Telephone' | 'Referral' | 'Website' | 'Social media' | 'Google' | 'Direct outreach' | 'Flyer';
export type YesNo = 'Yes' | 'No';
export type EnqStage = 'New Enquiry' | 'Qualification' | 'Site Assessment' | 'Quotation Sent' | 'Follow-up' | 'Accepted' | 'Declined' | 'Job Scheduled';
export type LostReason = 'Price' | 'Timing' | 'Went elsewhere' | 'No response' | 'Scope not suitable' | 'Other';
export type PropType = 'House' | 'Apartment' | 'Townhouse' | 'Office' | 'Shop' | 'Short-let unit' | 'Other';
export type PropUse = 'Owner-occupied' | 'Rented out' | 'Short-let' | 'Vacant' | 'Commercial';
export type Division = 'Civitas Fix' | 'Civitas Care' | 'Civitas Property Watch';
export type DivisionShared = Division | 'Shared overhead';
export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Expired';
export type ApprovalStatus = 'Draft' | 'Submitted' | 'Not required' | 'Pending' | 'Approved' | 'Rejected';
export type JobStatus = 'Requested' | 'Assessed' | 'Approved' | 'Scheduled' | 'Assigned' | 'In progress' | 'Quality inspection' | 'Accepted by customer' | 'Invoiced' | 'Paid' | 'Closed' | 'Cancelled';
export type QualityResult = 'Pass' | 'Pass after rework' | 'Fail' | 'Not inspected';
export type WorkerType = 'Independent contractor' | 'Temporary worker' | 'Salaried employee';
export type Trade = 'Cleaner' | 'Cleaning team leader' | 'Plumber' | 'Electrician' | 'Handyman' | 'Painter' | 'Tiler' | 'AC technician' | 'Property inspector' | 'Operations coordinator' | 'Administrative secretary';
export type VettingStatus = 'Not started' | 'In progress' | 'Verified' | 'Rejected';
export type TrainingStatus = 'None' | 'Safety orientation done' | 'Skills verified' | 'Fully trained';
export type ActiveStatus = 'Active' | 'Inactive';
export type PayMethod = 'Bank transfer' | 'Mobile money' | 'Cash';
export type ReconStatus = 'Unreconciled' | 'Reconciled';
export type PayBasis = 'Per day' | 'Per assignment';
export type PayStatus = 'Unpaid' | 'Paid';
export type FundingSource =
  | 'Own funds'
  | 'NEIP funding'
  | 'Other Grant / Donor'
  | 'Loan facility'
  | 'Operations (customer receipts)';
export type FundSourceType =
  | 'NEIP funding'
  | 'Other Grant / Donor'
  | 'Founder capital'
  | 'Founder drawing'
  | 'Bank / Microfinance Loan'
  | 'Director / Shareholder Loan'
  | 'Loan repayment'
  | 'Other';
export type FundStatus = 'Requested' | 'Approved' | 'Received' | 'Not secured' | 'Withdrawn';
export type GrantCategoryCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
export type GrantCategoryName = 
  | 'Equipment and tools'
  | 'Marketing and customer acquisition'
  | 'Workforce training and safety'
  | 'Transport and logistics'
  | 'Digital operations'
  | 'Regulatory compliance'
  | 'Branding and materials'
  | 'Working capital reserve';
export type CommitStatus = 'Committed' | 'Fulfilled' | 'Cancelled';
export type AssetCat = 'Cleaning equipment' | 'Tools' | 'Safety equipment' | 'Phone or IT' | 'Other';
export type AssetCond = 'Good' | 'Fair' | 'Poor' | 'Under repair' | 'Disposed';
export type DepMethod = 'Straight-line' | 'None';
export type AssetStatus = 'In use' | 'Under maintenance' | 'Disposed' | 'Lost';
export type MaintType = 'Service' | 'Repair' | 'Inspection';
export type MeetingType = 'Regular' | 'Special' | 'Review';
export type AdviceTopic = 'Strategy' | 'Finance' | 'Governance' | 'Operations' | 'Marketing' | 'Compliance' | 'Other';
export type AdviceResp = 'Pending' | 'Accepted' | 'Partly accepted' | 'Declined' | 'Deferred';
export type ActionStatus = 'Open' | 'In progress' | 'Done' | 'Cancelled';
export type ActionSource = 'Board recommendation' | 'Risk' | 'Control exception' | 'Incident' | 'Compliance gap' | 'Management';
export type DecisionStatus = 'In force' | 'Superseded' | 'Reversed';
export type RiskCat = 'Strategic' | 'Financial' | 'Operational' | 'Compliance' | 'People' | 'Safety' | 'Reputation' | 'Technology';
export type RiskStatus = 'Open' | 'Mitigated' | 'Accepted' | 'Closed';
export type Rating15 = 1 | 2 | 3 | 4 | 5;
export type CtrlType = 'Compliance document' | 'Policy check' | 'Control exception';
export type CtrlStatus = 'Valid' | 'Pending' | 'Expired' | 'Not required' | 'Exception open' | 'Closed';
export type IncType = 'Safety injury' | 'Near miss' | 'Property damage' | 'Customer complaint' | 'Misconduct' | 'Data or privacy' | 'Equipment loss' | 'Other';
export type Severity = 'Low' | 'Medium' | 'High';
export type IncStatus = 'Open' | 'Resolved' | 'Closed';
export type Account = 'Bank' | 'Mobile money' | 'Cash on hand';
export type PeriodStatus = 'Open' | 'Closed';
export type ConditionRating = 'Good' | 'Fair' | 'Poor';
export type ReportStatus = 'Draft' | 'Issued';
export type InspType = 'Scheduled Property Watch' | 'Move-in' | 'Move-out' | 'Pre-repair' | 'Follow-up';
export type ExpenseClass = 'Direct' | 'Opex' | 'Capex';

export type BudgetCat = 
  | 'Field labour (assignments)'
  | 'Direct materials'
  | 'Direct transport'
  | 'Equipment (capital)'
  | 'Marketing and customer acquisition'
  | 'Workforce training and safety'
  | 'Regulatory compliance'
  | 'Digital operations'
  | 'Branding and materials'
  | 'Administration and communication'
  | 'Insurance'
  | 'Professional fees'
  | 'Salaries and employer pension'
  | 'Other operating expense';

// ==========================================
// 1. CUSTOMERS (tblCustomers)
// ==========================================
export interface Customer {
  customerId: string; // C0001
  customerName: string;
  category: CustCat;
  phone: string;
  email: string;
  preferredChannel: Channel;
  area: Area;
  leadSource: LeadSource;
  dateAcquired: string; // YYYY-MM-DD
  relationshipOwner: string;
  consentRecorded: YesNo;
  closed: YesNo;
  nextFollowUp?: string;
  feedbackNotes?: string;
  // Calculated:
  properties?: number;
  jobs?: number;
  totalBilled?: number;
  totalPaid?: number;
  outstanding?: number;
  lastServiceDate?: string;
  lastInvoiceDate?: string;
  averageRating?: number | null;
  status?: 'Prospect' | 'Active' | 'Dormant' | 'Closed';
  idNumber?: number;
}

// ==========================================
// 2. PROPERTIES (tblProperties)
// ==========================================
export interface Property {
  propertyId: string; // P0001
  customerId: string; // C0001
  propertyType: PropType;
  addressOrDescription: string;
  area: Area;
  propertyUse: PropUse;
  units: number;
  maintenanceRequirements?: string;
  accessInstructions?: string;
  nextInspectionDate?: string;
  active: YesNo;
  // Calculated:
  customerName?: string;
  jobs?: number;
  lastJobDate?: string;
  lastInspectionDate?: string;
  inspectionFlag?: 'Inspection overdue' | '';
  idNumber?: number;
}

// ==========================================
// 3. ENQUIRIES (tblEnquiries)
// ==========================================
export interface Enquiry {
  enquiryId: string; // E0001
  enquiryDate: string; // YYYY-MM-DD
  contactName: string;
  phone: string;
  customerId?: string;
  leadSource: LeadSource;
  serviceInterest?: string;
  area: Area;
  stage: EnqStage;
  qualified: YesNo;
  quoteId?: string;
  lostReason?: LostReason;
  nextFollowUp?: string;
  owner?: string;
  notes?: string;
  // Calculated:
  daysOpen?: number | null;
  outcomeGroup?: 'Open' | 'Won' | 'Lost';
  quoteValue?: number;
  daysToQuote?: number | null;
  idNumber?: number;
}

// ==========================================
// 4. SERVICE CATALOGUE (tblServices)
// ==========================================
export interface ServiceItem {
  serviceId: string; // S01...
  division: Division;
  service: string;
  unit: string;
  standardPrice: number;
  standardDirectCost: number;
  active: YesNo;
  sourceNote?: string;
  // Calculated:
  standardContribution?: number;
  marginPct?: number;
  idNumber?: number;
}

// ==========================================
// 5. QUOTATIONS (tblQuotes)
// ==========================================
export interface Quote {
  quoteId: string; // Q0001
  quoteDate: string; // YYYY-MM-DD
  customerId: string;
  propertyId?: string;
  enquiryId?: string;
  preparedBy: string;
  status: QuoteStatus;
  discountAmount?: number;
  discountApproval?: ApprovalStatus;
  acceptedDate?: string;
  declineReason?: LostReason;
  notes?: string;
  // Calculated:
  customerName?: string;
  validUntil?: string;
  subtotal?: number;
  estimatedDirectCost?: number;
  netOfDiscount?: number;
  tax?: number;
  total?: number;
  estimatedContribution?: number;
  marginPct?: number;
  marginFlag?: 'Below minimum margin' | '';
  discountFlag?: 'Discount not approved' | '';
  expiryFlag?: 'Quote expired' | '';
  jobId?: string;
  idNumber?: number;
}

// ==========================================
// 6. QUOTATION LINES (tblQuoteLines)
// ==========================================
export interface QuoteLine {
  quoteId: string; // Q0001
  serviceId: string; // S01...
  customDescription?: string;
  quantity: number;
  priceOverride?: number;
  costOverride?: number;
  // Calculated:
  lineNo?: number;
  service?: string;
  description?: string;
  unitPrice?: number;
  lineTotal?: number;
  unitCost?: number;
  lineCost?: number;
  lineContribution?: number;
  lineKey?: string; // Q0001|1
  lineFlag?: 'Unknown service' | 'Inactive service' | '';
}

// ==========================================
// 7. JOBS (tblJobs)
// ==========================================
export interface Job {
  jobId: string; // J0001
  quoteId?: string;
  customerId: string;
  propertyId?: string;
  serviceId: string;
  description?: string;
  requestDate?: string;
  scheduledDate?: string;
  dueDate?: string;
  status: JobStatus;
  manualQuotedAmount?: number;
  estimatedLabour?: number;
  estimatedMaterials?: number;
  estimatedTransport?: number;
  completionDate?: string;
  qualityResult?: QualityResult;
  evidenceReference?: string;
  customerRating?: number; // 1 to 5
  reworkOrComplaint?: YesNo;
  complaintNote?: string;
  // Calculated:
  customerName?: string;
  division?: Division;
  quotedAmount?: number;
  estimatedDirectCost?: number;
  actualLabour?: number;
  actualMaterials?: number;
  actualTransport?: number;
  actualDirectCost?: number;
  invoicedNet?: number;
  jobContribution?: number | null;
  marginPct?: number | null;
  effectiveDueDate?: string;
  overdueFlag?: 'Overdue' | '';
  costOverrunFlag?: 'Cost overrun' | '';
  evidenceFlag?: 'Missing evidence' | '';
  unbilledFlag?: 'Completed not billed' | '';
  marginFlag?: 'Below minimum margin' | '';
  area?: string;
  daysToComplete?: number | null;
  onTime?: 'Yes' | 'No' | '';
  idNumber?: number;
}

// ==========================================
// 8. ASSIGNMENTS (tblAssignments)
// ==========================================
export interface Assignment {
  assignmentId: string; // A0001
  jobId: string;
  contractorId: string;
  assignmentDate: string; // YYYY-MM-DD
  payBasis: PayBasis;
  quantity: number;
  rate: number;
  paymentStatus: PayStatus;
  paidDate?: string;
  paymentMethod?: PayMethod;
  paymentReference?: string;
  rating?: number; // 1 to 5
  notes?: string;
  // Calculated:
  contractorName?: string;
  workerType?: WorkerType;
  trade?: Trade;
  agreedRate?: number;
  amount?: number;
  personDays?: number;
  unpaidAmount?: number;
  verificationFlag?: 'Contractor not found' | 'Unverified contractor' | '';
  rateFlag?: 'Rate above agreed' | '';
  jobFlag?: 'Job not found' | '';
  idNumber?: number;
}

// ==========================================
// 9. CONTRACTORS / WORKFORCE (tblContractors)
// ==========================================
export interface Contractor {
  contractorId: string; // W0001
  contractorName: string;
  workerType: WorkerType;
  trade: Trade;
  phone: string;
  coverageArea?: Area;
  skillsAndQualifications?: string;
  vettingStatus: VettingStatus;
  vettingDate?: string;
  trainingStatus: TrainingStatus;
  safetyOrientationDate?: string;
  agreedRate?: number;
  rateBasis?: PayBasis;
  startDate?: string;
  status: ActiveStatus;
  // Calculated:
  assignments?: number;
  personDays?: number;
  totalAssigned?: number;
  totalUnpaid?: number;
  averageRating?: number | null;
  lastAssignmentDate?: string;
  eligibility?: 'Eligible' | 'Not eligible';
  idNumber?: number;
}

// ==========================================
// 10. INVOICES (tblInvoices)
// ==========================================
export interface Invoice {
  invoiceNo: string; // INV0001
  customerId: string;
  jobId?: string;
  subscriptionId?: string;
  divisionIfNoJob?: Division;
  invoiceDate: string; // YYYY-MM-DD
  termsDays?: number;
  dueDateOverride?: string;
  amountBeforeTax: number;
  creditNoteAmount?: number;
  cancelled?: YesNo;
  notes?: string;
  // Calculated:
  customerName?: string;
  division?: Division;
  dueDate?: string;
  tax?: number;
  total?: number;
  creditNoteTotal?: number;
  netRevenue?: number;
  paymentsReceived?: number;
  balance?: number;
  daysOverdue?: number;
  status?: 'Cancelled' | 'Overpaid' | 'Paid' | 'Part paid' | 'Issued' | 'Overdue';
  ageingBucket?: 'Cancelled' | 'Settled' | 'Current' | '1-30 days' | '31-60 days' | '61-90 days' | 'Over 90 days';
  missingInfoFlag?: 'Missing information' | '';
  overpaidFlag?: 'Overpaid' | '';
  leadSource?: LeadSource;
  idNumber?: number;
}

// ==========================================
// 11. PAYMENTS (tblPayments)
// ==========================================
export interface Payment {
  paymentId: string; // PAY0001
  paymentDate: string; // YYYY-MM-DD
  invoiceNo: string;
  amount: number;
  method: PayMethod;
  reference?: string;
  receivedBy?: string;
  reconciliationStatus: ReconStatus;
  reconciledDate?: string;
  notes?: string;
  whtDeductedAmount?: number;
  whtCertificateRef?: string;
  // Calculated:
  customerId?: string;
  customerName?: string;
  duplicateFlag?: 'Duplicate reference' | '';
  invoiceFlag?: 'Invoice not found' | '';
  unreconciledFlag?: 'Not reconciled' | '';
  idNumber?: number;
}

// ==========================================
// 12. EXPENSES (tblExpenses)
// ==========================================
export interface Expense {
  expenseId: string; // EXP0001
  expenseDate: string; // YYYY-MM-DD
  supplier: string;
  supplierReference?: string;
  category: BudgetCat;
  division?: DivisionShared;
  jobId?: string;
  amount: number;
  paymentMethod: PayMethod;
  paymentStatus: PayStatus;
  approvalStatus: ApprovalStatus;
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidDate?: string;
  paymentReference?: string;
  rejectionReason?: string;
  selfApprovalOverrideReason?: string;
  evidenceReference?: string;
  fundingSource?: FundingSource;
  grantCategory?: GrantCategoryName;
  purchaseRequestId?: string;
  notes?: string;
  // Calculated:
  class?: ExpenseClass;
  evidenceFlag?: 'No evidence' | '';
  approvalFlag?: 'Approval required' | 'Paid without approval' | '';
  directCostFlag?: 'Direct cost without job' | '';
  duplicateFlag?: 'Duplicate entry' | '';
  jobFlag?: 'Job not found' | '';
  grantFlag?: 'Grant category missing' | '';
  requestFlag?: 'No purchase request' | '';
  idNumber?: number;
}

// ==========================================
// 13. BUDGET (tblBudget)
// ==========================================
export interface BudgetItem {
  month: string; // YYYY-MM-01
  budgetCategory: BudgetCat;
  amount: number;
  note?: string;
  // Calculated:
  key?: string; // YYYYMM
}

// ==========================================
// 14. FUNDING & CAPITAL (tblFunding)
// ==========================================
export interface FundingLine {
  fundingId: string; // F0001
  source: FundSourceType;
  description: string;
  status: FundStatus;
  amountRequested: number;
  amountApproved: number;
  amountReceived: number;
  dateReceived?: string;
  reportingConditions?: string;
  documentReference?: string;
  notes?: string;
  // Extended Capital, Grant, Loan & Drawing fields:
  financingClass?:
    | 'Equity Injection'
    | 'Owner Drawing (Contra-Equity)'
    | 'Restricted Grant'
    | 'Debt Drawdown (Liability)'
    | 'Debt Principal Repayment';
  paymentMethod?: PayMethod;
  lenderOrGrantor?: string;
  interestRatePct?: number;
  // Calculated:
  cashFlag?: 'Received but no date' | 'Received more than approved' | '';
  idNumber?: number;
}

// ==========================================
// 15. GRANT BUDGET UTILISATION (tblGrantBudget)
// ==========================================
export interface GrantBudgetCategory {
  code: GrantCategoryCode; // A to H
  grantCategory: GrantCategoryName;
  budget: number;
  stage1Planned: number;
  stage2Planned: number;
  notes?: string;
  // Calculated:
  committed?: number;
  spentFromNEIP?: number;
  spentFromOtherSources?: number;
  availableBudget?: number;
  usedPct?: number;
  budgetFlag?: 'Over budget' | 'Reserve drawn' | 'Pre-funding spending without cash' | '';
}

// ==========================================
// 16. COMMITMENTS (tblCommitments)
// ==========================================
export interface Commitment {
  commitmentId: string; // CM0001
  commitmentDate: string; // YYYY-MM-DD
  grantCategory: GrantCategoryName;
  supplier?: string;
  description?: string;
  amount: number;
  status: CommitStatus;
  purchaseRequestId?: string;
  expenseId?: string;
  // Calculated:
  activeAmount?: number;
  linkFlag?: 'Fulfilled: add Expense ID' | 'Expense not found' | '';
  idNumber?: number;
}

// ==========================================
// 17. PURCHASE REQUESTS (tblPurchaseReqs)
// ==========================================
export interface PurchaseRequest {
  requestId: string; // PR0001
  requestDate: string; // YYYY-MM-DD
  requestedBy: string;
  item: string;
  expenseCategory: BudgetCat;
  estimatedAmount: number;
  grantCategory?: GrantCategoryName;
  quotesObtained: number;
  supplierChosen?: string;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvalDate?: string;
  notes?: string;
  // Calculated:
  quotesRequired?: number;
  spent?: number;
  quotesFlag?: 'Too few quotes' | '';
  approvalFlag?: 'Spent without approval' | '';
  overspendFlag?: 'Over estimate' | '';
  idNumber?: number;
}

// ==========================================
// 18. ASSETS & EQUIPMENT (tblAssets)
// ==========================================
export interface Asset {
  assetId: string; // AS0001
  description: string;
  assetCategory: AssetCat;
  purchaseDate: string; // YYYY-MM-DD
  supplier?: string;
  purchaseCost: number;
  expenseId?: string;
  fundingSource?: FundingSource;
  grantCategory?: GrantCategoryName;
  serialNumber?: string;
  custodian?: string;
  location?: string;
  condition: AssetCond;
  warrantyExpiry?: string;
  depreciationMethod: DepMethod;
  usefulLifeYears?: number;
  residualValue?: number;
  status: AssetStatus;
  disposalDate?: string;
  // Calculated:
  depreciable?: 'Yes' | 'No';
  startMonth?: string; // YYYY-MM-01
  endMonth?: string; // YYYY-MM-01
  monthlyDepreciation?: number;
  monthsDepreciated?: number;
  accumulatedDepreciation?: number;
  netBookValue?: number;
  grantAsset?: 'Yes' | 'No';
  warrantyFlag?: 'Warranty expired' | 'Warranty expiring' | '';
  expenseLinkFlag?: 'No expense linked' | 'Expense not found' | '';
  idNumber?: number;
}

// ==========================================
// 19. MAINTENANCE LOG (tblMaintenance)
// ==========================================
export interface MaintenanceLog {
  logId: string; // MT0001
  assetId: string;
  maintenanceDate: string; // YYYY-MM-DD
  type: MaintType;
  description: string;
  cost?: number;
  performedBy?: string;
  nextDueDate?: string;
  expenseId?: string;
  // Calculated:
  assetDescription?: string;
  overdueFlag?: 'Maintenance overdue' | '';
  idNumber?: number;
}

// ==========================================
// 20. BOARD MEETINGS (tblMeetings)
// ==========================================
export interface BoardMeeting {
  meetingId: string; // BM0001
  meetingDate: string; // YYYY-MM-DD
  meetingType: MeetingType;
  membersInvited: number;
  membersPresent: number;
  chair?: string;
  minutesReference?: string;
  nextMeetingDate?: string;
  notes?: string;
  // Calculated:
  attendancePct?: number;
  recommendationsRaised?: number;
  stillOpen?: number;
  minutesFlag?: 'Minutes missing' | '';
  quorumFlag?: 'Below quorum' | '';
  idNumber?: number;
}

// ==========================================
// 21. ADVISORY RECOMMENDATIONS (tblAdvice)
// ==========================================
export interface AdvisoryRecommendation {
  recId: string; // AD0001
  meetingId?: string;
  recommendationDate: string; // YYYY-MM-DD
  topic: AdviceTopic;
  recommendation: string;
  advisor?: string;
  managementResponse?: AdviceResp;
  responseDate?: string;
  decisionId?: string;
  actionId?: string;
  owner?: string;
  dueDate?: string;
  status: ActionStatus;
  doneDate?: string;
  evidenceReference?: string;
  // Calculated:
  overdueFlag?: 'Overdue' | '';
  responseFlag?: 'Response overdue' | '';
  idNumber?: number;
}

// ==========================================
// 22. MANAGEMENT DECISIONS (tblDecisions)
// ==========================================
export interface ManagementDecision {
  decisionId: string; // DC0001
  decisionDate: string; // YYYY-MM-DD
  decision: string;
  decidedBy: string;
  relatedRecommendation?: string;
  rationale?: string;
  valueImpact?: number;
  reviewDate?: string;
  status: DecisionStatus;
  // Calculated:
  reviewFlag?: 'Review due' | '';
  idNumber?: number;
}

// ==========================================
// 23. ACTIONS & CORRECTIVE ACTIONS (tblActions)
// ==========================================
export interface ActionItem {
  actionId: string; // AC0001
  sourceType: ActionSource;
  sourceId?: string;
  description: string;
  owner: string;
  raisedDate?: string;
  deadline: string; // YYYY-MM-DD
  status: ActionStatus;
  completedDate?: string;
  evidenceReference?: string;
  // Calculated:
  overdueFlag?: 'Overdue' | '';
  daysOverdue?: number;
  lateCompletionFlag?: 'Completed late' | '';
  idNumber?: number;
}

// ==========================================
// 24. RISKS (tblRisks)
// ==========================================
export interface RiskItem {
  riskId: string; // RK0001
  riskDescription: string;
  category: RiskCat;
  probability: Rating15;
  impact: Rating15;
  mitigation?: string;
  owner?: string;
  nextReviewDate?: string;
  lastReviewed?: string;
  status: RiskStatus;
  actionId?: string;
  // Calculated:
  score?: number;
  rating?: 'Low' | 'Medium' | 'High' | 'Critical';
  reviewFlag?: 'Review overdue' | '';
  mitigationFlag?: 'High risk: no mitigation or owner' | '';
  idNumber?: number;
}

// ==========================================
// 25. COMPLIANCE & CONTROLS (tblControls)
// ==========================================
export interface ComplianceItem {
  itemId: string; // CP0001
  type: CtrlType;
  item: string;
  responsible?: string;
  referenceOrEvidence?: string;
  issueDate?: string;
  expiryOrDueDate?: string;
  status: CtrlStatus;
  notes?: string;
  // Calculated:
  daysToExpiry?: number | null;
  expiryFlag?: 'Expired or overdue' | 'Expiring soon' | '';
  pendingFlag?: 'Evidence not yet held' | '';
  idNumber?: number;
}

// ==========================================
// 26. INCIDENTS (tblIncidents)
// ==========================================
export interface Incident {
  incidentId: string; // IN0001
  incidentDate: string; // YYYY-MM-DD
  type: IncType;
  jobId?: string;
  contractorId?: string;
  customerId?: string;
  description: string;
  severity: Severity;
  reportedBy?: string;
  actionId?: string;
  status: IncStatus;
  resolvedDate?: string;
  cost?: number;
  // Calculated:
  daysOpen?: number;
  agingFlag?: 'Open too long' | '';
  actionFlag?: 'No corrective action' | '';
  idNumber?: number;
}

// ==========================================
// 27. FINANCIAL RECONCILIATIONS (tblRecons)
// ==========================================
export interface FinancialReconciliation {
  reconId: string; // RC0001
  monthEnd: string; // YYYY-MM-DD
  account: Account;
  statementBalance: number;
  bookBalance: number;
  reconcilingItems?: string;
  preparedBy: string;
  reviewedBy?: string;
  reviewDate?: string;
  // Calculated:
  difference?: number;
  differenceFlag?: 'Unexplained difference' | '';
  reviewFlag?: 'Not reviewed' | '';
  idNumber?: number;
}

// ==========================================
// 28. MONTH-END CLOSE (tblPeriods)
// ==========================================
export interface PeriodCloseRecord {
  month: string; // YYYY-MM-01
  status: PeriodStatus;
  closedBy?: string;
  closedDate?: string;
  invoicesAtClose?: number;
  paymentsAtClose?: number;
  expensesAtClose?: number;
  assignmentsAtClose?: number;
  openCheckItemsAtClose?: number;
  reopenedBy?: string;
  reopenedDate?: string;
  reopenReason?: string;
  // Calculated:
  invoicesNow?: number;
  paymentsNow?: number;
  expensesNow?: number;
  assignmentsNow?: number;
  changedFlag?: 'Records changed after close' | '';
  closeFlag?: 'Closed with open items' | '';
}

// ==========================================
// 29. PROPERTY WATCH INSPECTIONS (tblInspections)
// ==========================================
export interface PropertyInspection {
  inspectionId: string; // IS0001
  propertyId: string;
  inspectionDate: string; // YYYY-MM-DD
  inspector?: string;
  inspectionType: InspType;
  jobId?: string;
  roofAndCeiling?: ConditionRating;
  plumbing?: ConditionRating;
  electrical?: ConditionRating;
  doorsLocksWindows?: ConditionRating;
  dampAndPests?: ConditionRating;
  compoundAndExterior?: ConditionRating;
  observations?: string;
  recommendations?: string;
  photosFolderReference?: string;
  reportStatus: ReportStatus;
  nextInspectionDue?: string;
  // Calculated:
  customerName?: string;
  issuesFound?: number;
  poorItems?: number;
  conditionRating?: ConditionRating;
  reportFlag?: 'Issued report incomplete' | 'Report ready to issue' | '';
  idNumber?: number;
}

// ==========================================
// SETTINGS
// ==========================================
export interface SystemSettings {
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  businessRegNumber: string;
  tin: string;
  bankDetails: string;
  mobileMoneyDetails: string;
  currencySymbol: string;
  reportDateOverride?: string; // demonstration fix date e.g. 2026-11-07
  reportingYear: number; // 2026
  openingCashBalance: number;
  openingCashDate: string;
  minimumCashReserve: number;
  minimumMargin: number; // 0.35 (35%)
  spendingApprovalThreshold: number; // 500
  quoteValidityDays: number; // 14
  defaultPaymentTermsDays: number; // 7
  defaultJobDurationDays: number; // 1
  costOverrunTolerance: number; // 0.10 (10%)
  unreconciledPaymentGraceDays: number; // 7
  customerDormantDays: number; // 180
  applyTax: YesNo; // 'No' default
  taxRate: number; // 0.0 default
  quotesRequiredAboveThreshold: number; // 2
  capitalThreshold: number; // 500
  defaultUsefulLifeYears: number; // 4
  daysWarningExpiry: number; // 60
  daysAllowedResponse: number; // 30
  daysIncidentOpenMax: number; // 14
  boardQuorum?: number;
}

// ==========================================
// CONTROL CHECKS & ALERT ITEMS
// ==========================================
export interface ControlCheckResult {
  checkNumber: number;
  name: string;
  countOrValue: number;
  severity: 'Low' | 'Medium' | 'High';
  status: 'OK' | 'ATTENTION' | 'RECONCILED';
  whereToLook: string;
  whyItMatters: string;
}

export interface ManagementAlert {
  alert: string;
  status: 'OK' | 'ATTENTION';
  evidence: string;
  whyItMatters: string;
  nextAction: string;
}

// ==========================================
// 30. SYSTEM USERS & GOVERNANCE RBAC
// ==========================================
export type UserRole =
  | 'Founder / CEO'
  | 'Operations Coordinator'
  | 'Finance & Accounts Officer'
  | 'Field Supervisor'
  | 'Board / Internal Auditor';

export type UserDepartment =
  | 'Executive & Governance'
  | 'Service Operations'
  | 'Finance & Control'
  | 'Field Operations'
  | 'Board & Audit';

export type UserStatus = 'Active' | 'Suspended';

export interface SystemUser {
  userId: string; // U0001
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  department: UserDepartment;
  pinCode?: string; // Legacy migration field only; stripped after hashing
  passwordHash?: string; // Salted SHA-256 credential digest
  failedLoginAttempts?: number;
  lockedUntil?: string;
  status: UserStatus;
  createdDate: string; // YYYY-MM-DD
  lastLogin?: string;
  notes?: string;
}
