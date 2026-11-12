/**
 * CIVITAS ESTATE & MAINTENANCE
 * Monthly Management Accounts Engine (12-Month P&L, Cash Flow, Balance Sheet items)
 * Strict accounting rules:
 * - Revenue = Invoices before tax, net of credit notes (invoice date)
 * - Cash Received = Payments only (payment date)
 * - Field Labour = Assignments only (never from expenses, prevents double-counting)
 * - Funding Received = Capital, never revenue
 * - Working Capital Reserve = Cash asset, never an expense
 */

import type {
  Invoice,
  Payment,
  Expense,
  Assignment,
  Asset,
  FundingLine,
  SystemSettings
} from './types.ts';
import { roundMoney, parseDate } from './calculations.ts';

export interface MonthManagementAccount {
  monthIndex: number; // 0 to 11 (Jan to Dec)
  monthLabel: string; // "Jan", "Feb", etc.
  startDate: string;  // "YYYY-MM-01"
  endDate: string;    // "YYYY-MM-DD"

  // Revenue
  revCivitasFix: number;
  revCivitasCare: number;
  revCivitasWatch: number;
  totalRevenue: number;

  // Direct Costs
  directLabour: number;
  directMaterials: number;
  directTransport: number;
  totalDirectCosts: number;
  grossContribution: number;
  contributionMargin: number | null;

  // Operating Expenses
  opexMarketing: number;
  opexTraining: number;
  opexCompliance: number;
  opexDigital: number;
  opexBranding: number;
  opexAdmin: number;
  opexInsurance: number;
  opexProfessionalFees: number;
  opexSalaries: number;
  opexOther: number;
  totalOpex: number;

  // Profitability
  ebitda: number;
  depreciation: number;
  operatingProfit: number;

  // Capital Expenditure
  capex: number;

  // Cash Flow
  openingCash: number;
  cashReceivedCustomers: number;
  cashPaidOpexDirect: number;
  cashPaidCapex: number;
  cashPaidLabour: number;
  fundingReceived: number;
  founderCapitalIn: number;
  grantsReceived: number;
  loansReceived: number;
  founderDrawingsOut: number;
  loanPrincipalRepaid: number;
  netCashMovement: number;
  closingCash: number;

  // Balance Sheet Items (at month end)
  receivables: number;
  payables: number;
  workingCapital: number;
  loansPayable: number;
  netFounderEquity: number;
  grantCapitalReserve: number;
}

export interface YearManagementAccounts {
  year: number;
  months: MonthManagementAccount[];
  yearTotal: {
    revCivitasFix: number;
    revCivitasCare: number;
    revCivitasWatch: number;
    totalRevenue: number;

    directLabour: number;
    directMaterials: number;
    directTransport: number;
    totalDirectCosts: number;
    grossContribution: number;
    contributionMargin: number | null;

    opexMarketing: number;
    opexTraining: number;
    opexCompliance: number;
    opexDigital: number;
    opexBranding: number;
    opexAdmin: number;
    opexInsurance: number;
    opexProfessionalFees: number;
    opexSalaries: number;
    opexOther: number;
    totalOpex: number;

    ebitda: number;
    depreciation: number;
    operatingProfit: number;
    capex: number;

    cashReceivedCustomers: number;
    cashPaidOpexDirect: number;
    cashPaidCapex: number;
    cashPaidLabour: number;
    fundingReceived: number;
    founderCapitalIn: number;
    grantsReceived: number;
    loansReceived: number;
    founderDrawingsOut: number;
    loanPrincipalRepaid: number;
    netCashMovement: number;
    closingCash: number; // At end of year (or latest month)

    receivables: number; // Current at report date / year end
    payables: number;
    workingCapital: number;
    loansPayable: number;
    netFounderEquity: number;
    grantCapitalReserve: number;
  };
}

export function generateManagementAccounts(
  year: number,
  invoices: Invoice[],
  payments: Payment[],
  expenses: Expense[],
  assignments: Assignment[],
  assets: Asset[],
  fundingLines: FundingLine[],
  settings: SystemSettings
): YearManagementAccounts {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const months: MonthManagementAccount[] = [];

  let rollingCash = settings.openingCashBalance || 0;

  for (let m = 0; m < 12; m++) {
    const monthNumStr = String(m + 1).padStart(2, '0');
    const startStr = `${year}-${monthNumStr}-01`;
    const lastDay = new Date(year, m + 1, 0).getDate();
    const endStr = `${year}-${monthNumStr}-${String(lastDay).padStart(2, '0')}`;

    // 1. REVENUE (Invoices by invoice date)
    const monthInvoices = invoices.filter(
      inv => inv.cancelled !== 'Yes' && inv.invoiceDate >= startStr && inv.invoiceDate <= endStr
    );

    const revCivitasFix = roundMoney(
      monthInvoices.filter(i => i.division === 'Civitas Fix').reduce((sum, i) => sum + (i.netRevenue || 0), 0)
    );
    const revCivitasCare = roundMoney(
      monthInvoices.filter(i => i.division === 'Civitas Care').reduce((sum, i) => sum + (i.netRevenue || 0), 0)
    );
    const revCivitasWatch = roundMoney(
      monthInvoices.filter(i => i.division === 'Civitas Property Watch').reduce((sum, i) => sum + (i.netRevenue || 0), 0)
    );
    const totalRevenue = roundMoney(revCivitasFix + revCivitasCare + revCivitasWatch);

    // 2. DIRECT COSTS
    // Direct Labour from Assignments (by assignment date)
    const monthAssignments = assignments.filter(
      a => a.assignmentDate >= startStr && a.assignmentDate <= endStr
    );
    const directLabour = roundMoney(monthAssignments.reduce((sum, a) => sum + (a.amount || 0), 0));

    // Direct Materials & Transport from Expenses
    const monthDirectExpenses = expenses.filter(
      e => e.expenseDate >= startStr && e.expenseDate <= endStr && e.class === 'Direct'
    );
    const directMaterials = roundMoney(
      monthDirectExpenses.filter(e => e.category === 'Direct materials').reduce((sum, e) => sum + e.amount, 0)
    );
    const directTransport = roundMoney(
      monthDirectExpenses.filter(e => e.category === 'Direct transport').reduce((sum, e) => sum + e.amount, 0)
    );
    const totalDirectCosts = roundMoney(directLabour + directMaterials + directTransport);
    const grossContribution = roundMoney(totalRevenue - totalDirectCosts);
    const contributionMargin = totalRevenue > 0 ? roundMoney(grossContribution / totalRevenue) : null;

    // 3. OPERATING EXPENSES (by expense date)
    const monthOpexExpenses = expenses.filter(
      e => e.expenseDate >= startStr && e.expenseDate <= endStr && e.class === 'Opex'
    );
    const opexMarketing = roundMoney(monthOpexExpenses.filter(e => e.category === 'Marketing and customer acquisition').reduce((s, e) => s + e.amount, 0));
    const opexTraining = roundMoney(monthOpexExpenses.filter(e => e.category === 'Workforce training and safety').reduce((s, e) => s + e.amount, 0));
    const opexCompliance = roundMoney(monthOpexExpenses.filter(e => e.category === 'Regulatory compliance').reduce((s, e) => s + e.amount, 0));
    const opexDigital = roundMoney(monthOpexExpenses.filter(e => e.category === 'Digital operations').reduce((s, e) => s + e.amount, 0));
    const opexBranding = roundMoney(monthOpexExpenses.filter(e => e.category === 'Branding and materials').reduce((s, e) => s + e.amount, 0));
    const opexAdmin = roundMoney(monthOpexExpenses.filter(e => e.category === 'Administration and communication').reduce((s, e) => s + e.amount, 0));
    const opexInsurance = roundMoney(monthOpexExpenses.filter(e => e.category === 'Insurance').reduce((s, e) => s + e.amount, 0));
    const opexProfessionalFees = roundMoney(monthOpexExpenses.filter(e => e.category === 'Professional fees').reduce((s, e) => s + e.amount, 0));
    const opexSalaries = roundMoney(monthOpexExpenses.filter(e => e.category === 'Salaries and employer pension').reduce((s, e) => s + e.amount, 0));
    const opexOther = roundMoney(monthOpexExpenses.filter(e => e.category === 'Other operating expense').reduce((s, e) => s + e.amount, 0));

    const totalOpex = roundMoney(
      opexMarketing + opexTraining + opexCompliance + opexDigital + opexBranding +
      opexAdmin + opexInsurance + opexProfessionalFees + opexSalaries + opexOther
    );

    const ebitda = roundMoney(grossContribution - totalOpex);

    // Depreciation: straight-line depreciation of active depreciable assets active in this month
    const curMonthFirst = new Date(year, m, 1);
    let depreciation = 0;
    assets.forEach(a => {
      if (a.depreciable === 'Yes' && a.startMonth && a.endMonth && a.monthlyDepreciation) {
        const sMonth = parseDate(a.startMonth);
        const eMonth = parseDate(a.endMonth);
        if (sMonth && eMonth && curMonthFirst >= sMonth && curMonthFirst <= eMonth) {
          depreciation += a.monthlyDepreciation;
        }
      }
    });
    depreciation = roundMoney(depreciation);
    const operatingProfit = roundMoney(ebitda - depreciation);

    // 4. CAPITAL EXPENDITURE (Capex expenses in the month)
    const monthCapex = expenses.filter(
      e => e.expenseDate >= startStr && e.expenseDate <= endStr && e.class === 'Capex'
    );
    const capex = roundMoney(monthCapex.reduce((sum, e) => sum + e.amount, 0));

    // 5. CASH FLOW (by payment date)
    const openingCash = rollingCash;

    // Cash received from customers
    const monthPayments = payments.filter(
      p => p.paymentDate >= startStr && p.paymentDate <= endStr
    );
    const cashReceivedCustomers = roundMoney(monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0));

    // Paid expenses (Direct & Opex)
    const paidExpensesDirectOpex = expenses.filter(
      e => e.paymentStatus === 'Paid' &&
           e.class !== 'Capex' &&
           e.expenseDate >= startStr && e.expenseDate <= endStr
    );
    const cashPaidOpexDirect = roundMoney(paidExpensesDirectOpex.reduce((sum, e) => sum + e.amount, 0));

    // Paid capex
    const paidCapex = expenses.filter(
      e => e.paymentStatus === 'Paid' &&
           e.class === 'Capex' &&
           e.expenseDate >= startStr && e.expenseDate <= endStr
    );
    const cashPaidCapex = roundMoney(paidCapex.reduce((sum, e) => sum + e.amount, 0));

    // Paid labour (assignments with status Paid)
    const paidLabourAssignments = assignments.filter(
      a => a.paymentStatus === 'Paid' &&
           ((a.paidDate && a.paidDate >= startStr && a.paidDate <= endStr) ||
            (!a.paidDate && a.assignmentDate >= startStr && a.assignmentDate <= endStr))
    );
    const cashPaidLabour = roundMoney(paidLabourAssignments.reduce((sum, a) => sum + (a.amount || 0), 0));

    // Funding, Capital, Loans & Drawings (by dateReceived, never revenue or opex)
    const monthFunding = fundingLines.filter(
      f => f.amountReceived > 0 && f.dateReceived && f.dateReceived >= startStr && f.dateReceived <= endStr
    );

    const founderCapitalIn = roundMoney(
      monthFunding
        .filter(f => f.source === 'Founder capital')
        .reduce((sum, f) => sum + f.amountReceived, 0)
    );
    const grantsReceived = roundMoney(
      monthFunding
        .filter(f => f.source === 'NEIP funding' || f.source === 'Other Grant / Donor' || f.source === 'Other')
        .reduce((sum, f) => sum + f.amountReceived, 0)
    );
    const loansReceived = roundMoney(
      monthFunding
        .filter(f => f.source === 'Bank / Microfinance Loan' || f.source === 'Director / Shareholder Loan')
        .reduce((sum, f) => sum + f.amountReceived, 0)
    );
    const founderDrawingsOut = roundMoney(
      monthFunding
        .filter(f => f.source === 'Founder drawing')
        .reduce((sum, f) => sum + f.amountReceived, 0)
    );
    const loanPrincipalRepaid = roundMoney(
      monthFunding
        .filter(f => f.source === 'Loan repayment')
        .reduce((sum, f) => sum + f.amountReceived, 0)
    );

    const fundingReceived = roundMoney(founderCapitalIn + grantsReceived + loansReceived);

    const totalCashIn = cashReceivedCustomers + fundingReceived;
    const totalCashOut = cashPaidOpexDirect + cashPaidCapex + cashPaidLabour + founderDrawingsOut + loanPrincipalRepaid;
    const netCashMovement = roundMoney(totalCashIn - totalCashOut);
    const closingCash = roundMoney(openingCash + netCashMovement);

    rollingCash = closingCash;

    // 6. BALANCE SHEET ITEMS (as at end of month)
    // Cumulative invoices issued up to endStr less payments up to endStr
    const cumInvoices = invoices.filter(inv => inv.cancelled !== 'Yes' && inv.invoiceDate <= endStr);
    const cumPayments = payments.filter(pay => pay.paymentDate <= endStr);
    const cumInvoiceTotal = cumInvoices.reduce((sum, inv) => sum + (inv.total || 0) - (inv.creditNoteTotal || 0), 0);
    const cumPaymentTotal = cumPayments.reduce((sum, pay) => sum + pay.amount, 0);
    const receivables = roundMoney(Math.max(0, cumInvoiceTotal - cumPaymentTotal));

    // Unpaid expenses up to endStr + unpaid assignments up to endStr
    const unpaidExpensesToDate = expenses
      .filter(e => e.paymentStatus !== 'Paid' && e.expenseDate <= endStr)
      .reduce((sum, e) => sum + e.amount, 0);
    const unpaidAssignmentsToDate = assignments
      .filter(a => a.paymentStatus !== 'Paid' && a.assignmentDate <= endStr)
      .reduce((sum, a) => sum + (a.amount || 0), 0);
    const payables = roundMoney(unpaidExpensesToDate + unpaidAssignmentsToDate);

    const workingCapital = roundMoney(closingCash + receivables - payables);

    // Cumulative Financing & Equity Position up to endStr
    const cumFundingToDate = fundingLines.filter(
      f => f.amountReceived > 0 && f.dateReceived && f.dateReceived <= endStr
    );
    const cumLoansIn = cumFundingToDate
      .filter(f => f.source === 'Bank / Microfinance Loan' || f.source === 'Director / Shareholder Loan')
      .reduce((sum, f) => sum + f.amountReceived, 0);
    const cumLoansRepaid = cumFundingToDate
      .filter(f => f.source === 'Loan repayment')
      .reduce((sum, f) => sum + f.amountReceived, 0);
    const loansPayable = roundMoney(Math.max(0, cumLoansIn - cumLoansRepaid));

    const cumFounderCap = cumFundingToDate
      .filter(f => f.source === 'Founder capital')
      .reduce((sum, f) => sum + f.amountReceived, 0);
    const cumFounderDrawings = cumFundingToDate
      .filter(f => f.source === 'Founder drawing')
      .reduce((sum, f) => sum + f.amountReceived, 0);
    const cumOpProfitToDate = months.reduce((sum, prev) => sum + prev.operatingProfit, 0) + operatingProfit;
    const netFounderEquity = roundMoney((settings.openingCashBalance || 0) + cumFounderCap - cumFounderDrawings + cumOpProfitToDate);

    const grantCapitalReserve = roundMoney(
      cumFundingToDate
        .filter(f => f.source === 'NEIP funding' || f.source === 'Other Grant / Donor' || f.source === 'Other')
        .reduce((sum, f) => sum + f.amountReceived, 0)
    );

    months.push({
      monthIndex: m,
      monthLabel: monthNames[m],
      startDate: startStr,
      endDate: endStr,
      revCivitasFix,
      revCivitasCare,
      revCivitasWatch,
      totalRevenue,
      directLabour,
      directMaterials,
      directTransport,
      totalDirectCosts,
      grossContribution,
      contributionMargin,
      opexMarketing,
      opexTraining,
      opexCompliance,
      opexDigital,
      opexBranding,
      opexAdmin,
      opexInsurance,
      opexProfessionalFees,
      opexSalaries,
      opexOther,
      totalOpex,
      ebitda,
      depreciation,
      operatingProfit,
      capex,
      openingCash,
      cashReceivedCustomers,
      cashPaidOpexDirect,
      cashPaidCapex,
      cashPaidLabour,
      fundingReceived,
      founderCapitalIn,
      grantsReceived,
      loansReceived,
      founderDrawingsOut,
      loanPrincipalRepaid,
      netCashMovement,
      closingCash,
      receivables,
      payables,
      workingCapital,
      loansPayable,
      netFounderEquity,
      grantCapitalReserve
    });
  }

  // Calculate year totals
  const totalRev = roundMoney(months.reduce((s, m) => s + m.totalRevenue, 0));
  const totalDirect = roundMoney(months.reduce((s, m) => s + m.totalDirectCosts, 0));
  const totalGrossContr = roundMoney(totalRev - totalDirect);
  const totalMargin = totalRev > 0 ? roundMoney(totalGrossContr / totalRev) : null;
  const totalOpexYear = roundMoney(months.reduce((s, m) => s + m.totalOpex, 0));
  const totalEbitdaYear = roundMoney(totalGrossContr - totalOpexYear);
  const totalDeprYear = roundMoney(months.reduce((s, m) => s + m.depreciation, 0));
  const totalOpProfitYear = roundMoney(totalEbitdaYear - totalDeprYear);
  const totalCapexYear = roundMoney(months.reduce((s, m) => s + m.capex, 0));

  const totalCashCust = roundMoney(months.reduce((s, m) => s + m.cashReceivedCustomers, 0));
  const totalCashOpex = roundMoney(months.reduce((s, m) => s + m.cashPaidOpexDirect, 0));
  const totalCashCapex = roundMoney(months.reduce((s, m) => s + m.cashPaidCapex, 0));
  const totalCashLab = roundMoney(months.reduce((s, m) => s + m.cashPaidLabour, 0));
  const totalFundingRec = roundMoney(months.reduce((s, m) => s + m.fundingReceived, 0));
  const totalFounderCapIn = roundMoney(months.reduce((s, m) => s + m.founderCapitalIn, 0));
  const totalGrantsRec = roundMoney(months.reduce((s, m) => s + m.grantsReceived, 0));
  const totalLoansRec = roundMoney(months.reduce((s, m) => s + m.loansReceived, 0));
  const totalFounderDrawingsOut = roundMoney(months.reduce((s, m) => s + m.founderDrawingsOut, 0));
  const totalLoanRepaid = roundMoney(months.reduce((s, m) => s + m.loanPrincipalRepaid, 0));
  const totalNetCashMov = roundMoney(months.reduce((s, m) => s + m.netCashMovement, 0));

  const lastMonth = months[11];

  return {
    year,
    months,
    yearTotal: {
      revCivitasFix: roundMoney(months.reduce((s, m) => s + m.revCivitasFix, 0)),
      revCivitasCare: roundMoney(months.reduce((s, m) => s + m.revCivitasCare, 0)),
      revCivitasWatch: roundMoney(months.reduce((s, m) => s + m.revCivitasWatch, 0)),
      totalRevenue: totalRev,
      directLabour: roundMoney(months.reduce((s, m) => s + m.directLabour, 0)),
      directMaterials: roundMoney(months.reduce((s, m) => s + m.directMaterials, 0)),
      directTransport: roundMoney(months.reduce((s, m) => s + m.directTransport, 0)),
      totalDirectCosts: totalDirect,
      grossContribution: totalGrossContr,
      contributionMargin: totalMargin,
      opexMarketing: roundMoney(months.reduce((s, m) => s + m.opexMarketing, 0)),
      opexTraining: roundMoney(months.reduce((s, m) => s + m.opexTraining, 0)),
      opexCompliance: roundMoney(months.reduce((s, m) => s + m.opexCompliance, 0)),
      opexDigital: roundMoney(months.reduce((s, m) => s + m.opexDigital, 0)),
      opexBranding: roundMoney(months.reduce((s, m) => s + m.opexBranding, 0)),
      opexAdmin: roundMoney(months.reduce((s, m) => s + m.opexAdmin, 0)),
      opexInsurance: roundMoney(months.reduce((s, m) => s + m.opexInsurance, 0)),
      opexProfessionalFees: roundMoney(months.reduce((s, m) => s + m.opexProfessionalFees, 0)),
      opexSalaries: roundMoney(months.reduce((s, m) => s + m.opexSalaries, 0)),
      opexOther: roundMoney(months.reduce((s, m) => s + m.opexOther, 0)),
      totalOpex: totalOpexYear,
      ebitda: totalEbitdaYear,
      depreciation: totalDeprYear,
      operatingProfit: totalOpProfitYear,
      capex: totalCapexYear,
      cashReceivedCustomers: totalCashCust,
      cashPaidOpexDirect: totalCashOpex,
      cashPaidCapex: totalCashCapex,
      cashPaidLabour: totalCashLab,
      fundingReceived: totalFundingRec,
      founderCapitalIn: totalFounderCapIn,
      grantsReceived: totalGrantsRec,
      loansReceived: totalLoansRec,
      founderDrawingsOut: totalFounderDrawingsOut,
      loanPrincipalRepaid: totalLoanRepaid,
      netCashMovement: totalNetCashMov,
      closingCash: lastMonth ? lastMonth.closingCash : 0,
      receivables: lastMonth ? lastMonth.receivables : 0,
      payables: lastMonth ? lastMonth.payables : 0,
      workingCapital: lastMonth ? lastMonth.workingCapital : 0,
      loansPayable: lastMonth ? lastMonth.loansPayable : 0,
      netFounderEquity: lastMonth ? lastMonth.netFounderEquity : 0,
      grantCapitalReserve: lastMonth ? lastMonth.grantCapitalReserve : 0
    }
  };
}
