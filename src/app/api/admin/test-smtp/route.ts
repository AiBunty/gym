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

function friendlySmtpError(
  code: string,
  response: string,
  responseCode: number,
  host: string,
  port: number,
): { title: string; suggestion: string } {
  const r = response.toLowerCase();

  if (code === "ESOCKET" || code === "ECONNREFUSED") {
    return {
      title: "Cannot connect to SMTP server",
      suggestion: `Could not reach ${host}:${port}. Verify the host and port are correct and that outbound SMTP is not blocked by your firewall or network.`,
    };
  }
  if (code === "ETIMEDOUT" || code === "ECONNRESET" || code === "EHOSTUNREACH") {
    return {
      title: "Connection timed out",
      suggestion: `The SMTP server at ${host}:${port} did not respond. Try port 587 (STARTTLS) or port 465 (SSL/TLS). Make sure outbound SMTP is allowed on your network.`,
    };
  }
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return {
      title: "SMTP host not found",
      suggestion: `"${host}" could not be resolved. Double-check the hostname spelling (e.g. smtp.gmail.com, smtp.zoho.com, smtp.titan.email).`,
    };
  }
  if (
    code === "EAUTH" ||
    responseCode === 535 ||
    r.includes("535") ||
    r.includes("invalid credentials") ||
    r.includes("username and password") ||
    r.includes("authentication failed")
  ) {
    return {
      title: "Authentication failed — wrong username or password",
      suggestion:
        "For Gmail: you must use an App Password, NOT your Google account password. Go to myaccount.google.com → Security → 2-Step Verification → App passwords and generate one. For Zoho/Titan/other: use your full email address as the username.",
    };
  }
  if (
    responseCode === 534 ||
    r.includes("534") ||
    r.includes("less secure") ||
    r.includes("application-specific password")
  ) {
    return {
      title: "Gmail: App Password required",
      suggestion:
        "Enable 2-Step Verification on your Google account first, then create an App Password at: myaccount.google.com → Security → App passwords. Use the generated 16-character code as the SMTP password — NOT your regular Google password.",
    };
  }
  if (responseCode === 550 || r.includes("relay") || r.includes("not permitted")) {
    return {
      title: "Relay not permitted — sender address rejected",
      suggestion:
        "Your SMTP server rejected the message. Make sure the From Email in settings exactly matches your authenticated SMTP account email address.",
    };
  }
  if (responseCode === 554 || r.includes("spam") || r.includes("blocked")) {
    return {
      title: "Message blocked or flagged as spam",
      suggestion:
        "The recipient server rejected the message. Try a different recipient email, or check that your sender domain/IP is not blacklisted.",
    };
  }
  return {
    title: "SMTP error",
    suggestion:
      "Verify your SMTP host, port (587 for STARTTLS / 465 for SSL), username, and password. Also make sure SMTP access is enabled on your email provider account settings.",
  };
}

export async function POST(request: NextRequest) {
  let smtp: EmailSettings | undefined;
  try {
    const body = (await request.json()) as TestSmtpBody;

    const verification = verifyAdminToken(String(body.token || ""));
    if (!verification.ok) {
      return NextResponse.json({ ok: false, message: verification.message }, { status: 401 });
    }

    const toEmail = String(body.toEmail || "").trim();
    if (!toEmail) {
      return NextResponse.json({ ok: false, message: "Recipient email is required." }, { status: 400 });
    }

    smtp = body.smtp;
    if (!smtp) {
      return NextResponse.json({ ok: false, message: "SMTP settings payload missing." }, { status: 400 });
    }

    if (!smtp.user) {
      return NextResponse.json(
        { ok: false, message: "SMTP username is empty.", suggestion: "Enter your email address in the SMTP Username field and save settings first." },
        { status: 400 }
      );
    }
    if (!smtp.password) {
      return NextResponse.json(
        { ok: false, message: "SMTP password is empty.", suggestion: "Enter your SMTP password (or App Password for Gmail) in the settings and save first." },
        { status: 400 }
      );
    }

    const startedAt = Date.now();
    const transporter = await createTransporter(smtp);
    const verifiedAt = Date.now();

    const fromDisplay = smtp.fromName?.trim() || "Wani's Club Level Up";
    const fromEmail = smtp.fromEmail?.trim() || smtp.user;

    const subject = String(body.subject || "SMTP Test — Wani's Club Level Up").trim();
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
      message: "Test email sent successfully.",
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
    const err = error as Error & { code?: string; command?: string; response?: string; responseCode?: number };
    const { title, suggestion } = friendlySmtpError(
      err.code || "",
      err.response || err.message || "",
      err.responseCode || 0,
      smtp?.host || "",
      Number(smtp?.port || 0),
    );
    return NextResponse.json(
      {
        ok: false,
        message: title,
        suggestion,
        technical: err.message || "SMTP test failed.",
        diagnostics: {
          code: err.code || "UNKNOWN",
          command: err.command || "",
          response: err.response || "",
          responseCode: err.responseCode || 0,
        },
      },
      { status: 500 }
    );
  }
}
