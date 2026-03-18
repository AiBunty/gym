import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";
import { applyTemplate, createTransporter, loadEmailConfigFromCms } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const verification = verifyAdminToken(payload.token);
    if (!verification.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: verification.message,
        },
        { status: 401 }
      );
    }

    const { recipientEmails, subject, message, html, audienceSource } = payload;

    if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "No recipient emails provided.",
        },
        { status: 400 }
      );
    }

    if (!subject || (!message && !html)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Subject and message/html are required.",
        },
        { status: 400 }
      );
    }

    const { emailSettings } = await loadEmailConfigFromCms();
    const transporter = await createTransporter(emailSettings);

    const fromDisplay = emailSettings.fromName?.trim() || "Wani's Club Level Up";
    const fromEmail = emailSettings.fromEmail?.trim() || emailSettings.user;

    const sendResult = await transporter.sendMail({
      from: `${fromDisplay} <${fromEmail}>`,
      to: recipientEmails.join(","),
      subject,
      text: applyTemplate(String(message || ""), {}),
      html: html ? applyTemplate(String(html), {}) : undefined,
    });

    return NextResponse.json({
      ok: true,
      message: `Email sent to ${recipientEmails.length} recipient(s).`,
      details: {
        by: verification.payload.username,
        audience: audienceSource || "custom",
        recipientCount: recipientEmails.length,
        subject,
        messageId: sendResult.messageId,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to send email.",
      },
      { status: 500 }
    );
  }
}
