import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPTS: Record<string, string> = {
  invoice: `You are a professional invoice writer. Given a description of work done, generate clean professional line item descriptions suitable for an invoice.
Return ONLY a valid JSON array (no markdown, no extra text) like: [{"description":"...","quantity":1,"rate":1000}]
Rules:
- 1 to 4 line items max
- descriptions must be specific and professional
- quantity and rate must be numbers
- rate should reflect realistic market pricing for the work described
- if hourly rate is mentioned, use that as the rate and hours as quantity`,

  email: `You are a professional business email writer for invoice delivery.
Return ONLY valid JSON (no markdown, no extra text) with exactly these keys: {"subject":"...","body":"..."}
Rules:
- subject: concise and professional, include invoice number and amount
- body: 3-5 sentences, friendly but professional tone
- address the client by name if provided
- mention payment due date
- sign off with sender name`,

  reminder: `You are a professional accounts receivable specialist writing payment reminders.
Return ONLY valid JSON (no markdown, no extra text) with exactly these keys: {"subject":"...","body":"..."}
Rules:
- subject: clear and direct, mention overdue invoice
- body: 3-4 sentences, firm but polite tone
- mention invoice number and amount owed
- request action within a specific timeframe
- do not be aggressive or accusatory`,

  terms: `You are a legal and business consultant generating invoice payment terms.
Return ONLY plain text bullet points (no JSON, no markdown headers).
Include exactly 5 bullet points covering:
1. Payment due date policy
2. Late payment interest/fees
3. Accepted payment methods
4. Dispute resolution window
5. Returned payment fee`,
}

const FALLBACKS: Record<string, string> = {
  invoice: JSON.stringify([
    { description: 'Professional Services', quantity: 1, rate: 0 },
  ]),
  email: JSON.stringify({
    subject: 'Invoice for your review',
    body: 'Please find your invoice attached for the services rendered. Payment is due by the date specified on the invoice. Please do not hesitate to reach out if you have any questions. Thank you for your business.',
  }),
  reminder: JSON.stringify({
    subject: 'Payment Reminder — Invoice Overdue',
    body: 'This is a friendly reminder that your invoice is now overdue. Please arrange payment at your earliest convenience. If you have already processed this payment, please disregard this notice. Contact us if you have any questions.',
  }),
  terms:
    '• Payment is due within the number of days specified on the invoice from the issue date\n• Late payments are subject to a 1.5% monthly interest charge (18% per annum)\n• Accepted payment methods: bank transfer, credit/debit card, PayPal, or check\n• All disputes or discrepancies must be raised in writing within 7 days of invoice receipt\n• Returned or failed payments are subject to a $35 processing fee',
}

export async function POST(req: NextRequest) {
  try {
    const { type, input } = await req.json()

    if (!type || !input) {
      return NextResponse.json({ error: 'Missing type or input' }, { status: 400 })
    }

    const systemPrompt = SYSTEM_PROMPTS[type]
    if (!systemPrompt) {
      return NextResponse.json({ error: 'Unknown generation type' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.log('[AI] No OPENAI_API_KEY — returning fallback for type:', type)
      return NextResponse.json({ output: FALLBACKS[type] || '' })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 800,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input },
        ],
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('[AI] OpenAI error:', response.status, errBody)
      return NextResponse.json({ output: FALLBACKS[type] || '' })
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content || ''
    // Strip markdown fences that some models add despite instructions
    const text = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

    return NextResponse.json({ output: text })
  } catch (err) {
    console.error('[AI] generate error:', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
