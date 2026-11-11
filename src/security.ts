/**
 * CIVITAS ESTATE & MAINTENANCE
 * Version 2.1 Security, Cryptographic Credential Hashing, RBAC & Data Integrity Engine
 */

import type { SystemUser, UserRole } from './types.ts';
import type { OpsDatabaseState } from './store.ts';
import { roundMoney } from './calculations.ts';

// ==========================================
// 1. CREDENTIAL HASHING & SANITIZATION
// ==========================================
const CIVITAS_AUTH_PEPPER = 'CivitasEstate_GH_AccraTema_v2.1_Pepper_9f8e7d6c';

/**
 * Multi-round salted key derivation (PBKDF-style synchronous digest for browser + Node compatibility).
 * Ensures user PINs/passwords are NEVER stored or exported in plaintext.
 */
export function hashCredential(userId: string, rawSecret: string): string {
  const normalizedUser = userId.trim().toUpperCase();
  const normalizedSecret = rawSecret.trim();
  const input = `${normalizedUser}:${normalizedSecret}:${CIVITAS_AUTH_PEPPER}`;

  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  let h3 = 0x811c9dc5 ^ input.length;
  let h4 = 0xcbf29ce4 ^ input.length;

  // 2,048 rounds of non-linear key stretching
  for (let round = 0; round < 2048; round++) {
    for (let i = 0; i < input.length; i++) {
      const ch = input.charCodeAt(i) ^ (round & 0xff);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
      h3 = Math.imul(h3 ^ (ch + round), 16777619);
      h4 = Math.imul(h4 ^ (ch ^ (round >> 3)), 2166136261);
    }
    h1 = (h1 << 13) | (h1 >>> 19);
    h2 = (h2 << 17) | (h2 >>> 15);
    h3 = (h3 << 7) | (h3 >>> 25);
    h4 = (h4 << 11) | (h4 >>> 21);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);

  const hex = [h1, h2, h3, h4]
    .map(n => (n >>> 0).toString(16).padStart(8, '0'))
    .join('');

  return `cv21$${normalizedUser}$${hex}`;
}

export function verifyCredential(user: SystemUser, rawSecret: string): boolean {
  if (!rawSecret || rawSecret.trim() === '') return false;
  const expectedHash = hashCredential(user.userId, rawSecret);
  if (user.passwordHash) {
    return user.passwordHash === expectedHash;
  }
  // Fallback for legacy unmigrated user record
  if (user.pinCode) {
    return user.pinCode.trim() === rawSecret.trim();
  }
  return false;
}

/**
 * Strips plaintext `pinCode` from all user records and replaces with `passwordHash`.
 */
export function sanitizeUsersCredentials(users: SystemUser[]): SystemUser[] {
  return users.map(u => {
    const copy: SystemUser = { ...u };
    if (!copy.passwordHash && copy.pinCode) {
      copy.passwordHash = hashCredential(copy.userId, copy.pinCode);
    }
    delete copy.pinCode;
    return copy;
  });
}

// ==========================================
// 2. ROLE-BASED ACCESS CONTROL (RBAC) MATRIX
// ==========================================
export type PermissionAction =
  | 'MANAGE_USERS'
  | 'UPDATE_SETTINGS'
  | 'APPROVE_EXPENSE'
  | 'REJECT_EXPENSE'
  | 'APPROVE_DISCOUNT'
  | 'CLOSE_PERIOD'
  | 'REOPEN_PERIOD'
  | 'MANAGE_FUNDING'
  | 'MANAGE_CUSTOMERS_QUOTES'
  | 'MANAGE_JOBS_ASSIGNMENTS'
  | 'UPDATE_JOB_PROGRESS'
  | 'MANAGE_INSPECTIONS'
  | 'MANAGE_INVOICES_PAYMENTS'
  | 'RECORD_EXPENSE'
  | 'PAY_EXPENSE_OR_CONTRACTOR'
  | 'MANAGE_RECONCILIATIONS'
  | 'MANAGE_ASSETS'
  | 'MANAGE_GOVERNANCE'
  | 'IMPORT_RESET_DATABASE'
  | 'VIEW_REPORTS';

export const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  'Founder / CEO': [
    'MANAGE_USERS',
    'UPDATE_SETTINGS',
    'APPROVE_EXPENSE',
    'REJECT_EXPENSE',
    'APPROVE_DISCOUNT',
    'CLOSE_PERIOD',
    'REOPEN_PERIOD',
    'MANAGE_FUNDING',
    'MANAGE_CUSTOMERS_QUOTES',
    'MANAGE_JOBS_ASSIGNMENTS',
    'UPDATE_JOB_PROGRESS',
    'MANAGE_INSPECTIONS',
    'MANAGE_INVOICES_PAYMENTS',
    'RECORD_EXPENSE',
    'PAY_EXPENSE_OR_CONTRACTOR',
    'MANAGE_RECONCILIATIONS',
    'MANAGE_ASSETS',
    'MANAGE_GOVERNANCE',
    'IMPORT_RESET_DATABASE',
    'VIEW_REPORTS'
  ],
  'Operations Coordinator': [
    'MANAGE_CUSTOMERS_QUOTES',
    'MANAGE_JOBS_ASSIGNMENTS',
    'UPDATE_JOB_PROGRESS',
    'MANAGE_INSPECTIONS',
    'MANAGE_INVOICES_PAYMENTS',
    'RECORD_EXPENSE',
    'MANAGE_ASSETS',
    'MANAGE_GOVERNANCE',
    'VIEW_REPORTS'
  ],
  'Finance & Accounts Officer': [
    'MANAGE_FUNDING',
    'MANAGE_INVOICES_PAYMENTS',
    'RECORD_EXPENSE',
    'PAY_EXPENSE_OR_CONTRACTOR',
    'MANAGE_RECONCILIATIONS',
    'MANAGE_ASSETS',
    'MANAGE_GOVERNANCE',
    'VIEW_REPORTS'
  ],
  'Field Supervisor': [
    'UPDATE_JOB_PROGRESS',
    'MANAGE_JOBS_ASSIGNMENTS',
    'MANAGE_INSPECTIONS',
    'RECORD_EXPENSE',
    'VIEW_REPORTS'
  ],
  'Board / Internal Auditor': [
    'VIEW_REPORTS'
  ]
};

export function hasPermission(role: UserRole | undefined | null, action: PermissionAction): boolean {
  if (!role) return false;
  const allowed = ROLE_PERMISSIONS[role];
  return Array.isArray(allowed) && allowed.includes(action);
}

// ==========================================
// 3. TAMPER-EVIDENT AUDIT HASH CHAIN
// ==========================================
export function computeAuditHash(
  prevHash: string,
  timestamp: string,
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  details: string
): string {
  const payload = `${prevHash}|${timestamp}|${userId}|${action}|${entity}|${entityId}|${details}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < payload.length; i++) {
    const c = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 ^ (c + i), 2654435761);
  }
  return `aud21-${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}

// ==========================================
// 4. DATASET VALIDATION & MIGRATION INSPECTOR
// ==========================================
export interface DatasetValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    customerCount: number;
    jobCount: number;
    invoiceCount: number;
    paymentCount: number;
    expenseCount: number;
    totalInvoicedNet: number;
    totalCashCollected: number;
    totalExpenses: number;
    totalContractorPay: number;
  };
}

export function validateAndInspectDataset(candidate: any): DatasetValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!candidate || typeof candidate !== 'object') {
    return {
      valid: false,
      errors: ['Dataset is not a valid JSON object.'],
      warnings: [],
      summary: {
        customerCount: 0,
        jobCount: 0,
        invoiceCount: 0,
        paymentCount: 0,
        expenseCount: 0,
        totalInvoicedNet: 0,
        totalCashCollected: 0,
        totalExpenses: 0,
        totalContractorPay: 0
      }
    };
  }

  const requiredArrays: (keyof OpsDatabaseState)[] = [
    'customers',
    'properties',
    'enquiries',
    'quotes',
    'quoteLines',
    'jobs',
    'assignments',
    'contractors',
    'invoices',
    'payments',
    'expenses'
  ];

  if (!candidate.settings || typeof candidate.settings !== 'object') {
    errors.push('Missing or invalid `settings` configuration block.');
  }

  for (const key of requiredArrays) {
    if (!Array.isArray(candidate[key])) {
      errors.push(`Missing or non-array register: \`${String(key)}\`.`);
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      warnings,
      summary: {
        customerCount: 0,
        jobCount: 0,
        invoiceCount: 0,
        paymentCount: 0,
        expenseCount: 0,
        totalInvoicedNet: 0,
        totalCashCollected: 0,
        totalExpenses: 0,
        totalContractorPay: 0
      }
    };
  }

  // Check duplicate IDs
  const checkDuplicateKey = (arr: any[], field: string, label: string) => {
    const seen = new Set<string>();
    for (const item of arr) {
      const id = item?.[field];
      if (!id || typeof id !== 'string') {
        errors.push(`${label} record is missing primary key \`${field}\`.`);
        continue;
      }
      if (seen.has(id)) {
        errors.push(`Duplicate ${label} ID detected: \`${id}\`.`);
      }
      seen.add(id);
    }
    return seen;
  };

  const customerIds = checkDuplicateKey(candidate.customers, 'customerId', 'Customer');
  checkDuplicateKey(candidate.properties, 'propertyId', 'Property');
  checkDuplicateKey(candidate.quotes, 'quoteId', 'Quote');
  const jobIds = checkDuplicateKey(candidate.jobs, 'jobId', 'Job');
  const contractorIds = checkDuplicateKey(candidate.contractors, 'contractorId', 'Contractor');
  checkDuplicateKey(candidate.assignments, 'assignmentId', 'Assignment');
  const invoiceNos = checkDuplicateKey(candidate.invoices, 'invoiceNo', 'Invoice');
  checkDuplicateKey(candidate.payments, 'paymentId', 'Payment');
  checkDuplicateKey(candidate.expenses, 'expenseId', 'Expense');

  // Referential & financial integrity checks
  for (const inv of candidate.invoices) {
    if (inv.customerId && !customerIds.has(inv.customerId)) {
      warnings.push(`Invoice ${inv.invoiceNo} references unknown Customer ID ${inv.customerId}.`);
    }
    if (typeof inv.amountBeforeTax !== 'number' || inv.amountBeforeTax < 0) {
      errors.push(`Invoice ${inv.invoiceNo} has an invalid or negative amount (${inv.amountBeforeTax}).`);
    }
  }

  const paymentRefs = new Set<string>();
  for (const pay of candidate.payments) {
    if (!pay.invoiceNo || !invoiceNos.has(pay.invoiceNo)) {
      warnings.push(`Payment ${pay.paymentId} references unknown Invoice No ${pay.invoiceNo}.`);
    }
    if (typeof pay.amount !== 'number' || pay.amount <= 0) {
      errors.push(`Payment ${pay.paymentId} has an invalid non-positive amount (${pay.amount}).`);
    }
    if (pay.reference && pay.reference.trim() !== '') {
      const refKey = `${pay.method}|${pay.reference.trim().toLowerCase()}`;
      if (paymentRefs.has(refKey)) {
        warnings.push(`Payment ${pay.paymentId} has a duplicate payment reference (${pay.reference}).`);
      }
      paymentRefs.add(refKey);
    }
  }

  for (const exp of candidate.expenses) {
    if (typeof exp.amount !== 'number' || exp.amount < 0) {
      errors.push(`Expense ${exp.expenseId} has an invalid negative amount (${exp.amount}).`);
    }
    if (exp.jobId && !jobIds.has(exp.jobId)) {
      warnings.push(`Expense ${exp.expenseId} references unknown Job ID ${exp.jobId}.`);
    }
  }

  for (const asn of candidate.assignments) {
    if (asn.jobId && !jobIds.has(asn.jobId)) {
      warnings.push(`Assignment ${asn.assignmentId} references unknown Job ID ${asn.jobId}.`);
    }
    if (asn.contractorId && !contractorIds.has(asn.contractorId)) {
      warnings.push(`Assignment ${asn.assignmentId} references unknown Contractor ID ${asn.contractorId}.`);
    }
  }

  const totalInvoicedNet = roundMoney(
    candidate.invoices
      .filter((i: any) => i.cancelled !== 'Yes')
      .reduce((s: number, i: any) => s + ((i.amountBeforeTax || 0) - (i.creditNoteAmount || 0)), 0)
  );
  const totalCashCollected = roundMoney(
    candidate.payments.reduce((s: number, p: any) => s + (p.amount || 0), 0)
  );
  const totalExpenses = roundMoney(
    candidate.expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0)
  );
  const totalContractorPay = roundMoney(
    candidate.assignments.reduce((s: number, a: any) => s + ((a.quantity || 0) * (a.rate || 0)), 0)
  );

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      customerCount: candidate.customers.length,
      jobCount: candidate.jobs.length,
      invoiceCount: candidate.invoices.length,
      paymentCount: candidate.payments.length,
      expenseCount: candidate.expenses.length,
      totalInvoicedNet,
      totalCashCollected,
      totalExpenses,
      totalContractorPay
    }
  };
}
