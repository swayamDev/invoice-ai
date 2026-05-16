import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { invoiceId, to, subject, body } = await req.json()

    if (!to || !subject) {
      return NextResponse.json({ error: 'Missing recipient or subject' }, { status: 400 })
    }

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      // Log and return success — no email sent but invoice is saved
      console.log(`[Invoice Send] Would email ${to}: "${subject}"`)
      return NextResponse.json({ success: true, note: 'Email not sent — no RESEND_API_KEY configured' })
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'invoices@yourdomain.com'

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        text: body,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <pre style="font-family:Arial,sans-serif;white-space:pre-wrap;line-height:1.6">${body}</pre>
          <hr style="border:none;border-top:1px solid #eee;margin:30px 0">
          <p style="color:#999;font-size:12px">Sent via Invoice AI</p>
        </div>`,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.message || 'Resend error')
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Send invoice error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
