import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formUrl = process.env.APPS_SCRIPT_FORM_URL;
  const adminKey = process.env.ADMIN_PANEL_KEY;

  if (!formUrl || !adminKey) {
    return NextResponse.json(
      {
        ok: false,
        message: "Server configuration missing.",
      },
      { status: 500 }
    );
  }

  try {
    const payload = await request.json();

    // Validate admin key
    if (payload.adminKey !== adminKey) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid admin key.",
        },
        { status: 401 }
      );
    }

    // Fetch registrations from Apps Script
    const response = await fetch(formUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "getRegistrations",
      }),
      cache: "no-store",
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: "Failed to fetch registrations from Apps Script.",
        },
        { status: 500 }
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: true, registrations: [] };
    }

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to fetch reports.",
      },
      { status: 500 }
    );
  }
}
