# Civitas Operations & Financial Control System (Standalone)

> **Smart Living. Sustainable Legacy.**  
> Operations & Financial Control System for **Civitas Estate & Maintenance** (Accra and Tema, Ghana).

This is the standalone operations platform decoupled from the public marketing website. It provides an executive command centre, transactional registers, management accounting, and audit-grade financial controls.

---

## Capabilities

1. **Onboarding & Pipeline:** Customer & Property Registers (with consent tracking), Enquiries pipeline, Service Catalogue (S01–S16), and Quotation authoring.
2. **Operations & Field Labour:** Service Job lifecycle, Vetted Contractor workforce register, and Paid Assignments (single-entry field labour; person-days tracked separately).
3. **Financial Ledger & Invoicing:** Tax Invoices, Receipts & Payments (Cash &ne; Revenue), Operating & Direct Expenses with approval thresholds (> GH₵500), and Reconciliations.
4. **Accounting & Control:** 12-Month Management Accounts (P&L, Cash Flow, Working Capital), Receivables Ageing buckets, Job Profitability, and Month-End Close locking.
5. **Grant & Asset Accountability:** NEIP GH₵80,000 category tracking (A–H), founder pre-funding capital tracking, and Equipment Asset Register with straight-line depreciation.
6. **Governance & Risk:** 5&times;5 Probability &times; Impact Risk Heat Map, Board Meetings, Advisory Recommendations, and Compliance register (CP0001–CP0011 prompts).
7. **Rule-Based Controls:** 52 automated exception checks + 6 workbook control totals.
8. **Printable Document Suite:** Official branded Quotations, Tax Invoices, Monthly Management Reports, and Property Watch Condition Reports.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5174](http://localhost:5174) in your browser.

### 3. Run Test Suite
```bash
npm test
```
Verifies all 6 core invariant accounting rules and control checks.

### 4. Build for Production
```bash
npm run build
```
Generates an optimized static bundle in the `dist/` directory, ready to deploy to Vercel, Netlify, or any static hosting service with zero configuration.

---

## Production Deployment to Vercel
1. Push this folder to a GitHub repository (e.g. `civitas-operations-system`).
2. Import the project into your Vercel dashboard.
3. Framework Preset: **Vite**.
4. Deploy. The platform will run with $0 monthly cloud costs on Vercel's edge network.
