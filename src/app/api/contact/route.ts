import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const to = String(body?.to || "").trim();
    const name = String(body?.name || "Visitor").trim();
    const fromEmail = String(body?.fromEmail || "noreply@example.com").trim();
    const message = String(body?.message || "").trim();

    if (!to || !message) {
      return NextResponse.json({ ok: false, error: "Missing 'to' or 'message'" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "RESEND_API_KEY is not set" }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const subject = `New contact message from ${name}`;

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial; line-height:1.6; color:#e5e7eb; background:#000; padding:24px;">
        <h2 style="margin:0 0 16px 0; color:#fff;">New Contact Message</h2>
        <p style="margin:0 0 8px 0;"><strong>From:</strong> ${name} &lt;${fromEmail}&gt;</p>
        <p style="margin:0 0 16px 0;"><strong>To:</strong> ${to}</p>
        <div style="white-space:pre-wrap; background:#111; border:1px solid #222; padding:12px; border-radius:8px;">${message}</div>
      </div>
    `;

    const isProd = process.env.NEXT_PUBLIC_APP_ENV === "production";
    const fromAddress = isProd ? process.env.RESEND_FROM_PROD : process.env.RESEND_FROM_DEV;
    if (!fromAddress) {
      return NextResponse.json({ ok: false, error: "Missing FROM address env" }, { status: 500 });
    }

    const send = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject,
      html,
      replyTo: fromEmail,
    });

    if (send.error) {
      return NextResponse.json({ ok: false, error: send.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}

