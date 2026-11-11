/**
 * CIVITAS ESTATE & MAINTENANCE
 * Seed Data: Default Reference Entities & Planning Configurations
 */

import type {
  ServiceItem,
  FundingLine,
  GrantBudgetCategory,
  ComplianceItem,
  SystemSettings,
  SystemUser
} from './types.ts';
import { hashCredential } from './security.ts';

export const DEFAULT_SETTINGS: SystemSettings = {
  companyName: 'Civitas Estate & Maintenance',
  tagline: 'Smart Living. Sustainable Legacy.',
  address: 'Accra & Tema, Greater Accra Region, Ghana',
  phone: '+233 (0) 20 952 7426',
  email: 'admin@civitasestate.com',
  businessRegNumber: '',
  tin: '',
  bankDetails: 'Bank details to be confirmed.',
  mobileMoneyDetails: 'MTN Mobile Money: +233 (0) 20 952 7426 (Civitas Estate)',
  currencySymbol: 'GH₵',
  reportDateOverride: '2026-11-07',
  reportingYear: 2026,
  openingCashBalance: 0,
  openingCashDate: '2026-01-01',
  minimumCashReserve: 0,
  minimumMargin: 0.35,
  spendingApprovalThreshold: 500,
  quoteValidityDays: 14,
  defaultPaymentTermsDays: 7,
  defaultJobDurationDays: 1,
  costOverrunTolerance: 0.10,
  unreconciledPaymentGraceDays: 7,
  customerDormantDays: 180,
  applyTax: 'No',
  taxRate: 0.0,
  quotesRequiredAboveThreshold: 2,
  capitalThreshold: 500,
  defaultUsefulLifeYears: 4,
  daysWarningExpiry: 60,
  daysAllowedResponse: 30,
  daysIncidentOpenMax: 14,
  boardQuorum: undefined
};

export const DEFAULT_SERVICES: ServiceItem[] = [
  { serviceId: 'S01', division: 'Civitas Fix', service: 'Small residential cleaning', unit: 'job', standardPrice: 300, standardDirectCost: 190, active: 'Yes', sourceNote: 'Planning assumption (Civitas planning report); not validated' },
  { serviceId: 'S02', division: 'Civitas Fix', service: '2-3 bedroom cleaning', unit: 'job', standardPrice: 450, standardDirectCost: 280, active: 'Yes', sourceNote: 'Planning assumption (Civitas planning report); not validated' },
  { serviceId: 'S03', division: 'Civitas Fix', service: 'Small residential deep cleaning', unit: 'job', standardPrice: 650, standardDirectCost: 400, active: 'Yes', sourceNote: 'Planning assumption (Civitas planning report); not validated' },
  { serviceId: 'S04', division: 'Civitas Fix', service: 'Large residential deep cleaning', unit: 'job', standardPrice: 1050, standardDirectCost: 640, active: 'Yes', sourceNote: 'Planning assumption (Civitas planning report); not validated' },
  { serviceId: 'S05', division: 'Civitas Fix', service: 'Move-in/move-out cleaning', unit: 'job', standardPrice: 800, standardDirectCost: 500, active: 'Yes', sourceNote: 'Planning assumption (Civitas planning report); not validated' },
  { serviceId: 'S06', division: 'Civitas Fix', service: 'Upholstery cleaning', unit: 'job', standardPrice: 350, standardDirectCost: 220, active: 'Yes', sourceNote: 'Planning assumption (Civitas planning report); not validated' },
  { serviceId: 'S07', division: 'Civitas Fix', service: 'Pressure washing', unit: 'job', standardPrice: 450, standardDirectCost: 270, active: 'Yes', sourceNote: 'Planning assumption (Civitas planning report); not validated' },
  { serviceId: 'S08', division: 'Civitas Fix', service: 'Post-construction cleaning', unit: 'job', standardPrice: 1700, standardDirectCost: 1050, active: 'Yes', sourceNote: 'Planning assumption (Civitas planning report); not validated' },
  { serviceId: 'S09', division: 'Civitas Fix', service: 'Handyman services', unit: 'job', standardPrice: 250, standardDirectCost: 160, active: 'Yes', sourceNote: 'Planning assumption (Civitas planning report); not validated' },
  { serviceId: 'S10', division: 'Civitas Fix', service: 'Minor plumbing repairs', unit: 'job', standardPrice: 320, standardDirectCost: 200, active: 'Yes', sourceNote: 'Planning assumption (Civitas planning report); not validated' },
  { serviceId: 'S11', division: 'Civitas Fix', service: 'Minor electrical repairs', unit: 'job', standardPrice: 350, standardDirectCost: 220, active: 'Yes', sourceNote: 'Planning assumption (Civitas planning report); not validated' },
  { serviceId: 'S12', division: 'Civitas Fix', service: 'Door/lock adjustments', unit: 'job', standardPrice: 270, standardDirectCost: 165, active: 'Yes', sourceNote: 'Planning assumption (Civitas planning report); not validated' },
  { serviceId: 'S13', division: 'Civitas Fix', service: 'Painting/touch-up', unit: 'job', standardPrice: 480, standardDirectCost: 300, active: 'Yes', sourceNote: 'Planning assumption (Civitas planning report); not validated' },
  { serviceId: 'S14', division: 'Civitas Fix', service: 'AC servicing', unit: 'job', standardPrice: 450, standardDirectCost: 280, active: 'Yes', sourceNote: 'Planning assumption (Civitas planning report); not validated' },
  { serviceId: 'S15', division: 'Civitas Fix', service: 'Tiling repairs', unit: 'job', standardPrice: 550, standardDirectCost: 340, active: 'Yes', sourceNote: 'Planning assumption (Civitas planning report); not validated' },
  { serviceId: 'S16', division: 'Civitas Property Watch', service: 'Property inspection (basic)', unit: 'job', standardPrice: 280, standardDirectCost: 160, active: 'Yes', sourceNote: 'Planning assumption (Civitas planning report); not validated' }
];

export const DEFAULT_FUNDING: FundingLine[] = [
  {
    fundingId: 'F0001',
    source: 'NEIP funding',
    description: 'Funding request (staged, 80,000 cedis)',
    status: 'Requested',
    amountRequested: 80000,
    amountApproved: 0,
    amountReceived: 0,
    reportingConditions: 'To be supplied by NEIP'
  },
  {
    fundingId: 'F0002',
    source: 'Founder capital',
    description: 'Pre-funding capital for preparation and the pilot',
    status: 'Not secured',
    amountRequested: 18000,
    amountApproved: 0,
    amountReceived: 0,
    notes: 'Required, not secured'
  }
];

export const DEFAULT_GRANT_BUDGET: GrantBudgetCategory[] = [
  { code: 'A', grantCategory: 'Equipment and tools', budget: 24000, stage1Planned: 6715, stage2Planned: 17285 },
  { code: 'B', grantCategory: 'Marketing and customer acquisition', budget: 12000, stage1Planned: 0, stage2Planned: 12000 },
  { code: 'C', grantCategory: 'Workforce training and safety', budget: 8000, stage1Planned: 3000, stage2Planned: 5000 },
  { code: 'D', grantCategory: 'Transport and logistics', budget: 5000, stage1Planned: 0, stage2Planned: 5000 },
  { code: 'E', grantCategory: 'Digital operations', budget: 2000, stage1Planned: 700, stage2Planned: 1300 },
  { code: 'F', grantCategory: 'Regulatory compliance', budget: 4000, stage1Planned: 4000, stage2Planned: 0 },
  { code: 'G', grantCategory: 'Branding and materials', budget: 3000, stage1Planned: 700, stage2Planned: 2300 },
  { code: 'H', grantCategory: 'Working capital reserve', budget: 22000, stage1Planned: 0, stage2Planned: 0 }
];

export const DEFAULT_COMPLIANCE_PROMPTS: ComplianceItem[] = [
  { itemId: 'CP0001', type: 'Compliance document', item: 'Business registration certificate (confirm number and legal form)', status: 'Pending', notes: 'Confirm whether this applies (not verified)' },
  { itemId: 'CP0002', type: 'Compliance document', item: 'Tax registration certificate (TIN) on file', status: 'Pending', notes: 'Confirm whether this applies (not verified)' },
  { itemId: 'CP0003', type: 'Compliance document', item: 'Public liability or property damage insurance (confirm cover and quotation)', status: 'Pending', notes: 'Confirm whether this applies (not verified)' },
  { itemId: 'CP0004', type: 'Compliance document', item: 'Cover for field professionals\' injuries (confirm what applies)', status: 'Pending', notes: 'Confirm whether this applies (not verified)' },
  { itemId: 'CP0005', type: 'Compliance document', item: 'Local authority or sector permits (confirm which, if any, apply)', status: 'Pending', notes: 'Confirm whether this applies (not verified)' },
  { itemId: 'CP0006', type: 'Compliance document', item: 'Tax and VAT registration position confirmed in writing', status: 'Pending', notes: 'Confirm whether this applies (not verified)' },
  { itemId: 'CP0007', type: 'Compliance document', item: 'Data protection registration or duties (confirm whether required)', status: 'Pending', notes: 'Confirm whether this applies (not verified)' },
  { itemId: 'CP0008', type: 'Policy check', item: 'Signed contractor agreement template in use', status: 'Pending', notes: 'Confirm whether this applies (not verified)' },
  { itemId: 'CP0009', type: 'Policy check', item: 'Safety orientation records for every field professional', status: 'Pending', notes: 'Confirm whether this applies (not verified)' },
  { itemId: 'CP0010', type: 'Policy check', item: 'Customer consent recorded before photos or contact details are stored', status: 'Pending', notes: 'Confirm whether this applies (not verified)' },
  { itemId: 'CP0011', type: 'Policy check', item: 'Spending approval threshold applied (500 cedis)', status: 'Pending', notes: 'Confirm whether this applies (not verified)' }
];

export const DEFAULT_USERS: SystemUser[] = [
  {
    userId: 'U0001',
    fullName: 'Isaac Agya Koomson',
    email: 'admin@civitasestate.com',
    phone: '+233 20 952 7426',
    role: 'Founder / CEO',
    department: 'Executive & Governance',
    passwordHash: hashCredential('U0001', '2026'),
    status: 'Active',
    createdDate: '2026-01-01',
    lastLogin: '2026-11-07 08:30',
    notes: 'Executive sign-off authority (> GH₵500), Period Close lock, NEIP Grant custodian & User Governance.'
  },
  {
    userId: 'U0002',
    fullName: 'Ama Osei',
    email: 'operations@civitasestate.com',
    phone: '+233 55 506 2589',
    role: 'Operations Coordinator',
    department: 'Service Operations',
    passwordHash: hashCredential('U0002', '1111'),
    status: 'Active',
    createdDate: '2026-01-15',
    lastLogin: '2026-11-07 09:15',
    notes: 'Manages customer onboarding, quotations, job scheduling, and artisan dispatch across Accra & Tema.'
  },
  {
    userId: 'U0003',
    fullName: 'Kofi Boateng',
    email: 'finance@civitasestate.com',
    phone: '+233 24 812 3901',
    role: 'Finance & Accounts Officer',
    department: 'Finance & Control',
    passwordHash: hashCredential('U0003', '2222'),
    status: 'Active',
    createdDate: '2026-02-01',
    lastLogin: '2026-11-06 17:40',
    notes: 'Manages invoicing, MoMo/Bank receipt reconciliation, expense recording, and asset register.'
  },
  {
    userId: 'U0004',
    fullName: 'Yaw Asante',
    email: 'field@civitasestate.com',
    phone: '+233 27 409 8812',
    role: 'Field Supervisor',
    department: 'Field Operations',
    passwordHash: hashCredential('U0004', '3333'),
    status: 'Active',
    createdDate: '2026-02-10',
    lastLogin: '2026-11-07 07:50',
    notes: 'Leads on-site quality inspections, contractor attendance, and Civitas Property Watch walkthroughs.'
  },
  {
    userId: 'U0005',
    fullName: 'Abena Danquah',
    email: 'audit@civitasestate.com',
    phone: '+233 50 611 4400',
    role: 'Board / Internal Auditor',
    department: 'Board & Audit',
    passwordHash: hashCredential('U0005', '4444'),
    status: 'Active',
    createdDate: '2026-03-01',
    lastLogin: '2026-11-05 14:20',
    notes: 'Independent read-only oversight of 52 control checks, NEIP grant accountability, and audit logs.'
  }
];
