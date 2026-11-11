# CIVITAS ESTATE & MAINTENANCE
## Operations & Financial Management System — Version 2.1 Deployment, Backup & Recovery Guide
**Document ID:** `CIVITAS-V2.1-DEPLOYMENT`  
**Version:** `2.1.0`  

---

## 1. System Requirements
- **Node.js:** `v20.x` or `v22.x / v24.x` LTS
- **Package Manager:** `npm` (included with Node.js)
- **Disk Space:** Minimum 500 MB free for `data/civitas_db.json` and daily rotating backups in `backups/`
- **Supported Browsers:** Google Chrome, Microsoft Edge, Mozilla Firefox, Apple Safari (Desktop & Mobile)

---

## 2. Local Office / Server Installation & Startup

1. **Install Dependencies:**
   ```powershell
   npm install
   ```
2. **Run Automated Security & Financial Verification Suite:**
   ```powershell
   npm test
   ```
3. **Run Type Check & Production Build:**
   ```powershell
   npm run build
   ```
4. **Start the Application & Transactional Persistence Server:**
   ```powershell
   npm run dev -- --port 5174
   ```
   Access the portal at **`http://localhost:5174/`**.

---

## 3. Data Persistence & Automated Backup Architecture

### 3.1 Server-Side Persistence (`data/civitas_db.json`)
- When running via the Vite/Node server (`npm run dev`), every state mutation is atomically written to `data/civitas_db.json` (using write-to-temp-and-rename to prevent corrupted writes).
- An automatic daily backup snapshot is written to `backups/civitas_auto_backup_YYYY-MM-DD.json`.
- Browser `localStorage` (`civitas_ops_store_v2_prod`) acts as a synchronized local cache.

### 3.2 Manual Backup & Validated Restoration Procedure
1. **Exporting a Manual Backup:**
   - Sign in to the dashboard and click **`Backup JSON`** in the top bar.
   - Save `Civitas_Ops_Backup_YYYY-MM-DD.json` to an external drive or secure company cloud folder (e.g., OneDrive / Google Drive).
2. **Restoring & Validating a Backup:**
   - Sign in as **`Founder / CEO`** (`admin@civitasestate.com`).
   - Click **`Restore JSON`** and select the backup `.json` file.
   - The system automatically runs `validateAndInspectDataset()` to verify:
     - Primary key uniqueness across all registers.
     - Referential links (Customers, Jobs, Invoices, Payments, Contractors).
     - Financial reconciliation totals (`Net Revenue`, `Cash Collected`, `Total Expenses`).
   - Confirm the pre-import summary prompt to complete restoration. Existing audit trail entries are preserved and merged automatically.

### 3.3 Optional Cloud Migration to Managed PostgreSQL (Supabase)
When Civitas Estate & Maintenance expands to multi-branch cloud hosting:
1. Create a new Supabase project and execute [`docs/supabase_schema.sql`](file:///F:/PROJECTS/civitas-operations-system/docs/supabase_schema.sql) in the SQL Editor.
2. Export the current state via **`Backup JSON`** and verify all 6 Control Totals equal `0.00` (`RECONCILED`) in the **52 Control Checks** tab before migrating.

---

## 4. Rollback Procedure
If any operational issue occurs after an update:
1. Stop the server process.
2. Restore the baseline source archive from `Civitas_Operations_System_Full_Backup_2026-11-11.zip` or run:
   ```powershell
   git checkout f7da9ce
   ```
3. Restore the latest verified database snapshot from `backups/` or Desktop (`Civitas_Ops_Backup_2026-11-11.json`) using **`Restore JSON`**.
