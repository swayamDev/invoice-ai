import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPTS: Record<string, string> = {
  invoice: `You are a professional invoice writer. Given a description of work done, generate clean professional line item descriptions suitable for an invoice. Return 1-4 line items as a JSON array like: [{"description": "...", "quantity": 1, "rate": 1000}]. Be specific and professional. Rate should be a number. No markdown.`,
  email: `You are a professional business email writer. Given context about an invoice, write a short, friendly but professional email to accompany it. Return JSON with "subject" and "body" keys. The body should be 3-5 sentences. Address the client by name if provided. No markdown in the JSON values.`,
  reminder: `You are a professional accounts receivable specialist. Write a polite but firm payment reminder email. Return JSON with "subject" and "body" keys. Be professional, not aggressive. Mention the invoice number and amount if provided. No markdown in values.`,
  terms: `You are a legal and business consultant. Generate clear, professional payment terms and conditions for an invoice. Return plain text (no JSON). 3-5 bullet points covering: payment due date, late payment fees, accepted payment methods, and dispute resolution. Keep it concise.`,
};

export async function POST(req: NextRequest) {
  try {
    const { type, input } = await req.json();

    if (!type || !input) {
      return NextResponse.json(
        { error: "Missing type or input" },
        { status: 400 },
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[type];
    if (!systemPrompt) {
      return NextResponse.json(
        { error: "Unknown generation type" },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback without AI
      const fallbacks: Record<string, string> = {
        invoice: JSON.stringify([
          { description: "Professional Services", quantity: 1, rate: 0 },
        ]),
        email: JSON.stringify({
          subject: "Invoice for your review",
          body: "Please find your invoice attached. Thank you for your business.",
        }),
        reminder: JSON.stringify({
          subject: "Payment Reminder",
          body: "This is a friendly reminder that your invoice is due. Please process payment at your earliest convenience.",
        }),
        terms:
          "• Payment due within specified days\n• Late payments subject to 1.5% monthly interest\n• Accepted: bank transfer, card, PayPal\n• Disputes must be raised within 7 days",
      };
      return NextResponse.json({ output: fallbacks[type] || "" });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: input }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    return NextResponse.json({ output: text });
  } catch (err) {
    console.error("AI generate error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
