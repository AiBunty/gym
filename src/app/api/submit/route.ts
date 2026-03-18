import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formUrl = process.env.APPS_SCRIPT_FORM_URL;

  if (!formUrl) {
    return NextResponse.json(
      {
        ok: false,
        message: "APPS_SCRIPT_FORM_URL is not configured.",
      },
      { status: 500 }
    );
  }

  try {
    const payload = await request.json();

    const response = await fetch(formUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        source: "wani-club-level-up-site",
        submittedAt: new Date().toISOString(),
      }),
      cache: "no-store",
    });

    const text = await response.text();

    return NextResponse.json(
      {
        ok: response.ok,
        message: text || "Submission forwarded to Apps Script.",
      },
      { status: response.ok ? 200 : 502 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to submit form data.",
      },
      { status: 500 }
    );
  }
}
