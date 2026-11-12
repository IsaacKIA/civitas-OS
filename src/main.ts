/**
 * CIVITAS ESTATE & MAINTENANCE
 * Executive Operations & Financial Control System Application UI
 * Modern, responsive, zero-external-dependency TypeScript interface.
 */

import { opsStore, type OpsDatabaseState, type UploadedDocumentPayload } from './store.ts';
import { createDemoState } from './demo-data.ts';
import { roundMoney, formatYMD } from './calculations.ts';
import {
  renderPrintQuoteHtml,
  renderPrintInvoiceHtml,
  renderPrintReceiptHtml,
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
  private selectedPrintDocKeys: Set<string> = new Set();
  private printDocFilter: 'all' | 'quote' | 'invoice' | 'receipt' | 'inspection' = 'all';
  private tableSearchQuery: string = '';

  constructor(mountId: string) {
    const el = document.getElementById(mountId);
    if (!el) throw new Error(`Mount element #${mountId} not found`);
    this.mountEl = el;

    // Listen to changes in the store
    opsStore.subscribe(() => {
      this.render();
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (ev) => {
        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
          const searchEl = document.getElementById('inputGlobalTableSearch') as HTMLInputElement | null;
          if (searchEl) {
            ev.preventDefault();
            searchEl.focus();
            searchEl.select();
          }
        } else if (ev.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'SELECT') {
          const searchEl = document.getElementById('inputGlobalTableSearch') as HTMLInputElement | null;
          if (searchEl) {
            ev.preventDefault();
            searchEl.focus();
          }
        } else if (ev.key === 'Escape') {
          const modal = document.getElementById('opsModal');
          if (modal) {
            this.closeModal();
          } else if (this.tableSearchQuery) {
            this.tableSearchQuery = '';
            const searchEl = document.getElementById('inputGlobalTableSearch') as HTMLInputElement | null;
            if (searchEl) searchEl.value = '';
            this.applyLiveTableFilter('');
          }
        }
      });
    }

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

    const allowedTabs = this.getAllowedTabsForRole(currentUser.role);
    if (!allowedTabs.includes(this.currentTab)) {
      this.currentTab = allowedTabs[0] || 'operations';
    }
    const canSeeTab = (tab: ActiveTab) => allowedTabs.includes(tab);

    this.mountEl.innerHTML = `
      <div class="dashboard-shell">
        <!-- Left Sidebar Navigation (Role-Filtered) -->
        <aside class="dashboard-sidebar">
          <div class="sidebar-brand">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 34px; height: 34px; border-radius: 8px; background: #ffffff; padding: 3px; display: flex; align-items: center; justify-content: center;">
                <img src="/assets/logos/Civitas_Symbol_256.png" alt="Civitas" style="width: 100%; height: 100%; object-fit: contain;" />
              </div>
              <div>
                <h1 style="font-size: 15px; font-weight: 800; margin: 0; color: #ffffff; letter-spacing: -0.2px; line-height: 1.2;">
                  Civitas Estate
                </h1>
                <p style="font-size: 10px; color: #fed7aa; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
                  Accra &amp; Tema
                </p>
              </div>
            </div>
          </div>

          <div style="flex: 1; overflow-y: auto; padding-bottom: 16px;">
            ${(canSeeTab('dashboard') || canSeeTab('users') || canSeeTab('governance')) ? `
              <div class="sidebar-group-label">Overview &amp; Governance</div>
            ` : ''}
            ${canSeeTab('dashboard') ? `
              <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
                <span>Executive Overview</span>
              </button>
            ` : ''}
            ${canSeeTab('users') ? `
              <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'users' ? 'active' : ''}" data-tab="users">
                <span>Team &amp; Approvals</span>
                ${totalPendingApprovals > 0 ? `<span class="ops-badge badge-attention" style="font-size: 10px; padding: 2px 6px;">${totalPendingApprovals}</span>` : ''}
              </button>
            ` : ''}
            ${canSeeTab('governance') ? `
              <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'governance' ? 'active' : ''}" data-tab="governance">
                <span>Risk &amp; Compliance</span>
              </button>
            ` : ''}

            ${(canSeeTab('sales') || canSeeTab('operations') || canSeeTab('contractors')) ? `
              <div class="sidebar-group-label">Operations</div>
            ` : ''}
            ${canSeeTab('sales') ? `
              <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'sales' ? 'active' : ''}" data-tab="sales">
                <span>Clients &amp; Quotes</span>
                <span style="font-size: 11px; opacity: 0.65;">${state.customers.length}</span>
              </button>
            ` : ''}
            ${canSeeTab('operations') ? `
              <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'operations' ? 'active' : ''}" data-tab="operations">
                <span>Jobs &amp; Inspections</span>
                <span style="font-size: 11px; opacity: 0.65;">${state.jobs.length}</span>
              </button>
            ` : ''}
            ${canSeeTab('contractors') ? `
              <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'contractors' ? 'active' : ''}" data-tab="contractors">
                <span>Field Workforce</span>
                <span style="font-size: 11px; opacity: 0.65;">${state.contractors.length}</span>
              </button>
            ` : ''}

            ${(canSeeTab('financial') || canSeeTab('receivables') || canSeeTab('expenses') || canSeeTab('grant') || canSeeTab('assets')) ? `
              <div class="sidebar-group-label">Finance</div>
            ` : ''}
            ${canSeeTab('financial') ? `
              <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'financial' ? 'active' : ''}" data-tab="financial">
                <span>Financial Reports</span>
              </button>
            ` : ''}
            ${canSeeTab('receivables') ? `
              <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'receivables' ? 'active' : ''}" data-tab="receivables">
                <span>Invoices &amp; Receipts</span>
                <span style="font-size: 11px; opacity: 0.65;">${state.invoices.length}</span>
              </button>
            ` : ''}
            ${canSeeTab('expenses') ? `
              <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'expenses' ? 'active' : ''}" data-tab="expenses">
                <span>Expenses</span>
                <span style="font-size: 11px; opacity: 0.65;">${state.expenses.length}</span>
              </button>
            ` : ''}
            ${canSeeTab('assets') ? `
              <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'assets' ? 'active' : ''}" data-tab="assets">
                <span>Equipment &amp; Assets</span>
                <span style="font-size: 11px; opacity: 0.65;">${state.assets.length}</span>
              </button>
            ` : ''}
            ${canSeeTab('grant') ? `
              <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'grant' ? 'active' : ''}" data-tab="grant">
                <span>Grant &amp; Funding</span>
              </button>
            ` : ''}

            ${canSeeTab('print') ? `
              <div class="sidebar-group-label">Documents</div>
              <button class="sidebar-nav-item ops-nav-btn ${this.currentTab === 'print' ? 'active' : ''}" data-tab="print">
                <span>Print &amp; PDF Suite</span>
              </button>
            ` : ''}
          </div>

          <!-- Sidebar Footer -->
          <div style="padding: 14px 16px; border-top: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.22); font-size: 11px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
              <div style="width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, #E4693F, #c85229); color: #ffffff; font-weight: 800; font-size: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.25);">
                ${currentUser.fullName.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()}
              </div>
              <div style="min-width: 0; flex: 1;">
                <div style="font-weight: 700; color: #ffffff; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${currentUser.fullName}</div>
                <div style="color: #fed7aa; font-weight: 600; font-size: 10px; display: flex; align-items: center; gap: 5px;">
                  <span style="width: 6px; height: 6px; border-radius: 50%; background: #4ade80; display: inline-block;"></span>
                  ${currentUser.role}
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button id="btnGoLanding" class="sidebar-footer-btn">
                🏠 Home
              </button>
              <button id="btnLogout" class="sidebar-footer-btn-danger">
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        <!-- Main Workspace -->
        <div class="dashboard-main">
          <!-- Clean Executive Topbar -->
          <header class="dashboard-topbar">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <span style="font-size: 16px; font-weight: 800; color: #043D33;">
                ${this.getTabTitle(this.currentTab)}
              </span>
              <span class="ops-badge ${currentUser.role === 'Founder / CEO' ? 'badge-ok' : currentUser.role === 'Board / Internal Auditor' ? 'badge-reconciled' : 'badge-pending'}">
                ${currentUser.role}
              </span>
            </div>

            <div class="ops-search-shell">
              <span class="ops-search-icon">🔍</span>
              <input
                type="search"
                id="inputGlobalTableSearch"
                class="ops-search-input"
                placeholder="Filter records in this view..."
                value="${this.escapeHtml(this.tableSearchQuery)}"
              />
              <span id="badgeSearchMatchCount" class="ops-search-kbd">Ctrl+K</span>
            </div>

            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              ${opsStore.isDemoMode() ? `
                <div style="display: flex; align-items: center; gap: 6px; background: #fffbeb; border: 1px solid #fde68a; padding: 4px 10px; border-radius: 999px;">
                  <span style="font-size: 10px; font-weight: 700; color: #92400e;">Demo Mode</span>
                  ${users.filter(u => u.status === 'Active').length > 1 ? `
                    <select id="selectQuickSwitchUser" style="border: none; background: transparent; font-size: 11px; font-weight: 700; color: #075545; cursor: pointer; outline: none;">
                      ${users.filter(u => u.status === 'Active').map(u => `
                        <option value="${u.userId}" ${u.userId === currentUser.userId ? 'selected' : ''}>
                          ${u.fullName} (${u.role})
                        </option>
                      `).join('')}
                    </select>
                  ` : ''}
                  <button id="btnToggleSandboxMode" style="border: none; background: #fef3c7; color: #92400e; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; cursor: pointer;">
                    Exit Demo
                  </button>
                </div>
              ` : ''}

              ${opsStore.canCurrentUser('MANAGE_INVOICES_PAYMENTS') || opsStore.canCurrentUser('MANAGE_CUSTOMERS_QUOTES') || opsStore.canCurrentUser('RECORD_EXPENSE') ? `
                <button id="btnSmartUploadDoc" class="btn-brand-outline" style="font-size: 12px; padding: 7px 14px; border-radius: 999px; border-color: #075545; color: #075545; font-weight: 700;">
                  📤 Upload Quote / Invoice / Receipt
                </button>
              ` : ''}

              ${opsStore.canCurrentUser('MANAGE_USERS') ? `
                <button id="btnTopbarAddUser" class="btn-brand-primary" style="font-size: 12px; padding: 7px 14px; border-radius: 999px;">
                  + Add Staff User
                </button>
              ` : ''}
            </div>
          </header>

          ${isReadOnlyAuditor ? `
            <div style="background: #eef2ff; border-bottom: 1px solid #c7d2fe; padding: 8px 24px; font-size: 12px; color: #3730a3; display: flex; justify-content: space-between; align-items: center;">
              <span><strong>Read-Only Audit View:</strong> Signed in as <strong>${currentUser.fullName}</strong>.</span>
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
    if (this.tableSearchQuery) {
      this.applyLiveTableFilter(this.tableSearchQuery);
    }
  }

  private getAllowedTabsForRole(role: string): ActiveTab[] {
    switch (role) {
      case 'Founder / CEO':
        return ['dashboard', 'users', 'sales', 'operations', 'contractors', 'financial', 'receivables', 'expenses', 'assets', 'grant', 'governance', 'print'];
      case 'Operations Coordinator':
        return ['dashboard', 'sales', 'operations', 'contractors', 'print'];
      case 'Finance & Accounts Officer':
        return ['dashboard', 'financial', 'receivables', 'expenses', 'assets', 'grant', 'print'];
      case 'Field Supervisor':
        return ['operations', 'contractors', 'print'];
      case 'Board / Internal Auditor':
        return ['dashboard', 'financial', 'receivables', 'expenses', 'grant', 'governance', 'users', 'print'];
      default:
        return ['operations', 'print'];
    }
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
  // STAGE 1: WORLD-CLASS ICONIC MINIMALIST LANDING PAGE
  // ==========================================
  private renderLandingScreen(
    state: OpsDatabaseState,
    _mgmt: ReturnType<typeof opsStore.getManagementAccounts>,
    _evaluation: ReturnType<typeof opsStore.getChecksEvaluation>,
    _currency: string
  ): string {
    const activeUser = opsStore.getCurrentUser();

    return `
      <div class="landing-shell">
        <!-- Floating Glass Navigation Dock -->
        <header class="landing-nav">
          <div class="landing-dock">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="/assets/logos/Civitas_Symbol_256.png" alt="Civitas" style="width: 28px; height: 28px; object-fit: contain;" />
              <span style="font-family: var(--font-serif); font-size: 18px; font-weight: 700; color: #043D33; letter-spacing: -0.01em;">
                Civitas Estate
              </span>
            </div>

            <div style="display: flex; align-items: center; gap: 10px;">
              <a href="https://www.civitasestate.com" target="_blank" rel="noopener" style="color: #64748b; font-size: 12px; font-weight: 600; text-decoration: none; padding: 6px 12px;">
                Accra &middot; Tema &nearr;
              </a>
              ${activeUser ? `
                <button id="btnLandingResumeDashboard" class="btn-iconic-secondary" style="padding: 8px 18px; font-size: 12px;">
                  Dashboard &rarr;
                </button>
              ` : ''}
              <button id="btnLandingToLogin" class="btn-iconic-primary" style="padding: 9px 22px; font-size: 12px; box-shadow: none;">
                Sign In
              </button>
            </div>
          </div>
        </header>

        <!-- Iconic Minimalist Centerpiece -->
        <main class="landing-centerpiece">
          <div class="landing-container">
            <div class="landing-emblem-frame">
              <img
                src="/assets/logos/Civitas_Official_Logo_Transparent.png"
                alt="${state.settings.companyName}"
                class="landing-emblem-logo"
              />
            </div>

            <h1 class="landing-headline">
              Smart Living.<br /><em>Sustainable Legacy.</em>
            </h1>

            <p class="landing-subheadline">
              Property Care &amp; Estate Stewardship
            </p>

            <div class="landing-cta-group">
              <button id="btnHeroLogin" class="btn-iconic-primary">
                Enter Portal &rarr;
              </button>
              <button id="btnHeroDemoLogin" class="btn-iconic-secondary">
                Interactive Demo
              </button>
            </div>

            <!-- Whisper-Quiet 3-Pillar Glass Strip -->
            <div>
              <div class="landing-pill-strip">
                <div class="landing-division-chip">
                  <span class="chip-num">01</span> Civitas Fix
                </div>
                <span style="color: rgba(4, 61, 51, 0.15);">&bull;</span>
                <div class="landing-division-chip">
                  <span class="chip-num">02</span> Civitas Care
                </div>
                <span style="color: rgba(4, 61, 51, 0.15);">&bull;</span>
                <div class="landing-division-chip">
                  <span class="chip-num">03</span> Property Watch
                </div>
              </div>
            </div>
          </div>
        </main>

        <!-- Minimal Footer -->
        <footer class="landing-footer">
          &copy; ${state.settings.reportingYear} ${state.settings.companyName} &middot; Greater Accra &amp; Tema, Ghana
        </footer>
      </div>
    `;
  }

  // ==========================================
  // STAGE 2: CLEAN SINGLE-CARD LOGIN PORTAL
  // ==========================================
  private renderLoginScreen(_state: OpsDatabaseState): string {
    return `
      <div class="login-shell">
        <div class="login-card-centered">
          <div style="text-align: center; margin-bottom: 28px;">
            <div style="display: inline-flex; padding: 14px 24px; background: #FAF8F5; border: 1px solid rgba(4, 61, 51, 0.08); border-radius: 18px; margin-bottom: 18px;">
              <img src="/assets/logos/Civitas_Official_Logo_Transparent.png" alt="Civitas Estate" style="height: 48px; width: auto; object-fit: contain;" />
            </div>
            <h2 style="font-family: var(--font-serif); font-size: 28px; font-weight: 700; color: #043D33; margin: 0 0 4px 0; letter-spacing: -0.02em;">
              Welcome Back
            </h2>
            <p style="font-size: 13px; color: #64748b; margin: 0;">
              Sign in to Civitas Operations Portal
            </p>
          </div>

          ${this.loginError ? `
            <div style="background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 10px 14px; border-radius: 10px; font-size: 12px; font-weight: 600; margin-bottom: 18px; text-align: center;">
              ${this.loginError}
            </div>
          ` : ''}

          <form id="formStaffLogin">
            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                Email or User ID
              </label>
              <input type="text" id="loginEmailInput" required value="admin@civitasestate.com" placeholder="name@civitasestate.com" style="width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 13px; box-sizing: border-box; outline: none;">
            </div>

            <div style="margin-bottom: 24px;">
              <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                Passcode
              </label>
              <input type="password" id="loginPinInput" required placeholder="••••••••" autocomplete="current-password" style="width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 13px; box-sizing: border-box; outline: none;">
            </div>

            <button type="submit" class="btn-iconic-primary" style="width: 100%; justify-content: center; padding: 14px; font-size: 14px;">
              Sign In &rarr;
            </button>
          </form>

          <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
            <button type="button" id="btnLoginBackToLanding" style="background: none; border: none; color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer; padding: 0;">
              &larr; Back to Home
            </button>
            <button type="button" id="btnLaunchIsolatedDemo" style="background: none; border: none; color: #075545; font-size: 12px; font-weight: 700; cursor: pointer; padding: 0;">
              Explore Demo &rarr;
            </button>
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
      opsStore.setDemoSandboxMode(true, createDemoState);
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
      opsStore.setDemoSandboxMode(false);
      const res = opsStore.authenticateUser(emailOrId, pin);
      if (!res.success) {
        this.loginError = res.error || 'Authentication failed';
        this.render();
        return;
      }
      this.loginError = '';
      this.setScreen('dashboard');
    });

    document.getElementById('btnLaunchIsolatedDemo')?.addEventListener('click', () => {
      opsStore.setDemoSandboxMode(true, createDemoState);
      opsStore.loginAsUser('U0001');
      this.loginError = '';
      this.setScreen('dashboard');
    });

    this.mountEl.querySelectorAll<HTMLButtonElement>('.btn-select-login-user').forEach(btn => {
      btn.addEventListener('click', () => {
        const email = btn.dataset.email;
        const emailInput = document.getElementById('loginEmailInput') as HTMLInputElement | null;
        const pinInput = document.getElementById('loginPinInput') as HTMLInputElement | null;
        if (email && emailInput) {
          emailInput.value = email;
          if (pinInput) {
            pinInput.value = '';
            pinInput.focus();
          }
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
        <td style="font-size: 11px; color: #64748b;">${u.lastLogin || 'Never'}</td>
        <td>
          <span class="ops-badge ${u.status === 'Active' ? 'badge-ok' : 'badge-attention'}">${u.status}</span>
        </td>
        <td style="white-space: nowrap;">
          ${opsStore.isDemoMode() && u.status === 'Active' && currentUser?.userId !== u.userId ? `
            <button class="btn-brand-outline btn-switch-to-user" data-id="${u.userId}" style="padding: 3px 8px; font-size: 11px;">
              Switch
            </button>
          ` : ''}
          ${isCEO && u.userId !== 'U0001' ? `
            <button class="btn-brand-outline btn-toggle-user-status" data-id="${u.userId}" data-status="${u.status}" style="padding: 3px 8px; font-size: 11px; color: ${u.status === 'Active' ? '#b45309' : '#15803d'}; margin-left: 4px;">
              ${u.status === 'Active' ? 'Suspend' : 'Activate'}
            </button>
            <button class="btn-brand-outline btn-reset-user-pin" data-id="${u.userId}" data-name="${u.fullName}" style="padding: 3px 8px; font-size: 11px; color: #1d4ed8; margin-left: 4px;">
              Reset PIN
            </button>
            <button class="btn-brand-outline btn-delete-user" data-id="${u.userId}" data-name="${u.fullName}" style="padding: 3px 8px; font-size: 11px; color: #b91c1c; border-color: #fecaca; margin-left: 4px;">
              Delete
            </button>
          ` : `<span style="font-size: 11px; color: #075545; font-weight: 700;">Primary Founder</span>`}
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
        <td>${e.submittedBy || 'Staff'}</td>
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
        <td style="font-weight: 600;">${p.closedBy || '-'}${p.reopenedBy ? `<div style="font-size:10px; color:#b45309;">Reopened by ${p.reopenedBy}: ${p.reopenReason}</div>` : ''}</td>
        <td>${p.closedDate || '-'}</td>
        <td style="text-align: center;">${p.invoicesAtClose ?? 0} &rarr; ${p.invoicesNow ?? 0}</td>
        <td style="text-align: center;">${p.paymentsAtClose ?? 0} &rarr; ${p.paymentsNow ?? 0}</td>
        <td style="text-align: center;">${p.expensesAtClose ?? 0} &rarr; ${p.expensesNow ?? 0}</td>
        <td style="text-align: center;">${p.assignmentsAtClose ?? 0} &rarr; ${p.assignmentsNow ?? 0}</td>
        <td>
          ${p.changedFlag ? `<span class="ops-badge badge-attention">${p.changedFlag}</span>` : `<span class="ops-badge badge-ok">Protected &amp; Intact</span>`}
          ${isCEO && p.status === 'Closed' ? `
            <button class="btn-brand-outline btn-reopen-period" data-month="${p.month}" style="padding: 2px 8px; font-size: 10px; margin-left: 6px; color: #b45309; border-color: #fcd34d;">
              🔓 Reopen
            </button>
          ` : ''}
        </td>
      </tr>
    `).join('');

    const auditIntegrity = opsStore.verifyAuditTrailIntegrity();
    const auditRowsHtml = (state.auditLogs || []).slice(0, 30).map(log => `
      <tr>
        <td style="font-family: monospace; font-size: 11px; color: #64748b;">${log.timestamp.replace('T', ' ').substring(0, 19)}</td>
        <td style="font-weight: 700; color: #075545;">${log.actor}</td>
        <td>
          <span class="ops-badge ${log.action === 'APPROVE' || log.action === 'CREATE' ? 'badge-ok' : log.action === 'REJECT' || log.action === 'DELETE' || log.action === 'SECURITY_ALERT' || log.action === 'LOGIN_FAILED' ? 'badge-attention' : log.action === 'CLOSE_PERIOD' ? 'badge-reconciled' : 'badge-pending'}">
            ${log.action}
          </span>
        </td>
        <td style="font-weight: 600;">${log.entity}</td>
        <td style="font-family: monospace;">${log.entityId}</td>
        <td style="font-size: 12px; color: #334155;">
          ${log.details || '-'}
        </td>
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
          <p style="font-size: 11px; color: ${auditIntegrity.valid ? '#15803d' : '#b91c1c'}; font-weight: 600; margin: 4px 0 0 0;">
            ${auditIntegrity.valid ? '✓ Hash Chain Verified (Unlimited Retention)' : '⚠️ Hash Chain Alert'}
          </p>
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

      <!-- 5. System Activity Log -->
      <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0 0 12px 0;">
        5. Recent System Activity Log
      </h2>
      <div class="ops-table-container" style="margin-bottom: 32px;">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Operator</th>
              <th>Action</th>
              <th>Module</th>
              <th>Reference</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            ${auditRowsHtml || '<tr><td colspan="6" style="text-align: center; color: #64748b;">No activity recorded yet.</td></tr>'}
          </tbody>
        </table>
      </div>

      ${isCEO ? `
        <!-- 6. Founder System Data & Backup Utilities (Tucked out of main topbar) -->
        <div class="ops-card" style="background: #f8fafc; border: 1px solid #e2e8f0;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
              <h3 style="font-size: 14px; font-weight: 800; color: #043D33; margin: 0 0 2px 0;">System Data &amp; Backup Utilities</h3>
              <p style="font-size: 11px; color: #64748b; margin: 0;">Automatic backend persistence is active. Use these utilities for manual export, restore, or sandbox testing.</p>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <button id="btnExportJson" class="btn-brand-outline" style="font-size: 11px; padding: 6px 12px;">
                Export Backup JSON
              </button>
              <button id="btnImportJson" class="btn-brand-outline" style="color: #1d4ed8; border-color: #bfdbfe; font-size: 11px; padding: 6px 12px;">
                Restore Backup JSON
              </button>
              <input type="file" id="inputImportJson" accept=".json" style="display: none;" />
              <button id="btnPreloadDemo" class="btn-brand-outline" style="font-size: 11px; padding: 6px 12px;">
                Load Sample Data
              </button>
              <button id="btnResetClean" class="btn-brand-outline" style="color: #b91c1c; border-color: #fecaca; font-size: 11px; padding: 6px 12px;">
                Reset Database
              </button>
            </div>
          </div>
        </div>
      ` : ''}
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
    const jobsInProgress = state.jobs.filter(j => ['Scheduled', 'Assigned', 'In progress', 'Quality inspection'].includes(j.status)).length;
    const jobsCompleted = state.jobs.filter(j => ['Accepted by customer', 'Invoiced', 'Paid', 'Closed'].includes(j.status)).length;
    const jobsOverdue = state.jobs.filter(j => j.overdueFlag === 'Overdue').length;
    const contractorDays = state.assignments.reduce((s, a) => s + (a.personDays || 0), 0);
    const unpaidContractorPay = roundMoney(state.assignments.reduce((s, a) => s + (a.unpaidAmount || 0), 0));
    const acceptedQuotesCount = state.quotes.filter(q => q.status === 'Accepted').length;
    const quoteConversionRate = state.quotes.length > 0 ? Math.round((acceptedQuotesCount / state.quotes.length) * 100) : 0;
    const recurringClients = state.customers.filter(c => (c.jobs || 0) > 1 || c.category === 'Diaspora owner' || c.category === 'Property manager').length;

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

    const collectionPct = totalRev > 0 ? Math.min(100, Math.round((cashRec / totalRev) * 100)) : 0;
    const grossMarginPct = mgmt.yearTotal.contributionMargin ? Math.round(mgmt.yearTotal.contributionMargin * 100) : 0;
    const fixRev = roundMoney(state.invoices.filter(i => i.cancelled !== 'Yes' && i.division === 'Civitas Fix').reduce((s, i) => s + (i.netRevenue || i.amountBeforeTax || 0), 0));
    const careRev = roundMoney(state.invoices.filter(i => i.cancelled !== 'Yes' && i.division === 'Civitas Care').reduce((s, i) => s + (i.netRevenue || i.amountBeforeTax || 0), 0));
    const watchRev = roundMoney(state.invoices.filter(i => i.cancelled !== 'Yes' && i.division === 'Civitas Property Watch').reduce((s, i) => s + (i.netRevenue || i.amountBeforeTax || 0), 0));
    const divTotal = Math.max(1, fixRev + careRev + watchRev);
    const fixPct = Math.round((fixRev / divTotal) * 100);
    const carePct = Math.round((careRev / divTotal) * 100);
    const watchPct = Math.max(0, 100 - fixPct - carePct);

    return `
      <!-- Quick Interactive Action Bar -->
      <div class="ops-card" style="padding: 14px 18px; margin-bottom: 20px; background: linear-gradient(135deg, #043D33 0%, #075545 100%); color: #ffffff; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #fed7aa; font-weight: 800;">Interactive Executive Workspace</div>
          <div style="font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.92);">Click any KPI card below to drill directly into its ledger, or launch a workflow action:</div>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button type="button" id="btnDashQuickUpload" class="btn-brand-terracotta" style="border-radius: 999px; padding: 8px 16px;">
            📤 Smart Upload Document
          </button>
          <button type="button" class="btn-brand-outline" data-goto-tab="print" style="border-radius: 999px; background: rgba(255,255,255,0.12); color: #ffffff; border-color: rgba(255,255,255,0.28);">
            🖨️ Print &amp; PDF Suite
          </button>
          <button type="button" class="btn-brand-outline" data-goto-tab="financial" style="border-radius: 999px; background: rgba(255,255,255,0.12); color: #ffffff; border-color: rgba(255,255,255,0.28);">
            📊 12-Month P&amp;L
          </button>
        </div>
      </div>

      <!-- 3 Core Management Pulse Questions Banner (Phase 7) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-bottom: 20px;">
        <div class="ops-card ops-kpi-interactive" data-goto-tab="sales" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 5px solid #075545; padding: 14px 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 11px; font-weight: 800; color: #075545; text-transform: uppercase;">Q1: Are We Getting Customers?</div>
            <span class="kpi-drill-hint">Open Sales &rarr;</span>
          </div>
          <div style="font-size: 18px; font-weight: 800; color: #1e293b; margin: 4px 0;">
            ${enqCount} Enquiries &bull; ${quoteConversionRate}% Quote Conversion
          </div>
          <div style="font-size: 11px; color: #475569;">
            Active Quotes: <strong>${currency}${openQuoteVal.toFixed(2)}</strong> &bull; Recurring / Portfolio Clients: <strong>${recurringClients}</strong>
          </div>
        </div>
        <div class="ops-card ops-kpi-interactive" data-goto-tab="operations" style="background: #fff7ed; border: 1px solid #fed7aa; border-left: 5px solid #FF5800; padding: 14px 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 11px; font-weight: 800; color: #9a3412; text-transform: uppercase;">Q2: Are We Completing Profitable Jobs?</div>
            <span class="kpi-drill-hint">Open Jobs &rarr;</span>
          </div>
          <div style="font-size: 18px; font-weight: 800; color: #1e293b; margin: 4px 0;">
            ${jobsCompleted}/${jobsBooked} Completed &bull; ${grossMarginPct}% Gross Margin
          </div>
          <div style="font-size: 11px; color: #475569;">
            In Progress: <strong>${jobsInProgress}</strong> &bull; Gross Profit: <strong>${currency}${grossContr.toFixed(2)}</strong> (Target &ge; 35%)
          </div>
        </div>
        <div class="ops-card ops-kpi-interactive" data-goto-tab="receivables" style="background: #eff6ff; border: 1px solid #bfdbfe; border-left: 5px solid #1d4ed8; padding: 14px 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 11px; font-weight: 800; color: #1e40af; text-transform: uppercase;">Q3: Are We Collecting Enough Cash to Operate?</div>
            <span class="kpi-drill-hint">Open Cash &rarr;</span>
          </div>
          <div style="font-size: 18px; font-weight: 800; color: #1e293b; margin: 4px 0;">
            ${currency}${cashRec.toFixed(2)} Collected &bull; ${currency}${cashBal.toFixed(2)} Cash
          </div>
          <div style="font-size: 11px; color: #475569;">
            Receivables Due: <strong>${currency}${receivables.toFixed(2)}</strong> &bull; Contractor Pay Due: <strong>${currency}${unpaidContractorPay.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      <!-- Interactive Visual Telemetry Strip -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="ops-card" style="padding: 16px 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #075545;">Cash Collection Efficiency</span>
            <span class="ops-badge ${collectionPct >= 80 ? 'badge-ok' : 'badge-pending'}">${collectionPct}% Collected</span>
          </div>
          <div style="height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-bottom: 6px;">
            <div style="width: ${collectionPct}%; height: 100%; background: linear-gradient(90deg, #075545, #10b981); border-radius: 999px; transition: width 0.5s ease;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b;">
            <span>Collected: <strong>${currency}${cashRec.toFixed(2)}</strong></span>
            <span>Billed: <strong>${currency}${totalRev.toFixed(2)}</strong></span>
          </div>
        </div>

        <div class="ops-card" style="padding: 16px 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #075545;">Revenue Share by Division</span>
            <span style="font-size: 11px; font-weight: 700; color: #64748b;">Fix ${fixPct}% &bull; Care ${carePct}% &bull; Watch ${watchPct}%</span>
          </div>
          <div style="height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; display: flex; margin-bottom: 6px;">
            <div style="width: ${fixPct}%; height: 100%; background: #075545;" title="Civitas Fix: ${currency}${fixRev.toFixed(2)}"></div>
            <div style="width: ${carePct}%; height: 100%; background: #E4693F;" title="Civitas Care: ${currency}${careRev.toFixed(2)}"></div>
            <div style="width: ${watchPct}%; height: 100%; background: #2563eb;" title="Property Watch: ${currency}${watchRev.toFixed(2)}"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b;">
            <span><strong style="color:#075545;">● Fix:</strong> ${currency}${fixRev.toFixed(0)}</span>
            <span><strong style="color:#E4693F;">● Care:</strong> ${currency}${careRev.toFixed(0)}</span>
            <span><strong style="color:#2563eb;">● Watch:</strong> ${currency}${watchRev.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <!-- Top Row: Money Overview -->
      <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0 0 14px 0; letter-spacing: 0.5px;">
        1. Financial &amp; Cash Flow Overview (${state.settings.reportingYear} YTD)
      </h2>
      <div class="ops-kpi-grid">
        <div class="ops-card ops-kpi-interactive" data-goto-tab="receivables">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0;">Revenue Invoiced</p>
            <span class="kpi-drill-hint">Invoices &rarr;</span>
          </div>
          <h3 style="font-size: 24px; font-weight: 800; color: #075545; margin: 0;">${currency}${totalRev.toFixed(2)}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Before tax, net of credit notes</p>
        </div>

        <div class="ops-card ops-kpi-interactive" data-goto-tab="receivables">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0;">Cash Received</p>
            <span class="kpi-drill-hint">Receipts &rarr;</span>
          </div>
          <h3 style="font-size: 24px; font-weight: 800; color: #15803d; margin: 0;">${currency}${cashRec.toFixed(2)}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Payments register only</p>
        </div>

        <div class="ops-card ops-kpi-interactive" data-goto-tab="receivables">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0;">Outstanding Receivables</p>
            <span class="kpi-drill-hint">Ageing &rarr;</span>
          </div>
          <h3 style="font-size: 24px; font-weight: 800; color: ${receivables > 0 ? '#b91c1c' : '#1e293b'}; margin: 0;">${currency}${receivables.toFixed(2)}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Unpaid invoice balances</p>
        </div>

        <div class="ops-card ops-kpi-interactive" data-goto-tab="expenses">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0;">Operating Expenses</p>
            <span class="kpi-drill-hint">Expenses &rarr;</span>
          </div>
          <h3 style="font-size: 24px; font-weight: 800; color: #1e293b; margin: 0;">${currency}${opex.toFixed(2)}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Overhead running costs</p>
        </div>
      </div>

      <!-- Second Row: Margin & Balance Sheet -->
      <div class="ops-kpi-grid">
        <div class="ops-card ops-kpi-interactive" data-goto-tab="financial">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0;">Gross Contribution</p>
            <span class="kpi-drill-hint">P&amp;L &rarr;</span>
          </div>
          <h3 style="font-size: 22px; font-weight: 800; color: #075545; margin: 0;">${currency}${grossContr.toFixed(2)}</h3>
          <p style="font-size: 11px; color: #15803d; margin: 4px 0 0 0; font-weight: 600;">Margin: ${grossMarginPct}% (Min: 35%)</p>
        </div>

        <div class="ops-card ops-kpi-interactive" data-goto-tab="financial">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0;">Operating Profit / (Loss)</p>
            <span class="kpi-drill-hint">Accounts &rarr;</span>
          </div>
          <h3 style="font-size: 22px; font-weight: 800; color: ${opProfit >= 0 ? '#15803d' : '#b91c1c'}; margin: 0;">${currency}${opProfit.toFixed(2)}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">After depreciation, before tax</p>
        </div>

        <div class="ops-card ops-kpi-interactive" data-goto-tab="financial">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0;">Available Cash Balance</p>
            <span class="kpi-drill-hint">Cash Flow &rarr;</span>
          </div>
          <h3 style="font-size: 22px; font-weight: 800; color: #075545; margin: 0;">${currency}${cashBal.toFixed(2)}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Reserve threshold: ${currency}${state.settings.minimumCashReserve}</p>
        </div>

        <div class="ops-card ops-kpi-interactive" data-goto-tab="financial">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0;">Working Capital</p>
            <span class="kpi-drill-hint">Balance Sheet &rarr;</span>
          </div>
          <h3 style="font-size: 22px; font-weight: 800; color: #075545; margin: 0;">${currency}${workingCap.toFixed(2)}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Cash + Receivables &minus; Payables</p>
        </div>
      </div>

      <!-- Third Row: Activity & Service Delivery -->
      <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 24px 0 14px 0; letter-spacing: 0.5px;">
        2. Sales &amp; Operations Activity
      </h2>
      <div class="ops-kpi-grid">
        <div class="ops-card ops-kpi-interactive" data-goto-tab="sales">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0;">Active Customers</p>
            <span class="kpi-drill-hint">Clients &rarr;</span>
          </div>
          <h3 style="font-size: 22px; font-weight: 800; color: #1e293b; margin: 0;">${activeCust}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Total registered: ${newCust}</p>
        </div>

        <div class="ops-card ops-kpi-interactive" data-goto-tab="sales">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0;">Enquiries Received</p>
            <span class="kpi-drill-hint">Pipeline &rarr;</span>
          </div>
          <h3 style="font-size: 22px; font-weight: 800; color: #1e293b; margin: 0;">${enqCount}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Pipeline opportunities</p>
        </div>

        <div class="ops-card ops-kpi-interactive" data-goto-tab="sales">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0;">Open Quotations Value</p>
            <span class="kpi-drill-hint">Quotes &rarr;</span>
          </div>
          <h3 style="font-size: 22px; font-weight: 800; color: #E4693F; margin: 0;">${currency}${openQuoteVal.toFixed(2)}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Status: Sent; awaiting decision</p>
        </div>

        <div class="ops-card ops-kpi-interactive" data-goto-tab="operations">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <p style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0;">Jobs (Done / Overdue)</p>
            <span class="kpi-drill-hint">Dispatch &rarr;</span>
          </div>
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
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
        <div>
          <h2 style="font-size: 18px; font-weight: 800; color: #075545; margin: 0;">12-Month Management Accounts (${state.settings.reportingYear})</h2>
          <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">
            Reconciled from operational sub-ledgers (Invoices, Receipts, Assignments, Expenses, and Assets).
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; font-size: 11px;">
          <span style="font-weight: 700; color: #075545;">GRA Tax Configuration:</span>
          <span>Apply Tax: <strong>${state.settings.applyTax}</strong> (${Math.round((state.settings.taxRate || 0) * 100)}%)</span>
        </div>
      </div>

      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #075545; padding: 10px 14px; border-radius: 6px; margin-bottom: 18px; font-size: 11px; color: #334155;">
        <strong>Accounting Basis &amp; Scope Disclosure:</strong> Revenue is recognized on an accrual basis from issued Tax Invoices net of credit notes (Quotations are never recognized as revenue). Cash Flow is tracked strictly on a cash basis by payment date. These statements represent <em>Transaction-Reconciled Operational Management Accounts</em>; statutory year-end IFRS financial statements and GRA tax filings (VAT/NHIL/GETFund/Withholding Tax) should be reviewed by a Chartered Accountant (ICAG).
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
          <button class="btn-brand-outline btn-print-receipt" data-id="${p.paymentId}" style="padding: 2px 8px; font-size: 10px; margin-left: 4px;">
            Print Receipt
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
        <div style="display: flex; gap: 8px;">
          <button id="btnUploadInvoiceQuick" class="btn-brand-outline" style="border-color: #075545; color: #075545; font-weight: 700;">📤 Upload Invoice</button>
          <button id="btnNewInvoice" class="btn-brand-primary">+ Create Invoice</button>
        </div>
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
        <div style="display: flex; gap: 8px;">
          <button id="btnUploadReceiptQuick" class="btn-brand-outline" style="border-color: #075545; color: #075545; font-weight: 700;">📤 Upload Receipt</button>
          <button id="btnNewPayment" class="btn-brand-primary">+ Record Payment</button>
        </div>
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
        <td style="white-space: nowrap;">
          ${e.quoteId ? `<span style="font-weight: 700; color: #075545;">${e.quoteId}</span>` : `
            <button class="btn-brand-outline btn-convert-enq-quote" data-id="${e.enquiryId}" style="padding: 2px 8px; font-size: 10px; color: #075545; border-color: #075545;">
              &rarr; Create Quote
            </button>
          `}
        </td>
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
          ${q.status === 'Sent' || q.status === 'Draft' ? `
            <button class="btn-brand-primary btn-approve-quote-job" data-id="${q.quoteId}" style="padding: 3px 8px; font-size: 10px; margin-right: 4px;">
              ✓ Approve &amp; Book Job
            </button>
          ` : ''}
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
        <td><span class="ops-badge ${['Accepted by customer', 'Closed', 'Paid', 'Invoiced'].includes(j.status) ? 'badge-ok' : j.status === 'Cancelled' ? 'badge-attention' : 'badge-pending'}">${j.status}</span></td>
        <td style="text-align: right;">${currency}${roundMoney(j.quotedAmount || 0).toFixed(2)}</td>
        <td style="text-align: right; color: #64748b;">${currency}${roundMoney(j.actualDirectCost || 0).toFixed(2)}</td>
        <td style="text-align: right; font-weight: 700; color: ${(j.jobContribution || 0) >= 0 ? '#15803d' : '#b91c1c'};">
          ${j.jobContribution != null ? `${currency}${roundMoney(j.jobContribution).toFixed(2)}` : '-'}
        </td>
        <td style="white-space: nowrap;">
          ${j.overdueFlag ? `<span class="ops-badge badge-attention">Overdue</span>` : ''}
          ${!['Invoiced', 'Paid', 'Closed', 'Cancelled'].includes(j.status) ? `
            <button class="btn-brand-primary btn-complete-job-invoice" data-id="${j.jobId}" style="padding: 2px 8px; font-size: 10px;">
              ✓ Complete &amp; Invoice
            </button>
          ` : `<span style="font-size: 11px; color: #15803d; font-weight: 600;">Billed</span>`}
        </td>
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
          ${a.paymentStatus === 'Unpaid' && opsStore.canCurrentUser('PAY_EXPENSE_OR_CONTRACTOR') ? `
            <button class="btn-brand-primary btn-pay-assignment" data-id="${a.assignmentId}" style="padding: 2px 6px; font-size: 10px; margin-left: 4px;">
              ₵ Pay Artisan
            </button>
          ` : ''}
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
        <td>
          <span class="ops-badge ${e.paymentStatus === 'Paid' ? 'badge-ok' : 'badge-pending'}">${e.paymentStatus}</span>
          ${e.paymentStatus === 'Unpaid' && (e.approvalStatus === 'Approved' || e.approvalStatus === 'Not required') && opsStore.canCurrentUser('PAY_EXPENSE_OR_CONTRACTOR') ? `
            <button class="btn-brand-outline btn-pay-expense" data-id="${e.expenseId}" style="padding: 2px 6px; font-size: 9px; margin-left: 4px;">
              ₵ Pay
            </button>
          ` : ''}
        </td>
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

    const fundingRowsHtml = state.funding.map(f => `
      <tr>
        <td style="font-weight: 700; color: #075545;">${f.fundingId}</td>
        <td style="font-weight: 600;">${f.source}</td>
        <td>${f.description}</td>
        <td><span class="ops-badge ${f.status === 'Received' ? 'badge-ok' : 'badge-pending'}">${f.status} (Planning Scenario)</span></td>
        <td style="text-align: right;">${currency}${roundMoney(f.amountRequested).toFixed(2)}</td>
        <td style="text-align: right;">${currency}${roundMoney(f.amountApproved).toFixed(2)}</td>
        <td style="text-align: right; font-weight: 800; color: #15803d;">${currency}${roundMoney(f.amountReceived).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0 0 8px 0;">
        1. Capital &amp; Grant Planning Scenarios vs. Actual Cash Received
      </h2>
      <p style="font-size: 12px; color: var(--text-muted); margin: 0 0 12px 0;">
        Planning references (${currency}80,000 NEIP Grant Request &amp; ${currency}18,000 Pre-Funding Founder Capital) are strictly separated from actual cash received (${currency}0.00).
      </p>
      <div class="ops-table-container" style="margin-bottom: 28px;">
        <table class="ops-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Funding Source</th>
              <th>Scenario Description</th>
              <th>Status</th>
              <th style="text-align: right;">Planned / Requested</th>
              <th style="text-align: right;">Approved</th>
              <th style="text-align: right;">Actual Cash Received</th>
            </tr>
          </thead>
          <tbody>
            ${fundingRowsHtml}
          </tbody>
        </table>
      </div>

      <h2 style="font-size: 16px; font-weight: 800; color: #075545; text-transform: uppercase; margin: 0 0 8px 0;">
        2. NEIP Grant Funding Allocation &amp; Utilisation (${currency}80,000 Budget)
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
  // TAB 12: PRINTABLE DOCUMENTS SUITE & ROW SELECTION
  // ==========================================
  private renderPrintSuiteTab(state: OpsDatabaseState): string {
    const currency = state.settings.currencySymbol;

    interface SelectableDocRow {
      key: string; // e.g. 'quote:Q0001', 'invoice:INV0001', 'receipt:PAY0001', 'inspection:IS0001'
      docType: 'quote' | 'invoice' | 'receipt' | 'inspection';
      typeBadge: string;
      badgeClass: string;
      docId: string;
      date: string;
      partyName: string;
      description: string;
      amountLabel: string;
      statusLabel: string;
    }

    const allRows: SelectableDocRow[] = [
      ...state.quotes.map((q): SelectableDocRow => ({
        key: `quote:${q.quoteId}`,
        docType: 'quote',
        typeBadge: 'Quotation',
        badgeClass: 'badge-pending',
        docId: q.quoteId,
        date: q.quoteDate,
        partyName: q.customerName || q.customerId,
        description: q.notes || 'Service Quotation',
        amountLabel: `${currency}${roundMoney(q.netOfDiscount || q.total || 0).toFixed(2)}`,
        statusLabel: q.status
      })),
      ...state.invoices.map((inv): SelectableDocRow => ({
        key: `invoice:${inv.invoiceNo}`,
        docType: 'invoice',
        typeBadge: 'Tax Invoice',
        badgeClass: 'badge-ok',
        docId: inv.invoiceNo,
        date: inv.invoiceDate,
        partyName: inv.customerName || inv.customerId,
        description: inv.notes || inv.division || 'Tax Invoice',
        amountLabel: `${currency}${roundMoney(inv.amountBeforeTax || 0).toFixed(2)}`,
        statusLabel: `${inv.status || 'Issued'} (Bal: ${currency}${roundMoney(inv.balance || 0).toFixed(2)})`
      })),
      ...state.payments.map((pay): SelectableDocRow => ({
        key: `receipt:${pay.paymentId}`,
        docType: 'receipt',
        typeBadge: 'Official Receipt',
        badgeClass: 'badge-reconciled',
        docId: pay.paymentId,
        date: pay.paymentDate,
        partyName: pay.customerName || pay.customerId || 'Customer',
        description: `Payment for ${pay.invoiceNo} (${pay.method} • ${pay.reference || 'Verified'})`,
        amountLabel: `${currency}${roundMoney(pay.amount || 0).toFixed(2)}`,
        statusLabel: pay.reconciliationStatus || 'Reconciled'
      })),
      ...state.inspections.map((ins): SelectableDocRow => ({
        key: `inspection:${ins.inspectionId}`,
        docType: 'inspection',
        typeBadge: 'Condition Report',
        badgeClass: 'badge-ok',
        docId: ins.inspectionId,
        date: ins.inspectionDate,
        partyName: ins.customerName || ins.propertyId,
        description: `${ins.inspectionType} (${ins.conditionRating || 'Good'})`,
        amountLabel: '—',
        statusLabel: ins.reportStatus || 'Issued'
      }))
    ];

    const filteredRows = this.printDocFilter === 'all'
      ? allRows
      : allRows.filter(r => r.docType === this.printDocFilter);

    const allFilteredSelected =
      filteredRows.length > 0 && filteredRows.every(r => this.selectedPrintDocKeys.has(r.key));

    const rowsHtml = filteredRows.map(r => {
      const isSelected = this.selectedPrintDocKeys.has(r.key);
      return `
        <tr class="selectable-doc-row" data-key="${r.key}" style="cursor: pointer; background: ${isSelected ? '#ecfdf5' : 'transparent'}; transition: background 0.15s ease;">
          <td style="text-align: center; width: 42px;" onclick="event.stopPropagation();">
            <input type="checkbox" class="doc-row-checkbox" data-key="${r.key}" ${isSelected ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer; accent-color: #075545;" />
          </td>
          <td><span class="ops-badge ${r.badgeClass}">${r.typeBadge}</span></td>
          <td style="font-weight: 800; color: #043D33; font-family: monospace; font-size: 13px;">${r.docId}</td>
          <td>${r.date}</td>
          <td style="font-weight: 700; color: #1e293b;">${r.partyName}</td>
          <td style="color: #475569; font-size: 12px;">${r.description}</td>
          <td style="text-align: right; font-weight: 800; color: #075545;">${r.amountLabel}</td>
          <td><span style="font-size: 11px; font-weight: 600; color: #475569;">${r.statusLabel}</span></td>
          <td style="text-align: right; white-space: nowrap;" onclick="event.stopPropagation();">
            <button type="button" class="btn-brand-primary btn-single-doc-print" data-key="${r.key}" style="padding: 5px 12px; font-size: 11px;">
              Print PDF
            </button>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <!-- Top Action & Upload Banner -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 18px; font-weight: 800; color: #043D33; margin: 0 0 4px 0;">
            Document Generation &amp; Interactive Row Selection Suite
          </h2>
          <p style="font-size: 12px; color: #64748b; margin: 0;">
            Click any row (or checkbox) below to select Quotations, Tax Invoices, Official Receipts, or Inspection Reports and generate PDFs in one click.
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <button type="button" id="btnPrintSuiteUpload" class="btn-brand-outline" style="border-color: #075545; color: #075545; font-weight: 700;">
            📤 Upload Quote / Invoice / Receipt
          </button>
          <button type="button" id="btnPrintSelectedDocs" class="btn-brand-primary" ${this.selectedPrintDocKeys.size === 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
            🖨️ Generate PDF for Selected (${this.selectedPrintDocKeys.size})
          </button>
        </div>
      </div>

      <!-- Filter Pills + Batch Selection Controls + Monthly Report Bar -->
      <div class="ops-card" style="padding: 16px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <button type="button" class="btn-doc-filter ${this.printDocFilter === 'all' ? 'btn-brand-primary' : 'btn-brand-outline'}" data-filter="all" style="padding: 6px 14px; font-size: 12px; border-radius: 999px;">
            All (${allRows.length})
          </button>
          <button type="button" class="btn-doc-filter ${this.printDocFilter === 'quote' ? 'btn-brand-primary' : 'btn-brand-outline'}" data-filter="quote" style="padding: 6px 14px; font-size: 12px; border-radius: 999px;">
            Quotations (${state.quotes.length})
          </button>
          <button type="button" class="btn-doc-filter ${this.printDocFilter === 'invoice' ? 'btn-brand-primary' : 'btn-brand-outline'}" data-filter="invoice" style="padding: 6px 14px; font-size: 12px; border-radius: 999px;">
            Tax Invoices (${state.invoices.length})
          </button>
          <button type="button" class="btn-doc-filter ${this.printDocFilter === 'receipt' ? 'btn-brand-primary' : 'btn-brand-outline'}" data-filter="receipt" style="padding: 6px 14px; font-size: 12px; border-radius: 999px;">
            Official Receipts (${state.payments.length})
          </button>
          <button type="button" class="btn-doc-filter ${this.printDocFilter === 'inspection' ? 'btn-brand-primary' : 'btn-brand-outline'}" data-filter="inspection" style="padding: 6px 14px; font-size: 12px; border-radius: 999px;">
            Inspections (${state.inspections.length})
          </button>
        </div>

        <!-- Monthly Management Report Quick Generator -->
        <div style="display: flex; align-items: center; gap: 8px; background: #FAF8F5; padding: 6px 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
          <span style="font-size: 11px; font-weight: 700; color: #043D33;">Monthly Report:</span>
          <select id="selectPrintMonth" style="padding: 5px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 12px;">
            <option value="0">January ${state.settings.reportingYear}</option>
            <option value="1">February ${state.settings.reportingYear}</option>
            <option value="2" selected>March ${state.settings.reportingYear}</option>
            <option value="3">April ${state.settings.reportingYear}</option>
            <option value="4">May ${state.settings.reportingYear}</option>
            <option value="5">June ${state.settings.reportingYear}</option>
            <option value="6">July ${state.settings.reportingYear}</option>
            <option value="7">August ${state.settings.reportingYear}</option>
            <option value="8">September ${state.settings.reportingYear}</option>
            <option value="9">October ${state.settings.reportingYear}</option>
            <option value="10">November ${state.settings.reportingYear}</option>
            <option value="11">December ${state.settings.reportingYear}</option>
          </select>
          <button id="btnTriggerPrintMonthly" class="btn-brand-outline" style="padding: 5px 12px; font-size: 11px;">
            Print Monthly PDF
          </button>
        </div>
      </div>

      <!-- Interactive Row-Selection Table -->
      <div class="ops-table-container">
        <table class="ops-table">
          <thead>
            <tr>
              <th style="text-align: center; width: 42px;">
                <input type="checkbox" id="chkSelectAllDocs" ${allFilteredSelected ? 'checked' : ''} title="Select / Deselect All Visible Rows" style="width: 16px; height: 16px; cursor: pointer; accent-color: #075545;" />
              </th>
              <th>Document Type</th>
              <th>Document No</th>
              <th>Date</th>
              <th>Client / Party</th>
              <th>Service / Description</th>
              <th style="text-align: right;">Amount</th>
              <th>Status</th>
              <th style="text-align: right;">Quick Action</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="9" style="text-align: center; padding: 32px; color: #64748b;">No documents found in this view. Click <strong>"📤 Upload Quote / Invoice / Receipt"</strong> above to add or upload documents.</td></tr>`}
          </tbody>
        </table>
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

    // Interactive KPI Cards & Quick-Jump Buttons ([data-goto-tab])
    this.mountEl.querySelectorAll<HTMLElement>('[data-goto-tab]').forEach(el => {
      el.addEventListener('click', () => {
        const targetTab = el.getAttribute('data-goto-tab') as ActiveTab;
        if (targetTab) {
          this.setTab(targetTab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });

    // Dashboard Quick Upload button
    document.getElementById('btnDashQuickUpload')?.addEventListener('click', () => {
      this.showSmartUploadModal('invoice');
    });

    // Global Live Table Search Input
    const searchInput = document.getElementById('inputGlobalTableSearch') as HTMLInputElement | null;
    searchInput?.addEventListener('input', () => {
      this.tableSearchQuery = searchInput.value;
      this.applyLiveTableFilter(this.tableSearchQuery);
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
          const validation = opsStore.validateDataset(parsed);
          if (!validation.valid) {
            throw new Error(validation.errors.join('\n'));
          }
          const warnMsg = validation.warnings.length > 0 ? `\n\nWarnings:\n- ${validation.warnings.join('\n- ')}` : '';
          const summaryMsg = `Validated Backup Summary:\n• Customers: ${validation.summary.customerCount}\n• Jobs: ${validation.summary.jobCount}\n• Invoices: ${validation.summary.invoiceCount} (Net Revenue: GH₵${validation.summary.totalInvoicedNet.toFixed(2)})\n• Cash Receipts: GH₵${validation.summary.totalCashCollected.toFixed(2)}\n• Expenses: GH₵${validation.summary.totalExpenses.toFixed(2)}${warnMsg}\n\nRestore this backup now? (Existing audit history will be preserved.)`;
          if (confirm(summaryMsg)) {
            opsStore.loadState(parsed, opsStore.getActorLabel());
            alert('Database successfully validated and restored from backup.');
          }
        } catch (err: any) {
          alert('Failed to import backup:\n' + (err?.message || 'Invalid JSON file'));
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
    document.getElementById('btnTopbarAddUser')?.addEventListener('click', () => this.showNewUserModal());

    // Smart Upload & Auto-Entry Modal triggers
    document.getElementById('btnSmartUploadDoc')?.addEventListener('click', () => this.showSmartUploadModal('invoice'));
    document.getElementById('btnPrintSuiteUpload')?.addEventListener('click', () => this.showSmartUploadModal('invoice'));
    document.getElementById('btnUploadInvoiceQuick')?.addEventListener('click', () => this.showSmartUploadModal('invoice'));
    document.getElementById('btnUploadReceiptQuick')?.addEventListener('click', () => this.showSmartUploadModal('payment_receipt'));

    // Document Suite Filter Pills & Interactive Row Selection
    this.mountEl.querySelectorAll<HTMLButtonElement>('.btn-doc-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        const f = btn.dataset.filter as any;
        if (f) {
          this.printDocFilter = f;
          this.render();
        }
      });
    });

    const toggleDocRowSelection = (key: string) => {
      if (this.selectedPrintDocKeys.has(key)) {
        this.selectedPrintDocKeys.delete(key);
      } else {
        this.selectedPrintDocKeys.add(key);
      }
      this.render();
    };

    this.mountEl.querySelectorAll<HTMLElement>('.selectable-doc-row').forEach(row => {
      row.addEventListener('click', () => {
        const key = row.dataset.key;
        if (key) toggleDocRowSelection(key);
      });
    });

    this.mountEl.querySelectorAll<HTMLInputElement>('.doc-row-checkbox').forEach(chk => {
      chk.addEventListener('change', () => {
        const key = chk.dataset.key;
        if (key) toggleDocRowSelection(key);
      });
    });

    const selectAllChk = document.getElementById('chkSelectAllDocs') as HTMLInputElement | null;
    selectAllChk?.addEventListener('change', () => {
      const visibleCheckboxes = this.mountEl.querySelectorAll<HTMLInputElement>('.doc-row-checkbox');
      visibleCheckboxes.forEach(chk => {
        const key = chk.dataset.key;
        if (!key) return;
        if (selectAllChk.checked) {
          this.selectedPrintDocKeys.add(key);
        } else {
          this.selectedPrintDocKeys.delete(key);
        }
      });
      this.render();
    });

    document.getElementById('btnPrintSelectedDocs')?.addEventListener('click', () => {
      this.printSelectedDocuments();
    });

    this.mountEl.querySelectorAll<HTMLButtonElement>('.btn-single-doc-print').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        if (key) this.printDocumentByKey(key);
      });
    });

    // Dashboard session & governance controls
    document.getElementById('btnGoLanding')?.addEventListener('click', () => {
      this.setScreen('landing');
    });

    document.getElementById('btnLogout')?.addEventListener('click', () => {
      opsStore.logout();
      this.setScreen('login');
    });

    document.getElementById('btnToggleSandboxMode')?.addEventListener('click', () => {
      if (opsStore.isDemoMode()) {
        opsStore.setDemoSandboxMode(false);
        opsStore.logout('Exited Demo Sandbox Mode');
        this.setScreen('login');
      } else {
        opsStore.setDemoSandboxMode(true, createDemoState);
        opsStore.loginAsUser('U0001');
        this.render();
      }
    });

    const quickSwitchSelect = document.getElementById('selectQuickSwitchUser') as HTMLSelectElement | null;
    quickSwitchSelect?.addEventListener('change', () => {
      if (quickSwitchSelect.value) {
        try {
          opsStore.loginAsUser(quickSwitchSelect.value);
        } catch (err: any) {
          alert(err?.message || 'Role switch blocked.');
        }
      }
    });

    document.querySelectorAll('.btn-switch-to-user').forEach((el) => {
      const btn = el as HTMLElement;
      btn.addEventListener('click', () => {
        const userId = btn.dataset.id;
        if (userId) {
          try {
            opsStore.loginAsUser(userId);
          } catch (err: any) {
            alert(err?.message || 'Role switch blocked.');
          }
        }
      });
    });

    document.querySelectorAll('.btn-toggle-user-status').forEach((el) => {
      const btn = el as HTMLElement;
      btn.addEventListener('click', () => {
        const userId = btn.dataset.id;
        const currentStatus = btn.dataset.status;
        if (!userId) return;
        const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
        try {
          opsStore.updateUser(userId, { status: nextStatus as any });
        } catch (err: any) {
          alert(err?.message || 'Failed to update user status.');
        }
      });
    });

    document.querySelectorAll('.btn-reset-user-pin').forEach((el) => {
      const btn = el as HTMLElement;
      btn.addEventListener('click', () => {
        const userId = btn.dataset.id;
        const userName = btn.dataset.name || userId;
        if (!userId) return;
        const newPin = prompt(`Enter a new security PIN/passcode for ${userName} (${userId}):`);
        if (!newPin || !newPin.trim()) return;
        try {
          opsStore.updateUser(userId, { pinCode: newPin.trim(), failedLoginAttempts: 0, lockedUntil: undefined });
          alert(`Security passcode updated for ${userName}.`);
        } catch (err: any) {
          alert(err?.message || 'Failed to reset passcode.');
        }
      });
    });

    document.querySelectorAll('.btn-delete-user').forEach((el) => {
      const btn = el as HTMLElement;
      btn.addEventListener('click', () => {
        const userId = btn.dataset.id;
        const userName = btn.dataset.name || userId;
        if (!userId) return;
        if (confirm(`Delete staff user account "${userName}" (${userId})? This action will be recorded in the audit log.`)) {
          try {
            opsStore.deleteUser(userId);
          } catch (err: any) {
            alert(err?.message || 'Failed to delete user.');
          }
        }
      });
    });

    document.querySelectorAll('.btn-approve-expense').forEach((el) => {
      const btn = el as HTMLElement;
      btn.addEventListener('click', () => {
        const expId = btn.dataset.id;
        if (expId) {
          try {
            opsStore.approveExpense(expId);
          } catch (err: any) {
            alert(err?.message || 'Failed to approve expense.');
          }
        }
      });
    });

    document.querySelectorAll('.btn-reject-expense').forEach((el) => {
      const btn = el as HTMLElement;
      btn.addEventListener('click', () => {
        const expId = btn.dataset.id;
        if (expId) {
          const reason = prompt(`Enter reason for rejecting Expense ${expId}:`, 'Insufficient supporting documentation');
          if (!reason) return;
          try {
            opsStore.rejectExpense(expId, reason);
          } catch (err: any) {
            alert(err?.message || 'Failed to reject expense.');
          }
        }
      });
    });

    document.getElementById('btnLockClosePeriod')?.addEventListener('click', () => {
      const monthSelect = document.getElementById('selectCloseMonth') as HTMLSelectElement | null;
      const monthVal = monthSelect?.value;
      if (!monthVal) return;
      if (confirm(`Lock and close accounting period ${monthVal}? Once closed, transactions in ${monthVal} cannot be added or modified without an authorized reopen.`)) {
        try {
          opsStore.closePeriod(monthVal, opsStore.getActorLabel());
        } catch (err: any) {
          alert(err?.message || 'Failed to close accounting period.');
        }
      }
    });

    document.querySelectorAll('.btn-reopen-period').forEach((el) => {
      const btn = el as HTMLElement;
      btn.addEventListener('click', () => {
        const monthVal = btn.dataset.month;
        if (!monthVal) return;
        const reason = prompt(`Enter documented business reason to reopen closed accounting period ${monthVal} (minimum 5 characters):`);
        if (!reason) return;
        try {
          opsStore.reopenPeriod(monthVal, reason);
        } catch (err: any) {
          alert(err?.message || 'Failed to reopen period.');
        }
      });
    });

    // Streamlined Operations Workflow (Phase 6: 1-Click Progression)
    document.querySelectorAll('.btn-convert-enq-quote').forEach((el) => {
      const btn = el as HTMLElement;
      btn.addEventListener('click', () => {
        const enqId = btn.dataset.id;
        if (!enqId) return;
        try {
          const quote = opsStore.convertEnquiryToQuote(enqId);
          alert(`Created Quotation ${quote.quoteId} from Enquiry ${enqId}.`);
        } catch (err: any) {
          alert(err?.message || 'Failed to convert enquiry to quotation.');
        }
      });
    });

    document.querySelectorAll('.btn-approve-quote-job').forEach((el) => {
      const btn = el as HTMLElement;
      btn.addEventListener('click', () => {
        const quoteId = btn.dataset.id;
        if (!quoteId) return;
        try {
          const job = opsStore.approveQuoteAndCreateJob(quoteId);
          alert(`Approved Quotation ${quoteId} and scheduled Job ${job.jobId}.`);
        } catch (err: any) {
          alert(err?.message || 'Failed to approve quote and schedule job.');
        }
      });
    });

    document.querySelectorAll('.btn-complete-job-invoice').forEach((el) => {
      const btn = el as HTMLElement;
      btn.addEventListener('click', () => {
        const jobId = btn.dataset.id;
        if (!jobId) return;
        try {
          const inv = opsStore.completeJobAndGenerateInvoice(jobId);
          alert(`Marked Job ${jobId} complete and generated Tax Invoice ${inv.invoiceNo} for GH₵${inv.amountBeforeTax.toFixed(2)}.`);
        } catch (err: any) {
          alert(err?.message || 'Failed to complete job and generate invoice.');
        }
      });
    });

    document.querySelectorAll('.btn-pay-assignment').forEach((el) => {
      const btn = el as HTMLElement;
      btn.addEventListener('click', () => {
        const asnId = btn.dataset.id;
        if (!asnId) return;
        const ref = prompt(`Enter Mobile Money / Bank reference for paying Contractor Assignment ${asnId}:`, `MOMO-ASN-${asnId}`);
        if (!ref) return;
        try {
          opsStore.payContractorAssignment(asnId, 'Mobile money', ref);
        } catch (err: any) {
          alert(err?.message || 'Failed to settle contractor assignment.');
        }
      });
    });

    document.querySelectorAll('.btn-pay-expense').forEach((el) => {
      const btn = el as HTMLElement;
      btn.addEventListener('click', () => {
        const expId = btn.dataset.id;
        if (!expId) return;
        const ref = prompt(`Enter payment reference for Expense ${expId}:`, `MOMO-EXP-${expId}`);
        if (!ref) return;
        try {
          opsStore.markExpensePaid(expId, 'Mobile money', ref);
        } catch (err: any) {
          alert(err?.message || 'Failed to mark expense paid.');
        }
      });
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

    this.mountEl.querySelectorAll<HTMLButtonElement>('.btn-print-receipt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (id) this.printReceipt(id);
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

  private printReceipt(paymentId: string): void {
    const state = opsStore.getState();
    const pay = state.payments.find(item => item.paymentId === paymentId);
    if (!pay) return alert('Payment receipt not found');
    const inv = state.invoices.find(item => item.invoiceNo === pay.invoiceNo);
    const c: Customer = state.customers.find(item => item.customerId === (pay.customerId || inv?.customerId)) || {
      customerId: pay.customerId || 'C0001',
      customerName: pay.customerName || inv?.customerName || 'Valued Client',
      category: 'Homeowner',
      phone: '',
      email: '',
      preferredChannel: 'WhatsApp',
      area: 'East Legon',
      leadSource: 'WhatsApp',
      dateAcquired: '',
      relationshipOwner: 'Founder/CEO',
      consentRecorded: 'Yes',
      closed: 'No'
    };

    const html = renderPrintReceiptHtml(pay, inv, c, state.settings);
    this.openPrintWindow(html);
  }

  private buildDocumentHtmlByKey(key: string): string | null {
    const [type, id] = key.split(':');
    const state = opsStore.getState();
    if (type === 'quote') {
      const q = state.quotes.find(item => item.quoteId === id);
      if (!q) return null;
      const c = state.customers.find(item => item.customerId === q.customerId) || ({
        customerId: q.customerId,
        customerName: q.customerName || 'Client',
        phone: '',
        email: '',
        area: 'East Legon'
      } as Customer);
      const p = state.properties.find(item => item.propertyId === q.propertyId);
      return renderPrintQuoteHtml(q, state.quoteLines, c, p, state.settings);
    }
    if (type === 'invoice') {
      const inv = state.invoices.find(item => item.invoiceNo === id);
      if (!inv) return null;
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
      return renderPrintInvoiceHtml(inv, c, state.payments, state.settings);
    }
    if (type === 'receipt') {
      const pay = state.payments.find(item => item.paymentId === id);
      if (!pay) return null;
      const inv = state.invoices.find(item => item.invoiceNo === pay.invoiceNo);
      const c: Customer = state.customers.find(item => item.customerId === (pay.customerId || inv?.customerId)) || {
        customerId: pay.customerId || 'C0001',
        customerName: pay.customerName || inv?.customerName || 'Valued Client',
        category: 'Homeowner',
        phone: '',
        email: '',
        preferredChannel: 'WhatsApp',
        area: 'East Legon',
        leadSource: 'WhatsApp',
        dateAcquired: '',
        relationshipOwner: 'Founder/CEO',
        consentRecorded: 'Yes',
        closed: 'No'
      };
      return renderPrintReceiptHtml(pay, inv, c, state.settings);
    }
    if (type === 'inspection') {
      const ins = state.inspections.find(item => item.inspectionId === id);
      if (!ins) return null;
      const p = state.properties.find(item => item.propertyId === ins.propertyId);
      const c = p ? state.customers.find(item => item.customerId === p.customerId) : undefined;
      return renderPrintInspectionHtml(ins, p, c, state.settings);
    }
    return null;
  }

  private printDocumentByKey(key: string): void {
    const html = this.buildDocumentHtmlByKey(key);
    if (html) this.openPrintWindow(html);
  }

  private printSelectedDocuments(): void {
    if (this.selectedPrintDocKeys.size === 0) {
      alert('Please select at least one row to generate PDF.');
      return;
    }
    const pages: string[] = [];
    this.selectedPrintDocKeys.forEach(key => {
      const html = this.buildDocumentHtmlByKey(key);
      if (html) pages.push(html);
    });
    if (pages.length === 0) return;
    const combinedHtml = pages.join('<div style="page-break-after: always; height: 24px;"></div>');
    this.openPrintWindow(combinedHtml);
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
          <h3 style="font-size: 18px; font-weight: 800; color: #075545; margin: 0 0 8px 0;">Add Staff / Governance User (${nextId})</h3>
          <p style="font-size: 12px; color: var(--text-muted); margin: 0 0 16px 0;">Provision a new user account with Role-Based Access Control (RBAC) and a personal security passcode.</p>
          <form id="formNewUser">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Full Name *</label>
                <input type="text" id="usrName" required placeholder="e.g. Ama Osei" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Email Address *</label>
                <input type="email" id="usrEmail" required placeholder="e.g. operations@civitasestate.com" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Phone Number (Ghana) *</label>
                <input type="text" id="usrPhone" required placeholder="e.g. +233 55 506 2589" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;">
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #475569;">Security Passcode / PIN *</label>
                <input type="text" id="usrPin" required placeholder="e.g. 1111" maxlength="12" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box; font-family: monospace;">
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
            <div style="margin-bottom: 16px;">
              <label style="font-size: 12px; font-weight: 700; color: #475569;">Role Responsibilities / Notes</label>
              <input type="text" id="usrNotes" placeholder="e.g. Manages customer onboarding, quotations, and artisan dispatch" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;">
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
        try {
          opsStore.addUser({
            userId: nextId,
            fullName: (document.getElementById('usrName') as HTMLInputElement).value.trim(),
            email: (document.getElementById('usrEmail') as HTMLInputElement).value.trim(),
            phone: (document.getElementById('usrPhone') as HTMLInputElement).value.trim(),
            pinCode: (document.getElementById('usrPin') as HTMLInputElement).value.trim() || '1234',
            role: (document.getElementById('usrRole') as HTMLSelectElement).value as any,
            department: (document.getElementById('usrDept') as HTMLSelectElement).value as any,
            notes: (document.getElementById('usrNotes') as HTMLInputElement).value.trim(),
            status: 'Active',
            createdDate: formatYMD(new Date())
          });
          this.closeModal();
          this.currentTab = 'users';
          this.render();
        } catch (err: any) {
          alert(err?.message || 'Failed to create user account.');
        }
      });
    });
  }

  private showSmartUploadModal(defaultType: UploadedDocumentPayload['docType'] = 'invoice'): void {
    const state = opsStore.getState();
    const today = formatYMD(new Date());
    const customerOptions = state.customers
      .map(c => `<option value="${this.escapeHtml(c.customerName)}">${c.customerId} — ${this.escapeHtml(c.area || 'Accra')}</option>`)
      .join('');

    const modalHtml = `
      <div class="ops-modal-backdrop" id="opsModal">
        <div class="ops-modal-card" style="max-width: 720px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:12px;">
            <div>
              <h3 style="margin: 0 0 4px 0; color: var(--civitas-Onyx); font-family: 'Fraunces', serif;">Smart Upload &amp; Auto-Entry Engine</h3>
              <p style="margin: 0; font-size: 0.82rem; color: var(--civitas-Sage);">
                Upload a Quotation, Tax Invoice, Official Payment Receipt, or Expense Receipt (PDF, Image, CSV, JSON, or Text). The system automatically posts all linked Customer, Job, Invoice, Receipt, and Ledger entries while keeping all 52 internal controls balanced.
              </p>
            </div>
          </div>

          <form id="formSmartUpload">
            <!-- File Dropzone -->
            <div id="uplDropzone" style="border: 2px dashed rgba(45, 79, 62, 0.35); background: rgba(45, 79, 62, 0.04); border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
              <div>
                <div style="font-weight: 700; font-size: 0.86rem; color: var(--civitas-Evergreen);">1. Attach Document File or Batch Sheet (Optional)</div>
                <div id="uplFileStatus" style="font-size: 0.76rem; color: var(--civitas-Sage);">Supports .pdf, .jpg, .png, .txt, .csv, or .json — auto-extracts details &amp; batch rows</div>
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <label for="uplFileInput" class="btn-brand-outline" style="padding: 6px 12px; font-size: 0.78rem; cursor: pointer; margin: 0;">Choose File...</label>
                <input type="file" id="uplFileInput" accept=".pdf,.png,.jpg,.jpeg,.csv,.txt,.json" style="display: none;" />
              </div>
            </div>

            <!-- Batch Row Selection Table (Appears when CSV/JSON multi-row file is uploaded) -->
            <div id="uplBatchContainer" style="display: none; margin-bottom: 14px; border: 1px solid var(--civitas-Sand); border-radius: 8px; overflow: hidden;">
              <div style="background: rgba(45, 79, 62, 0.08); padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--civitas-Evergreen);">Batch Rows Detected — Click Any Row to Toggle Selection</span>
                <span id="uplBatchCountBadge" class="badge-pill badge-success">0 selected</span>
              </div>
              <div style="max-height: 190px; overflow-y: auto;">
                <table class="ops-table" style="margin: 0; font-size: 0.78rem;">
                  <thead>
                    <tr>
                      <th style="width: 36px; text-align: center;"><input type="checkbox" id="chkUplBatchAll" checked style="cursor: pointer;" /></th>
                      <th>Type</th>
                      <th>Client / Vendor</th>
                      <th>Description / Service</th>
                      <th class="num">Amount (GH₵)</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody id="uplBatchTbody"></tbody>
                </table>
              </div>
            </div>

            <!-- Single Document Fields -->
            <div id="uplSingleFields">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                <div>
                  <label style="display: block; font-size: 0.78rem; font-weight: 700; margin-bottom: 4px;">Document Type *</label>
                  <select id="uplDocType" class="ops-select" style="width: 100%; padding: 8px;">
                    <option value="quotation" ${defaultType === 'quotation' ? 'selected' : ''}>Quotation (Estimate)</option>
                    <option value="invoice" ${defaultType === 'invoice' ? 'selected' : ''}>Tax Invoice (Customer Billing)</option>
                    <option value="payment_receipt" ${defaultType === 'payment_receipt' ? 'selected' : ''}>Customer Payment Receipt (Cash In)</option>
                    <option value="expense_receipt" ${defaultType === 'expense_receipt' ? 'selected' : ''}>Supplier / Expense Receipt (Cash Out)</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; font-size: 0.78rem; font-weight: 700; margin-bottom: 4px;">Client / Supplier Name *</label>
                  <input type="text" id="uplPartyName" list="uplCustomerList" required placeholder="e.g., Kojo Mensah or Electroland Ghana" style="width: 100%; padding: 8px; border: 1px solid var(--civitas-Sand); border-radius: 6px;" />
                  <datalist id="uplCustomerList">${customerOptions}</datalist>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1.2fr 0.9fr 0.9fr; gap: 12px; margin-bottom: 12px;">
                <div>
                  <label style="display: block; font-size: 0.78rem; font-weight: 700; margin-bottom: 4px;">Service / Expense Description *</label>
                  <input type="text" id="uplDescription" required placeholder="e.g., Electrical rewiring &amp; DB upgrade" style="width: 100%; padding: 8px; border: 1px solid var(--civitas-Sand); border-radius: 6px;" />
                </div>
                <div>
                  <label style="display: block; font-size: 0.78rem; font-weight: 700; margin-bottom: 4px;">Amount (GH₵) *</label>
                  <input type="number" id="uplAmount" step="0.01" min="0.01" required placeholder="1500.00" style="width: 100%; padding: 8px; border: 1px solid var(--civitas-Sand); border-radius: 6px;" />
                </div>
                <div>
                  <label style="display: block; font-size: 0.78rem; font-weight: 700; margin-bottom: 4px;">Document Date *</label>
                  <input type="date" id="uplDate" value="${today}" required style="width: 100%; padding: 8px; border: 1px solid var(--civitas-Sand); border-radius: 6px;" />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 14px;">
                <div>
                  <label style="display: block; font-size: 0.75rem; font-weight: 700; margin-bottom: 4px;">Division / Category</label>
                  <select id="uplCategory" class="ops-select" style="width: 100%; padding: 7px; font-size: 0.8rem;">
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="AC Servicing">AC Servicing</option>
                    <option value="General Repairs">General Repairs</option>
                    <option value="Painting">Painting</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Inspection">Property Watch</option>
                    <option value="Materials">Direct Materials</option>
                    <option value="Fuel &amp; Transport">Fuel &amp; Transport</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; font-size: 0.75rem; font-weight: 700; margin-bottom: 4px;">Location / Area</label>
                  <input type="text" id="uplArea" value="East Legon" style="width: 100%; padding: 7px; font-size: 0.8rem; border: 1px solid var(--civitas-Sand); border-radius: 6px;" />
                </div>
                <div>
                  <label style="display: block; font-size: 0.75rem; font-weight: 700; margin-bottom: 4px;">Payment Channel</label>
                  <select id="uplMethod" class="ops-select" style="width: 100%; padding: 7px; font-size: 0.8rem;">
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; font-size: 0.75rem; font-weight: 700; margin-bottom: 4px;">Ref / Receipt #</label>
                  <input type="text" id="uplReference" placeholder="Auto-generated if blank" style="width: 100%; padding: 7px; font-size: 0.8rem; border: 1px solid var(--civitas-Sand); border-radius: 6px;" />
                </div>
              </div>

              <!-- Option for Invoice: Also record immediate payment receipt -->
              <div id="uplAutoPayRow" style="margin-bottom: 12px; padding: 8px 12px; background: rgba(200, 155, 60, 0.08); border-radius: 6px; border: 1px solid rgba(200, 155, 60, 0.25); display: ${defaultType === 'invoice' ? 'flex' : 'none'}; align-items: center; gap: 8px;">
                <input type="checkbox" id="chkUplAutoRecordReceipt" style="width: 16px; height: 16px; cursor: pointer;" />
                <label for="chkUplAutoRecordReceipt" style="font-size: 0.8rem; font-weight: 600; color: var(--civitas-Onyx); cursor: pointer;">
                  This uploaded invoice is already paid — automatically generate its Reconciled Official Payment Receipt too
                </label>
              </div>
            </div>

            <!-- Live Accounting & Ledger Preview Banner -->
            <div id="uplAutoEntriesPreview" style="background: rgba(45, 79, 62, 0.06); border-left: 4px solid var(--civitas-Evergreen); padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 0.8rem; color: var(--civitas-Onyx);">
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--civitas-Sage); cursor: pointer;">
                <input type="checkbox" id="chkUplOpenPrintSuite" checked />
                Select &amp; highlight created document(s) in Print &amp; PDF Suite immediately
              </label>
              <div style="display: flex; gap: 10px;">
                <button type="button" id="btnModalCancel" class="btn-brand-outline">Cancel</button>
                <button type="submit" class="btn-brand-primary">Post &amp; Auto-Create Entries</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;

    this.showModal(modalHtml, () => {
      let batchRows: Array<UploadedDocumentPayload & { selected: boolean }> = [];
      let uploadedFileName = '';

      const docTypeEl = document.getElementById('uplDocType') as HTMLSelectElement;
      const partyEl = document.getElementById('uplPartyName') as HTMLInputElement;
      const descEl = document.getElementById('uplDescription') as HTMLInputElement;
      const amountEl = document.getElementById('uplAmount') as HTMLInputElement;
      const dateEl = document.getElementById('uplDate') as HTMLInputElement;
      const catEl = document.getElementById('uplCategory') as HTMLSelectElement;
      const areaEl = document.getElementById('uplArea') as HTMLInputElement;
      const methodEl = document.getElementById('uplMethod') as HTMLSelectElement;
      const refEl = document.getElementById('uplReference') as HTMLInputElement;
      const autoPayRow = document.getElementById('uplAutoPayRow') as HTMLElement;
      const chkAutoReceipt = document.getElementById('chkUplAutoRecordReceipt') as HTMLInputElement;
      const previewEl = document.getElementById('uplAutoEntriesPreview') as HTMLElement;
      const batchContainer = document.getElementById('uplBatchContainer') as HTMLElement;
      const batchTbody = document.getElementById('uplBatchTbody') as HTMLElement;
      const batchBadge = document.getElementById('uplBatchCountBadge') as HTMLElement;
      const singleFields = document.getElementById('uplSingleFields') as HTMLElement;

      const updatePreview = () => {
        if (batchRows.length > 0) {
          const sel = batchRows.filter(r => r.selected);
          const total = sel.reduce((s, r) => s + (Number(r.amount) || 0), 0);
          previewEl.innerHTML = `<strong>Automatic Batch Entries (${sel.length} of ${batchRows.length} rows selected · GH₵ ${total.toFixed(2)}):</strong> Each selected row will automatically create/link its Customer, Property, Completed Service Job, Quotation/Invoice/Receipt, and update all 6 Reconciliation Control Totals.`;
          return;
        }
        const t = docTypeEl.value as UploadedDocumentPayload['docType'];
        autoPayRow.style.display = t === 'invoice' ? 'flex' : 'none';
        if (t === 'quotation') {
          previewEl.innerHTML = `<strong>Automatic Accounting &amp; Operational Entries:</strong><br/>1. Find or create <strong>Customer</strong> &amp; <strong>Property</strong> &rarr; 2. Create <strong>Service Job</strong> &rarr; 3. Post <strong>Approved Quotation (Q00xx)</strong> &amp; <strong>Quote Line Item</strong> ready for PDF printing.`;
        } else if (t === 'invoice') {
          const withRec = chkAutoReceipt?.checked;
          previewEl.innerHTML = `<strong>Automatic Accounting &amp; Operational Entries:</strong><br/>1. Find or create <strong>Customer</strong> &amp; <strong>Property</strong> &rarr; 2. Create Completed <strong>Service Job</strong> &rarr; 3. Post <strong>Tax Invoice (INV00xx)</strong> to Revenue &amp; AR Ledger${withRec ? ' &rarr; 4. Post <strong>Reconciled Payment Receipt (PAY00xx)</strong> to Cash Ledger' : ''}.`;
        } else if (t === 'payment_receipt') {
          previewEl.innerHTML = `<strong>Automatic Accounting &amp; Operational Entries:</strong><br/>1. Match open Customer Invoice (or auto-create Customer, Job &amp; backing Tax Invoice if none exists) &rarr; 2. Post <strong>Reconciled Official Payment Receipt (PAY00xx)</strong> &rarr; 3. Update Invoice Paid/Balance status &amp; Cash Control Totals.`;
        } else {
          previewEl.innerHTML = `<strong>Automatic Accounting &amp; Operational Entries:</strong><br/>1. Post <strong>Approved &amp; Reconciled Expense Voucher (EXP00xx)</strong> &rarr; 2. Link to Cost Category &amp; Job Costing &rarr; 3. Update Income Statement &amp; Cash Outflow Control Totals.`;
        }
      };

      const renderBatchTable = () => {
        if (batchRows.length === 0) {
          batchContainer.style.display = 'none';
          singleFields.style.display = 'block';
          updatePreview();
          return;
        }
        batchContainer.style.display = 'block';
        singleFields.style.display = 'none';
        const selectedCount = batchRows.filter(r => r.selected).length;
        batchBadge.textContent = `${selectedCount} of ${batchRows.length} selected`;

        batchTbody.innerHTML = batchRows.map((row, idx) => `
          <tr class="upl-batch-row" data-idx="${idx}" style="cursor: pointer; background: ${row.selected ? 'rgba(45, 79, 62, 0.08)' : 'transparent'};">
            <td style="text-align: center;"><input type="checkbox" class="chk-upl-row" data-idx="${idx}" ${row.selected ? 'checked' : ''} style="cursor: pointer;" /></td>
            <td><span class="badge-pill badge-neutral">${this.escapeHtml(row.docType)}</span></td>
            <td style="font-weight: 600;">${this.escapeHtml(row.partyName)}</td>
            <td>${this.escapeHtml(row.description)}</td>
            <td class="num" style="font-weight: 700;">${Number(row.amount).toFixed(2)}</td>
            <td>${this.escapeHtml(row.date || today)}</td>
          </tr>
        `).join('');

        batchTbody.querySelectorAll('.upl-batch-row').forEach(tr => {
          tr.addEventListener('click', (ev) => {
            const target = ev.target as HTMLElement;
            if (target.tagName === 'INPUT') return;
            const idx = Number(tr.getAttribute('data-idx'));
            if (!isNaN(idx) && batchRows[idx]) {
              batchRows[idx].selected = !batchRows[idx].selected;
              renderBatchTable();
            }
          });
        });

        batchTbody.querySelectorAll('.chk-upl-row').forEach(chk => {
          chk.addEventListener('change', (ev) => {
            const input = ev.target as HTMLInputElement;
            const idx = Number(input.getAttribute('data-idx'));
            if (!isNaN(idx) && batchRows[idx]) {
              batchRows[idx].selected = input.checked;
              renderBatchTable();
            }
          });
        });

        updatePreview();
      };

      document.getElementById('chkUplBatchAll')?.addEventListener('change', (ev) => {
        const checked = (ev.target as HTMLInputElement).checked;
        batchRows.forEach(r => { r.selected = checked; });
        renderBatchTable();
      });

      docTypeEl.addEventListener('change', updatePreview);
      chkAutoReceipt?.addEventListener('change', updatePreview);
      updatePreview();

      // Smart File Parser
      const fileInput = document.getElementById('uplFileInput') as HTMLInputElement;
      const fileStatus = document.getElementById('uplFileStatus') as HTMLElement;
      fileInput?.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        uploadedFileName = file.name;
        const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();

        const lowerName = file.name.toLowerCase();
        if (lowerName.includes('quot') || lowerName.includes('est')) {
          docTypeEl.value = 'quotation';
        } else if (lowerName.includes('rec') || lowerName.includes('pay')) {
          docTypeEl.value = 'payment_receipt';
        } else if (lowerName.includes('exp') || lowerName.includes('bill') || lowerName.includes('voucher')) {
          docTypeEl.value = 'expense_receipt';
        } else if (lowerName.includes('inv')) {
          docTypeEl.value = 'invoice';
        }

        if (!refEl.value) refEl.value = `UPL-${file.name.slice(0, 18).toUpperCase()}`;
        if (!descEl.value) descEl.value = `Uploaded: ${baseName}`;

        if (lowerName.endsWith('.csv') || lowerName.endsWith('.txt') || lowerName.endsWith('.json')) {
          const reader = new FileReader();
          reader.onload = () => {
            const text = String(reader.result || '').trim();
            // Try JSON array or object first
            if (lowerName.endsWith('.json')) {
              try {
                const parsed = JSON.parse(text);
                const arr = Array.isArray(parsed) ? parsed : [parsed];
                if (arr.length > 1) {
                  batchRows = arr.map((item: any) => ({
                    docType: (item.docType || item.type || docTypeEl.value) as UploadedDocumentPayload['docType'],
                    partyName: String(item.partyName || item.customer || item.client || item.vendor || 'Walk-In Client'),
                    description: String(item.description || item.service || 'Uploaded service item'),
                    amount: Number(item.amount || item.total || 500),
                    date: String(item.date || today),
                    category: String(item.category || 'General Repairs'),
                    area: String(item.area || 'East Legon'),
                    paymentMethod: (item.paymentMethod || 'Mobile Money') as any,
                    reference: String(item.reference || ''),
                    fileName: file.name,
                    selected: true
                  }));
                  fileStatus.textContent = `Loaded ${batchRows.length} rows from ${file.name}`;
                  renderBatchTable();
                  return;
                } else if (arr.length === 1) {
                  const item = arr[0];
                  if (item.partyName || item.customer) partyEl.value = item.partyName || item.customer;
                  if (item.description || item.service) descEl.value = item.description || item.service;
                  if (item.amount || item.total) amountEl.value = String(item.amount || item.total);
                }
              } catch {
                // fallback to text extraction
              }
            }

            // Check if multi-line CSV
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            if (lowerName.endsWith('.csv') && lines.length >= 2) {
              const dataLines = lines[0].toLowerCase().includes('amount') || lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('client')
                ? lines.slice(1)
                : lines;
              if (dataLines.length >= 1) {
                batchRows = dataLines.map((line) => {
                  const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                  const rawType = (cols[0] || '').toLowerCase();
                  let dType: UploadedDocumentPayload['docType'] = docTypeEl.value as any;
                  if (rawType.includes('quot')) dType = 'quotation';
                  else if (rawType.includes('inv')) dType = 'invoice';
                  else if (rawType.includes('exp')) dType = 'expense_receipt';
                  else if (rawType.includes('rec') || rawType.includes('pay')) dType = 'payment_receipt';

                  const hasTypeCol = ['quotation', 'quote', 'invoice', 'receipt', 'payment_receipt', 'expense', 'expense_receipt'].some(k => rawType.includes(k));
                  const party = hasTypeCol ? (cols[1] || 'Client') : (cols[0] || 'Client');
                  const desc = hasTypeCol ? (cols[2] || 'Maintenance Service') : (cols[1] || 'Maintenance Service');
                  const amtStr = hasTypeCol ? (cols[3] || '0') : (cols[2] || '0');
                  const dt = hasTypeCol ? (cols[4] || today) : (cols[3] || today);
                  const amt = parseFloat(amtStr.replace(/[^0-9.]/g, '')) || 450;

                  return {
                    docType: dType,
                    partyName: party,
                    description: desc,
                    amount: amt,
                    date: /^\d{4}-\d{2}-\d{2}$/.test(dt) ? dt : today,
                    category: catEl.value,
                    area: areaEl.value || 'Accra',
                    paymentMethod: methodEl.value as any,
                    fileName: file.name,
                    selected: true
                  };
                });
                fileStatus.textContent = `Parsed ${batchRows.length} selectable rows from ${file.name}`;
                renderBatchTable();
                return;
              }
            }

            // Single text extraction
            const amountMatch = text.match(/(?:GH₵|GHS|Amount|Total)[:\s]*([0-9,]+(?:\.[0-9]{1,2})?)/i) || text.match(/\b([0-9]{2,6}\.[0-9]{2})\b/);
            if (amountMatch && !amountEl.value) {
              amountEl.value = amountMatch[1].replace(/,/g, '');
            }
            const clientMatch = text.match(/(?:Client|Customer|Bill To|Received From|Vendor)[:\s]+([^\r\n]+)/i);
            if (clientMatch && !partyEl.value) {
              partyEl.value = clientMatch[1].trim();
            }
          };
          reader.readAsText(file);
        } else {
          // Filename heuristics for PDF/Images
          const numMatch = baseName.match(/\b([0-9]{2,6}(?:\.[0-9]{1,2})?)\b/);
          if (numMatch && !amountEl.value) {
            amountEl.value = numMatch[1];
          }
          if (!partyEl.value && state.customers[0]) {
            const matchedCust = state.customers.find(c => baseName.toLowerCase().includes(c.customerName.toLowerCase().split(' ')[0]));
            if (matchedCust) partyEl.value = matchedCust.customerName;
          }
        }

        fileStatus.textContent = `Attached: ${file.name} (${(file.size / 1024).toFixed(1)} KB) — fields auto-populated`;
        updatePreview();
      });

      document.getElementById('formSmartUpload')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        try {
          const openPrintSuite = (document.getElementById('chkUplOpenPrintSuite') as HTMLInputElement)?.checked;
          const createdDocKeys: string[] = [];
          let lastSummary = '';

          if (batchRows.length > 0) {
            const selected = batchRows.filter(r => r.selected);
            if (selected.length === 0) {
              this.showToast('Selection Required', 'Please select at least one row in the batch table.', 'error');
              return;
            }
            for (const row of selected) {
              const res = opsStore.autoPostUploadedDocument(row);
              lastSummary = res.summary;
              if (res.documentType === 'quote') createdDocKeys.push(`quote:${res.primaryId}`);
              else if (res.documentType === 'invoice') createdDocKeys.push(`invoice:${res.primaryId}`);
              else if (res.documentType === 'receipt') createdDocKeys.push(`receipt:${res.primaryId}`);
            }
            lastSummary = `Auto-posted ${selected.length} batch document(s) & reconciled all ledgers.`;
          } else {
            const payload: UploadedDocumentPayload = {
              docType: docTypeEl.value as UploadedDocumentPayload['docType'],
              partyName: partyEl.value.trim(),
              description: descEl.value.trim(),
              amount: parseFloat(amountEl.value) || 0,
              date: dateEl.value || today,
              category: catEl.value,
              area: areaEl.value.trim() || 'Accra',
              paymentMethod: methodEl.value as any,
              reference: refEl.value.trim(),
              fileName: uploadedFileName || undefined,
              autoRecordReceiptForInvoice: docTypeEl.value === 'invoice' && Boolean(chkAutoReceipt?.checked)
            };
            const res = opsStore.autoPostUploadedDocument(payload);
            lastSummary = `${res.summary} (${res.relatedEntries.join(' · ')})`;
            if (res.documentType === 'quote') createdDocKeys.push(`quote:${res.primaryId}`);
            else if (res.documentType === 'invoice') createdDocKeys.push(`invoice:${res.primaryId}`);
            else if (res.documentType === 'receipt') createdDocKeys.push(`receipt:${res.primaryId}`);
          }

          this.closeModal();
          if (openPrintSuite && createdDocKeys.length > 0) {
            this.printDocFilter = 'all';
            createdDocKeys.forEach(k => this.selectedPrintDocKeys.add(k));
            this.currentTab = 'print';
          }
          this.render();
          this.showToast('Smart Auto-Entry Complete', lastSummary, 'success');
        } catch (err: any) {
          this.showToast('Upload Error', err?.message || 'Failed to process uploaded document.', 'error');
        }
      });
    });
  }

  private applyLiveTableFilter(rawQuery: string): void {
    const q = rawQuery.trim().toLowerCase();
    const badge = document.getElementById('badgeSearchMatchCount');
    const tables = this.mountEl.querySelectorAll<HTMLTableElement>('.ops-table');
    let matchCount = 0;
    let totalRows = 0;

    tables.forEach(tbl => {
      const rows = tbl.querySelectorAll<HTMLTableRowElement>('tbody tr');
      rows.forEach(tr => {
        totalRows++;
        if (!q) {
          tr.style.display = '';
          return;
        }
        const text = (tr.textContent || '').toLowerCase();
        if (text.includes(q)) {
          tr.style.display = '';
          matchCount++;
        } else {
          tr.style.display = 'none';
        }
      });
    });

    if (badge) {
      if (!q) {
        badge.textContent = 'Ctrl+K';
        badge.style.background = '#e2e8f0';
        badge.style.color = '#64748b';
      } else {
        badge.textContent = `${matchCount}/${totalRows}`;
        badge.style.background = matchCount > 0 ? '#dcfce7' : '#fee2e2';
        badge.style.color = matchCount > 0 ? '#15803d' : '#b91c1c';
      }
    }
  }

  private showToast(title: string, message: string, type: 'success' | 'error' = 'success'): void {
    if (typeof document === 'undefined') return;
    let container = document.getElementById('opsToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'opsToastContainer';
      container.className = 'ops-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `ops-toast ${type === 'error' ? 'toast-error' : ''}`;
    toast.innerHTML = `
      <div>
        <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.3px; margin-bottom: 2px; color: #fed7aa;">
          ${type === 'error' ? '⚠️ ' : '✓ '}${this.escapeHtml(title)}
        </div>
        <div style="font-size: 11.5px; color: rgba(255,255,255,0.92); line-height: 1.4;">
          ${this.escapeHtml(message)}
        </div>
      </div>
      <button type="button" style="background: transparent; border: none; color: rgba(255,255,255,0.7); cursor: pointer; font-size: 14px; line-height: 1;">&times;</button>
    `;

    toast.querySelector('button')?.addEventListener('click', () => toast.remove());
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 4500);
  }

  private escapeHtml(str?: string): string {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
