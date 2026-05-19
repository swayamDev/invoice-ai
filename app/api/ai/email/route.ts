import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const {
      clientName,
      invoiceNumber,
      amount,
      dueDate,
      senderName,
      senderCompany,
      type = 'invoice',
    } = await req.json()

    const isReminder = type === 'reminder'

    // Always provide a solid fallback
    const fallback = {
      subject: isReminder
        ? `Payment Reminder: ${invoiceNumber} – ${amount} Overdue`
        : `Invoice ${invoiceNumber} from ${senderCompany || senderName} – ${amount} Due`,
      body: isReminder
        ? `Dear ${clientName || 'Valued Client'},\n\nI hope this message finds you well. I'm writing to follow up on invoice ${invoiceNumber} for ${amount}, which was due on ${dueDate}.\n\nCould you please let us know when we can expect payment, or reach out if there are any issues we can help resolve?\n\nThank you for your prompt attention to this matter.\n\nBest regards,\n${senderName || senderCompany}`
        : `Dear ${clientName || 'Valued Client'},\n\nPlease find invoice ${invoiceNumber} for ${amount} attached to this email.\n\nPayment is due by ${dueDate}. If you have any questions about the services or the invoice, please don't hesitate to get in touch.\n\nThank you for your continued business — it's truly appreciated!\n\nWarm regards,\n${senderName || senderCompany}`,
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(fallback)
    }

    const prompt = isReminder
      ? `Write a polite payment reminder email.
Client name: ${clientName}
Invoice number: ${invoiceNumber}
Amount owed: ${amount}
Original due date: ${dueDate}
Sender: ${senderName}${senderCompany ? ` at ${senderCompany}` : ''}
Return JSON: {"subject":"...","body":"..."}`
      : `Write a professional invoice delivery email.
Client name: ${clientName}
Invoice number: ${invoiceNumber}
Amount: ${amount}
Due date: ${dueDate}
From: ${senderName}${senderCompany ? ` at ${senderCompany}` : ''}
Return JSON: {"subject":"...","body":"..."}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 500,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content:
              'You are a professional business email writer. Return ONLY valid JSON with "subject" and "body" keys. No markdown, no extra text, no code blocks.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!response.ok) {
      console.error('[AI Email] OpenAI error:', response.status)
      return NextResponse.json(fallback)
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content || '{}'
    const text = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

    try {
      const parsed = JSON.parse(text)
      return NextResponse.json({
        subject: parsed.subject || fallback.subject,
        body: parsed.body || fallback.body,
      })
    } catch {
      return NextResponse.json(fallback)
    }
  } catch (err) {
    console.error('[AI Email] error:', err)
    return NextResponse.json({ error: 'Email generation failed' }, { status: 500 })
  }
}
