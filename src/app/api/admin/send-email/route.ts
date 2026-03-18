import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";

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

    const { recipientEmails, subject, message, audienceSource } = payload;

    if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "No recipient emails provided.",
        },
        { status: 400 }
      );
    }

    if (!subject || !message) {
      return NextResponse.json(
        {
          ok: false,
          message: "Subject and message are required.",
        },
        { status: 400 }
      );
    }

    // For now, simulate email sending
    // In production, integrate with Nodemailer or SendGrid
    console.log("Email notification:");
    console.log(`By: ${verification.payload.username}`);
    console.log(`Audience: ${audienceSource || "custom"}`);
    console.log(`To: ${recipientEmails.join(", ")}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);

    return NextResponse.json({
      ok: true,
      message: `Email would be sent to ${recipientEmails.length} recipient(s).`,
      details: {
        recipientCount: recipientEmails.length,
        subject,
        messageLength: message.length,
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
