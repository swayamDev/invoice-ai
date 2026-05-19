import { NextRequest, NextResponse } from 'next/server'
import { buildInvoiceEmailHtml, buildInvoiceEmailText } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const {
      type = 'invoice',
      to,
      subject,
      body,
      invoiceNumber,
      invoiceId,
      clientName,
      clientEmail,
      senderName,
      senderCompany,
      senderEmail,
      senderAddress,
      issueDate,
      dueDate,
      currency = 'USD',
      subtotal = 0,
      taxRate = 0,
      taxAmount = 0,
      discount = 0,
      total = 0,
      items = [],
      notes,
    } = payload

    if (!to || !subject) {
      return NextResponse.json({ error: 'Missing recipient or subject' }, { status: 400 })
    }

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      console.log(`[Invoice Send] No RESEND_API_KEY — would email ${to}: "${subject}"`)
      return NextResponse.json({
        success: true,
        note: 'Invoice saved. Email not sent — configure RESEND_API_KEY to enable email sending.',
      })
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'invoices@yourdomain.com'
    const fromName = senderCompany || senderName || 'Invoice AI'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://invoice-ai.vercel.app'

    const emailData = {
      type: (type as 'invoice' | 'reminder' | 'receipt'),
      invoiceNumber: invoiceNumber || 'INV',
      invoiceId: invoiceId || '',
      clientName: clientName || to,
      clientEmail: clientEmail || to,
      senderName: senderName || fromName,
      senderCompany,
      senderEmail: senderEmail || fromEmail,
      senderAddress,
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      currency,
      subtotal,
      taxRate,
      taxAmount,
      discount,
      total,
      items,
      notes,
      subject,
      body,
      appName: 'Invoice AI',
      appUrl,
    }

    const htmlContent = buildInvoiceEmailHtml(emailData)
    const textContent = buildInvoiceEmailText(emailData)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: 'type', value: type },
          { name: 'invoice_number', value: invoiceNumber || 'unknown' },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('[Resend] Error:', err)
      throw new Error(err.message || `Resend error ${response.status}`)
    }

    const result = await response.json()
    return NextResponse.json({ success: true, messageId: result.id })
  } catch (err) {
    console.error('[Invoice Send] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}
