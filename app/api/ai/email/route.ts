import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const {
      clientName,
      invoiceNumber,
      amount,
      dueDate,
      senderName,
      type = "invoice",
    } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback template
      const isReminder = type === "reminder";
      return NextResponse.json({
        subject: isReminder
          ? `Payment Reminder: ${invoiceNumber} – ${amount}`
          : `Invoice ${invoiceNumber} – ${amount}`,
        body: isReminder
          ? `Dear ${clientName || "Client"},\n\nThis is a friendly reminder that invoice ${invoiceNumber} for ${amount} was due on ${dueDate}.\n\nPlease process payment at your earliest convenience. If you have any questions, don't hesitate to reach out.\n\nBest regards,\n${senderName}`
          : `Dear ${clientName || "Client"},\n\nPlease find invoice ${invoiceNumber} for ${amount} attached.\n\nPayment is due by ${dueDate}. If you have any questions, please don't hesitate to reach out.\n\nThank you for your business!\n\nBest regards,\n${senderName}`,
      });
    }

    const prompt =
      type === "reminder"
        ? `Write a polite payment reminder email. Client: ${clientName}. Invoice: ${invoiceNumber}. Amount: ${amount}. Was due: ${dueDate}. Sender: ${senderName}. Return JSON with "subject" and "body". Body: 3-4 sentences. Professional but friendly.`
        : `Write a professional invoice email. Client: ${clientName}. Invoice: ${invoiceNumber}. Amount: ${amount}. Due: ${dueDate}. From: ${senderName}. Return JSON with "subject" and "body". Body: 3-4 sentences.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system:
          'You are a professional business email writer. Return only valid JSON with "subject" and "body" keys. No markdown. No extra text.',
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "{}";
    const parsed = JSON.parse(text);

    return NextResponse.json({
      subject: parsed.subject || `Invoice ${invoiceNumber}`,
      body: parsed.body || "",
    });
  } catch (err) {
    console.error("AI email error:", err);
    return NextResponse.json(
      { error: "Email generation failed" },
      { status: 500 },
    );
  }
}
