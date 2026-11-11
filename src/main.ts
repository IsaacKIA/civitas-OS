/**
 * CIVITAS ESTATE & MAINTENANCE
 * Executive Operations & Financial Control System Application UI
 * Modern, responsive, zero-external-dependency TypeScript interface.
 */

import { opsStore, type OpsDatabaseState } from './store.ts';
import { createDemoState } from './demo-data.ts';
import { roundMoney, formatYMD } from './calculations.ts';
import {
  renderPrintQuoteHtml,
  renderPrintInvoiceHtml,
  renderPrintMonthlyReportHtml,
  renderPrintInspectionHtml
} from './reports.ts';
import type { Customer, Property, Enquiry, Quote, Job, Assignment, Contractor, Invoice, Payment, Expense, PropertyInspection, SystemUser, UserRole, UserDepartment } from './types.ts';

type ScreenMode = 'landing' | 'login' | 'dashboard';

type ActiveTab = 
  | 'dashboard'
  | 'users'
  | 'financial'
  | 'receivables'
  | 'sales'
  | 'operations'
  | 'contractors'
  | 'expenses'
  | 'grant'
  | 'assets'
  | 'governance'
  | 'checks'
  | 'print';

function formatGhanaWhatsAppLink(phone: string, text: string): string {
  let clean = phone.replace(/[^\d+]/g, '');
  if (clean.startsWith('+')) {
    clean = clean.substring(1);
  }
  if (clean.startsWith('0')) {
    clean = '233' + clean.substring(1);
  } else if (!clean.startsWith('233') && clean.length === 9) {
    clean = '233' + clean;
  }
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

class OpsApp {
  private mountEl: HTMLElement;
  private screenMode: ScreenMode = 'landing';
  private currentTab: ActiveTab = 'dashboard';
  private loginError: string = '';
  private selectedCustomerForQuote?: string;

  constructor(mountId: string) {
    const el = document.getElementById(mountId);
    if (!el) throw new Error(`Mount element #${mountId} not found`);
    this.mountEl = el;

    // Listen to changes in the store
    opsStore.subscribe(() => {
      this.render();
    });

    this.render();
  }

  public setTab(tab: ActiveTab): void {
    this.currentTab = tab;
    this.render();
  }

  public setScreen(mode: ScreenMode): void {
    this.loginError = '';
    this.screenMode = mode;
    this.render();
  }

  public render(): void {
    const state = opsStore.getState();
    const settings = state.settings;
    const mgmt = opsStore.getManagementAccounts();
    const evaluation = opsStore.getChecksEvaluation();
    const currency = settings.currencySymbol;

    if (this.screenMode === 'landing') {
      this.mountEl.innerHTML = this.renderLandingScreen(state, mgmt, evaluation, currency);
      this.bindLandingEvents();
      return;
    }

    if (this.screenMode === 'login' || !opsStore.getCurrentUser()) {
      this.screenMode = 'login';
      this.mountEl.innerHTML = this.renderLoginScreen(state);
      this.bindLoginEvents();
      return;
    }

    const currentUser = opsStore.getCurrentUser()!;
    const users = opsStore.getUsers();
    const pendingExpenses = state.expenses.filter(e => e.approvalStatus === 'Pending').length;
    const pendingQuotes = state.quotes.filter(q => q.discountApproval === 'Pending').length;
    const totalPendingApprovals = pendingExpenses + pendingQuotes;
    const isReadOnlyAuditor = currentUser.role === 'Board / Internal Auditor';

    this.mountEl.innerHTML = `
      <div class="dashboard-shell">
        <!-- Left Sidebar Navigation -->
        <aside class="dashboard-sidebar">
          <div class="sidebar-brand">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <div style="width: 34px; height: 34px; border-radius: 8px; background: var(--brand-terracotta); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 16px; color: #ffffff;">
                C
              </div>
              <div>
                <h1 style="font-size: 15px; font-weight: 800; margin: 0; color: #ffffff; letter-spacing: -0.2px; line-height: 1.2;">
                  Civitas Estate
                </h1>
                <p style="font-size: 10px; color: #fed7aa; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
                  Operations &amp; Control
                </p>
              </div>
            </div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.65); margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
              Year: <strong style="color: #fff;">${settings.reportingYear}</strong> &bull; Ref: <strong style="color: #fff;">${settings.reportDateOverride || 'Today'}</strong>
            </div>
          </div>

          <div style="flex: 1; overflow-y: auto; padding-bottom: 16px;">
            <div class="sidebar-group-label">Executive &amp; Governance</div>
            <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
              <span>Command Centre</span>
            </button>
            <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'users' ? 'active' : ''}" data-tab="users">
              <span>Users &amp; Governance</span>
              ${totalPendingApprovals > 0 ? `<span class="ops-badge badge-attention" style="font-size: 10px; padding: 2px 6px;">${totalPendingApprovals} Pending</span>` : `<span class="ops-badge badge-ok" style="font-size: 9px; padding: 2px 6px;">RBAC</span>`}
            </button>
            <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'checks' ? 'active' : ''}" data-tab="checks">
              <span>52 Control Checks</span>
              <span class="ops-badge ${evaluation.itemsNeedingAttention > 0 ? 'badge-attention' : 'badge-ok'}" style="font-size: 10px; padding: 2px 6px;">
                ${evaluation.itemsNeedingAttention > 0 ? `${evaluation.itemsNeedingAttention} Attn` : 'OK'}
              </span>
            </button>
            <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'governance' ? 'active' : ''}" data-tab="governance">
              <span>Risk &amp; Compliance</span>
            </button>

            <div class="sidebar-group-label">Commercial &amp; Field Ops</div>
            <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'sales' ? 'active' : ''}" data-tab="sales">
              <span>Sales &amp; Customers</span>
              <span style="font-size: 11px; opacity: 0.65;">${state.customers.length}</span>
            </button>
            <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'operations' ? 'active' : ''}" data-tab="operations">
              <span>Service Operations</span>
              <span style="font-size: 11px; opacity: 0.65;">${state.jobs.length}</span>
            </button>
            <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'contractors' ? 'active' : ''}" data-tab="contractors">
              <span>Field Workforce</span>
              <span style="font-size: 11px; opacity: 0.65;">${state.contractors.length}</span>
            </button>

            <div class="sidebar-group-label">Finance &amp; Accountability</div>
            <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'financial' ? 'active' : ''}" data-tab="financial">
              <span>Financial Performance</span>
            </button>
            <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'receivables' ? 'active' : ''}" data-tab="receivables">
              <span>Invoices &amp; Receivables</span>
              <span style="font-size: 11px; opacity: 0.65;">${state.invoices.length}</span>
            </button>
            <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'expenses' ? 'active' : ''}" data-tab="expenses">
              <span>Expenses &amp; Procurement</span>
              <span style="font-size: 11px; opacity: 0.65;">${state.expenses.length}</span>
            </button>
            <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'grant' ? 'active' : ''}" data-tab="grant">
              <span>Grant &amp; NEIP Funding</span>
            </button>
            <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'assets' ? 'active' : ''}" data-tab="assets">
              <span>Equipment &amp; Assets</span>
              <span style="font-size: 11px; opacity: 0.65;">${state.assets.length}</span>
            </button>

            <div class="sidebar-group-label">Official Documentation</div>
            <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'print' ? 'active' : ''}" data-tab="print">
              <span>Printable Documents</span>
            </button>
          </div>

          <!-- Sidebar Footer -->
          <div style="padding: 14px 18px; border-top: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.2); font-size: 11px;">
            <div style="font-weight: 700; color: #ffffff; margin-bottom: 2px;">${currentUser.fullName}</div>
            <div style="color: #fed7aa; font-weight: 600; font-size: 10px; margin-bottom: 10px;">${currentUser.role}</div>
            <div style="display: flex; gap: 6px;">
              <button id="btnGoLanding" class="btn-brand-outline" style="flex: 1; justify-content: center; color: #e2e8f0; border-color: rgba(255,255,255,0.25); padding: 5px 8px; font-size: 10px;">
                Landing
              </button>
              <button id="btnLogout" class="btn-brand-outline" style="flex: 1; justify-content: center; color: #fca5a5; border-color: rgba(252,165,165,0.35); padding: 5px 8px; font-size: 10px;">
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        <!-- Main Workspace -->
        <div class="dashboard-main">
          <!-- Sticky Governance Topbar -->
          <header class="dashboard-topbar">
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 15px; font-weight: 800; color: #075545;">
                    ${this.getTabTitle(this.currentTab)}
                  </span>
                  <span class="ops-badge ${currentUser.role === 'Founder / CEO' ? 'badge-ok' : currentUser.role === 'Board / Internal Auditor' ? 'badge-reconciled' : 'badge-pending'}">
                    ${currentUser.role}
                  </span>
                </div>
                <p style="font-size: 11px; color: #64748b; margin: 0;">
                  Active Operator: <strong>${currentUser.fullName}</strong> (${currentUser.department}) &bull; Audit Trail: <strong>Recording</strong>
                </p>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 6px;">
                <span style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase;">Role Switch:</span>
                <select id="selectQuickSwitchUser" style="border: none; background: transparent; font-size: 11px; font-weight: 700; color: #075545; cursor: pointer; outline: none;">
                  ${users.filter(u => u.status === 'Active').map(u => `
                    <option value="${u.userId}" ${u.userId === currentUser.userId ? 'selected' : ''}>
                      ${u.fullName} — ${u.role}
                    </option>
                  `).join('')}
                </select>
              </div>

              <button id="btnPreloadDemo" class="btn-brand-outline" style="font-size: 11px; padding: 6px 10px;">
                Preload Demo
              </button>
              <button id="btnResetClean" class="btn-brand-outline" style="color: #b91c1c; border-color: #fecaca; font-size: 11px; padding: 6px 10px;">
                Reset Clean
              </button>
              <button id="btnExportJson" class="btn-brand-outline" style="font-size: 11px; padding: 6px 10px;">
                Backup JSON
              </button>
              <button id="btnImportJson" class="btn-brand-outline" style="color: #1d4ed8; border-color: #bfdbfe; font-size: 11px; padding: 6px 10px;">
                Restore JSON
              </button>
              <input type="file" id="inputImportJson" accept=".json" style="display: none;" />
              <a href="https://www.civitasestate.com" target="_blank" class="btn-brand-outline" style="font-size: 11px; padding: 6px 10px; text-decoration: none;">
                civitasestate.com &nearr;
              </a>
            </div>
          </header>

          ${isReadOnlyAuditor ? `
            <div style="background: #eef2ff; border-bottom: 1px solid #c7d2fe; padding: 8px 24px; font-size: 12px; color: #3730a3; display: flex; justify-content: space-between; align-items: center;">
              <span><strong>🔒 Read-Only Governance &amp; Internal Audit Mode:</strong> You are signed in as <strong>${currentUser.fullName} (${currentUser.role})</strong>. Data modification controls are restricted to preserve audit independence.</span>
              <span class="ops-badge badge-reconciled">Audit Oversight</span>
            </div>
          ` : ''}

          <!-- Main Tab Content Body -->
          <main class="dashboard-content">
            ${this.renderActiveTabContent(state, mgmt, evaluation, currency)}
          </main>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private getTabTitle(tab: ActiveTab): string {
    switch (tab) {
      case 'dashboard': return 'Executive Command Centre';
      case 'users': return 'Users, Roles & Governance Control';
      case 'financial': return '12-Month Financial Performance & Close';
      case 'receivables': return 'Tax Invoices, Cash Receipts & Ageing';
      case 'sales': return 'Customer Register, Enquiries & Quotations';
      case 'operations': return 'Service Operations & Property Watch';
      case 'contractors': return 'Vetted Field Workforce & Assignments';
      case 'expenses': return 'Operating & Direct Expenses Ledger';
      case 'grant': return 'NEIP Grant & Pre-Funding Accountability';
      case 'assets': return 'Equipment & Straight-Line Depreciation';
      case 'governance': return 'Risk Heat Map & Compliance Register';
      case 'checks': return '52 Automated Internal Control Checks';
      case 'print': return 'Official Printable Document Suite';
    }
  }

  private renderActiveTabContent(
    state: OpsDatabaseState,
    mgmt: ReturnType<typeof opsStore.getManagementAccounts>,
    evaluation: ReturnType<typeof opsStore.getChecksEvaluation>,
    currency: string
  ): string {
    switch (this.currentTab) {
      case 'dashboard':
        return this.renderDashboardTab(state, mgmt, evaluation, currency);
      case 'users':
        return this.renderUsersAndGovernanceTab(state, evaluation, currency);
      case 'financial':
        return this.renderFinancialTab(state, mgmt, currency);
      case 'receivables':
        return this.renderReceivablesTab(state, currency);
      case 'sales':
        return this.renderSalesTab(state, currency);
      case 'operations':
        return this.renderOperationsTab(state, currency);
      case 'contractors':
        return this.renderContractorsTab(state, currency);
      case 'expenses':
        return this.renderExpensesTab(state, currency);
      case 'grant':
        return this.renderGrantTab(state, currency);
      case 'assets':
        return this.renderAssetsTab(state, currency);
      case 'governance':
        return this.renderGovernanceTab(state);
      case 'checks':
        return this.renderChecksTab(evaluation);
      case 'print':
        return this.renderPrintSuiteTab(state);
      default:
        return `<p>Tab under construction</p>`;
    }
  }

  // ==========================================
  // STAGE 1: EXECUTIVE LANDING PAGE
  // ==========================================
  private renderLandingScreen(
    state: OpsDatabaseState,
    mgmt: ReturnType<typeof opsStore.getManagementAccounts>,
    evaluation: ReturnType<typeof opsStore.getChecksEvaluation>,
    currency: string
  ): string {
    const activeUser = opsStore.getCurrentUser();
    const usersCount = opsStore.getUsers().filter(u => u.status === 'Active').length;
    const reconciledTotals = evaluation.controlTotals.filter(t => t.status === 'RECONCILED').length;

    return `
      <div class="landing-shell">
        <!-- Top Brand Bar -->
        <header style="background: #032b24; color: #ffffff; padding: 14px 24px; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <div class="landing-container" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: var(--brand-terracotta); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; color: #ffffff;">
                C
              </div>
              <div>
                <div style="font-size: 16px; font-weight: 800; letter-spacing: -0.3px;">${state.settings.companyName}</div>
                <div style="font-size: 11px; color: #fed7aa; font-weight: 600;">${state.settings.tagline} &bull; Accra &amp; Tema, Ghana</div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <a href="https://www.civitasestate.com" target="_blank" class="btn-brand-outline" style="color: #ffffff; border-color: rgba(255,255,255,0.3); font-size: 12px; text-decoration: none;">
                www.civitasestate.com &nearr;
              </a>
              ${activeUser ? `
                <button id="btnLandingResumeDashboard" class="btn-brand-terracotta" style="font-size: 12px; padding: 9px 16px;">
                  Continue as ${activeUser.fullName} (${activeUser.role}) &rarr;
                </button>
              ` : ''}
              <button id="btnLandingToLogin" class="btn-brand-primary" style="background: #10b981; font-size: 12px; padding: 9px 18px;">
                Staff &amp; Governance Sign In &rarr;
              </button>
            </div>
          </div>
        </header>

        <!-- Hero Section -->
        <section class="landing-hero">
          <div class="landing-container">
            <div style="max-width: 780px;">
              <div class="landing-pill">
                <span>●</span> Internal Operations, Accounting &amp; Governance Control System
              </div>
              <h1 style="font-family: var(--font-serif); font-size: 44px; font-weight: 700; line-height: 1.12; margin: 0 0 18px 0; color: #ffffff;">
                Institutional Discipline for Property Care &amp; Estate Maintenance in Ghana.
              </h1>
              <p style="font-size: 16px; color: #e2e8f0; line-height: 1.65; margin: 0 0 28px 0;">
                Built for <strong>Civitas Estate &amp; Maintenance</strong> across Greater Accra and Tema. Unifying customer onboarding, vetted field workforce dispatch, diaspora <em>Property Watch</em> condition reporting, NEIP grant accountability, and 52 audit-grade internal controls under strict role-based governance.
              </p>

              <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
                <button id="btnHeroLogin" class="btn-brand-terracotta" style="font-size: 14px; padding: 13px 26px; box-shadow: 0 10px 25px rgba(228, 105, 63, 0.35);">
                  Access Staff Login Portal &rarr;
                </button>
                <button id="btnHeroDemoLogin" class="btn-brand-outline" style="color: #ffffff; border-color: rgba(255,255,255,0.45); font-size: 13px; padding: 12px 20px;">
                  Preload Verified Demo Dataset &amp; Sign In
                </button>
              </div>
            </div>

            <!-- Live Governance & System Pulse Strip -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-top: 44px; padding-top: 28px; border-top: 1px solid rgba(255,255,255,0.15);">
              <div style="background: rgba(0,0,0,0.22); padding: 14px 18px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700;">Governance RBAC</div>
                <div style="font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 2px;">${usersCount} Active Roles</div>
                <div style="font-size: 11px; color: #fed7aa;">Segregation of Duties Enforced</div>
              </div>
              <div style="background: rgba(0,0,0,0.22); padding: 14px 18px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700;">Automated Controls</div>
                <div style="font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 2px;">52 Rule Checks</div>
                <div style="font-size: 11px; color: #86efac;">${reconciledTotals}/6 Ledger Totals Reconciled</div>
              </div>
              <div style="background: rgba(0,0,0,0.22); padding: 14px 18px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700;">Approval Threshold</div>
                <div style="font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 2px;">&gt; ${currency}${state.settings.spendingApprovalThreshold}</div>
                <div style="font-size: 11px; color: #cbd5e1;">Mandatory CEO Sign-Off</div>
              </div>
              <div style="background: rgba(0,0,0,0.22); padding: 14px 18px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700;">Service Catalogue</div>
                <div style="font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 2px;">S01 – S16</div>
                <div style="font-size: 11px; color: #cbd5e1;">Standardized Accra &amp; Tema Rates</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Operational Divisions & Governance Architecture -->
        <section style="padding: 48px 24px; flex: 1;">
          <div class="landing-container">
            <div style="text-align: center; max-width: 720px; margin: 0 auto 36px auto;">
              <h2 style="font-size: 24px; font-weight: 800; color: #075545; margin: 0 0 8px 0;">
                Three Operational Divisions &bull; One Unified Control System
              </h2>
              <p style="font-size: 14px; color: #64748b; margin: 0;">
                Aligned with <strong>www.civitasestate.com</strong> to serve residential homeowners, commercial facilities, and diaspora property investors across East Legon, Cantonments, Airport, Spintex, Adenta, and Tema Communities 1–25.
              </p>
            </div>

            <div class="landing-grid-3" style="margin-bottom: 44px;">
              <div class="landing-feature-card">
                <span class="ops-badge badge-ok" style="margin-bottom: 10px;">Division 01</span>
                <h3 style="font-size: 18px; font-weight: 800; color: #075545; margin: 0 0 8px 0;">Civitas Fix (Repairs &amp; Cleaning)</h3>
                <p style="font-size: 13px; color: #475569; margin: 0 0 14px 0;">
                  On-demand residential and commercial cleaning, deep post-construction cleanups, plumbing, electrical, AC servicing, lock hardware, painting, and tiling with benchmarked pricing.
                </p>
                <div style="font-size: 11px; font-weight: 700; color: #075545;">
                  ✓ Vetted Artisans &bull; ✓ Single-Entry Field Labour &bull; ✓ Quality Inspection Gate
                </div>
              </div>

              <div class="landing-feature-card" style="border-top-color: var(--brand-terracotta);">
                <span class="ops-badge badge-pending" style="margin-bottom: 10px;">Division 02</span>
                <h3 style="font-size: 18px; font-weight: 800; color: #075545; margin: 0 0 8px 0;">Civitas Care (Preventive Plans)</h3>
                <p style="font-size: 13px; color: #475569; margin: 0 0 14px 0;">
                  Scheduled preventive maintenance routines for generators, HVAC/AC units, water pumps, and electrical distribution boards to preserve long-term estate asset value.
                </p>
                <div style="font-size: 11px; font-weight: 700; color: #075545;">
                  ✓ Recurring Schedules &bull; ✓ 35% Minimum Margin Guardrail &bull; ✓ SLA Tracking
                </div>
              </div>

              <div class="landing-feature-card" style="border-top-color: #1d4ed8;">
                <span class="ops-badge badge-reconciled" style="margin-bottom: 10px;">Division 03</span>
                <h3 style="font-size: 18px; font-weight: 800; color: #075545; margin: 0 0 8px 0;">Civitas Property Watch (Diaspora)</h3>
                <p style="font-size: 13px; color: #475569; margin: 0 0 14px 0;">
                  Independent periodic walkthroughs for remote landlords and diaspora owners. Grades roof, plumbing, electrical, damp, and perimeter with cloud photo evidence and WhatsApp/PDF dispatch.
                </p>
                <div style="font-size: 11px; font-weight: 700; color: #075545;">
                  ✓ 6-Point Condition Grading &bull; ✓ Cloud Photo Links &bull; ✓ Instant WhatsApp Summaries
                </div>
              </div>
            </div>

            <!-- Governance & Internal Control Pillars -->
            <div class="ops-card" style="background: #ffffff; border: 1px solid #cbd5e1; padding: 28px;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
                <div>
                  <h3 style="font-size: 17px; font-weight: 800; color: #075545; margin: 0; text-transform: uppercase;">
                    Governance, Risk &amp; Accounting Control Framework
                  </h3>
                  <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">
                    Enforcing strict financial integrity, role separation, and tamper-evident period locks.
                  </p>
                </div>
                <button id="btnCardToLogin" class="btn-brand-primary" style="padding: 10px 20px; font-size: 13px;">
                  Sign In to Governance Dashboard &rarr;
                </button>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; font-size: 12px;">
                <div>
                  <strong style="color: #075545; display: block; margin-bottom: 4px;">1. Role-Based Access (RBAC)</strong>
                  5 distinct operational roles (Founder/CEO, Operations Coordinator, Finance Officer, Field Supervisor, Internal Auditor) with full audit logging.
                </div>
                <div>
                  <strong style="color: #075545; display: block; margin-bottom: 4px;">2. Revenue &ne; Cash Invariant</strong>
                  Accrual revenue is recognized from valid Tax Invoices; cash is tracked strictly from reconciled Mobile Money &amp; Bank receipts.
                </div>
                <div>
                  <strong style="color: #075545; display: block; margin-bottom: 4px;">3. NEIP Grant Ring-Fencing</strong>
                  Dedicated tracking for GH₵80,000 NEIP categories (A–H), holding Working Capital Reserve (GH₵22,000) strictly as cash.
                </div>
                <div>
                  <strong style="color: #075545; display: block; margin-bottom: 4px;">4. Tamper-Evident Period Close</strong>
                  Locked monthly accounts snapshot invoice, payment, expense, and assignment counts—flagging any subsequent alteration.
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Footer -->
        <footer style="background: #043D33; color: rgba(255,255,255,0.7); padding: 18px 24px; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
          <div class="landing-container" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <span>&copy; ${state.settings.reportingYear} ${state.settings.companyName}. All Rights Reserved.</span>
            <span>Contact: ${state.settings.email} &bull; WhatsApp: ${state.settings.phone}</span>
          </div>
        </footer>
      </div>
    `;
  }

  // ==========================================
  // STAGE 2: STAFF AUTHENTICATION & LOGIN PORTAL
  // ==========================================
  private renderLoginScreen(state: OpsDatabaseState): string {
    const users = opsStore.getUsers();

    const quickRoleCardsHtml = users.map(u => `
      <div class="role-switch-card">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
            <strong style="font-size: 14px; color: #ffffff;">${u.fullName}</strong>
            <span class="ops-badge ${u.role === 'Founder / CEO' ? 'badge-ok' : u.role === 'Board / Internal Auditor' ? 'badge-reconciled' : 'badge-pending'}" style="font-size: 10px;">
              ${u.role}
            </span>
            ${u.status !== 'Active' ? `<span class="ops-badge badge-attention" style="font-size: 10px;">Suspended</span>` : ''}
          </div>
          <div style="font-size: 11px; color: #cbd5e1;">
            ${u.email} &bull; PIN: <code style="color: #fed7aa; font-weight: 700;">${u.pinCode}</code>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
            ${u.notes || u.department}
          </div>
        </div>
        <button class="btn-brand-terracotta btn-quick-role-login" data-userid="${u.userId}" ${u.status !== 'Active' ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : 'style="white-space: nowrap; font-size: 11px; padding: 8px 14px;"'}>
          Sign In as ${u.role.split(' ')[0]} &rarr;
        </button>
      </div>
    `).join('');

    return `
      <div class="login-shell">
        <div class="login-grid">
          <!-- Left: Credentials Login Card -->
          <div class="login-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 34px; height: 34px; border-radius: 8px; background: var(--brand-green); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 16px; color: #ffffff;">
                  C
                </div>
                <div>
                  <div style="font-size: 15px; font-weight: 800; color: #075545;">Civitas Governance Portal</div>
                  <div style="font-size: 11px; color: #64748b;">Authorized Staff &amp; Executive Sign-In</div>
                </div>
              </div>
              <button id="btnLoginBackToLanding" class="btn-brand-outline" style="font-size: 11px; padding: 5px 10px;">
                &larr; Landing Page
              </button>
            </div>

            <h2 style="font-size: 22px; font-weight: 800; color: #1e293b; margin: 0 0 6px 0;">
              Sign In to Operations Dashboard
            </h2>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 20px 0;">
              All actions performed in your session are logged in the immutable governance audit trail under your user identity.
            </p>

            ${this.loginError ? `
              <div style="background: #fee2e2; border: 1px solid #fecaca; color: #b91c1c; padding: 10px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; margin-bottom: 16px;">
                ⚠️ ${this.loginError}
              </div>
            ` : ''}

            <form id="formStaffLogin">
              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                  Staff Email or User Account *
                </label>
                <input type="text" id="loginEmailInput" required value="admin@civitasestate.com" placeholder="e.g. admin@civitasestate.com" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px;">
              </div>

              <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                  Security PIN / Passcode *
                </label>
                <input type="password" id="loginPinInput" required value="2026" placeholder="Enter 4-digit security PIN" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px;">
                <p style="font-size: 11px; color: #64748b; margin-top: 6px;">
                  Default Executive PIN for <code>admin@civitasestate.com</code> is <strong>2026</strong>.
                </p>
              </div>

              <button type="submit" class="btn-brand-primary" style="width: 100%; justify-content: center; padding: 12px; font-size: 14px;">
                Authenticate &amp; Open Dashboard &rarr;
              </button>
            </form>

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b;">
              <span>Segregation of Duties: <strong>Active</strong></span>
              <span>Session Audit Trail: <strong>Enabled</strong></span>
            </div>
          </div>

          <!-- Right: Interactive Role-Based Governance Access -->
          <div style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div class="landing-pill" style="margin-bottom: 10px;">
                Role-Based Access Control (RBAC)
              </div>
              <h3 style="font-size: 20px; font-weight: 800; color: #ffffff; margin: 0 0 6px 0;">
                Select a Governance Role to Sign In
              </h3>
              <p style="font-size: 12px; color: #cbd5e1; margin: 0 0 16px 0;">
                Click any active staff account below to immediately sign in and test role-specific permissions, approval thresholds, and audit controls:
              </p>

              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${quickRoleCardsHtml}
              </div>
            </div>

            <div style="margin-top: 18px; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 12px 16px; color: #e2e8f0; font-size: 11px;">
              <strong style="color: #fed7aa;">Governance Control Note:</strong> Only the <strong>Founder / CEO</strong> can approve expenses above GH₵${state.settings.spendingApprovalThreshold}, lock monthly accounting periods, or register/suspend staff accounts.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private bindLandingEvents(): void {
    document.getElementById('btnLandingToLogin')?.addEventListener('click', () => this.setScreen('login'));
    document.getElementById('btnHeroLogin')?.addEventListener('click', () => this.setScreen('login'));
    document.getElementById('btnCardToLogin')?.addEventListener('click', () => this.setScreen('login'));

    document.getElementById('btnLandingResumeDashboard')?.addEventListener('click', () => {
      this.setScreen('dashboard');
    });

    document.getElementById('btnHeroDemoLogin')?.addEventListener('click', () => {
      opsStore.loadState(createDemoState());
      opsStore.loginAsUser('U0001');
      this.setScreen('dashboard');
    });
  }

  private bindLoginEvents(): void {
    document.getElementById('btnLoginBackToLanding')?.addEventListener('click', () => {
      this.setScreen('landing');
    });

    document.getElementById('formStaffLogin')?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const emailOrId = (document.getElementById('loginEmailInput') as HTMLInputElement).value;
      const pin = (document.getElementById('loginPinInput') as HTMLInputElement).value;
      const res = opsStore.authenticateUser(emailOrId, pin);
      if (!res.success) {
        this.loginError = res.error || 'Authentication failed';
        this.render();
        return;
      }
      this.loginError = '';
      this.setScreen('dashboard');
    });

    this.mountEl.querySelectorAll<HTMLButtonElement>('.btn-quick-role-login').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.dataset.userid;
        if (!uid) return;
        const user = opsStore.loginAsUser(uid);
        if (user) {
          this.loginError = '';
          this.setScreen('dashboard');
        }
      });
    });
  }

  // ==========================================
  // TAB: USERS, ROLES & GOVERNANCE CONTROL
  // ==========================================
  private renderUsersAndGovernanceTab(
    state: OpsDatabaseState,
    evaluation: ReturnType<typeof opsStore.getChecksEvaluation>,
    currency: string
  ): string {
    const currentUser = opsStore.getCurrentUser();
    const isCEO = currentUser?.role === 'Founder / CEO';
    const users = opsStore.getUsers();
    const activeUsersCount = users.filter(u => u.status === 'Active').length;

    const pendingExpenses = state.expenses.filter(e => e.approvalStatus === 'Pending');
    const pendingQuotes = state.quotes.filter(q => q.discountApproval === 'Pending');
    const closedMonths = state.periodClose.filter(p => p.status === 'Closed');
    const tamperedMonths = state.periodClose.filter(p => p.changedFlag === 'Records changed after close');

    const userRowsHtml = users.map(u => `
      <tr>
        <td style="font-weight: 700; color: #075545;">${u.userId}</td>
        <td style="font-weight: 700;">
          ${u.fullName}
          ${currentUser?.userId === u.userId ? `<span class="ops-badge badge-ok" style="margin-left: 6px; font-size: 9px;">You</span>` : ''}
        </td>
        <td>
          <span class="ops-badge ${u.role === 'Founder / CEO' ? 'badge-ok' : u.role === 'Board / Internal Auditor' ? 'badge-reconciled' : 'badge-pending'}">
            ${u.role}
          </span>
        </td>
        <td>${u.department}</td>
        <td>${u.email}</td>
        <td>${u.phone}</td>
        <td style="font-family: monospace; font-weight: 700;">${isCEO ? u.pinCode : '••••'}</td>
        <td style="font-size: 11px; color: #64748b;">${u.lastLogin || 'Never'}</td>
        <td>
          <span class="ops-badge ${u.status === 'Active' ? 'badge-ok' : 'badge-attention'}">${u.status}</span>
        </td>
        <td style="white-space: nowrap;">
          ${u.status === 'Active' && currentUser?.userId !== u.userId ? `
            <button class="btn-brand-outline btn-switch-to-user" data-id="${u.userId}" style="padding: 3px 8px; font-size: 11px;">
              Switch To Role
            </button>
          ` : ''}
          ${isCEO && u.userId !== 'U0001' ? `
            <button class="btn-brand-outline btn-toggle-user-status" data-id="${u.userId}" style="padding: 3px 8px; font-size: 11px; color: ${u.status === 'Active' ? '#b91c1c' : '#15803d'}; margin-left: 4px;">
              ${u.status === 'Active' ? 'Suspend' : 'Activate'}
            </button>
          ` : ''}
        </td>
      </tr>
    `).join('');

    const pendingExpenseRowsHtml = pendingExpenses.map(e => `
      <tr>
        <td style="font-weight: 700; color: #b91c1c;">${e.expenseId}</td>
        <td>${e.expenseDate}</td>
        <td style="font-weight: 600;">${e.supplier}</td>
        <td>${e.category}</td>
        <td style="text-align: right; font-weight: 800; color: #b91c1c;">${currency}${roundMoney(e.amount).toFixed(2)}</td>
        <td>${e.fundingSource}</td>
        <td style="font-family: monospace; font-size: 11px;">${e.evidenceReference || 'Missing'}</td>
        <td><span class="ops-badge badge-attention">Pending CEO Approval (&gt; ${currency}${state.settings.spendingApprovalThreshold})</span></td>
        <td style="white-space: nowrap;">
          ${isCEO ? `
            <button class="btn-brand-primary btn-approve-expense" data-id="${e.expenseId}" style="padding: 4px 10px; font-size: 11px;">
              ✓ Approve
            </button>
            <button class="btn-brand-outline btn-reject-expense" data-id="${e.expenseId}" style="padding: 4px 10px; font-size: 11px; color: #b91c1c; border-color: #fecaca; margin-left: 4px;">
              ✕ Reject
            </button>
          ` : `<span style="font-size: 11px; color: #64748b; font-weight: 600;">🔒 Requires Founder / CEO</span>`}
        </td>
      </tr>
    `).join('');

    const periodCloseRowsHtml = state.periodClose.map(p => `
      <tr>
        <td style="font-weight: 700; color: #075545;">${p.month}</td>
        <td><span class="ops-badge ${p.status === 'Closed' ? 'badge-ok' : 'badge-pending'}">${p.status}</span></td>
        <td style="font-weight: 600;">${p.closedBy || '-'}</td>
        <td>${p.closedDate || '-'}</td>
        <td style="text-align: center;">${p.invoicesAtClose ?? 0} &rarr; ${p.invoicesNow ?? 0}</td>
        <td style="text-align: center;">${p.paymentsAtClose ?? 0} &rarr; ${p.paymentsNow ?? 0}</td>
        <td style="text-align: center;">${p.expensesAtClose ?? 0} &rarr; ${p.expensesNow ?? 0}</td>
        <td style="text-align: center;">${p.assignmentsAtClose ?? 0} &rarr; ${p.assignmentsNow ?? 0}</td>
        <td>
          ${p.changedFlag ? `<span class="ops-badge badge-attention">${p.changedFlag}</span>` : `<span class="ops-badge badge-ok">Verified Intact</span>`}
        </td>
      </tr>
    `).join('');

    const auditRowsHtml = (state.auditLogs || []).slice(0, 30).map(log => `
      <tr>
        <td style="font-family: monospace; font-size: 11px; color: #64748b;">${log.timestamp.replace('T', ' ').substring(0, 19)}</td>
        <td style="font-weight: 700; color: #075545;">${log.actor}</td>
        <td>
          <span class="ops-badge ${log.action === 'APPROVE' || log.action === 'CREATE' ? 'badge-ok' : log.action === 'REJECT' || log.action === 'DELETE' ? 'badge-attention' : log.action === 'CLOSE_PERIOD' ? 'badge-reconciled' : 'badge-pending'}">
            ${log.action}
          </span>
        </td>
        <td style="font-weight: 600;">${log.entity}</td>
        <td style="font-family: monospace;">${log.entityId}</td>
        <td style="font-size: 12px; color: #334155;">${log.details || '-'}</td>
      </tr>
    `).join('');

    return `
      <!-- Top KPIs -->
      <div class="ops-kpi-grid">
        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 6px 0;">Authorized Staff Users</p>
          <h3 style="font-size: 24px; font-weight: 800; color: #075545; margin: 0;">${activeUsersCount} / ${users.length} Active</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Across 5 governance role tiers</p>
        </div>
        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 6px 0;">Pending Executive Sign-Off</p>
          <h3 style="font-size: 24px; font-weight: 800; color: ${pendingExpenses.length + pendingQuotes.length > 0 ? '#b91c1c' : '#15803d'}; margin: 0;">
            ${pendingExpenses.length + pendingQuotes.length} Item(s)
          </h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Threshold: &gt; ${currency}${state.settings.spendingApprovalThreshold}</p>
        </div>
        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 6px 0;">Locked Accounting Periods</p>
          <h3 style="font-size: 24px; font-weight: 800; color: ${tamperedMonths.length > 0 ? '#b91c1c' : '#075545'}; margin: 0;">
            ${closedMonths.length} Closed
          </h3>
          <p style="font-size: 11px; color: ${tamperedMonths.length > 0 ? '#b91c1c' : '#15803d'}; font-weight: 600; margin: 4px 0 0 0;">
            ${tamperedMonths.length > 0 ? `${tamperedMonths.length} post-close tamper alert(s)!` : '0 post-close modifications'}
          </p>
        </div>
        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 6px 0;">Audit Trail Events</p>
          <h3 style="font-size: 24px; font-weight: 800; color: #1e293b; margin: 0;">${state.auditLogs.length} Logged</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Immutable actor &amp; timestamp log</p>
        </div>
      </div>

      <!-- 1. Executive Approval Queue -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0;">
            1. Executive Approvals Queue (Spending &gt; ${currency}${state.settings.spendingApprovalThreshold} Control)
          </h2>
          <p style="font-size: 11px; color: var(--text-muted); margin: 2px 0 0 0;">
            Expenses above ${currency}${state.settings.spendingApprovalThreshold} recorded by non-executive staff require Founder / CEO approval before passing Control Check #24.
          </p>
        </div>
      </div>
      <div class="ops-table-container" style="margin-bottom: 32px;">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Expense ID</th>
              <th>Date</th>
              <th>Supplier / Payee</th>
              <th>Category</th>
              <th style="text-align: right;">Amount</th>
              <th>Funding Source</th>
              <th>Evidence Ref</th>
              <th>Governance Status</th>
              <th>Executive Action</th>
            </tr>
          </thead>
          <tbody>
            ${pendingExpenseRowsHtml || `<tr><td colspan="9" style="text-align: center; color: #15803d; font-weight: 600;">✓ All expenses above ${currency}${state.settings.spendingApprovalThreshold} have been reviewed and approved.</td></tr>`}
          </tbody>
        </table>
      </div>

      <!-- 2. System Users & Role-Based Access Control (RBAC) -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0;">
            2. System Users &amp; Role-Based Governance Directory
          </h2>
          <p style="font-size: 11px; color: var(--text-muted); margin: 2px 0 0 0;">
            Manage staff credentials, role assignments, and account status. Switch roles anytime to verify permissions.
          </p>
        </div>
        ${isCEO ? `<button id="btnNewUser" class="btn-brand-primary">+ Add System User</button>` : `<span class="ops-badge badge-pending">Only Founder / CEO can add users</span>`}
      </div>
      <div class="ops-table-container" style="margin-bottom: 32px;">
        <table class="ops-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Full Name</th>
              <th>Governance Role</th>
              <th>Department</th>
              <th>Email</th>
              <th>Phone</th>
              <th>PIN</th>
              <th>Last Login</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${userRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- 3. Month-End Period Close & Tamper-Evident Lock -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
        <div>
          <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0;">
            3. Month-End Period Close &amp; Tamper-Evident Control Register
          </h2>
          <p style="font-size: 11px; color: var(--text-muted); margin: 2px 0 0 0;">
            Closing a month snapshots transaction counts. Any subsequent addition or edit in a closed month triggers a tamper-evident exception (Check #51).
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <select id="selectCloseMonth" style="padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px;">
            <option value="2026-01-01">January 2026 (2026-01-01)</option>
            <option value="2026-02-01">February 2026 (2026-02-01)</option>
            <option value="2026-03-01">March 2026 (2026-03-01)</option>
            <option value="2026-04-01">April 2026 (2026-04-01)</option>
            <option value="2026-05-01">May 2026 (2026-05-01)</option>
            <option value="2026-06-01">June 2026 (2026-06-01)</option>
            <option value="2026-07-01">July 2026 (2026-07-01)</option>
            <option value="2026-08-01">August 2026 (2026-08-01)</option>
            <option value="2026-09-01">September 2026 (2026-09-01)</option>
            <option value="2026-10-01">October 2026 (2026-10-01)</option>
            <option value="2026-11-01">November 2026 (2026-11-01)</option>
            <option value="2026-12-01">December 2026 (2026-12-01)</option>
          </select>
          ${isCEO ? `
            <button id="btnLockClosePeriod" class="btn-brand-terracotta" style="font-size: 12px;">
              🔒 Lock &amp; Close Period
            </button>
          ` : `<span class="ops-badge badge-pending">CEO Authority Required</span>`}
        </div>
      </div>
      <div class="ops-table-container" style="margin-bottom: 32px;">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Period Month</th>
              <th>Status</th>
              <th>Closed By</th>
              <th>Closed Date</th>
              <th style="text-align: center;">Invoices (Close &rarr; Now)</th>
              <th style="text-align: center;">Payments (Close &rarr; Now)</th>
              <th style="text-align: center;">Expenses (Close &rarr; Now)</th>
              <th style="text-align: center;">Assignments (Close &rarr; Now)</th>
              <th>Tamper-Evident Integrity</th>
            </tr>
          </thead>
          <tbody>
            ${periodCloseRowsHtml || '<tr><td colspan="9" style="text-align: center; color: #64748b;">No accounting periods closed yet.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- 4. Segregation of Duties & Role Authority Matrix -->
      <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0 0 12px 0;">
        4. Governance Segregation of Duties Matrix
      </h2>
      <div class="ops-table-container" style="margin-bottom: 32px;">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Control Domain / Action</th>
              <th>Founder / CEO</th>
              <th>Operations Coordinator</th>
              <th>Finance Officer</th>
              <th>Field Supervisor</th>
              <th>Internal Auditor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight: 700;">Customer Onboarding, Enquiries &amp; Quotations</td>
              <td><span class="ops-badge badge-ok">Full Authority</span></td>
              <td><span class="ops-badge badge-ok">Create &amp; Manage</span></td>
              <td><span class="ops-badge badge-pending">View Only</span></td>
              <td><span class="ops-badge badge-pending">View Only</span></td>
              <td><span class="ops-badge badge-reconciled">Audit Read-Only</span></td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Service Jobs, Artisan Dispatch &amp; Property Watch</td>
              <td><span class="ops-badge badge-ok">Full Authority</span></td>
              <td><span class="ops-badge badge-ok">Schedule &amp; Dispatch</span></td>
              <td><span class="ops-badge badge-pending">View Costing</span></td>
              <td><span class="ops-badge badge-ok">Inspect &amp; Log Reports</span></td>
              <td><span class="ops-badge badge-reconciled">Audit Read-Only</span></td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Tax Invoicing, Cash Receipts &amp; MoMo Reconciliation</td>
              <td><span class="ops-badge badge-ok">Full Authority</span></td>
              <td><span class="ops-badge badge-pending">View Balances</span></td>
              <td><span class="ops-badge badge-ok">Issue &amp; Reconcile</span></td>
              <td><span class="ops-badge badge-attention">Restricted</span></td>
              <td><span class="ops-badge badge-reconciled">Audit Read-Only</span></td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Expense Recording (&le; ${currency}${state.settings.spendingApprovalThreshold})</td>
              <td><span class="ops-badge badge-ok">Record &amp; Auto-Approve</span></td>
              <td><span class="ops-badge badge-ok">Record Direct Job Cost</span></td>
              <td><span class="ops-badge badge-ok">Record &amp; Classify</span></td>
              <td><span class="ops-badge badge-attention">Restricted</span></td>
              <td><span class="ops-badge badge-reconciled">Audit Read-Only</span></td>
            </tr>
            <tr>
              <td style="font-weight: 700;">High-Value Expense Approval (&gt; ${currency}${state.settings.spendingApprovalThreshold})</td>
              <td><span class="ops-badge badge-ok">Exclusive Sign-Off</span></td>
              <td><span class="ops-badge badge-attention">Queues as Pending</span></td>
              <td><span class="ops-badge badge-attention">Queues as Pending</span></td>
              <td><span class="ops-badge badge-attention">Restricted</span></td>
              <td><span class="ops-badge badge-reconciled">Verify Compliance</span></td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Month-End Period Close &amp; User Governance</td>
              <td><span class="ops-badge badge-ok">Exclusive Authority</span></td>
              <td><span class="ops-badge badge-attention">Restricted</span></td>
              <td><span class="ops-badge badge-attention">Restricted</span></td>
              <td><span class="ops-badge badge-attention">Restricted</span></td>
              <td><span class="ops-badge badge-reconciled">Verify Tamper Flags</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 5. Immutable System Audit Trail -->
      <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0 0 12px 0;">
        5. Immutable System Audit Log Register (Latest 30 Events)
      </h2>
      <div class="ops-table-container">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Timestamp (UTC)</th>
              <th>Authenticated Actor &amp; Role</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Record ID</th>
              <th>Audit Details</th>
            </tr>
          </thead>
          <tbody>
            ${auditRowsHtml || '<tr><td colspan="6" style="text-align: center; color: #64748b;">No audit events recorded yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  // ==========================================
  // TAB 1: EXECUTIVE DASHBOARD
  // ==========================================
  private renderDashboardTab(
    state: OpsDatabaseState,
    mgmt: ReturnType<typeof opsStore.getManagementAccounts>,
    evaluation: ReturnType<typeof opsStore.getChecksEvaluation>,
    currency: string
  ): string {
    const totalRev = mgmt.yearTotal.totalRevenue;
    const cashRec = mgmt.yearTotal.cashReceivedCustomers;
    const receivables = mgmt.yearTotal.receivables;
    const opex = mgmt.yearTotal.totalOpex;
    const grossContr = mgmt.yearTotal.grossContribution;
    const opProfit = mgmt.yearTotal.operatingProfit;
    const cashBal = mgmt.yearTotal.closingCash;
    const workingCap = mgmt.yearTotal.workingCapital;

    const activeCust = state.customers.filter(c => c.status === 'Active').length;
    const newCust = state.customers.length;
    const enqCount = state.enquiries.length;
    const openQuoteVal = roundMoney(
      state.quotes.filter(q => q.status === 'Sent').reduce((s, q) => s + (q.netOfDiscount || 0), 0)
    );

    const jobsBooked = state.jobs.length;
    const jobsCompleted = state.jobs.filter(j => ['Accepted by customer', 'Invoiced', 'Paid', 'Closed'].includes(j.status)).length;
    const jobsOverdue = state.jobs.filter(j => j.overdueFlag === 'Overdue').length;
    const contractorDays = state.assignments.reduce((s, a) => s + (a.personDays || 0), 0);

    const alertRowsHtml = evaluation.alerts.map(a => `
      <tr>
        <td style="font-weight: 700; color: #1e293b;">${a.alert}</td>
        <td>
          <span class="ops-badge ${a.status === 'OK' ? 'badge-ok' : 'badge-attention'}">
            ${a.status}
          </span>
        </td>
        <td style="color: #334155; font-size: 12px;">${a.evidence}</td>
        <td style="color: #64748b; font-size: 12px;">${a.whyItMatters}</td>
        <td style="font-weight: 600; color: #075545; font-size: 12px;">${a.nextAction}</td>
      </tr>
    `).join('');

    return `
      <!-- Top Row: Money Overview -->
      <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0 0 14px 0; letter-spacing: 0.5px;">
        1. Financial &amp; Cash Flow Overview
      </h2>
      <div class="ops-kpi-grid">
        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 6px 0;">Revenue Invoiced</p>
          <h3 style="font-size: 24px; font-weight: 800; color: #075545; margin: 0;">${currency}${totalRev.toFixed(2)}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Before tax, net of credit notes</p>
        </div>

        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 6px 0;">Cash Received</p>
          <h3 style="font-size: 24px; font-weight: 800; color: #15803d; margin: 0;">${currency}${cashRec.toFixed(2)}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Payments register only</p>
        </div>

        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 6px 0;">Outstanding Receivables</p>
          <h3 style="font-size: 24px; font-weight: 800; color: ${receivables > 0 ? '#b91c1c' : '#1e293b'}; margin: 0;">${currency}${receivables.toFixed(2)}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Unpaid invoice balances</p>
        </div>

        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 6px 0;">Operating Expenses</p>
          <h3 style="font-size: 24px; font-weight: 800; color: #1e293b; margin: 0;">${currency}${opex.toFixed(2)}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Overhead running costs</p>
        </div>
      </div>

      <!-- Second Row: Margin & Balance Sheet -->
      <div class="ops-kpi-grid">
        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 6px 0;">Gross Contribution</p>
          <h3 style="font-size: 22px; font-weight: 800; color: #075545; margin: 0;">${currency}${grossContr.toFixed(2)}</h3>
          <p style="font-size: 11px; color: #15803d; margin: 4px 0 0 0; font-weight: 600;">Margin: ${mgmt.yearTotal.contributionMargin ? Math.round(mgmt.yearTotal.contributionMargin * 100) : 0}% (Min: 35%)</p>
        </div>

        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 6px 0;">Operating Profit / (Loss)</p>
          <h3 style="font-size: 22px; font-weight: 800; color: ${opProfit >= 0 ? '#15803d' : '#b91c1c'}; margin: 0;">${currency}${opProfit.toFixed(2)}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">After depreciation, before tax</p>
        </div>

        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 6px 0;">Available Cash Balance</p>
          <h3 style="font-size: 22px; font-weight: 800; color: #075545; margin: 0;">${currency}${cashBal.toFixed(2)}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Reserve threshold: ${currency}${state.settings.minimumCashReserve}</p>
        </div>

        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 6px 0;">Working Capital</p>
          <h3 style="font-size: 22px; font-weight: 800; color: #075545; margin: 0;">${currency}${workingCap.toFixed(2)}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Cash + Receivables &minus; Payables</p>
        </div>
      </div>

      <!-- Third Row: Activity & Service Delivery -->
      <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 24px 0 14px 0; letter-spacing: 0.5px;">
        2. Sales &amp; Operations Activity
      </h2>
      <div class="ops-kpi-grid">
        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 6px 0;">Active Customers</p>
          <h3 style="font-size: 22px; font-weight: 800; color: #1e293b; margin: 0;">${activeCust}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Total registered: ${newCust}</p>
        </div>

        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 6px 0;">Enquiries Received</p>
          <h3 style="font-size: 22px; font-weight: 800; color: #1e293b; margin: 0;">${enqCount}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Pipeline opportunities</p>
        </div>

        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 6px 0;">Open Quotations Value</p>
          <h3 style="font-size: 22px; font-weight: 800; color: #E4693F; margin: 0;">${currency}${openQuoteVal.toFixed(2)}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Status: Sent; awaiting decision</p>
        </div>

        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 6px 0;">Jobs (Done / Overdue)</p>
          <h3 style="font-size: 22px; font-weight: 800; color: #1e293b; margin: 0;">${jobsCompleted} / <span style="color: ${jobsOverdue > 0 ? '#b91c1c' : '#15803d'}">${jobsOverdue}</span></h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Contractor Person-Days: ${contractorDays}</p>
        </div>
      </div>

      <!-- Action Panel: What Management Should Pay Attention To -->
      <div style="margin-top: 32px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0; letter-spacing: 0.5px;">
              What Management Should Pay Attention To
            </h2>
            <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">
              Executive decision-making panel. Rule-based exceptions with exact evidence and next actions.
            </p>
          </div>
          <span class="ops-badge ${evaluation.itemsNeedingAttention > 0 ? 'badge-attention' : 'badge-ok'}" style="font-size: 12px; padding: 6px 12px;">
            ${evaluation.itemsNeedingAttention} Attention Item(s)
          </span>
        </div>

        <div class="ops-table-container">
          <table class="ops-table">
            <thead>
              <tr>
                <th style="width: 20%;">Alert Category</th>
                <th style="width: 10%;">Status</th>
                <th style="width: 25%;">What Happened &amp; Evidence</th>
                <th style="width: 25%;">Why It Matters</th>
                <th style="width: 20%;">Practical Next Action</th>
              </tr>
            </thead>
            <tbody>
              ${alertRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ==========================================
  // TAB 2: FINANCIAL PERFORMANCE & P&L
  // ==========================================
  private renderFinancialTab(
    state: OpsDatabaseState,
    mgmt: ReturnType<typeof opsStore.getManagementAccounts>,
    currency: string
  ): string {
    const monthHeaders = mgmt.months.map(m => `<th style="text-align: right;">${m.monthLabel}</th>`).join('');

    const renderMetricRow = (label: string, getter: (m: typeof mgmt.months[0]) => number, isBold = false, isAccent = false) => {
      const cells = mgmt.months.map(m => `<td style="text-align: right; ${isBold ? 'font-weight: 700;' : ''}">${currency}${roundMoney(getter(m)).toFixed(2)}</td>`).join('');
      const total = mgmt.months.reduce((s, m) => s + getter(m), 0);
      return `
        <tr style="${isAccent ? 'background: #FAF8F4;' : ''}">
          <td style="${isBold ? 'font-weight: 700; color: #075545;' : 'color: #334155;'}">${label}</td>
          ${cells}
          <td style="text-align: right; font-weight: 800; color: #075545;">${currency}${roundMoney(total).toFixed(2)}</td>
        </tr>
      `;
    };

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>
          <h2 style="font-size: 18px; font-weight: 800; color: #075545; margin: 0;">12-Month Management Accounts</h2>
          <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">
            Reporting Year ${state.settings.reportingYear}. Built from verified transaction registers.
          </p>
        </div>
      </div>

      <div class="ops-table-container" style="margin-bottom: 24px;">
        <table class="ops-table">
          <thead>
            <tr>
              <th style="text-align: left; min-width: 240px;">Item (${currency})</th>
              ${monthHeaders}
              <th style="text-align: right; min-width: 100px;">Year Total</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: #f1f5f9;"><td colspan="14" style="font-weight: 800; color: #075545;">REVENUE (Invoiced, before tax, net of credit notes)</td></tr>
            ${renderMetricRow('Civitas Fix', m => m.revCivitasFix)}
            ${renderMetricRow('Civitas Care', m => m.revCivitasCare)}
            ${renderMetricRow('Civitas Property Watch', m => m.revCivitasWatch)}
            ${renderMetricRow('Total Revenue', m => m.totalRevenue, true, true)}

            <tr style="background: #f1f5f9;"><td colspan="14" style="font-weight: 800; color: #075545;">DIRECT COSTS</td></tr>
            ${renderMetricRow('Field labour (paid assignments)', m => m.directLabour)}
            ${renderMetricRow('Direct materials', m => m.directMaterials)}
            ${renderMetricRow('Direct transport', m => m.directTransport)}
            ${renderMetricRow('Total Direct Costs', m => m.totalDirectCosts, true, true)}

            <tr style="background: #e2e8f0;">
              <td style="font-weight: 800; color: #075545;">GROSS CONTRIBUTION</td>
              ${mgmt.months.map(m => `<td style="text-align: right; font-weight: 800; color: #075545;">${currency}${m.grossContribution.toFixed(2)}</td>`).join('')}
              <td style="text-align: right; font-weight: 800; color: #075545;">${currency}${mgmt.yearTotal.grossContribution.toFixed(2)}</td>
            </tr>

            <tr style="background: #f1f5f9;"><td colspan="14" style="font-weight: 800; color: #075545;">OPERATING EXPENSES (Opex)</td></tr>
            ${renderMetricRow('Marketing & Acquisition', m => m.opexMarketing)}
            ${renderMetricRow('Workforce Training & Safety', m => m.opexTraining)}
            ${renderMetricRow('Regulatory Compliance', m => m.opexCompliance)}
            ${renderMetricRow('Digital Operations', m => m.opexDigital)}
            ${renderMetricRow('Branding & Materials', m => m.opexBranding)}
            ${renderMetricRow('Administration & Communication', m => m.opexAdmin)}
            ${renderMetricRow('Insurance', m => m.opexInsurance)}
            ${renderMetricRow('Professional Fees', m => m.opexProfessionalFees)}
            ${renderMetricRow('Salaries & Employer Pension', m => m.opexSalaries)}
            ${renderMetricRow('Other Operating Expenses', m => m.opexOther)}
            ${renderMetricRow('Total Operating Expenses', m => m.totalOpex, true, true)}

            <tr style="background: #FAF8F4;">
              <td style="font-weight: 700; color: #1e293b;">EBITDA</td>
              ${mgmt.months.map(m => `<td style="text-align: right; font-weight: 700;">${currency}${m.ebitda.toFixed(2)}</td>`).join('')}
              <td style="text-align: right; font-weight: 800; color: #075545;">${currency}${mgmt.yearTotal.ebitda.toFixed(2)}</td>
            </tr>
            ${renderMetricRow('Straight-line Depreciation', m => m.depreciation)}
            <tr style="background: #e2e8f0;">
              <td style="font-weight: 800; color: #1e293b;">OPERATING PROFIT / (LOSS)</td>
              ${mgmt.months.map(m => `<td style="text-align: right; font-weight: 800; color: ${m.operatingProfit >= 0 ? '#15803d' : '#b91c1c'};">${currency}${m.operatingProfit.toFixed(2)}</td>`).join('')}
              <td style="text-align: right; font-weight: 800; color: ${mgmt.yearTotal.operatingProfit >= 0 ? '#15803d' : '#b91c1c'};">${currency}${mgmt.yearTotal.operatingProfit.toFixed(2)}</td>
            </tr>

            <tr style="background: #f1f5f9;"><td colspan="14" style="font-weight: 800; color: #075545;">CASH FLOW (By payment date)</td></tr>
            <tr style="background: #ffffff;">
              <td style="color: #64748b;">Opening Cash Balance</td>
              ${mgmt.months.map(m => `<td style="text-align: right; color: #64748b;">${currency}${m.openingCash.toFixed(2)}</td>`).join('')}
              <td style="text-align: right; color: #64748b;">-</td>
            </tr>
            ${renderMetricRow('Cash Received from Customers', m => m.cashReceivedCustomers)}
            ${renderMetricRow('Cash Paid: Expenses (Opex & Direct)', m => m.cashPaidOpexDirect)}
            ${renderMetricRow('Cash Paid: Capex Equipment', m => m.cashPaidCapex)}
            ${renderMetricRow('Cash Paid: Field Professionals', m => m.cashPaidLabour)}
            ${renderMetricRow('Funding Received (Capital, not Revenue)', m => m.fundingReceived)}
            <tr style="background: #FAF8F4;">
              <td style="font-weight: 700;">Net Cash Movement</td>
              ${mgmt.months.map(m => `<td style="text-align: right; font-weight: 700; color: ${m.netCashMovement >= 0 ? '#15803d' : '#b91c1c'};">${currency}${m.netCashMovement.toFixed(2)}</td>`).join('')}
              <td style="text-align: right; font-weight: 800; color: #075545;">${currency}${mgmt.yearTotal.netCashMovement.toFixed(2)}</td>
            </tr>
            <tr style="background: #e2e8f0;">
              <td style="font-weight: 800; color: #075545;">CLOSING CASH BALANCE</td>
              ${mgmt.months.map(m => `<td style="text-align: right; font-weight: 800; color: #075545;">${currency}${m.closingCash.toFixed(2)}</td>`).join('')}
              <td style="text-align: right; font-weight: 800; color: #075545;">${currency}${mgmt.yearTotal.closingCash.toFixed(2)}</td>
            </tr>

            <tr style="background: #f1f5f9;"><td colspan="14" style="font-weight: 800; color: #075545;">BALANCE SHEET ITEMS (End of month)</td></tr>
            <tr style="background: #ffffff;">
              <td style="color: #64748b;">Receivables (Unpaid Invoices)</td>
              ${mgmt.months.map(m => `<td style="text-align: right;">${currency}${m.receivables.toFixed(2)}</td>`).join('')}
              <td style="text-align: right; font-weight: 700;">${currency}${mgmt.yearTotal.receivables.toFixed(2)}</td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="color: #64748b;">Payables (Unpaid Costs &amp; Labour)</td>
              ${mgmt.months.map(m => `<td style="text-align: right;">${currency}${m.payables.toFixed(2)}</td>`).join('')}
              <td style="text-align: right; font-weight: 700;">${currency}${mgmt.yearTotal.payables.toFixed(2)}</td>
            </tr>
            <tr style="background: #FAF8F4;">
              <td style="font-weight: 800; color: #075545;">WORKING CAPITAL</td>
              ${mgmt.months.map(m => `<td style="text-align: right; font-weight: 800; color: #075545;">${currency}${m.workingCapital.toFixed(2)}</td>`).join('')}
              <td style="text-align: right; font-weight: 800; color: #075545;">${currency}${mgmt.yearTotal.workingCapital.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // ==========================================
  // TAB 3: RECEIVABLES & INVOICES
  // ==========================================
  private renderReceivablesTab(state: OpsDatabaseState, currency: string): string {
    const invoices = state.invoices;
    const payments = state.payments;

    // Ageing summary
    const current = invoices.filter(i => i.ageingBucket === 'Current').reduce((s, i) => s + (i.balance || 0), 0);
    const b30 = invoices.filter(i => i.ageingBucket === '1-30 days').reduce((s, i) => s + (i.balance || 0), 0);
    const b60 = invoices.filter(i => i.ageingBucket === '31-60 days').reduce((s, i) => s + (i.balance || 0), 0);
    const b90 = invoices.filter(i => i.ageingBucket === '61-90 days').reduce((s, i) => s + (i.balance || 0), 0);
    const over90 = invoices.filter(i => i.ageingBucket === 'Over 90 days').reduce((s, i) => s + (i.balance || 0), 0);
    const totalRec = current + b30 + b60 + b90 + over90;

    const invoiceRowsHtml = invoices.map(i => `
      <tr>
        <td style="font-weight: 700; color: #075545;">${i.invoiceNo}</td>
        <td>${i.customerName}</td>
        <td>${i.invoiceDate}</td>
        <td>${i.dueDate}</td>
        <td style="text-align: right;">${currency}${roundMoney(i.amountBeforeTax).toFixed(2)}</td>
        <td style="text-align: right; color: #15803d;">${currency}${roundMoney(i.paymentsReceived || 0).toFixed(2)}</td>
        <td style="text-align: right; font-weight: 700; color: ${(i.balance || 0) > 0 ? '#b91c1c' : '#15803d'};">
          ${currency}${roundMoney(i.balance || 0).toFixed(2)}
        </td>
        <td>
          <span class="ops-badge ${(i.balance || 0) <= 0.005 ? 'badge-ok' : 'badge-attention'}">
            ${i.status}
          </span>
        </td>
        <td>${i.ageingBucket}</td>
        <td style="white-space: nowrap;">
          <button class="btn-brand-outline btn-print-inv" data-id="${i.invoiceNo}" style="padding: 3px 8px; font-size: 11px;">
            Print / PDF
          </button>
          <button class="btn-brand-outline btn-whatsapp-inv" data-id="${i.invoiceNo}" style="padding: 3px 8px; font-size: 11px; color: #16a34a; border-color: rgba(22, 163, 74, 0.4); margin-left: 4px;" title="Send invoice to client via WhatsApp">
            WhatsApp
          </button>
        </td>
      </tr>
    `).join('');

    const paymentRowsHtml = payments.map(p => `
      <tr>
        <td style="font-weight: 700;">${p.paymentId}</td>
        <td>${p.paymentDate}</td>
        <td style="font-weight: 600; color: #075545;">${p.invoiceNo}</td>
        <td>${p.customerName || 'N/A'}</td>
        <td style="text-align: right; font-weight: 700; color: #15803d;">${currency}${roundMoney(p.amount).toFixed(2)}</td>
        <td>${p.method}</td>
        <td style="font-family: monospace;">${p.reference || 'N/A'}</td>
        <td style="white-space: nowrap;">
          <span class="ops-badge ${p.reconciliationStatus === 'Reconciled' ? 'badge-ok' : 'badge-pending'}">
            ${p.reconciliationStatus}
          </span>
          <button class="btn-brand-outline btn-toggle-pay-recon" data-id="${p.paymentId}" style="padding: 2px 6px; font-size: 10px; margin-left: 4px;" title="Toggle reconciliation status">
            ${p.reconciliationStatus === 'Reconciled' ? 'Mark Unreconciled' : 'Reconcile'}
          </button>
        </td>
      </tr>
    `).join('');

    return `
      <!-- Ageing Cards -->
      <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0 0 14px 0;">
        Receivables Ageing Breakdown
      </h2>
      <div class="ops-kpi-grid">
        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 4px 0;">Current (Not Due)</p>
          <h3 style="font-size: 20px; font-weight: 800; color: #075545; margin: 0;">${currency}${current.toFixed(2)}</h3>
        </div>
        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 4px 0;">1 - 30 Days Overdue</p>
          <h3 style="font-size: 20px; font-weight: 800; color: #d97706; margin: 0;">${currency}${b30.toFixed(2)}</h3>
        </div>
        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 4px 0;">31 - 60 Days Overdue</p>
          <h3 style="font-size: 20px; font-weight: 800; color: #b91c1c; margin: 0;">${currency}${b60.toFixed(2)}</h3>
        </div>
        <div class="ops-card">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 4px 0;">61 - 90+ Days Overdue</p>
          <h3 style="font-size: 20px; font-weight: 800; color: #7f1d1d; margin: 0;">${currency}${(b90 + over90).toFixed(2)}</h3>
        </div>
      </div>

      <!-- Invoices Register -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin: 24px 0 12px 0;">
        <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0;">
          Invoices &amp; Receivables Register
        </h2>
        <button id="btnNewInvoice" class="btn-brand-primary">+ Create Invoice</button>
      </div>
      <div class="ops-table-container" style="margin-bottom: 32px;">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Due Date</th>
              <th style="text-align: right;">Amount</th>
              <th style="text-align: right;">Paid</th>
              <th style="text-align: right;">Balance</th>
              <th>Status</th>
              <th>Ageing</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceRowsHtml || '<tr><td colspan="10" style="text-align: center; color: #64748b;">No invoices issued yet.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Payments Register -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin: 24px 0 12px 0;">
        <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0;">
          Payments &amp; Cash Received Register (Cash &ne; Revenue)
        </h2>
        <button id="btnNewPayment" class="btn-brand-primary">+ Record Payment</button>
      </div>
      <div class="ops-table-container">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Date</th>
              <th>Invoice No</th>
              <th>Customer</th>
              <th style="text-align: right;">Amount</th>
              <th>Method</th>
              <th>Reference</th>
              <th>Recon Status</th>
            </tr>
          </thead>
          <tbody>
            ${paymentRowsHtml || '<tr><td colspan="8" style="text-align: center; color: #64748b;">No cash receipts recorded yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  // ==========================================
  // TAB 4: SALES PIPELINE & CUSTOMERS
  // ==========================================
  private renderSalesTab(state: OpsDatabaseState, currency: string): string {
    const custRowsHtml = state.customers.map(c => `
      <tr>
        <td style="font-weight: 700; color: #075545;">${c.customerId}</td>
        <td style="font-weight: 600;">${c.customerName}</td>
        <td>${c.category}</td>
        <td>${c.phone}</td>
        <td>${c.area}</td>
        <td>${c.leadSource}</td>
        <td style="text-align: right; font-weight: 600;">${currency}${roundMoney(c.totalBilled || 0).toFixed(2)}</td>
        <td style="text-align: right; color: ${(c.outstanding || 0) > 0 ? '#b91c1c' : '#15803d'}; font-weight: 700;">
          ${currency}${roundMoney(c.outstanding || 0).toFixed(2)}
        </td>
        <td>
          <span class="ops-badge ${c.status === 'Active' ? 'badge-ok' : c.status === 'Closed' ? 'badge-attention' : 'badge-pending'}">
            ${c.status}
          </span>
        </td>
      </tr>
    `).join('');

    const enqRowsHtml = state.enquiries.map(e => `
      <tr>
        <td style="font-weight: 700;">${e.enquiryId}</td>
        <td>${e.enquiryDate}</td>
        <td style="font-weight: 600;">${e.contactName}</td>
        <td>${e.phone}</td>
        <td>${e.area}</td>
        <td>${e.leadSource}</td>
        <td>${e.serviceInterest || 'N/A'}</td>
        <td><span class="ops-badge ${e.stage === 'Accepted' ? 'badge-ok' : e.stage === 'Declined' ? 'badge-attention' : 'badge-pending'}">${e.stage}</span></td>
        <td>${e.quoteId || '-'}</td>
      </tr>
    `).join('');

    const quoteRowsHtml = state.quotes.map(q => `
      <tr>
        <td style="font-weight: 700; color: #075545;">${q.quoteId}</td>
        <td>${q.quoteDate}</td>
        <td style="font-weight: 600;">${q.customerName}</td>
        <td style="text-align: right;">${currency}${roundMoney(q.subtotal || 0).toFixed(2)}</td>
        <td style="text-align: right; color: #15803d;">${currency}${roundMoney(q.discountAmount || 0).toFixed(2)}</td>
        <td style="text-align: right; font-weight: 700; color: #075545;">${currency}${roundMoney(q.netOfDiscount || 0).toFixed(2)}</td>
        <td style="text-align: center; font-weight: 600;">${q.marginPct ? Math.round(q.marginPct * 100) : 0}%</td>
        <td><span class="ops-badge ${q.status === 'Accepted' ? 'badge-ok' : q.status === 'Declined' ? 'badge-attention' : 'badge-pending'}">${q.status}</span></td>
        <td style="white-space: nowrap;">
          <button class="btn-brand-outline btn-print-quote" data-id="${q.quoteId}" style="padding: 3px 8px; font-size: 11px;">
            Print / PDF
          </button>
          <button class="btn-brand-outline btn-whatsapp-quote" data-id="${q.quoteId}" style="padding: 3px 8px; font-size: 11px; color: #16a34a; border-color: rgba(22, 163, 74, 0.4); margin-left: 4px;" title="Send quotation to client via WhatsApp">
            WhatsApp
          </button>
        </td>
      </tr>
    `).join('');

    return `
      <!-- Customers Section -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0;">
          Customer Register (One row per client)
        </h2>
        <button id="btnNewCustomer" class="btn-brand-primary">+ Add New Customer</button>
      </div>
      <div class="ops-table-container" style="margin-bottom: 32px;">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Customer Name</th>
              <th>Category</th>
              <th>Phone</th>
              <th>Area</th>
              <th>Lead Source</th>
              <th style="text-align: right;">Total Billed</th>
              <th style="text-align: right;">Outstanding</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${custRowsHtml || '<tr><td colspan="9" style="text-align: center; color: #64748b;">No customers registered yet.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Enquiries Section -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0;">
          Sales Pipeline: Enquiries
        </h2>
        <button id="btnNewEnquiry" class="btn-brand-primary">+ Log Enquiry</button>
      </div>
      <div class="ops-table-container" style="margin-bottom: 32px;">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Enquiry ID</th>
              <th>Date</th>
              <th>Contact Name</th>
              <th>Phone</th>
              <th>Area</th>
              <th>Source</th>
              <th>Interest</th>
              <th>Stage</th>
              <th>Quote</th>
            </tr>
          </thead>
          <tbody>
            ${enqRowsHtml || '<tr><td colspan="9" style="text-align: center; color: #64748b;">No enquiries logged yet.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Quotations Section -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0;">
          Quotations Register
        </h2>
        <button id="btnNewQuote" class="btn-brand-primary">+ Create Quotation</button>
      </div>
      <div class="ops-table-container">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Quote ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th style="text-align: right;">Subtotal</th>
              <th style="text-align: right;">Discount</th>
              <th style="text-align: right;">Total Net</th>
              <th style="text-align: center;">Margin %</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${quoteRowsHtml || '<tr><td colspan="9" style="text-align: center; color: #64748b;">No quotations created yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  // ==========================================
  // TAB 5: SERVICE OPERATIONS & JOBS
  // ==========================================
  private renderOperationsTab(state: OpsDatabaseState, currency: string): string {
    const jobRowsHtml = state.jobs.map(j => `
      <tr>
        <td style="font-weight: 700; color: #075545;">${j.jobId}</td>
        <td>${j.customerName}</td>
        <td style="font-size: 12px;">${j.description || 'Job service'}</td>
        <td>${j.scheduledDate || 'TBD'}</td>
        <td>${j.effectiveDueDate || 'TBD'}</td>
        <td><span class="ops-badge ${['Accepted by customer', 'Closed', 'Paid'].includes(j.status) ? 'badge-ok' : j.status === 'Cancelled' ? 'badge-attention' : 'badge-pending'}">${j.status}</span></td>
        <td style="text-align: right;">${currency}${roundMoney(j.quotedAmount || 0).toFixed(2)}</td>
        <td style="text-align: right; color: #64748b;">${currency}${roundMoney(j.actualDirectCost || 0).toFixed(2)}</td>
        <td style="text-align: right; font-weight: 700; color: (j.jobContribution || 0) >= 0 ? '#15803d' : '#b91c1c';">
          ${j.jobContribution != null ? `${currency}${roundMoney(j.jobContribution).toFixed(2)}` : '-'}
        </td>
        <td>${j.overdueFlag ? `<span class="ops-badge badge-attention">Overdue</span>` : ''}</td>
      </tr>
    `).join('');

    const serviceRowsHtml = state.services.map(s => `
      <tr>
        <td style="font-weight: 700;">${s.serviceId}</td>
        <td>${s.division}</td>
        <td style="font-weight: 600;">${s.service}</td>
        <td>${s.unit}</td>
        <td style="text-align: right; font-weight: 700; color: #075545;">${currency}${s.standardPrice.toFixed(2)}</td>
        <td style="text-align: right; color: #64748b;">${currency}${s.standardDirectCost.toFixed(2)}</td>
        <td style="text-align: right; font-weight: 600; color: #15803d;">${currency}${roundMoney(s.standardPrice - s.standardDirectCost).toFixed(2)}</td>
        <td style="text-align: center;">${Math.round(((s.standardPrice - s.standardDirectCost) / s.standardPrice) * 100)}%</td>
      </tr>
    `).join('');

    const inspectionRowsHtml = (state.inspections || []).map(ins => {
      const prop = state.properties.find(p => p.propertyId === ins.propertyId);
      return `
      <tr>
        <td style="font-weight: 700; color: #075545;">${ins.inspectionId}</td>
        <td>${ins.inspectionDate}</td>
        <td style="font-weight: 600;">${ins.customerName || ins.propertyId}</td>
        <td>${prop?.area || 'Accra/Tema'}</td>
        <td>${ins.inspectionType}</td>
        <td>${ins.inspector || 'Staff'}</td>
        <td>
          <span class="ops-badge ${ins.conditionRating === 'Good' ? 'badge-ok' : ins.conditionRating === 'Fair' ? 'badge-pending' : 'badge-attention'}">
            ${ins.conditionRating || 'Not graded'}
          </span>
        </td>
        <td style="font-size: 11px; color: #64748b; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${ins.observations || 'Routine walk-through'}
        </td>
        <td style="white-space: nowrap;">
          <button class="btn-brand-outline btn-print-inspection-item" data-id="${ins.inspectionId}" style="padding: 3px 8px; font-size: 11px;">
            Print / PDF
          </button>
          <button class="btn-brand-outline btn-whatsapp-inspection" data-id="${ins.inspectionId}" style="padding: 3px 8px; font-size: 11px; color: #16a34a; border-color: rgba(22, 163, 74, 0.4); margin-left: 4px;" title="Send condition summary to owner via WhatsApp">
            WhatsApp
          </button>
        </td>
      </tr>
    `;
    }).join('');

    return `
      <!-- Jobs Section -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0;">
          Jobs &amp; Service Management
        </h2>
        <button id="btnNewJob" class="btn-brand-primary">+ Book Job</button>
      </div>
      <div class="ops-table-container" style="margin-bottom: 32px;">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Customer</th>
              <th>Description</th>
              <th>Scheduled</th>
              <th>Due Date</th>
              <th>Status</th>
              <th style="text-align: right;">Quoted</th>
              <th style="text-align: right;">Actual Cost</th>
              <th style="text-align: right;">Contribution</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            ${jobRowsHtml || '<tr><td colspan="10" style="text-align: center; color: #64748b;">No jobs booked yet.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Civitas Property Watch: Inspections Section -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0;">
            Civitas Property Watch (Inspections Register)
          </h2>
          <p style="font-size: 11px; color: var(--text-muted); margin: 2px 0 0 0;">
            Periodic walkthroughs, condition scoring, and photo records for diaspora owners and landlords.
          </p>
        </div>
        <button id="btnNewInspection" class="btn-brand-primary">+ Log Inspection</button>
      </div>
      <div class="ops-table-container" style="margin-bottom: 32px;">
        <table class="ops-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Client / Property</th>
              <th>Area</th>
              <th>Type</th>
              <th>Inspector</th>
              <th>Condition</th>
              <th>Observations</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${inspectionRowsHtml || '<tr><td colspan="9" style="text-align: center; color: #64748b;">No property inspections logged yet.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Service Catalogue -->
      <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0 0 12px 0;">
        Service Price Catalogue (S01 – S16 Reference)
      </h2>
      <div class="ops-table-container">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Service ID</th>
              <th>Division</th>
              <th>Service Name</th>
              <th>Unit</th>
              <th style="text-align: right;">Standard Price</th>
              <th style="text-align: right;">Standard Direct Cost</th>
              <th style="text-align: right;">Contribution</th>
              <th style="text-align: center;">Margin %</th>
            </tr>
          </thead>
          <tbody>
            ${serviceRowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  // ==========================================
  // TAB 6: CONTRACTORS & FIELD WORKFORCE
  // ==========================================
  private renderContractorsTab(state: OpsDatabaseState, currency: string): string {
    const contractorRowsHtml = state.contractors.map(c => `
      <tr>
        <td style="font-weight: 700; color: #075545;">${c.contractorId}</td>
        <td style="font-weight: 600;">${c.contractorName}</td>
        <td>${c.workerType}</td>
        <td>${c.trade}</td>
        <td>${c.phone}</td>
        <td>
          <span class="ops-badge ${c.vettingStatus === 'Verified' ? 'badge-ok' : 'badge-attention'}">
            ${c.vettingStatus}
          </span>
        </td>
        <td>${c.trainingStatus}</td>
        <td style="text-align: right;">${currency}${c.agreedRate || 0} (${c.rateBasis || 'Per day'})</td>
        <td><span class="ops-badge ${c.eligibility === 'Eligible' ? 'badge-ok' : 'badge-attention'}">${c.eligibility}</span></td>
      </tr>
    `).join('');

    const assignmentRowsHtml = state.assignments.map(a => `
      <tr>
        <td style="font-weight: 700;">${a.assignmentId}</td>
        <td style="font-weight: 600; color: #075545;">${a.jobId}</td>
        <td>${a.contractorName}</td>
        <td>${a.assignmentDate}</td>
        <td>${a.trade || 'N/A'}</td>
        <td style="text-align: center;">${a.quantity}</td>
        <td style="text-align: right;">${currency}${a.rate.toFixed(2)}</td>
        <td style="text-align: right; font-weight: 700;">${currency}${roundMoney(a.amount || 0).toFixed(2)}</td>
        <td style="text-align: center; font-weight: 600;">${a.personDays || 0}</td>
        <td style="white-space: nowrap;">
          <span class="ops-badge ${a.paymentStatus === 'Paid' ? 'badge-ok' : 'badge-attention'}">${a.paymentStatus}</span>
          <button class="btn-brand-outline btn-whatsapp-assign" data-id="${a.assignmentId}" style="padding: 2px 6px; font-size: 10px; color: #16a34a; border-color: rgba(22, 163, 74, 0.4); margin-left: 4px;" title="Dispatch assignment to artisan via WhatsApp">
            Dispatch
          </button>
        </td>
      </tr>
    `).join('');

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0;">
            Field Professionals &amp; Workforce Register
          </h2>
          <p style="font-size: 11px; color: var(--text-muted); margin: 2px 0 0 0;">
            Paid per assignment. Salaried staff are not paid through assignments.
          </p>
        </div>
        <button id="btnNewContractor" class="btn-brand-primary">+ Add Professional</button>
      </div>
      <div class="ops-table-container" style="margin-bottom: 32px;">
        <table class="ops-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Worker Type</th>
              <th>Trade</th>
              <th>Phone</th>
              <th>Vetting</th>
              <th>Training</th>
              <th style="text-align: right;">Agreed Rate</th>
              <th>Eligibility</th>
            </tr>
          </thead>
          <tbody>
            ${contractorRowsHtml || '<tr><td colspan="9" style="text-align: center; color: #64748b;">No workers registered yet.</td></tr>'}
          </tbody>
        </table>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0;">
            Paid Assignments (Single-Entry Labour Register)
          </h2>
          <p style="font-size: 11px; color: var(--text-muted); margin: 2px 0 0 0;">
            This is the only place field labour is recorded (never duplicated in expenses). Paid person-days are never reported as jobs.
          </p>
        </div>
        <button id="btnNewAssignment" class="btn-brand-primary">+ Assign Work</button>
      </div>
      <div class="ops-table-container">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Assignment ID</th>
              <th>Job ID</th>
              <th>Professional</th>
              <th>Date</th>
              <th>Trade</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Rate</th>
              <th style="text-align: right;">Total Amount</th>
              <th style="text-align: center;">Person Days</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${assignmentRowsHtml || '<tr><td colspan="10" style="text-align: center; color: #64748b;">No assignments recorded yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  // ==========================================
  // TAB 7: EXPENSES & PROCUREMENT
  // ==========================================
  private renderExpensesTab(state: OpsDatabaseState, currency: string): string {
    const isCEO = opsStore.getCurrentUser()?.role === 'Founder / CEO';
    const expenseRowsHtml = state.expenses.map(e => `
      <tr>
        <td style="font-weight: 700; color: #075545;">${e.expenseId}</td>
        <td>${e.expenseDate}</td>
        <td style="font-weight: 600;">${e.supplier}</td>
        <td>${e.category}</td>
        <td><span class="ops-badge ${e.class === 'Direct' ? 'badge-ok' : e.class === 'Capex' ? 'badge-reconciled' : 'badge-pending'}">${e.class}</span></td>
        <td>${e.jobId || '-'}</td>
        <td style="text-align: right; font-weight: 700;">${currency}${roundMoney(e.amount).toFixed(2)}</td>
        <td>${e.paymentStatus}</td>
        <td>
          <span class="ops-badge ${e.approvalStatus === 'Approved' ? 'badge-ok' : e.approvalStatus === 'Not required' ? 'badge-reconciled' : 'badge-attention'}">${e.approvalStatus}</span>
          ${e.approvalStatus === 'Pending' && isCEO ? `
            <div style="margin-top: 4px; display: flex; gap: 4px;">
              <button class="btn-brand-primary btn-approve-expense" data-id="${e.expenseId}" style="padding: 2px 6px; font-size: 9px;">✓ Approve</button>
              <button class="btn-brand-outline btn-reject-expense" data-id="${e.expenseId}" style="padding: 2px 6px; font-size: 9px; color: #dc2626; border-color: #fca5a5;">✕ Reject</button>
            </div>
          ` : ''}
        </td>
        <td style="font-family: monospace; font-size: 11px;">${e.evidenceReference || 'NO EVIDENCE'}</td>
      </tr>
    `).join('');

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0;">
            Expenses &amp; Procurement Register
          </h2>
          <p style="font-size: 11px; color: var(--text-muted); margin: 2px 0 0 0;">
            Threshold: Expenses &gt; ${currency}${state.settings.spendingApprovalThreshold} require approval. Direct costs must carry a Job ID.
          </p>
        </div>
        <button id="btnNewExpense" class="btn-brand-primary">+ Record Expense</button>
      </div>
      <div class="ops-table-container">
        <table class="ops-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Supplier</th>
              <th>Category</th>
              <th>Class</th>
              <th>Job ID</th>
              <th style="text-align: right;">Amount</th>
              <th>Pay Status</th>
              <th>Approval</th>
              <th>Evidence Ref</th>
            </tr>
          </thead>
          <tbody>
            ${expenseRowsHtml || '<tr><td colspan="10" style="text-align: center; color: #64748b;">No expenses recorded yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  // ==========================================
  // TAB 8: GRANT & NEIP FUNDING
  // ==========================================
  private renderGrantTab(state: OpsDatabaseState, currency: string): string {
    const grantRowsHtml = state.grantBudget.map(cat => `
      <tr>
        <td style="font-weight: 700; text-align: center;">${cat.code}</td>
        <td style="font-weight: 600;">${cat.grantCategory}</td>
        <td style="text-align: right; font-weight: 700;">${currency}${cat.budget.toFixed(2)}</td>
        <td style="text-align: right;">${currency}${cat.stage1Planned.toFixed(2)}</td>
        <td style="text-align: right;">${currency}${cat.stage2Planned.toFixed(2)}</td>
        <td style="text-align: right; color: #d97706;">${currency}${(cat.committed || 0).toFixed(2)}</td>
        <td style="text-align: right; color: #15803d; font-weight: 700;">${currency}${(cat.spentFromNEIP || 0).toFixed(2)}</td>
        <td style="text-align: right; font-weight: 800; color: #075545;">${currency}${(cat.availableBudget || cat.budget).toFixed(2)}</td>
        <td>${cat.budgetFlag ? `<span class="ops-badge badge-attention">${cat.budgetFlag}</span>` : '<span class="ops-badge badge-ok">OK</span>'}</td>
      </tr>
    `).join('');

    return `
      <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0 0 8px 0;">
        NEIP Grant Funding Request &amp; Utilisation (${currency}80,000 Budget)
      </h2>
      <p style="font-size: 12px; color: var(--text-muted); margin: 0 0 16px 0;">
        Funding requested or approved is NOT cash. The working capital reserve (Category H) is held as cash and is not an operating expense.
      </p>

      <div class="ops-table-container">
        <table class="ops-table">
          <thead>
            <tr>
              <th style="text-align: center;">Code</th>
              <th>Grant Category</th>
              <th style="text-align: right;">Budget</th>
              <th style="text-align: right;">Stage 1</th>
              <th style="text-align: right;">Stage 2</th>
              <th style="text-align: right;">Committed</th>
              <th style="text-align: right;">Spent (NEIP)</th>
              <th style="text-align: right;">Available</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${grantRowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  // ==========================================
  // TAB 9: ASSETS & DEPRECIATION
  // ==========================================
  private renderAssetsTab(state: OpsDatabaseState, currency: string): string {
    const assetRowsHtml = state.assets.map(a => `
      <tr>
        <td style="font-weight: 700; color: #075545;">${a.assetId}</td>
        <td style="font-weight: 600;">${a.description}</td>
        <td>${a.assetCategory}</td>
        <td>${a.purchaseDate}</td>
        <td style="text-align: right; font-weight: 700;">${currency}${a.purchaseCost.toFixed(2)}</td>
        <td>${a.custodian || 'N/A'}</td>
        <td style="text-align: center;">${a.condition}</td>
        <td style="text-align: right;">${currency}${roundMoney(a.monthlyDepreciation || 0).toFixed(2)}</td>
        <td style="text-align: right; color: #b91c1c;">${currency}${roundMoney(a.accumulatedDepreciation || 0).toFixed(2)}</td>
        <td style="text-align: right; font-weight: 800; color: #075545;">${currency}${roundMoney(a.netBookValue || a.purchaseCost).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0;">
            Equipment &amp; Asset Register (Straight-Line Depreciation)
          </h2>
          <p style="font-size: 11px; color: var(--text-muted); margin: 2px 0 0 0;">
            Items &ge; ${currency}${state.settings.capitalThreshold} are capitalised and depreciated over useful life (default 4 years).
          </p>
        </div>
        <button id="btnNewAsset" class="btn-brand-primary">+ Add Equipment Asset</button>
      </div>
      <div class="ops-table-container">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Asset ID</th>
              <th>Description</th>
              <th>Category</th>
              <th>Purchase Date</th>
              <th style="text-align: right;">Cost</th>
              <th>Custodian</th>
              <th style="text-align: center;">Condition</th>
              <th style="text-align: right;">Monthly Depr.</th>
              <th style="text-align: right;">Accum. Depr.</th>
              <th style="text-align: right;">Net Book Value</th>
            </tr>
          </thead>
          <tbody>
            ${assetRowsHtml || '<tr><td colspan="10" style="text-align: center; color: #64748b;">No assets registered yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  // ==========================================
  // TAB 10: GOVERNANCE & RISK
  // ==========================================
  private renderGovernanceTab(state: OpsDatabaseState): string {
    const riskRowsHtml = state.risks.map(r => `
      <tr>
        <td style="font-weight: 700;">${r.riskId}</td>
        <td style="font-weight: 600;">${r.riskDescription}</td>
        <td>${r.category}</td>
        <td style="text-align: center;">${r.probability}</td>
        <td style="text-align: center;">${r.impact}</td>
        <td style="text-align: center; font-weight: 700;">${r.score || r.probability * r.impact}</td>
        <td>
          <span class="ops-badge ${r.rating === 'Critical' || r.rating === 'High' ? 'badge-attention' : r.rating === 'Medium' ? 'badge-pending' : 'badge-ok'}">
            ${r.rating}
          </span>
        </td>
        <td style="font-size: 12px;">${r.mitigation || 'No mitigation assigned'}</td>
        <td>${r.owner || 'Unassigned'}</td>
      </tr>
    `).join('');

    const complianceRowsHtml = state.compliance.map(cp => `
      <tr>
        <td style="font-weight: 700;">${cp.itemId}</td>
        <td>${cp.type}</td>
        <td style="font-weight: 600;">${cp.item}</td>
        <td><span class="ops-badge ${cp.status === 'Valid' ? 'badge-ok' : 'badge-pending'}">${cp.status}</span></td>
        <td style="font-size: 12px; color: #64748b;">${cp.notes || '-'}</td>
      </tr>
    `).join('');

    return `
      <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0 0 12px 0;">
        Risk Register (Probability &times; Impact Scoring)
      </h2>
      <div class="ops-table-container" style="margin-bottom: 32px;">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Risk ID</th>
              <th>Description</th>
              <th>Category</th>
              <th style="text-align: center;">Prob (1-5)</th>
              <th style="text-align: center;">Impact (1-5)</th>
              <th style="text-align: center;">Score</th>
              <th>Rating</th>
              <th>Mitigation</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            ${riskRowsHtml || '<tr><td colspan="9" style="text-align: center; color: #64748b;">No risks logged yet.</td></tr>'}
          </tbody>
        </table>
      </div>

      <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0 0 12px 0;">
        Compliance Prompts &amp; Policy Register (CP0001 – CP0011)
      </h2>
      <div class="ops-table-container">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Item ID</th>
              <th>Type</th>
              <th>Compliance Check Item</th>
              <th>Status</th>
              <th>Notes / Requirement Source</th>
            </tr>
          </thead>
          <tbody>
            ${complianceRowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  // ==========================================
  // TAB 11: 52 CONTROL CHECKS & RECONCILIATION
  // ==========================================
  private renderChecksTab(evaluation: ReturnType<typeof opsStore.getChecksEvaluation>): string {
    const checkRowsHtml = evaluation.checks.map(c => `
      <tr>
        <td style="font-weight: 700; text-align: center;">${c.checkNumber}</td>
        <td style="font-weight: 600; color: #1e293b;">${c.name}</td>
        <td style="text-align: center; font-weight: 700;">${c.countOrValue}</td>
        <td>
          <span class="ops-badge ${c.severity === 'High' ? 'badge-attention' : c.severity === 'Medium' ? 'badge-pending' : 'badge-ok'}">
            ${c.severity}
          </span>
        </td>
        <td>
          <span class="ops-badge ${c.status === 'OK' ? 'badge-ok' : 'badge-attention'}">
            ${c.status}
          </span>
        </td>
        <td style="font-size: 11px; color: #64748b;">${c.whereToLook}</td>
        <td style="font-size: 12px; color: #334155;">${c.whyItMatters}</td>
      </tr>
    `).join('');

    const totalsRowsHtml = evaluation.controlTotals.map(t => `
      <tr>
        <td style="font-weight: 700; color: #075545;">${t.name}</td>
        <td style="text-align: right; font-weight: 700;">Diff: ${t.countOrValue.toFixed(2)}</td>
        <td><span class="ops-badge badge-reconciled">${t.status}</span></td>
        <td style="font-size: 12px; color: #64748b;">${t.whyItMatters}</td>
      </tr>
    `).join('');

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <div>
          <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0;">
            Data Quality &amp; Control Checks (52 Checks)
          </h2>
          <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">
            Automatic exception verification. Every ATTENTION item highlights records requiring management review.
          </p>
        </div>
        <span class="ops-badge ${evaluation.itemsNeedingAttention > 0 ? 'badge-attention' : 'badge-ok'}" style="padding: 6px 12px; font-size: 13px;">
          ${evaluation.itemsNeedingAttention} Attention Item(s)
        </span>
      </div>

      <div class="ops-table-container" style="margin-bottom: 32px;">
        <table class="ops-table">
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">#</th>
              <th style="width: 25%;">Control Check Description</th>
              <th style="width: 10%; text-align: center;">Count / Value</th>
              <th style="width: 10%;">Severity</th>
              <th style="width: 10%;">Status</th>
              <th style="width: 15%;">Where to Look</th>
              <th style="width: 25%;">Why It Matters &amp; Action</th>
            </tr>
          </thead>
          <tbody>
            ${checkRowsHtml}
          </tbody>
        </table>
      </div>

      <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0 0 12px 0;">
        Workbook Reconciliation Control Totals (Must Balance 1:1)
      </h2>
      <div class="ops-table-container">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Control Total Verification</th>
              <th style="text-align: right;">Difference</th>
              <th>Status</th>
              <th>Reconciliation Scope</th>
            </tr>
          </thead>
          <tbody>
            ${totalsRowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  // ==========================================
  // TAB 12: PRINTABLE DOCUMENTS SUITE
  // ==========================================
  private renderPrintSuiteTab(state: OpsDatabaseState): string {
    const quotes = state.quotes;
    const invoices = state.invoices;
    const inspections = state.inspections;

    return `
      <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0 0 12px 0;">
        Official Printable Document Suite
      </h2>
      <p style="font-size: 12px; color: var(--text-muted); margin: 0 0 24px 0;">
        Generate pixel-perfect, branded printable PDFs directly in the browser for quotations, invoices, monthly reports, and property condition assessments.
      </p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        <!-- Printable Quotation -->
        <div class="ops-card">
          <h3 style="font-size: 16px; font-weight: 800; color: #075545; margin: 0 0 8px 0;">Official Quotation</h3>
          <p style="font-size: 12px; color: #64748b; margin: 0 0 14px 0;">Select a quotation to view, print, or export as PDF with full terms.</p>
          <select id="selectPrintQuote" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #cbd5e1; margin-bottom: 12px; font-size: 13px;">
            ${quotes.map(q => `<option value="${q.quoteId}">Quote ${q.quoteId} &bull; ${q.customerName} (${state.settings.currencySymbol}${q.netOfDiscount})</option>`).join('')}
          </select>
          <button id="btnTriggerPrintQuote" class="btn-brand-primary" style="width: 100%; justify-content: center;">
            Generate Quotation PDF
          </button>
        </div>

        <!-- Printable Invoice -->
        <div class="ops-card">
          <h3 style="font-size: 16px; font-weight: 800; color: #075545; margin: 0 0 8px 0;">Tax Invoice</h3>
          <p style="font-size: 12px; color: #64748b; margin: 0 0 14px 0;">Select an invoice to generate official receipt/invoice with balance.</p>
          <select id="selectPrintInvoice" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #cbd5e1; margin-bottom: 12px; font-size: 13px;">
            ${invoices.map(i => `<option value="${i.invoiceNo}">Invoice ${i.invoiceNo} &bull; ${i.customerName} (Bal: ${state.settings.currencySymbol}${i.balance})</option>`).join('')}
          </select>
          <button id="btnTriggerPrintInvoice" class="btn-brand-primary" style="width: 100%; justify-content: center;">
            Generate Invoice PDF
          </button>
        </div>

        <!-- Monthly Report -->
        <div class="ops-card">
          <h3 style="font-size: 16px; font-weight: 800; color: #075545; margin: 0 0 8px 0;">Monthly Management Report</h3>
          <p style="font-size: 12px; color: #64748b; margin: 0 0 14px 0;">Executive summary of monthly results, cash flow, and control status.</p>
          <select id="selectPrintMonth" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #cbd5e1; margin-bottom: 12px; font-size: 13px;">
            <option value="2">March 2026</option>
            <option value="3">April 2026</option>
            <option value="5">June 2026</option>
            <option value="9">October 2026</option>
            <option value="10">November 2026</option>
          </select>
          <button id="btnTriggerPrintMonthly" class="btn-brand-primary" style="width: 100%; justify-content: center;">
            Generate Monthly Report PDF
          </button>
        </div>

        <!-- Property Condition Report -->
        <div class="ops-card">
          <h3 style="font-size: 16px; font-weight: 800; color: #075545; margin: 0 0 8px 0;">Property Condition Report</h3>
          <p style="font-size: 12px; color: #64748b; margin: 0 0 14px 0;">Property Watch visual inspection report for owners and diaspora clients.</p>
          <select id="selectPrintInspection" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #cbd5e1; margin-bottom: 12px; font-size: 13px;">
            ${inspections.map(ins => `<option value="${ins.inspectionId}">Inspection ${ins.inspectionId} &bull; ${ins.customerName || ins.propertyId} (${ins.conditionRating})</option>`).join('')}
          </select>
          <button id="btnTriggerPrintInspection" class="btn-brand-primary" style="width: 100%; justify-content: center;">
            Generate Condition Report PDF
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================
  // EVENT BINDINGS
  // ==========================================
  private bindEvents(): void {
    // Nav Tabs
    const tabBtns = this.mountEl.querySelectorAll<HTMLButtonElement>('.ops-nav-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab as ActiveTab;
        if (tab) this.setTab(tab);
      });
    });

    // Top action buttons
    document.getElementById('btnPreloadDemo')?.addEventListener('click', () => {
      if (confirm('Preload verified demonstration dataset with full transactions, jobs, and financial history?')) {
        opsStore.loadState(createDemoState());
        alert('Demonstration dataset loaded and fully calculated!');
      }
    });

    document.getElementById('btnResetClean')?.addEventListener('click', () => {
      if (confirm('Reset system to clean production state (all transactional data emptied)?')) {
        opsStore.resetToEmpty();
        alert('System reset to clean production state.');
      }
    });

    document.getElementById('btnExportJson')?.addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(opsStore.getState(), null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `Civitas_Ops_Backup_${formatYMD(new Date())}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });

    const inputImport = document.getElementById('inputImportJson') as HTMLInputElement | null;
    document.getElementById('btnImportJson')?.addEventListener('click', () => {
      inputImport?.click();
    });

    inputImport?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          if (!parsed.settings || !Array.isArray(parsed.customers)) {
            throw new Error('Invalid Civitas database backup file format.');
          }
          if (confirm('Are you sure you want to restore this backup? This will overwrite the current active database.')) {
            opsStore.loadState(parsed, 'Founder/CEO');
            alert('Database successfully restored from backup.');
          }
        } catch (err: any) {
          alert('Failed to import backup: ' + (err?.message || 'Invalid JSON file'));
        } finally {
          if (inputImport) inputImport.value = '';
        }
      };
      reader.readAsText(file);
    });

    // Quick creation modals
    document.getElementById('btnNewCustomer')?.addEventListener('click', () => this.showNewCustomerModal());
    document.getElementById('btnNewEnquiry')?.addEventListener('click', () => this.showNewEnquiryModal());
    document.getElementById('btnNewQuote')?.addEventListener('click', () => this.showNewQuoteModal());
    document.getElementById('btnNewJob')?.addEventListener('click', () => this.showNewJobModal());
    document.getElementById('btnNewInvoice')?.addEventListener('click', () => this.showNewInvoiceModal());
    document.getElementById('btnNewPayment')?.addEventListener('click', () => this.showNewPaymentModal());
    document.getElementById('btnNewExpense')?.addEventListener('click', () => this.showNewExpenseModal());
    document.getElementById('btnNewAssignment')?.addEventListener('click', () => this.showNewAssignmentModal());
    document.getElementById('btnNewInspection')?.addEventListener('click', () => this.showNewInspectionModal());
    document.getElementById('btnNewUser')?.addEventListener('click', () => this.showNewUserModal());

    // Dashboard session & governance controls
    document.getElementById('btnGoLanding')?.addEventListener('click', () => {
      this.setScreen('landing');
    });

    document.getElementById('btnLogout')?.addEventListener('click', () => {
      opsStore.logout();
      this.setScreen('login');
    });

    const quickSwitchSelect = document.getElementById('selectQuickSwitchUser') as HTMLSelectElement | null;
    quickSwitchSelect?.addEventListener('change', () => {
      if (quickSwitchSelect.value) {
        opsStore.loginAsUser(quickSwitchSelect.value);
      }
    });

    document.querySelectorAll('.btn-switch-to-user').forEach((el) => {
      const btn = el as HTMLElement;
      btn.addEventListener('click', () => {
        const userId = btn.dataset.id;
        if (userId) opsStore.loginAsUser(userId);
      });
    });

    document.querySelectorAll('.btn-toggle-user-status').forEach((el) => {
      const btn = el as HTMLElement;
      btn.addEventListener('click', () => {
        const userId = btn.dataset.id;
        const currentStatus = btn.dataset.status;
        if (!userId) return;
        const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
        opsStore.updateUser(userId, { status: nextStatus as any });
      });
    });

    document.querySelectorAll('.btn-approve-expense').forEach((el) => {
      const btn = el as HTMLElement;
      btn.addEventListener('click', () => {
        const expId = btn.dataset.id;
        if (expId) opsStore.approveExpense(expId);
      });
    });

    document.querySelectorAll('.btn-reject-expense').forEach((el) => {
      const btn = el as HTMLElement;
      btn.addEventListener('click', () => {
        const expId = btn.dataset.id;
        if (expId) opsStore.rejectExpense(expId);
      });
    });

    document.getElementById('btnLockClosePeriod')?.addEventListener('click', () => {
      const monthSelect = document.getElementById('selectCloseMonth') as HTMLSelectElement | null;
      const monthVal = monthSelect?.value;
      if (!monthVal) return;
      if (confirm(`Lock and close accounting period ${monthVal}? Any modifications to ${monthVal} records after this timestamp will trigger Control Check #51.`)) {
        opsStore.closePeriod(monthVal, opsStore.getActorLabel());
      }
    });

    // Print triggers
    document.getElementById('btnTriggerPrintQuote')?.addEventListener('click', () => {
      const sel = (document.getElementById('selectPrintQuote') as HTMLSelectElement)?.value;
      if (sel) this.printQuote(sel);
    });

    document.getElementById('btnTriggerPrintInvoice')?.addEventListener('click', () => {
      const sel = (document.getElementById('selectPrintInvoice') as HTMLSelectElement)?.value;
      if (sel) this.printInvoice(sel);
    });

    document.getElementById('btnTriggerPrintMonthly')?.addEventListener('click', () => {
      const sel = parseInt((document.getElementById('selectPrintMonth') as HTMLSelectElement)?.value, 10);
      this.printMonthly(sel);
    });

    document.getElementById('btnTriggerPrintInspection')?.addEventListener('click', () => {
      const sel = (document.getElementById('selectPrintInspection') as HTMLSelectElement)?.value;
      if (sel) this.printInspection(sel);
    });

    // Table action print buttons
    this.mountEl.querySelectorAll<HTMLButtonElement>('.btn-print-quote').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (id) this.printQuote(id);
      });
    });

    this.mountEl.querySelectorAll<HTMLButtonElement>('.btn-print-inv').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (id) this.printInvoice(id);
      });
    });

    // WhatsApp quick actions
    this.mountEl.querySelectorAll<HTMLButtonElement>('.btn-whatsapp-quote').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (!id) return;
        const state = opsStore.getState();
        const quote = state.quotes.find(q => q.quoteId === id);
        if (!quote) return alert('Quote not found');
        const cust = state.customers.find(c => c.customerId === quote.customerId);
        const phone = cust?.phone || '';
        if (!phone) return alert('Customer does not have a phone number registered.');

        const message = 
`*CIVITAS ESTATE & MAINTENANCE*
_Smart Living. Sustainable Legacy._
Accra & Tema, Ghana | +233 (0) 20 952 7426

Hello *${cust?.customerName || quote.customerName}*,

Here is your official service quotation from Civitas Estate & Maintenance:
📄 *Quote No:* ${quote.quoteId}
📅 *Date:* ${quote.quoteDate}
💰 *Quoted Net Amount:* GH₵${roundMoney(quote.netOfDiscount || 0).toFixed(2)}

*Payment Details:*
📱 *MTN Mobile Money:* +233 (0) 20 952 7426 (Civitas Estate)
Reference: ${quote.quoteId}

Please reply to this message to confirm and schedule your service!`;

        window.open(formatGhanaWhatsAppLink(phone, message), '_blank');
      });
    });

    this.mountEl.querySelectorAll<HTMLButtonElement>('.btn-whatsapp-inv').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (!id) return;
        const state = opsStore.getState();
        const inv = state.invoices.find(i => i.invoiceNo === id);
        if (!inv) return alert('Invoice not found');
        const cust = state.customers.find(c => c.customerId === inv.customerId);
        const phone = cust?.phone || '';
        if (!phone) return alert('Customer does not have a phone number registered.');

        const message = 
`*CIVITAS ESTATE & MAINTENANCE*
_Smart Living. Sustainable Legacy._
Accra & Tema, Ghana | +233 (0) 20 952 7426

Hello *${cust?.customerName || inv.customerName}*,

Here is your tax invoice from Civitas Estate & Maintenance:
📄 *Invoice No:* ${inv.invoiceNo}
📅 *Date:* ${inv.invoiceDate}
⏰ *Due Date:* ${inv.dueDate}
💵 *Total Billed:* GH₵${roundMoney(inv.amountBeforeTax).toFixed(2)}
⚖️ *Outstanding Balance:* GH₵${roundMoney(inv.balance || 0).toFixed(2)}

*Payment Details:*
📱 *MTN Mobile Money:* +233 (0) 20 952 7426 (Civitas Estate)
Reference: ${inv.invoiceNo}

Kindly share your payment confirmation or transaction ID once transferred. Thank you!`;

        window.open(formatGhanaWhatsAppLink(phone, message), '_blank');
      });
    });

    this.mountEl.querySelectorAll<HTMLButtonElement>('.btn-whatsapp-assign').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (!id) return;
        const state = opsStore.getState();
        const assign = state.assignments.find(a => a.assignmentId === id);
        if (!assign) return alert('Assignment not found');
        const contractor = state.contractors.find(c => c.contractorId === assign.contractorId);
        const phone = contractor?.phone || '';
        if (!phone) return alert('Contractor does not have a phone number registered.');
        const job = state.jobs.find(j => j.jobId === assign.jobId);
        const prop = state.properties.find(p => p.propertyId === job?.propertyId);

        const message = 
`*CIVITAS ESTATE & MAINTENANCE - FIELD DISPATCH*
Hello *${assign.contractorName}*, you have an assignment scheduled:

🛠️ *Job ID:* ${assign.jobId}
📋 *Assignment:* ${assign.assignmentId}
📅 *Date:* ${assign.assignmentDate}
🔧 *Trade:* ${assign.trade || 'General'}
📍 *Property Location:* ${prop ? `${prop.addressOrDescription}, ${prop.area}` : 'Accra/Tema area'}
💵 *Agreed Pay:* GH₵${roundMoney(assign.amount || 0).toFixed(2)}

Please confirm receipt, arrive on time with proper PPE & tools, and contact the operations coordinator upon arrival on site.`;

        window.open(formatGhanaWhatsAppLink(phone, message), '_blank');
      });
    });

    // Payment reconciliation toggle
    this.mountEl.querySelectorAll<HTMLButtonElement>('.btn-toggle-pay-recon').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (!id) return;
        const p = opsStore.getState().payments.find(item => item.paymentId === id);
        if (!p) return;
        const nextStatus = p.reconciliationStatus === 'Reconciled' ? 'Unreconciled' : 'Reconciled';
        opsStore.updatePayment(id, { reconciliationStatus: nextStatus });
      });
    });

    // Property inspection print & WhatsApp
    this.mountEl.querySelectorAll<HTMLButtonElement>('.btn-print-inspection-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (id) this.printInspection(id);
      });
    });

    this.mountEl.querySelectorAll<HTMLButtonElement>('.btn-whatsapp-inspection').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (!id) return;
        const state = opsStore.getState();
        const ins = state.inspections.find(i => i.inspectionId === id);
        if (!ins) return alert('Inspection not found');
        const prop = state.properties.find(p => p.propertyId === ins.propertyId);
        const cust = state.customers.find(c => c.customerId === prop?.customerId);
        const phone = cust?.phone || '';
        if (!phone) return alert('Customer does not have a phone number registered.');

        const message = 
`*CIVITAS ESTATE & MAINTENANCE - PROPERTY WATCH*
_Smart Living. Sustainable Legacy._
Accra & Tema, Ghana | +233 (0) 20 952 7426

Hello *${cust?.customerName || 'Property Owner'}*,

Your latest Property Watch walkthrough report has been completed:
📋 *Report ID:* ${ins.inspectionId}
📅 *Date:* ${ins.inspectionDate}
📍 *Property:* ${prop ? `${prop.addressOrDescription}, ${prop.area}` : 'Your property'}
⭐ *Overall Condition Rating:* ${ins.conditionRating || 'Evaluated'}

*Area Summary:*
• Roof & Ceilings: ${ins.roofAndCeiling || 'Good'}
• Plumbing: ${ins.plumbing || 'Good'}
• Electrical: ${ins.electrical || 'Good'}
• Doors & Windows: ${ins.doorsLocksWindows || 'Good'}
• Compound & Exterior: ${ins.compoundAndExterior || 'Good'}

${ins.photosFolderReference ? `📸 *Photos & Media Link:* ${ins.photosFolderReference}\n` : ''}
${ins.observations ? `📝 *Observations:* ${ins.observations}\n` : ''}
${ins.recommendations ? `💡 *Recommendations:* ${ins.recommendations}\n` : ''}
An official PDF condition report is available upon request. Thank you for choosing Civitas Estate & Maintenance!`;

        window.open(formatGhanaWhatsAppLink(phone, message), '_blank');
      });
    });
  }

  // ==========================================
  // PRINT EXECUTION
  // ==========================================
  private printQuote(quoteId: string): void {
    const state = opsStore.getState();
    const q = state.quotes.find(item => item.quoteId === quoteId);
    if (!q) return alert('Quote not found');
    const c = state.customers.find(item => item.customerId === q.customerId) || {
      customerId: q.customerId,
      customerName: q.customerName || 'Client',
      phone: '',
      email: '',
      area: 'East Legon'
    } as Customer;
    const p = state.properties.find(item => item.propertyId === q.propertyId);

    const html = renderPrintQuoteHtml(q, state.quoteLines, c, p, state.settings);
    this.openPrintWindow(html);
  }

  private printInvoice(invoiceNo: string): void {
    const state = opsStore.getState();
    const inv = state.invoices.find(item => item.invoiceNo === invoiceNo);
    if (!inv) return alert('Invoice not found');
    const c: Customer = state.customers.find(item => item.customerId === inv.customerId) || {
      customerId: inv.customerId,
      customerName: inv.customerName || 'Client',
      category: 'Homeowner',
      phone: '',
      email: '',
      preferredChannel: 'WhatsApp',
      area: 'Other Accra',
      leadSource: 'Referral',
      dateAcquired: '',
      relationshipOwner: 'Founder/CEO',
      consentRecorded: 'Yes',
      closed: 'No'
    };

    const html = renderPrintInvoiceHtml(inv, c, state.payments, state.settings);
    this.openPrintWindow(html);
  }

  private printMonthly(monthIdx: number): void {
    const state = opsStore.getState();
    const mgmt = opsStore.getManagementAccounts();
    const m = mgmt.months[monthIdx] || mgmt.months[0];
    const evalData = opsStore.getChecksEvaluation();

    const html = renderPrintMonthlyReportHtml(m, state.settings.reportingYear, state.settings, evalData.itemsNeedingAttention);
    this.openPrintWindow(html);
  }

  private printInspection(inspectionId: string): void {
    const state = opsStore.getState();
    const ins = state.inspections.find(item => item.inspectionId === inspectionId);
    if (!ins) return alert('Inspection not found');
    const p = state.properties.find(item => item.propertyId === ins.propertyId);
    const c = p ? state.customers.find(item => item.customerId === p.customerId) : undefined;

    const html = renderPrintInspectionHtml(ins, p, c, state.settings);
    this.openPrintWindow(html);
  }

  private openPrintWindow(html: string): void {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      // Fallback in-page
      const printArea = document.getElementById('printArea');
      if (printArea) {
        printArea.innerHTML = html;
        printArea.style.display = 'block';
        window.print();
        printArea.style.display = 'none';
      }
      return;
    }
    printWin.document.open();
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Civitas Document Print</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { margin: 0; background: #ffffff; }
        </style>
      </head>
      <body>
        ${html}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  }

  // ==========================================
  // QUICK TRANSACTION MODALS
  // ==========================================
  private showNewCustomerModal(): void {
    const nextId = opsStore.nextCustomerId();
    const modalHtml = `
      <div class="ops-modal-backdrop" id="opsModal">
        <div class="ops-modal-content">
          <h3 style="font-size: 18px; font-weight: 800; color: #075545; margin: 0 0 16px 0;">Register New Customer (${nextId})</h3>
          <form id="formNewCustomer">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Customer Name *</label>
                <input type="text" id="custName" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Category</label>
                <select id="custCat" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  <option value="Homeowner">Homeowner</option>
                  <option value="Landlord">Landlord</option>
                  <option value="Tenant">Tenant</option>
                  <option value="Short-let operator">Short-let operator</option>
                  <option value="Diaspora owner">Diaspora owner</option>
                  <option value="Small business">Small business</option>
                </select>
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Phone (WhatsApp) *</label>
                <input type="text" id="custPhone" required placeholder="+233 24 000 0000" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Email</label>
                <input type="email" id="custEmail" placeholder="client@example.com" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Area</label>
                <select id="custArea" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  <option value="East Legon">East Legon</option>
                  <option value="Spintex">Spintex</option>
                  <option value="Adenta">Adenta</option>
                  <option value="Tema Community 25">Tema Community 25</option>
                  <option value="Airport Residential">Airport Residential</option>
                  <option value="Other Accra">Other Accra</option>
                  <option value="Other Tema">Other Tema</option>
                </select>
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Lead Source</label>
                <select id="custSource" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Telephone">Telephone</option>
                  <option value="Referral">Referral</option>
                  <option value="Website">Website</option>
                  <option value="Social media">Social media</option>
                </select>
              </div>
            </div>
            <div style="margin-bottom: 16px;">
              <label style="font-size: 12px; font-weight: 700; color: #475569;">Consent Recorded</label>
              <select id="custConsent" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                <option value="Yes">Yes (Consent recorded to store details)</option>
                <option value="No">No</option>
              </select>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" id="btnModalCancel" class="btn-brand-outline">Cancel</button>
              <button type="submit" class="btn-brand-primary">Save Customer</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.showModal(modalHtml, () => {
      document.getElementById('formNewCustomer')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const c: Customer = {
          customerId: nextId,
          customerName: (document.getElementById('custName') as HTMLInputElement).value,
          category: (document.getElementById('custCat') as HTMLSelectElement).value as any,
          phone: (document.getElementById('custPhone') as HTMLInputElement).value,
          email: (document.getElementById('custEmail') as HTMLInputElement).value,
          preferredChannel: 'WhatsApp',
          area: (document.getElementById('custArea') as HTMLSelectElement).value as any,
          leadSource: (document.getElementById('custSource') as HTMLSelectElement).value as any,
          dateAcquired: formatYMD(new Date()),
          relationshipOwner: 'Founder/CEO',
          consentRecorded: (document.getElementById('custConsent') as HTMLSelectElement).value as any,
          closed: 'No'
        };
        opsStore.addCustomer(c);
        this.closeModal();
      });
    });
  }

  private showNewEnquiryModal(): void {
    const nextId = opsStore.nextEnquiryId();
    const state = opsStore.getState();
    const modalHtml = `
      <div class="ops-modal-backdrop" id="opsModal">
        <div class="ops-modal-content">
          <h3 style="font-size: 18px; font-weight: 800; color: #075545; margin: 0 0 16px 0;">Log Sales Enquiry (${nextId})</h3>
          <form id="formNewEnquiry">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Contact Name *</label>
                <input type="text" id="enqContact" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Phone Number *</label>
                <input type="text" id="enqPhone" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Link Existing Customer (Optional)</label>
                <select id="enqCustomer" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  <option value="">None (New Prospect)</option>
                  ${state.customers.map(c => `<option value="${c.customerId}">${c.customerName}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Lead Source</label>
                <select id="enqSource" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Telephone">Telephone</option>
                  <option value="Referral">Referral</option>
                  <option value="Website">Website</option>
                  <option value="Social media">Social media</option>
                  <option value="Google">Google</option>
                </select>
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Service Interest</label>
                <input type="text" id="enqInterest" placeholder="e.g. Deep cleaning, leak fix" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Service Area</label>
                <select id="enqArea" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  <option value="East Legon">East Legon</option>
                  <option value="Spintex">Spintex</option>
                  <option value="Adenta">Adenta</option>
                  <option value="Tema Community 25">Tema Community 25</option>
                  <option value="Other Accra">Other Accra</option>
                </select>
              </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" id="btnModalCancel" class="btn-brand-outline">Cancel</button>
              <button type="submit" class="btn-brand-primary">Log Enquiry</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.showModal(modalHtml, () => {
      document.getElementById('formNewEnquiry')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const e: Enquiry = {
          enquiryId: nextId,
          enquiryDate: formatYMD(new Date()),
          contactName: (document.getElementById('enqContact') as HTMLInputElement).value,
          phone: (document.getElementById('enqPhone') as HTMLInputElement).value,
          customerId: (document.getElementById('enqCustomer') as HTMLSelectElement).value || undefined,
          leadSource: (document.getElementById('enqSource') as HTMLSelectElement).value as any,
          serviceInterest: (document.getElementById('enqInterest') as HTMLInputElement).value,
          area: (document.getElementById('enqArea') as HTMLSelectElement).value as any,
          stage: 'New Enquiry',
          qualified: 'Yes',
          owner: 'Founder/CEO'
        };
        opsStore.addEnquiry(e);
        this.closeModal();
      });
    });
  }

  private showNewQuoteModal(): void {
    const nextId = opsStore.nextQuoteId();
    const state = opsStore.getState();
    const modalHtml = `
      <div class="ops-modal-backdrop" id="opsModal">
        <div class="ops-modal-content">
          <h3 style="font-size: 18px; font-weight: 800; color: #075545; margin: 0 0 16px 0;">Prepare Quotation (${nextId})</h3>
          <form id="formNewQuote">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Customer *</label>
                <select id="quoteCust" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  ${state.customers.map(c => `<option value="${c.customerId}">${c.customerName}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Primary Catalogue Service *</label>
                <select id="quoteService" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  ${state.services.map(s => `<option value="${s.serviceId}">${s.service} (GH₵${s.standardPrice})</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Quantity</label>
                <input type="number" id="quoteQty" value="1" min="1" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Discount (GH₵)</label>
                <input type="number" id="quoteDiscount" value="0" min="0" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
            </div>
            <div style="margin-bottom: 16px;">
              <label style="font-size: 12px; font-weight: 700; color: #475569;">Scope / Custom Description</label>
              <textarea id="quoteDesc" rows="2" placeholder="Specific areas, room layout, or inclusions" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;"></textarea>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" id="btnModalCancel" class="btn-brand-outline">Cancel</button>
              <button type="submit" class="btn-brand-primary">Generate Quotation</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.showModal(modalHtml, () => {
      document.getElementById('formNewQuote')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const custId = (document.getElementById('quoteCust') as HTMLSelectElement).value;
        const serviceId = (document.getElementById('quoteService') as HTMLSelectElement).value;
        const qty = parseInt((document.getElementById('quoteQty') as HTMLInputElement).value, 10) || 1;
        const discount = parseFloat((document.getElementById('quoteDiscount') as HTMLInputElement).value) || 0;
        const desc = (document.getElementById('quoteDesc') as HTMLTextAreaElement).value;

        const q: Quote = {
          quoteId: nextId,
          quoteDate: formatYMD(new Date()),
          customerId: custId,
          preparedBy: 'Founder/CEO',
          status: 'Sent',
          discountAmount: discount,
          discountApproval: discount > 0 ? 'Approved' : 'Not required'
        };

        const line = {
          quoteId: nextId,
          serviceId,
          customDescription: desc,
          quantity: qty
        };

        opsStore.addQuoteWithLines(q, [line]);
        this.closeModal();
      });
    });
  }

  private showNewJobModal(): void {
    const nextId = opsStore.nextJobId();
    const state = opsStore.getState();
    const modalHtml = `
      <div class="ops-modal-backdrop" id="opsModal">
        <div class="ops-modal-content">
          <h3 style="font-size: 18px; font-weight: 800; color: #075545; margin: 0 0 16px 0;">Book New Service Job (${nextId})</h3>
          <form id="formNewJob">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Customer *</label>
                <select id="jobCust" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  ${state.customers.map(c => `<option value="${c.customerId}">${c.customerName}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Service Item *</label>
                <select id="jobService" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  ${state.services.map(s => `<option value="${s.serviceId}">${s.service} (GH₵${s.standardPrice})</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Scheduled Date *</label>
                <input type="date" id="jobSchedDate" required value="${formatYMD(new Date())}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Agreed Quoted Amount (GH₵)</label>
                <input type="number" id="jobAmount" placeholder="Standard price or quote" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
            </div>
            <div style="margin-bottom: 16px;">
              <label style="font-size: 12px; font-weight: 700; color: #475569;">Job Description</label>
              <textarea id="jobDesc" rows="2" placeholder="Specific property instructions" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;"></textarea>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" id="btnModalCancel" class="btn-brand-outline">Cancel</button>
              <button type="submit" class="btn-brand-primary">Book Job</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.showModal(modalHtml, () => {
      document.getElementById('formNewJob')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const sId = (document.getElementById('jobService') as HTMLSelectElement).value;
        const sObj = state.services.find(s => s.serviceId === sId);
        const quotedAmt = parseFloat((document.getElementById('jobAmount') as HTMLInputElement).value) || (sObj ? sObj.standardPrice : 300);

        const j: Job = {
          jobId: nextId,
          customerId: (document.getElementById('jobCust') as HTMLSelectElement).value,
          serviceId: sId,
          description: (document.getElementById('jobDesc') as HTMLTextAreaElement).value,
          requestDate: formatYMD(new Date()),
          scheduledDate: (document.getElementById('jobSchedDate') as HTMLInputElement).value,
          status: 'Scheduled',
          manualQuotedAmount: quotedAmt,
          estimatedLabour: sObj ? sObj.standardDirectCost * 0.6 : 100,
          estimatedMaterials: sObj ? sObj.standardDirectCost * 0.3 : 50,
          estimatedTransport: sObj ? sObj.standardDirectCost * 0.1 : 30
        };

        opsStore.addJob(j);
        this.closeModal();
      });
    });
  }

  private showNewInvoiceModal(): void {
    const nextNo = opsStore.nextInvoiceNo();
    const state = opsStore.getState();
    const modalHtml = `
      <div class="ops-modal-backdrop" id="opsModal">
        <div class="ops-modal-content">
          <h3 style="font-size: 18px; font-weight: 800; color: #075545; margin: 0 0 16px 0;">Create Invoice (${nextNo})</h3>
          <form id="formNewInvoice">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Customer *</label>
                <select id="invCust" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  ${state.customers.map(c => `<option value="${c.customerId}">${c.customerName}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Link Job (Optional)</label>
                <select id="invJob" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  <option value="">No linked job (Direct billing)</option>
                  ${state.jobs.map(j => `<option value="${j.jobId}">Job ${j.jobId} &bull; ${j.customerName} (${j.description || 'Job'})</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Amount Before Tax (GH₵) *</label>
                <input type="number" id="invAmount" required min="1" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Payment Terms (Days)</label>
                <input type="number" id="invTerms" value="${state.settings.defaultPaymentTermsDays}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
            </div>
            <div style="margin-bottom: 16px;">
              <label style="font-size: 12px; font-weight: 700; color: #475569;">Notes / Billing Description</label>
              <input type="text" id="invNotes" placeholder="Service billing details" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" id="btnModalCancel" class="btn-brand-outline">Cancel</button>
              <button type="submit" class="btn-brand-primary">Issue Invoice</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.showModal(modalHtml, () => {
      document.getElementById('formNewInvoice')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const amt = parseFloat((document.getElementById('invAmount') as HTMLInputElement).value);
        const inv: Invoice = {
          invoiceNo: nextNo,
          customerId: (document.getElementById('invCust') as HTMLSelectElement).value,
          jobId: (document.getElementById('invJob') as HTMLSelectElement).value || undefined,
          invoiceDate: formatYMD(new Date()),
          termsDays: parseInt((document.getElementById('invTerms') as HTMLInputElement).value, 10) || 7,
          amountBeforeTax: amt,
          cancelled: 'No',
          notes: (document.getElementById('invNotes') as HTMLInputElement).value
        };
        opsStore.addInvoice(inv);
        this.closeModal();
      });
    });
  }

  private showNewPaymentModal(): void {
    const nextId = opsStore.nextPaymentId();
    const state = opsStore.getState();
    const modalHtml = `
      <div class="ops-modal-backdrop" id="opsModal">
        <div class="ops-modal-content">
          <h3 style="font-size: 18px; font-weight: 800; color: #075545; margin: 0 0 16px 0;">Record Cash Receipt (${nextId})</h3>
          <p style="font-size: 12px; color: var(--text-muted); margin: 0 0 14px 0;">Cash received is recorded here only, never from invoices. Cash &ne; Revenue.</p>
          <form id="formNewPayment">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Target Invoice *</label>
                <select id="payInvoice" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  ${state.invoices.filter(i => (i.balance || 0) > 0).map(i => `<option value="${i.invoiceNo}">${i.invoiceNo} &bull; ${i.customerName} (Bal: GH₵${i.balance})</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Amount Received (GH₵) *</label>
                <input type="number" id="payAmount" required min="0.01" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Payment Method</label>
                <select id="payMethod" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  <option value="Mobile money">Mobile money</option>
                  <option value="Bank transfer">Bank transfer</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Transaction Reference *</label>
                <input type="text" id="payRef" required placeholder="MoMo / Bank transaction reference" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" id="btnModalCancel" class="btn-brand-outline">Cancel</button>
              <button type="submit" class="btn-brand-primary">Record Payment</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.showModal(modalHtml, () => {
      document.getElementById('formNewPayment')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const p: Payment = {
          paymentId: nextId,
          paymentDate: formatYMD(new Date()),
          invoiceNo: (document.getElementById('payInvoice') as HTMLSelectElement).value,
          amount: parseFloat((document.getElementById('payAmount') as HTMLInputElement).value),
          method: (document.getElementById('payMethod') as HTMLSelectElement).value as any,
          reference: (document.getElementById('payRef') as HTMLInputElement).value,
          receivedBy: 'Founder/CEO',
          reconciliationStatus: 'Unreconciled'
        };
        opsStore.addPayment(p);
        this.closeModal();
      });
    });
  }

  private showNewExpenseModal(): void {
    const nextId = opsStore.nextExpenseId();
    const state = opsStore.getState();
    const modalHtml = `
      <div class="ops-modal-backdrop" id="opsModal">
        <div class="ops-modal-content">
          <h3 style="font-size: 18px; font-weight: 800; color: #075545; margin: 0 0 16px 0;">Record Operating / Direct Expense (${nextId})</h3>
          <p style="font-size: 12px; color: var(--text-muted); margin: 0 0 14px 0;">Field labour is not recorded here (use Assignments). Direct costs must carry a Job ID.</p>
          <form id="formNewExpense">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Supplier / Vendor *</label>
                <input type="text" id="expSupplier" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Amount (GH₵) *</label>
                <input type="number" id="expAmount" required min="0.01" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Expense Category *</label>
                <select id="expCategory" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  <option value="Direct materials">Direct materials (Job supplies)</option>
                  <option value="Direct transport">Direct transport (Job travel)</option>
                  <option value="Marketing and customer acquisition">Marketing and customer acquisition</option>
                  <option value="Workforce training and safety">Workforce training and safety</option>
                  <option value="Administration and communication">Administration and communication</option>
                  <option value="Equipment (capital)">Equipment (capital)</option>
                  <option value="Digital operations">Digital operations</option>
                  <option value="Salaries and employer pension">Salaries and employer pension</option>
                </select>
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Link Job (Required for Direct costs)</label>
                <select id="expJob" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  <option value="">None (Overhead running cost)</option>
                  ${state.jobs.map(j => `<option value="${j.jobId}">Job ${j.jobId} &bull; ${j.customerName}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Receipt Reference *</label>
                <input type="text" id="expEvidence" required placeholder="Receipt # or photo doc reference" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Funding Source</label>
                <select id="expFunding" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  <option value="Operations (customer receipts)">Operations (customer receipts)</option>
                  <option value="Own funds">Own funds</option>
                  <option value="NEIP funding">NEIP funding</option>
                </select>
              </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" id="btnModalCancel" class="btn-brand-outline">Cancel</button>
              <button type="submit" class="btn-brand-primary">Record Expense</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.showModal(modalHtml, () => {
      document.getElementById('formNewExpense')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const amt = parseFloat((document.getElementById('expAmount') as HTMLInputElement).value);
        const isCEO = opsStore.getCurrentUser()?.role === 'Founder / CEO';
        const needsApproval = amt > state.settings.spendingApprovalThreshold;
        const e: Expense = {
          expenseId: nextId,
          expenseDate: formatYMD(new Date()),
          supplier: (document.getElementById('expSupplier') as HTMLInputElement).value,
          category: (document.getElementById('expCategory') as HTMLSelectElement).value as any,
          jobId: (document.getElementById('expJob') as HTMLSelectElement).value || undefined,
          amount: amt,
          paymentMethod: 'Mobile money',
          paymentStatus: 'Paid',
          approvalStatus: needsApproval ? (isCEO ? 'Approved' : 'Pending') : 'Not required',
          approvedBy: needsApproval && isCEO ? opsStore.getActorLabel() : undefined,
          evidenceReference: (document.getElementById('expEvidence') as HTMLInputElement).value,
          fundingSource: (document.getElementById('expFunding') as HTMLSelectElement).value as any
        };
        opsStore.addExpense(e);
        this.closeModal();
      });
    });
  }

  private showNewAssignmentModal(): void {
    const nextId = opsStore.nextAssignmentId();
    const state = opsStore.getState();
    const modalHtml = `
      <div class="ops-modal-backdrop" id="opsModal">
        <div class="ops-modal-content">
          <h3 style="font-size: 18px; font-weight: 800; color: #075545; margin: 0 0 16px 0;">Assign Field Professional (${nextId})</h3>
          <p style="font-size: 12px; color: var(--text-muted); margin: 0 0 14px 0;">Assign a vetted professional to an active job. Paid per assignment/day.</p>
          <form id="formNewAssignment">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Target Job *</label>
                <select id="asnJob" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  ${state.jobs.map(j => `<option value="${j.jobId}">Job ${j.jobId} &bull; ${j.customerName}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Field Professional *</label>
                <select id="asnContractor" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  ${state.contractors.map(c => `<option value="${c.contractorId}">${c.contractorName} (${c.trade}) &bull; GH₵${c.agreedRate}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Quantity (Days or Visits)</label>
                <input type="number" id="asnQty" value="1" min="1" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Agreed Assignment Rate (GH₵) *</label>
                <input type="number" id="asnRate" required min="1" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" id="btnModalCancel" class="btn-brand-outline">Cancel</button>
              <button type="submit" class="btn-brand-primary">Confirm Assignment</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.showModal(modalHtml, () => {
      document.getElementById('formNewAssignment')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const a: Assignment = {
          assignmentId: nextId,
          jobId: (document.getElementById('asnJob') as HTMLSelectElement).value,
          contractorId: (document.getElementById('asnContractor') as HTMLSelectElement).value,
          assignmentDate: formatYMD(new Date()),
          payBasis: 'Per day',
          quantity: parseInt((document.getElementById('asnQty') as HTMLInputElement).value, 10) || 1,
          rate: parseFloat((document.getElementById('asnRate') as HTMLInputElement).value),
          paymentStatus: 'Unpaid'
        };
        opsStore.addAssignment(a);
        this.closeModal();
      });
    });
  }

  private showNewInspectionModal(): void {
    const nextId = opsStore.nextInspectionId();
    const state = opsStore.getState();
    const modalHtml = `
      <div class="ops-modal-backdrop" id="opsModal">
        <div class="ops-modal-content" style="max-width: 620px;">
          <h3 style="font-size: 18px; font-weight: 800; color: #075545; margin: 0 0 16px 0;">Log Property Watch Inspection (${nextId})</h3>
          <p style="font-size: 12px; color: var(--text-muted); margin: 0 0 14px 0;">Property condition evaluation for diaspora clients and property care contracts.</p>
          <form id="formNewInspection">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Target Property *</label>
                <select id="insProperty" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  ${state.properties.map(p => `<option value="${p.propertyId}">${p.propertyId} &bull; ${p.customerName || p.customerId} (${p.area})</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Inspection Date *</label>
                <input type="date" id="insDate" required value="${formatYMD(new Date())}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Inspector Name</label>
                <input type="text" id="insInspector" value="Operations Lead" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Inspection Type</label>
                <select id="insType" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  <option value="Scheduled Property Watch">Scheduled Property Watch</option>
                  <option value="Move-in">Move-in</option>
                  <option value="Move-out">Move-out</option>
                  <option value="Pre-repair">Pre-repair</option>
                  <option value="Follow-up">Follow-up</option>
                </select>
              </div>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-bottom: 14px;">
              <p style="font-size: 12px; font-weight: 700; color: #075545; margin: 0 0 10px 0; text-transform: uppercase;">Area Condition Ratings</p>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                <div>
                  <label style="font-size: 11px; font-weight: 600; color: #475569;">Roof &amp; Ceilings</label>
                  <select id="insRoof" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;">
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label style="font-size: 11px; font-weight: 600; color: #475569;">Plumbing &amp; Water</label>
                  <select id="insPlumbing" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;">
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label style="font-size: 11px; font-weight: 600; color: #475569;">Electrical &amp; DB</label>
                  <select id="insElectrical" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;">
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label style="font-size: 11px; font-weight: 600; color: #475569;">Doors, Locks &amp; Windows</label>
                  <select id="insDoors" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;">
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label style="font-size: 11px; font-weight: 600; color: #475569;">Damp &amp; Pests</label>
                  <select id="insDamp" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;">
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label style="font-size: 11px; font-weight: 600; color: #475569;">Compound &amp; Exterior</label>
                  <select id="insCompound" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;">
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>
            </div>

            <div style="margin-bottom: 12px;">
              <label style="font-size: 12px; font-weight: 700; color: #475569;">Observations &amp; Findings</label>
              <textarea id="insObservations" rows="2" placeholder="Key visual findings and status of property components..." style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;"></textarea>
            </div>

            <div style="margin-bottom: 12px;">
              <label style="font-size: 12px; font-weight: 700; color: #475569;">Recommendations</label>
              <textarea id="insRecommendations" rows="2" placeholder="Recommended preventive maintenance or urgent repairs..." style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;"></textarea>
            </div>

            <div style="margin-bottom: 14px;">
              <label style="font-size: 12px; font-weight: 700; color: #475569;">Photo Folder / Cloud Storage Link</label>
              <input type="text" id="insPhotos" placeholder="Google Drive / Dropbox link or internal storage reference" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;">
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" id="btnModalCancel" class="btn-brand-outline">Cancel</button>
              <button type="submit" class="btn-brand-primary">Save Inspection Report</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.showModal(modalHtml, () => {
      document.getElementById('formNewInspection')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const ins: PropertyInspection = {
          inspectionId: nextId,
          propertyId: (document.getElementById('insProperty') as HTMLSelectElement).value,
          inspectionDate: (document.getElementById('insDate') as HTMLInputElement).value,
          inspector: (document.getElementById('insInspector') as HTMLInputElement).value,
          inspectionType: (document.getElementById('insType') as HTMLSelectElement).value as any,
          roofAndCeiling: (document.getElementById('insRoof') as HTMLSelectElement).value as any,
          plumbing: (document.getElementById('insPlumbing') as HTMLSelectElement).value as any,
          electrical: (document.getElementById('insElectrical') as HTMLSelectElement).value as any,
          doorsLocksWindows: (document.getElementById('insDoors') as HTMLSelectElement).value as any,
          dampAndPests: (document.getElementById('insDamp') as HTMLSelectElement).value as any,
          compoundAndExterior: (document.getElementById('insCompound') as HTMLSelectElement).value as any,
          observations: (document.getElementById('insObservations') as HTMLTextAreaElement).value,
          recommendations: (document.getElementById('insRecommendations') as HTMLTextAreaElement).value,
          photosFolderReference: (document.getElementById('insPhotos') as HTMLInputElement).value,
          reportStatus: 'Draft'
        };
        opsStore.addInspection(ins);
        this.closeModal();
      });
    });
  }

  private showNewUserModal(): void {
    const nextId = opsStore.nextUserId();
    const modalHtml = `
      <div class="ops-modal-backdrop" id="opsModal">
        <div class="ops-modal-content">
          <h3 style="font-size: 18px; font-weight: 800; color: #075545; margin: 0 0 8px 0;">Add System User (${nextId})</h3>
          <p style="font-size: 12px; color: var(--text-muted); margin: 0 0 16px 0;">Provision a staff or governance account with Role-Based Access Control (RBAC) and PIN authentication.</p>
          <form id="formNewUser">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Full Name *</label>
                <input type="text" id="usrName" required placeholder="e.g. Efua Mensah" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Email Address *</label>
                <input type="email" id="usrEmail" required placeholder="efua@civitasestate.com" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Phone Number (Ghana)</label>
                <input type="text" id="usrPhone" value="0501234567" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">4-Digit Security PIN *</label>
                <input type="text" id="usrPin" value="5555" maxlength="6" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box; font-family: monospace;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Governance Role *</label>
                <select id="usrRole" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  <option value="Operations Coordinator">Operations Coordinator</option>
                  <option value="Finance & Accounts Officer">Finance &amp; Accounts Officer</option>
                  <option value="Field Supervisor">Field Supervisor</option>
                  <option value="Board / Internal Auditor">Board / Internal Auditor</option>
                  <option value="Founder / CEO">Founder / CEO</option>
                </select>
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Department *</label>
                <select id="usrDept" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  <option value="Service Operations">Service Operations</option>
                  <option value="Finance & Control">Finance &amp; Control</option>
                  <option value="Field Operations">Field Operations</option>
                  <option value="Board & Audit">Board &amp; Audit</option>
                  <option value="Executive & Governance">Executive &amp; Governance</option>
                </select>
              </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" id="btnModalCancel" class="btn-brand-outline">Cancel</button>
              <button type="submit" class="btn-brand-primary">Create User Account</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.showModal(modalHtml, () => {
      document.getElementById('formNewUser')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        opsStore.addUser({
          userId: nextId,
          fullName: (document.getElementById('usrName') as HTMLInputElement).value.trim(),
          email: (document.getElementById('usrEmail') as HTMLInputElement).value.trim(),
          phone: (document.getElementById('usrPhone') as HTMLInputElement).value.trim(),
          pinCode: (document.getElementById('usrPin') as HTMLInputElement).value.trim() || '1234',
          role: (document.getElementById('usrRole') as HTMLSelectElement).value as any,
          department: (document.getElementById('usrDept') as HTMLSelectElement).value as any,
          status: 'Active',
          createdDate: formatYMD(new Date())
        });
        this.closeModal();
      });
    });
  }

  private showModal(html: string, onMounted: () => void): void {
    const existing = document.getElementById('opsModal');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild as HTMLElement);

    document.getElementById('btnModalCancel')?.addEventListener('click', () => this.closeModal());
    onMounted();
  }

  private closeModal(): void {
    document.getElementById('opsModal')?.remove();
  }
}

// Instantiate on DOM ready
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    new OpsApp('opsMount');
  });
}
