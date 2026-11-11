/**
 * CIVITAS ESTATE & MAINTENANCE
 * Printable Document Generators (Print_Quote, Print_Invoice, Print_Monthly, Print_Inspection)
 * Rendered with pixel-perfect print layout and brand styling.
 */

import type {
  Quote,
  QuoteLine,
  Invoice,
  Payment,
  Customer,
  Property,
  PropertyInspection,
  SystemSettings
} from './types.ts';
import type { MonthManagementAccount } from './management-accounts.ts';
import { roundMoney } from './calculations.ts';

export function renderPrintQuoteHtml(
  quote: Quote,
  lines: QuoteLine[],
  customer: Customer,
  property: Property | undefined,
  settings: SystemSettings
): string {
  const quoteLines = lines.filter(l => l.quoteId === quote.quoteId);
  const currency = settings.currencySymbol;

  const lineRowsHtml = quoteLines.map((line, idx) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">${idx + 1}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 500; color: #1e293b;">
        ${line.description || line.service}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #334155;">${line.quantity}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155;">${currency}${roundMoney(line.unitPrice || 0).toFixed(2)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #075545;">${currency}${roundMoney(line.lineTotal || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <div class="printable-doc" style="max-width: 800px; margin: 0 auto; background: #ffffff; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.5;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #075545; padding-bottom: 24px; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 24px; font-weight: 800; color: #075545; margin: 0 0 4px 0; letter-spacing: -0.5px;">${settings.companyName}</h1>
          <p style="font-size: 13px; color: #E4693F; font-weight: 600; margin: 0 0 12px 0;">${settings.tagline}</p>
          <p style="font-size: 12px; color: #64748b; margin: 0;">${settings.address}</p>
          <p style="font-size: 12px; color: #64748b; margin: 0;">Phone / WhatsApp: ${settings.phone} | Email: ${settings.email}</p>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; background: #FAF8F4; border: 1px solid #cbd5e1; color: #075545; font-size: 14px; font-weight: 700; padding: 6px 16px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">QUOTATION</span>
          <p style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 12px 0 2px 0;">Quote No: ${quote.quoteId}</p>
          <p style="font-size: 12px; color: #64748b; margin: 0;">Date: ${quote.quoteDate}</p>
          <p style="font-size: 12px; color: #b91c1c; font-weight: 600; margin: 2px 0 0 0;">Valid until: ${quote.validUntil || '14 days'}</p>
        </div>
      </div>

      <!-- Parties -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 28px;">
        <div style="flex: 1; padding-right: 20px;">
          <h4 style="font-size: 11px; text-transform: uppercase; color: #64748b; margin: 0 0 6px 0; letter-spacing: 0.5px;">Prepared For</h4>
          <p style="font-size: 15px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0;">${customer.customerName}</p>
          <p style="font-size: 13px; color: #475569; margin: 0;">Phone: ${customer.phone}</p>
          ${customer.email ? `<p style="font-size: 13px; color: #475569; margin: 0;">Email: ${customer.email}</p>` : ''}
          <p style="font-size: 13px; color: #475569; margin: 0;">Area: ${customer.area}</p>
        </div>
        <div style="flex: 1; padding-left: 20px; border-left: 1px solid #f1f5f9;">
          <h4 style="font-size: 11px; text-transform: uppercase; color: #64748b; margin: 0 0 6px 0; letter-spacing: 0.5px;">Service Property</h4>
          <p style="font-size: 14px; font-weight: 600; color: #1e293b; margin: 0 0 4px 0;">${property ? property.addressOrDescription : 'Property as agreed'}</p>
          <p style="font-size: 13px; color: #475569; margin: 0;">Area: ${property ? property.area : customer.area}</p>
          ${property && property.accessInstructions ? `<p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">Access: ${property.accessInstructions}</p>` : ''}
        </div>
      </div>

      <!-- Scope Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">No</th>
            <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Service Scope & Description</th>
            <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Qty</th>
            <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Unit Price</th>
            <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${lineRowsHtml}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 28px;">
        <div style="width: 280px; background: #FAF8F4; padding: 16px 20px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
            <span style="color: #64748b;">Subtotal:</span>
            <span style="font-weight: 600; color: #1e293b;">${currency}${roundMoney(quote.subtotal || 0).toFixed(2)}</span>
          </div>
          ${quote.discountAmount ? `
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; color: #15803d;">
              <span>Discount:</span>
              <span>-${currency}${roundMoney(quote.discountAmount).toFixed(2)}</span>
            </div>
          ` : ''}
          ${quote.tax ? `
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
              <span style="color: #64748b;">Tax / Levies:</span>
              <span style="font-weight: 600; color: #1e293b;">${currency}${roundMoney(quote.tax).toFixed(2)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; border-top: 2px solid #075545; padding-top: 10px; color: #075545;">
            <span>TOTAL:</span>
            <span>${currency}${roundMoney(quote.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <!-- Terms & Acceptance -->
      <div style="background: #f8fafc; border-left: 4px solid #075545; padding: 14px 18px; margin-bottom: 28px; font-size: 12px; color: #475569;">
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #1e293b;">Terms & Conditions</p>
        <p style="margin: 0 0 4px 0;">1. This quotation is valid for ${settings.quoteValidityDays} days from the date of issue. Prices are in Ghana cedis (GH₵).</p>
        <p style="margin: 0 0 4px 0;">2. Work commences only upon written acceptance. No hidden charges or chemical fees will be added.</p>
        <p style="margin: 0;">3. Payment by approved Mobile Money or direct bank transfer. Official receipt issued for every transaction.</p>
      </div>

      <!-- Sign-off Block -->
      <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px;">
        <div style="width: 45%;">
          <p style="margin: 0 0 35px 0; color: #64748b;">Prepared by (Civitas Representative):</p>
          <div style="border-bottom: 1px solid #94a3b8; margin-bottom: 4px;"></div>
          <p style="margin: 0; font-weight: 600; color: #1e293b;">${quote.preparedBy}</p>
        </div>
        <div style="width: 45%;">
          <p style="margin: 0 0 35px 0; color: #64748b;">Customer Acceptance (Name, Signature & Date):</p>
          <div style="border-bottom: 1px solid #94a3b8; margin-bottom: 4px;"></div>
          <p style="margin: 0; color: #94a3b8;">Accepted by authorised representative</p>
        </div>
      </div>
    </div>
  `;
}

export function renderPrintInvoiceHtml(
  invoice: Invoice,
  customer: Customer,
  payments: Payment[],
  settings: SystemSettings
): string {
  const currency = settings.currencySymbol;
  const myPayments = payments.filter(p => p.invoiceNo === invoice.invoiceNo);

  const paymentsHtml = myPayments.length > 0 ? myPayments.map(p => `
    <div style="display: flex; justify-content: space-between; font-size: 12px; color: #15803d; margin-bottom: 4px;">
      <span>Receipt ${p.paymentDate} (${p.method} - ${p.reference || 'N/A'}):</span>
      <span>-${currency}${roundMoney(p.amount).toFixed(2)}</span>
    </div>
  `).join('') : '<p style="font-size: 12px; color: #94a3b8; margin: 0;">No payments recorded yet.</p>';

  return `
    <div class="printable-doc" style="max-width: 800px; margin: 0 auto; background: #ffffff; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.5;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #075545; padding-bottom: 24px; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 24px; font-weight: 800; color: #075545; margin: 0 0 4px 0;">${settings.companyName}</h1>
          <p style="font-size: 13px; color: #E4693F; font-weight: 600; margin: 0 0 12px 0;">${settings.tagline}</p>
          <p style="font-size: 12px; color: #64748b; margin: 0;">${settings.address}</p>
          <p style="font-size: 12px; color: #64748b; margin: 0;">Phone: ${settings.phone} | Email: ${settings.email}</p>
          ${settings.tin ? `<p style="font-size: 12px; color: #64748b; margin: 0;">TIN: ${settings.tin}</p>` : ''}
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; background: #075545; color: #ffffff; font-size: 14px; font-weight: 700; padding: 6px 16px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">TAX INVOICE</span>
          <p style="font-size: 15px; font-weight: 700; color: #1e293b; margin: 12px 0 2px 0;">Invoice: ${invoice.invoiceNo}</p>
          <p style="font-size: 12px; color: #64748b; margin: 0;">Date: ${invoice.invoiceDate}</p>
          <p style="font-size: 12px; color: #b91c1c; font-weight: 600; margin: 2px 0 0 0;">Due Date: ${invoice.dueDate || 'Upon receipt'}</p>
        </div>
      </div>

      <!-- Bill To -->
      <div style="margin-bottom: 28px;">
        <h4 style="font-size: 11px; text-transform: uppercase; color: #64748b; margin: 0 0 6px 0; letter-spacing: 0.5px;">Bill To</h4>
        <p style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0;">${customer.customerName}</p>
        <p style="font-size: 13px; color: #475569; margin: 0;">Phone: ${customer.phone}</p>
        ${customer.email ? `<p style="font-size: 13px; color: #475569; margin: 0;">Email: ${customer.email}</p>` : ''}
        <p style="font-size: 13px; color: #475569; margin: 0;">Area: ${customer.area}</p>
      </div>

      <!-- Invoice Items -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Description</th>
            <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Division / Ref</th>
            <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: 500; color: #1e293b;">
              ${invoice.notes || 'Property care and maintenance services delivered'}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">
              ${invoice.division || 'Civitas Fix'}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #1e293b;">
              ${currency}${roundMoney(invoice.amountBeforeTax || 0).toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Statement Calculation -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px;">
        <div style="width: 45%; background: #f8fafc; padding: 14px 18px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <p style="font-size: 12px; font-weight: 700; color: #075545; margin: 0 0 8px 0; text-transform: uppercase;">Payment Details</p>
          <p style="font-size: 12px; color: #334155; margin: 0 0 4px 0;"><strong>Mobile Money:</strong> ${settings.mobileMoneyDetails}</p>
          <p style="font-size: 12px; color: #334155; margin: 0 0 4px 0;"><strong>Bank Account:</strong> ${settings.bankDetails}</p>
          <p style="font-size: 11px; color: #64748b; margin: 8px 0 0 0;"><em>Please quote invoice number <strong>${invoice.invoiceNo}</strong> as your payment reference.</em></p>
        </div>

        <div style="width: 45%; background: #FAF8F4; padding: 16px 20px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
            <span style="color: #64748b;">Amount Before Tax:</span>
            <span style="font-weight: 600; color: #1e293b;">${currency}${roundMoney(invoice.amountBeforeTax || 0).toFixed(2)}</span>
          </div>
          ${invoice.creditNoteAmount ? `
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; color: #b91c1c;">
              <span>Credit Note:</span>
              <span>-${currency}${roundMoney(invoice.creditNoteAmount).toFixed(2)}</span>
            </div>
          ` : ''}
          ${invoice.tax ? `
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
              <span style="color: #64748b;">Tax:</span>
              <span style="font-weight: 600; color: #1e293b;">${currency}${roundMoney(invoice.tax).toFixed(2)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 8px; margin-bottom: 8px; color: #1e293b;">
            <span>Total Payable:</span>
            <span>${currency}${roundMoney(invoice.total || 0).toFixed(2)}</span>
          </div>
          
          <div style="margin: 8px 0; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
            <p style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin: 0 0 6px 0;">Payments Received</p>
            ${paymentsHtml}
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; border-top: 2px solid #075545; padding-top: 10px; color: ${(invoice.balance || 0) > 0 ? '#b91c1c' : '#15803d'};">
            <span>BALANCE DUE:</span>
            <span>${currency}${roundMoney(invoice.balance || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #64748b;">
        <p style="margin: 0;">Thank you for trusting Civitas Estate & Maintenance. Smart Living. Sustainable Legacy.</p>
      </div>
    </div>
  `;
}

export function renderPrintReceiptHtml(
  payment: Payment,
  invoice: Invoice | undefined,
  customer: Customer,
  settings: SystemSettings
): string {
  const currency = settings.currencySymbol;
  const remainingBalance = invoice ? roundMoney(invoice.balance || 0) : 0;

  return `
    <div class="printable-doc" style="max-width: 800px; margin: 0 auto; background: #ffffff; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.5;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #075545; padding-bottom: 24px; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 24px; font-weight: 800; color: #075545; margin: 0 0 4px 0;">${settings.companyName}</h1>
          <p style="font-size: 13px; color: #E4693F; font-weight: 600; margin: 0 0 12px 0;">${settings.tagline}</p>
          <p style="font-size: 12px; color: #64748b; margin: 0;">${settings.address}</p>
          <p style="font-size: 12px; color: #64748b; margin: 0;">Phone: ${settings.phone} | Email: ${settings.email}</p>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; background: #15803d; color: #ffffff; font-size: 14px; font-weight: 700; padding: 6px 16px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">OFFICIAL RECEIPT</span>
          <p style="font-size: 15px; font-weight: 700; color: #1e293b; margin: 12px 0 2px 0;">Receipt No: ${payment.paymentId}</p>
          <p style="font-size: 12px; color: #64748b; margin: 0;">Date: ${payment.paymentDate}</p>
          <p style="font-size: 12px; color: #075545; font-weight: 600; margin: 2px 0 0 0;">Invoice Ref: ${payment.invoiceNo}</p>
        </div>
      </div>

      <!-- Received From -->
      <div style="display: flex; justify-content: space-between; background: #FAF8F4; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 22px; margin-bottom: 28px;">
        <div>
          <h4 style="font-size: 11px; text-transform: uppercase; color: #64748b; margin: 0 0 6px 0; letter-spacing: 0.5px;">Received With Thanks From</h4>
          <p style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0;">${customer.customerName}</p>
          <p style="font-size: 13px; color: #475569; margin: 0;">Phone: ${customer.phone || 'On file'} &bull; Area: ${customer.area}</p>
        </div>
        <div style="text-align: right;">
          <h4 style="font-size: 11px; text-transform: uppercase; color: #64748b; margin: 0 0 6px 0; letter-spacing: 0.5px;">Amount Received</h4>
          <p style="font-size: 24px; font-weight: 800; color: #15803d; margin: 0;">${currency}${roundMoney(payment.amount).toFixed(2)}</p>
          <p style="font-size: 12px; color: #475569; margin: 2px 0 0 0;">Method: <strong>${payment.method}</strong> (${payment.reference || 'Verified'})</p>
        </div>
      </div>

      <!-- Payment Breakdown Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Invoice Reference</th>
            <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Payment Channel &amp; Ref</th>
            <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Amount Paid</th>
            <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Remaining Invoice Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #075545;">
              ${payment.invoiceNo} ${invoice?.notes ? `<div style="font-size: 11px; font-weight: 400; color: #64748b;">${invoice.notes}</div>` : ''}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">
              ${payment.method} &mdash; <span style="font-family: monospace;">${payment.reference || 'N/A'}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #15803d;">
              ${currency}${roundMoney(payment.amount).toFixed(2)}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: ${remainingBalance > 0 ? '#b91c1c' : '#15803d'};">
              ${currency}${remainingBalance.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Sign-off Block -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px;">
        <div>
          <p style="margin: 0 0 4px 0; color: #64748b;">Received &amp; Verified By:</p>
          <p style="margin: 0; font-weight: 700; color: #075545;">${payment.receivedBy || settings.companyName}</p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #15803d;">Status: ${payment.reconciliationStatus || 'Reconciled'}</p>
        </div>
        <div style="text-align: right; color: #64748b;">
          <p style="margin: 0;">Thank you for your payment.</p>
          <p style="margin: 2px 0 0 0; font-weight: 600; color: #075545;">${settings.companyName} &bull; ${settings.tagline}</p>
        </div>
      </div>
    </div>
  `;
}

export function renderPrintInspectionHtml(
  inspection: PropertyInspection,
  property: Property | undefined,
  customer: Customer | undefined,
  settings: SystemSettings
): string {
  const areas = [
    { name: 'Roof and Ceiling', rating: inspection.roofAndCeiling || 'Not inspected' },
    { name: 'Plumbing & Drainage', rating: inspection.plumbing || 'Not inspected' },
    { name: 'Electrical & Fittings', rating: inspection.electrical || 'Not inspected' },
    { name: 'Doors, Locks & Windows', rating: inspection.doorsLocksWindows || 'Not inspected' },
    { name: 'Damp, Moisture & Pests', rating: inspection.dampAndPests || 'Not inspected' },
    { name: 'Compound, Grounds & Exterior', rating: inspection.compoundAndExterior || 'Not inspected' }
  ];

  const getBadge = (rating: string) => {
    if (rating === 'Good') return '<span style="background: #dcfce7; color: #15803d; font-weight: 700; padding: 4px 10px; border-radius: 4px;">GOOD</span>';
    if (rating === 'Fair') return '<span style="background: #fef9c3; color: #854d0e; font-weight: 700; padding: 4px 10px; border-radius: 4px;">FAIR (Attention)</span>';
    if (rating === 'Poor') return '<span style="background: #fee2e2; color: #b91c1c; font-weight: 700; padding: 4px 10px; border-radius: 4px;">POOR (Action Required)</span>';
    return '<span style="background: #f1f5f9; color: #64748b; padding: 4px 10px; border-radius: 4px;">NOT INSPECTED</span>';
  };

  return `
    <div class="printable-doc" style="max-width: 800px; margin: 0 auto; background: #ffffff; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.5;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #075545; padding-bottom: 24px; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 800; color: #075545; margin: 0 0 4px 0;">Civitas Property Watch</h1>
          <p style="font-size: 13px; color: #E4693F; font-weight: 600; margin: 0 0 12px 0;">Scheduled Visual Inspection & Condition Report</p>
          <p style="font-size: 12px; color: #64748b; margin: 0;">${settings.companyName} | ${settings.phone}</p>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; background: #FAF8F4; border: 1px solid #cbd5e1; color: #075545; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 4px;">REPORT ${inspection.inspectionId}</span>
          <p style="font-size: 12px; color: #64748b; margin: 8px 0 0 0;">Date: ${inspection.inspectionDate}</p>
          <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">Inspector: ${inspection.inspector || 'Civitas Certified Inspector'}</p>
        </div>
      </div>

      <!-- Property & Customer Overview -->
      <div style="display: flex; justify-content: space-between; background: #FAF8F4; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px 20px; margin-bottom: 24px;">
        <div>
          <p style="font-size: 11px; text-transform: uppercase; color: #64748b; margin: 0 0 4px 0; font-weight: 600;">Property</p>
          <p style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 0;">${property ? property.addressOrDescription : 'Property'}</p>
          <p style="font-size: 12px; color: #475569; margin: 2px 0 0 0;">Area: ${property ? property.area : 'Accra/Tema'}</p>
        </div>
        <div>
          <p style="font-size: 11px; text-transform: uppercase; color: #64748b; margin: 0 0 4px 0; font-weight: 600;">Client</p>
          <p style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 0;">${customer ? customer.customerName : 'Client'}</p>
          <p style="font-size: 12px; color: #475569; margin: 2px 0 0 0;">Channel: ${customer ? customer.preferredChannel : 'WhatsApp'}</p>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 11px; text-transform: uppercase; color: #64748b; margin: 0 0 4px 0; font-weight: 600;">Overall Status</p>
          <div>${getBadge(inspection.conditionRating || 'Good')}</div>
        </div>
      </div>

      <!-- Area Matrix -->
      <h3 style="font-size: 14px; font-weight: 700; color: #075545; text-transform: uppercase; margin: 0 0 12px 0;">Visual Inspection Scope & Status</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Area Evaluated</th>
            <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Condition Rating</th>
          </tr>
        </thead>
        <tbody>
          ${areas.map(a => `
            <tr>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 500; color: #1e293b;">${a.name}</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${getBadge(a.rating)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Findings & Recommendations -->
      <div style="margin-bottom: 24px;">
        <h4 style="font-size: 12px; text-transform: uppercase; color: #075545; font-weight: 700; margin: 0 0 6px 0;">Inspector Observations</h4>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; font-size: 13px; color: #334155; line-height: 1.6;">
          ${inspection.observations || 'No issues observed during the scheduled walk-through inspection.'}
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <h4 style="font-size: 12px; text-transform: uppercase; color: #E4693F; font-weight: 700; margin: 0 0 6px 0;">Practical Recommendations</h4>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; font-size: 13px; color: #334155; line-height: 1.6;">
          ${inspection.recommendations || 'Continue scheduled maintenance routine.'}
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b; background: #f8fafc; padding: 10px 14px; border-radius: 4px; margin-bottom: 24px;">
        <span>Photo Reference: <strong>${inspection.photosFolderReference || 'Photos on file'}</strong></span>
        <span>Next Inspection Due: <strong>${inspection.nextInspectionDue || 'To be scheduled'}</strong></span>
      </div>

      <!-- Mandatory Legal Disclaimer -->
      <div style="background: #FAF8F4; border-left: 4px solid #E4693F; padding: 12px 16px; font-size: 11px; color: #64748b; line-height: 1.5;">
        <strong>Important Notice:</strong> This is a property condition report based on a visual walk-through on the date shown. It is not a security guarding, live surveillance, insurance, or structural engineering service. Civitas Estate & Maintenance accepts no liability for unobservable internal structural defects.
      </div>
    </div>
  `;
}

export function renderPrintMonthlyReportHtml(
  monthAccount: MonthManagementAccount,
  year: number,
  settings: SystemSettings,
  openChecksCount: number
): string {
  const currency = settings.currencySymbol;

  return `
    <div class="printable-doc" style="max-width: 800px; margin: 0 auto; background: #ffffff; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.5;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #075545; padding-bottom: 20px; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 800; color: #075545; margin: 0 0 4px 0;">${settings.companyName}</h1>
          <p style="font-size: 13px; color: #E4693F; font-weight: 600; margin: 0;">Monthly Management Performance Report</p>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 16px; font-weight: 800; color: #1e293b; margin: 0;">Period: ${monthAccount.monthLabel} ${year}</p>
          <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">Report Date: ${settings.reportDateOverride || new Date().toISOString().split('T')[0]}</p>
        </div>
      </div>

      <!-- Financial Snapshot Cards -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
        <div style="background: #FAF8F4; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
          <p style="font-size: 11px; text-transform: uppercase; color: #64748b; margin: 0 0 4px 0; font-weight: 600;">Invoiced Revenue</p>
          <p style="font-size: 18px; font-weight: 800; color: #075545; margin: 0;">${currency}${roundMoney(monthAccount.totalRevenue).toFixed(2)}</p>
        </div>
        <div style="background: #FAF8F4; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
          <p style="font-size: 11px; text-transform: uppercase; color: #64748b; margin: 0 0 4px 0; font-weight: 600;">Gross Contribution</p>
          <p style="font-size: 18px; font-weight: 800; color: #1e293b; margin: 0;">${currency}${roundMoney(monthAccount.grossContribution).toFixed(2)}</p>
          <p style="font-size: 11px; color: #15803d; margin: 2px 0 0 0; font-weight: 600;">Margin: ${monthAccount.contributionMargin ? Math.round(monthAccount.contributionMargin * 100) : 0}%</p>
        </div>
        <div style="background: #FAF8F4; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
          <p style="font-size: 11px; text-transform: uppercase; color: #64748b; margin: 0 0 4px 0; font-weight: 600;">Operating Profit</p>
          <p style="font-size: 18px; font-weight: 800; color: ${monthAccount.operatingProfit >= 0 ? '#15803d' : '#b91c1c'}; margin: 0;">${currency}${roundMoney(monthAccount.operatingProfit).toFixed(2)}</p>
        </div>
        <div style="background: #FAF8F4; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
          <p style="font-size: 11px; text-transform: uppercase; color: #64748b; margin: 0 0 4px 0; font-weight: 600;">Closing Cash</p>
          <p style="font-size: 18px; font-weight: 800; color: #075545; margin: 0;">${currency}${roundMoney(monthAccount.closingCash).toFixed(2)}</p>
        </div>
      </div>

      <!-- Financial Breakdown Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
        <thead>
          <tr style="background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 8px 12px; text-align: left; text-transform: uppercase; color: #475569;">Financial Metric</th>
            <th style="padding: 8px 12px; text-align: right; text-transform: uppercase; color: #475569;">Amount (${currency})</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding: 6px 12px; font-weight: 600; color: #075545;">Civitas Fix Revenue</td><td style="padding: 6px 12px; text-align: right;">${currency}${roundMoney(monthAccount.revCivitasFix).toFixed(2)}</td></tr>
          <tr><td style="padding: 6px 12px; font-weight: 600; color: #075545;">Civitas Care Revenue</td><td style="padding: 6px 12px; text-align: right;">${currency}${roundMoney(monthAccount.revCivitasCare).toFixed(2)}</td></tr>
          <tr><td style="padding: 6px 12px; font-weight: 600; color: #075545;">Civitas Property Watch Revenue</td><td style="padding: 6px 12px; text-align: right;">${currency}${roundMoney(monthAccount.revCivitasWatch).toFixed(2)}</td></tr>
          <tr style="border-top: 1px solid #e2e8f0; background: #FAF8F4;"><td style="padding: 6px 12px; font-weight: 700;">TOTAL REVENUE</td><td style="padding: 6px 12px; text-align: right; font-weight: 700;">${currency}${roundMoney(monthAccount.totalRevenue).toFixed(2)}</td></tr>
          
          <tr><td style="padding: 6px 12px; color: #64748b;">Direct Field Labour (Assignments)</td><td style="padding: 6px 12px; text-align: right;">${currency}${roundMoney(monthAccount.directLabour).toFixed(2)}</td></tr>
          <tr><td style="padding: 6px 12px; color: #64748b;">Direct Materials</td><td style="padding: 6px 12px; text-align: right;">${currency}${roundMoney(monthAccount.directMaterials).toFixed(2)}</td></tr>
          <tr><td style="padding: 6px 12px; color: #64748b;">Direct Transport</td><td style="padding: 6px 12px; text-align: right;">${currency}${roundMoney(monthAccount.directTransport).toFixed(2)}</td></tr>
          <tr style="border-top: 1px solid #e2e8f0; background: #FAF8F4;"><td style="padding: 6px 12px; font-weight: 700;">TOTAL DIRECT COSTS</td><td style="padding: 6px 12px; text-align: right; font-weight: 700;">${currency}${roundMoney(monthAccount.totalDirectCosts).toFixed(2)}</td></tr>
          
          <tr style="background: #f1f5f9;"><td style="padding: 6px 12px; font-weight: 800; color: #075545;">GROSS CONTRIBUTION</td><td style="padding: 6px 12px; text-align: right; font-weight: 800; color: #075545;">${currency}${roundMoney(monthAccount.grossContribution).toFixed(2)}</td></tr>
          
          <tr><td style="padding: 6px 12px; color: #64748b;">Total Operating Expenses</td><td style="padding: 6px 12px; text-align: right;">${currency}${roundMoney(monthAccount.totalOpex).toFixed(2)}</td></tr>
          <tr><td style="padding: 6px 12px; color: #64748b;">Straight-line Depreciation</td><td style="padding: 6px 12px; text-align: right;">${currency}${roundMoney(monthAccount.depreciation).toFixed(2)}</td></tr>
          <tr style="border-top: 2px solid #075545; background: #FAF8F4;"><td style="padding: 8px 12px; font-weight: 800;">OPERATING PROFIT / (LOSS)</td><td style="padding: 8px 12px; text-align: right; font-weight: 800; color: ${monthAccount.operatingProfit >= 0 ? '#15803d' : '#b91c1c'};">${currency}${roundMoney(monthAccount.operatingProfit).toFixed(2)}</td></tr>
        </tbody>
      </table>

      <!-- Cash & Working Capital Summary -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 18px; margin-bottom: 24px;">
        <h4 style="font-size: 12px; font-weight: 700; color: #075545; text-transform: uppercase; margin: 0 0 10px 0;">Cash & Balance Sheet Position</h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 12px;">
          <div><span style="color: #64748b;">Closing Cash:</span> <strong style="color: #1e293b;">${currency}${roundMoney(monthAccount.closingCash).toFixed(2)}</strong></div>
          <div><span style="color: #64748b;">Receivables (Unpaid):</span> <strong style="color: #1e293b;">${currency}${roundMoney(monthAccount.receivables).toFixed(2)}</strong></div>
          <div><span style="color: #64748b;">Payables:</span> <strong style="color: #1e293b;">${currency}${roundMoney(monthAccount.payables).toFixed(2)}</strong></div>
        </div>
        <div style="border-top: 1px solid #cbd5e1; margin-top: 10px; padding-top: 8px; font-size: 13px;">
          <span style="color: #075545; font-weight: 700;">Working Capital (Cash + Receivables - Payables):</span>
          <strong style="color: #075545; font-weight: 800;"> ${currency}${roundMoney(monthAccount.workingCapital).toFixed(2)}</strong>
        </div>
      </div>

      <div style="font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 14px;">
        Prepared from the Civitas operations register. Management accounts only, not audited financial statements. Open control check items needing attention: <strong>${openChecksCount}</strong>.
      </div>
    </div>
  `;
}
