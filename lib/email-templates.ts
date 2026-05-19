// =============================================================
// INVOICE AI — Responsive Email Templates
// Used by /app/api/invoices/send/route.ts
// =============================================================

interface InvoiceEmailData {
  type: 'invoice' | 'reminder' | 'receipt'
  invoiceNumber: string
  invoiceId: string
  clientName: string
  clientEmail: string
  senderName: string
  senderCompany?: string
  senderEmail: string
  senderAddress?: string
  issueDate: string
  dueDate: string
  currency: string
  subtotal: number
  taxRate: number
  taxAmount: number
  discount: number
  total: number
  items: Array<{ description: string; quantity: number; rate: number; amount: number }>
  notes?: string
  subject: string
  body: string
  appName?: string
  appUrl?: string
}

function fmt(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function buildInvoiceEmailHtml(data: InvoiceEmailData): string {
  const {
    type,
    invoiceNumber,
    clientName,
    senderName,
    senderCompany,
    senderEmail,
    senderAddress,
    issueDate,
    dueDate,
    currency,
    subtotal,
    taxRate,
    taxAmount,
    discount,
    total,
    items,
    notes,
    body,
    appName = 'Invoice AI',
    appUrl = 'https://invoice-ai.vercel.app',
  } = data

  const accentColor = type === 'reminder' ? '#ef4444' : type === 'receipt' ? '#10b981' : '#FF0A54'
  const badgeText =
    type === 'reminder' ? 'PAYMENT OVERDUE' : type === 'receipt' ? 'PAYMENT RECEIVED' : 'INVOICE'
  const badgeBg =
    type === 'reminder' ? '#fef2f2' : type === 'receipt' ? '#f0fdf4' : '#fff0f3'
  const badgeColor =
    type === 'reminder' ? '#dc2626' : type === 'receipt' ? '#059669' : '#FF0A54'

  const itemRows = items
    .filter((item) => item.description)
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;color:#334155;font-size:14px;line-height:1.5;">
            ${item.description}
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;text-align:center;white-space:nowrap;">
            ${item.quantity}
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;text-align:right;white-space:nowrap;">
            ${fmt(item.rate, currency)}
          </td>
          <td style="padding:12px 0 12px 16px;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;font-weight:600;text-align:right;white-space:nowrap;">
            ${fmt(item.amount, currency)}
          </td>
        </tr>`
    )
    .join('')

  const bodyParagraphs = body
    .split('\n\n')
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px 0;color:#475569;font-size:15px;line-height:1.7;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${invoiceNumber} — ${appName}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <!-- Preheader -->
  <span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${invoiceNumber} · ${fmt(total, currency)} due ${fmtDate(dueDate)} · ${senderCompany || senderName}
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </span>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f8fafc;min-width:100%;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Email container -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin:0 auto;">

          <!-- ─── Header ─── -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="background:linear-gradient(135deg,#0a0a0a 0%,#1a0a12 100%);border-radius:16px 16px 0 0;padding:32px 40px;">
                <tr>
                  <td>
                    <!-- Logo + App name -->
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="vertical-align:middle;">
                          <div style="width:40px;height:40px;background-color:${accentColor};border-radius:10px;display:inline-flex;align-items:center;justify-content:center;margin-right:10px;vertical-align:middle;">
                            <span style="color:white;font-size:20px;line-height:1;">✦</span>
                          </div>
                        </td>
                        <td style="vertical-align:middle;padding-left:10px;">
                          <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${appName}</span>
                        </td>
                      </tr>
                    </table>
                    <!-- Badge -->
                    <div style="margin-top:28px;">
                      <span style="display:inline-block;background-color:${badgeBg};color:${badgeColor};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:5px 12px;border-radius:20px;">
                        ${badgeText}
                      </span>
                    </div>
                    <!-- Invoice number -->
                    <h1 style="margin:12px 0 4px;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                      ${invoiceNumber}
                    </h1>
                    <p style="margin:0;color:rgba(255,255,255,0.5);font-size:14px;">
                      From ${senderCompany || senderName}
                    </p>
                  </td>
                  <td align="right" style="vertical-align:bottom;">
                    <div style="text-align:right;">
                      <p style="margin:0 0 2px;color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px;">Total Due</p>
                      <p style="margin:0;color:${accentColor};font-size:32px;font-weight:800;letter-spacing:-1px;">${fmt(total, currency)}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ─── Body card ─── -->
          <tr>
            <td style="background:#ffffff;padding:0 40px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

              <!-- Date strip -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="border-bottom:1px solid #f1f5f9;padding:24px 0;">
                <tr>
                  <td width="50%">
                    <p style="margin:0 0 2px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Issue Date</p>
                    <p style="margin:0;color:#1e293b;font-size:14px;font-weight:600;">${fmtDate(issueDate)}</p>
                  </td>
                  <td width="50%" align="right">
                    <p style="margin:0 0 2px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Due Date</p>
                    <p style="margin:0;color:${type === 'reminder' ? '#dc2626' : '#1e293b'};font-size:14px;font-weight:600;">${fmtDate(dueDate)}</p>
                  </td>
                </tr>
              </table>

              <!-- From / To -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="border-bottom:1px solid #f1f5f9;padding:24px 0;">
                <tr>
                  <td width="50%" style="vertical-align:top;">
                    <p style="margin:0 0 8px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">From</p>
                    <p style="margin:0 0 2px;color:#1e293b;font-size:14px;font-weight:700;">${senderCompany || senderName}</p>
                    ${senderCompany ? `<p style="margin:0 0 2px;color:#64748b;font-size:13px;">${senderName}</p>` : ''}
                    <p style="margin:0 0 2px;color:#64748b;font-size:13px;">${senderEmail}</p>
                    ${senderAddress ? `<p style="margin:0;color:#64748b;font-size:13px;">${senderAddress}</p>` : ''}
                  </td>
                  <td width="50%" style="vertical-align:top;padding-left:32px;">
                    <p style="margin:0 0 8px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">To</p>
                    <p style="margin:0 0 2px;color:#1e293b;font-size:14px;font-weight:700;">${clientName}</p>
                    <p style="margin:0;color:#64748b;font-size:13px;">${data.clientEmail}</p>
                  </td>
                </tr>
              </table>

              <!-- Email body text -->
              <div style="padding:28px 0 4px;">
                ${bodyParagraphs}
              </div>

              <!-- Line items -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="margin:8px 0 0;border-top:2px solid #f1f5f9;">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th style="padding:10px 0;text-align:left;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Description</th>
                    <th style="padding:10px 16px;text-align:center;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;white-space:nowrap;">Qty</th>
                    <th style="padding:10px 16px;text-align:right;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;white-space:nowrap;">Rate</th>
                    <th style="padding:10px 0 10px 16px;text-align:right;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;white-space:nowrap;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>

              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:16px 0 0;">
                <tr>
                  <td></td>
                  <td width="200" style="padding-left:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:5px 0;color:#64748b;font-size:13px;">Subtotal</td>
                        <td style="padding:5px 0;text-align:right;color:#334155;font-size:13px;">${fmt(subtotal, currency)}</td>
                      </tr>
                      ${
                        taxAmount > 0
                          ? `<tr>
                        <td style="padding:5px 0;color:#64748b;font-size:13px;">Tax (${taxRate}%)</td>
                        <td style="padding:5px 0;text-align:right;color:#334155;font-size:13px;">${fmt(taxAmount, currency)}</td>
                      </tr>`
                          : ''
                      }
                      ${
                        discount > 0
                          ? `<tr>
                        <td style="padding:5px 0;color:#64748b;font-size:13px;">Discount</td>
                        <td style="padding:5px 0;text-align:right;color:#059669;font-size:13px;">-${fmt(discount, currency)}</td>
                      </tr>`
                          : ''
                      }
                      <tr>
                        <td style="padding:12px 0 8px;border-top:2px solid #f1f5f9;">
                          <span style="color:#0f172a;font-size:15px;font-weight:800;">Total Due</span>
                        </td>
                        <td style="padding:12px 0 8px;text-align:right;border-top:2px solid #f1f5f9;">
                          <span style="color:${accentColor};font-size:18px;font-weight:800;">${fmt(total, currency)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${
                notes
                  ? `<!-- Notes -->
              <div style="margin:24px 0 0;padding:16px 20px;background:#f8fafc;border-left:3px solid ${accentColor};border-radius:0 8px 8px 0;">
                <p style="margin:0 0 6px;color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Notes</p>
                <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">${notes}</p>
              </div>`
                  : ''
              }

              <!-- Spacer -->
              <div style="height:32px;"></div>
            </td>
          </tr>

          <!-- ─── Footer ─── -->
          <tr>
            <td style="background:#f1f5f9;border-radius:0 0 16px 16px;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 6px;color:#64748b;font-size:12px;line-height:1.6;">
                This email was sent by <strong style="color:#0f172a;">${senderCompany || senderName}</strong> via ${appName}.
              </p>
              <p style="margin:0 0 16px;color:#94a3b8;font-size:12px;">
                If you have questions about this invoice, reply to this email or contact <a href="mailto:${senderEmail}" style="color:${accentColor};text-decoration:none;">${senderEmail}</a>.
              </p>
              <p style="margin:0;color:#cbd5e1;font-size:11px;">
                Powered by <a href="${appUrl}" style="color:${accentColor};text-decoration:none;font-weight:600;">${appName}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`
}

export function buildInvoiceEmailText(data: InvoiceEmailData): string {
  const {
    invoiceNumber,
    clientName,
    senderName,
    senderCompany,
    senderEmail,
    issueDate,
    dueDate,
    currency,
    subtotal,
    taxAmount,
    discount,
    total,
    items,
    notes,
    body,
  } = data

  const separator = '─'.repeat(48)
  const itemLines = items
    .filter((i) => i.description)
    .map((i) => `  ${i.description.padEnd(28)} ${String(i.quantity).padStart(4)} × ${fmt(i.rate, currency).padStart(10)}  ${fmt(i.amount, currency).padStart(12)}`)
    .join('\n')

  return `${invoiceNumber}
From: ${senderCompany || senderName} <${senderEmail}>
To: ${clientName}

${body}

${separator}
INVOICE DETAILS
${separator}
Issue Date: ${fmtDate(issueDate)}
Due Date:   ${fmtDate(dueDate)}

${separator}
ITEMS
${separator}
  ${'Description'.padEnd(28)} ${'Qty'.padStart(4)}   ${'Rate'.padStart(10)}  ${'Amount'.padStart(12)}
${separator}
${itemLines}
${separator}
  ${'Subtotal'.padEnd(44)} ${fmt(subtotal, currency).padStart(12)}
${taxAmount > 0 ? `  ${'Tax'.padEnd(44)} ${fmt(taxAmount, currency).padStart(12)}\n` : ''}${discount > 0 ? `  ${'Discount'.padEnd(44)} -${fmt(discount, currency).padStart(11)}\n` : ''}${separator}
  ${'TOTAL DUE'.padEnd(44)} ${fmt(total, currency).padStart(12)}
${separator}
${notes ? `\nNOTES\n${separator}\n${notes}\n${separator}` : ''}

If you have questions, reply to this email or contact ${senderEmail}.
`
}
