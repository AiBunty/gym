import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";
import { createTransporter } from "@/lib/email";
import type { EmailSettings } from "@/lib/cms";

type TestSmtpBody = {
  token?: string;
  toEmail?: string;
  smtp?: EmailSettings;
  subject?: string;
  text?: string;
  html?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TestSmtpBody;

    const verification = verifyAdminToken(String(body.token || ""));
    if (!verification.ok) {      return NextResponse.json({ ok: false, message: verification.message }, { status: 401 });
    }

    const toEmail = String(body.toEmail || "").trim();
    if (!toEmail) {
      return NextResponse.json({ ok: false, message: "Recipient email is required." }, { status: 400 });
    }

    const smtp = body.smtp;
    if (!smtp) {
      return NextResponse.json({ ok: false, message: "SMTP settings payload missing." }, { status: 400 });
    }

    const startedAt = Date.now();
    const transporter = await createTransporter(smtp);
    const verifiedAt = Date.now();

    const fromDisplay = smtp.fromName?.trim() || "Wani's Club Level Up";
    const fromEmail = smtp.fromEmail?.trim() || smtp.user;

    const subject = String(body.subject || "SMTP Test - Wani's Club Level Up").trim();
    const text = String(body.text || "This is a test SMTP message.").trim();
    const html = String(body.html || "").trim();

    const sendResult = await transporter.sendMail({
      from: `${fromDisplay} <${fromEmail}>`,
      to: toEmail,
      subject,
      text,
      html: html || undefined,
    });

    return NextResponse.json({
      ok: true,
      message: "SMTP test email sent successfully.",
      diagnostics: {
        provider: smtp.provider,
        host: smtp.host,
        port: Number(smtp.port),
        secure: Boolean(smtp.secure),
        authUser: smtp.user,
        from: `${fromDisplay} <${fromEmail}>`,
        to: toEmail,
        verifyMs: verifiedAt - startedAt,
        sendMs: Date.now() - verifiedAt,
        messageId: sendResult.messageId,
        response: sendResult.response,
      },
    });
  } catch (error) {
    const err = error as Error & { code?: string; command?: string; response?: string };
    return NextResponse.json(
      {
        ok: false,
        message: err?.message || "SMTP test failed.",
        diagnostics: {
          code: err?.code || "UNKNOWN",
          command: err?.command || "",
          response: err?.response || "",
        },
      },
      { status: 500 }
    );
  }
}
