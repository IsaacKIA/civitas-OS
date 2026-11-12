# CIVITAS ESTATE & MAINTENANCE
## Operations & Financial Management System — Version 2.1 Staff & Executive User Guide
**Document ID:** `CIVITAS-V2.1-USER-GUIDE`  
**Company:** Civitas Estate & Maintenance (Accra & Tema, Ghana)  

---

## 1. Signing In & Security Rules

1. Open **`http://localhost:5174/`** and click **`Access Staff Login Portal`**.
2. Select your account from the directory or enter your email / User ID and personal security passcode:
   - **Founder / CEO (`U0001`):** `admin@civitasestate.com` (Default initial passcode: `2026`)
   - **Operations Coordinator (`U0002`):** `operations@civitasestate.com` (Default initial passcode: `1111`)
   - **Finance & Accounts Officer (`U0003`):** `finance@civitasestate.com` (Default initial passcode: `2222`)
   - **Field Supervisor (`U0004`):** `field@civitasestate.com` (Default initial passcode: `3333`)
   - **Board / Internal Auditor (`U0005`):** `audit@civitasestate.com` (Default initial passcode: `4444`)
3. **Important Security Controls:**
   - Passcodes are encrypted (salted SHA-256) and are never shown on screen.
   - Entering a wrong passcode **5 times** locks the account for **15 minutes**.
   - Leaving the system idle for **30 minutes** automatically signs you out.
   - To practice or demonstrate features without touching real company records, click **`🧪 Enter Demo Sandbox`**.

---

## 2. Everyday Workflow (From Customer Enquiry to Cash Receipt)

You do not need to re-type customer or job details at each step. Follow this 5-step flow:

1. **Step 1 — Log Customer Enquiry (`Sales & Customers` tab):**
   - Click **`+ Log Enquiry`** to record a call or WhatsApp lead from Accra or Tema.
   - Click **`→ Create Quote`** next to the enquiry to automatically register the customer, property, and quotation.
2. **Step 2 — Issue & Approve Quotation (`Sales & Customers` tab):**
   - Click **`WhatsApp`** or **`Print / PDF`** on the quotation to send it to the client.
   - Once the client accepts, click **`✓ Approve & Book Job`** on the quotation row to automatically schedule the service job.
3. **Step 3 — Assign Field Technician (`Field Workforce` tab):**
   - Click **`+ Assign Work`** to assign a vetted electrician, plumber, cleaner, or technician to the job.
   - Click **`Dispatch`** to send the job location and rate to the artisan via WhatsApp.
4. **Step 4 — Complete Job & Generate Tax Invoice (`Service Operations` tab):**
   - Once site work passes inspection, click **`✓ Complete & Invoice`** on the job row. This marks the job completed and automatically generates the Tax Invoice.
5. **Step 5 — Record Customer Payment & Reconcile (`Invoices & Receivables` tab):**
   - When the customer pays via MTN Mobile Money or Bank Transfer, click **`+ Record Payment`** and enter the transaction reference.
   - Click **`Reconcile`** once verified against the Mobile Money or Bank statement.

---

## 3. Recording & Approving Expenses

1. Go to **`Expenses & Procurement`** and click **`+ Record Expense`**.
2. Always include the **Job ID** for direct job materials or transport so job profitability is accurate.
3. **Approval Rule (`> GH₵500`):**
   - Any expense above **GH₵500** recorded by staff is placed in **`Pending`** status and cannot be marked `Paid` until reviewed.
   - The **Founder / CEO** reviews pending items in **`Users & Governance`** (or directly in the Expenses tab) and clicks **`✓ Approve`** or **`✕ Reject`**.
   - Once approved, the Finance Officer or CEO clicks **`₵ Pay`** and enters the Mobile Money / Bank reference.

---

## 4. Closing Monthly Accounting Periods (Administrator / CEO)

1. At the end of each month, review the **`52 Control Checks`** tab to ensure all attention items are resolved and all 6 reconciliation totals show **`RECONCILED`**.
2. Go to **`Users & Governance`** → **Section 3 (Month-End Period Close)**.
3. Select the month and click **`🔒 Lock & Close Period`**.
4. Once closed, no invoices, payments, expenses, or assignments can be added or edited in that month unless the Founder / CEO clicks **`🔓 Reopen`** and records a formal business reason.

