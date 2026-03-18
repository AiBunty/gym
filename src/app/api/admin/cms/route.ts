import { NextResponse } from "next/server";
import { normalizeCmsData } from "@/lib/cms";

export const dynamic = "force-dynamic";

type SaveBody = {
  adminKey?: string;
  data?: unknown;
};

export async function POST(request: Request) {
  const configuredAdminKey = process.env.ADMIN_PANEL_KEY;
  const writeUrl = process.env.APPS_SCRIPT_CMS_WRITE_URL || process.env.APPS_SCRIPT_CMS_URL;

  if (!configuredAdminKey) {
    return NextResponse.json(
      {
        ok: false,
        message: "ADMIN_PANEL_KEY is not configured.",
      },
      { status: 500 }
    );
  }

  if (!writeUrl) {
    return NextResponse.json(
      {
        ok: false,
        message: "APPS_SCRIPT_CMS_WRITE_URL or APPS_SCRIPT_CMS_URL is not configured.",
      },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as SaveBody;

    if (!body.adminKey || body.adminKey !== configuredAdminKey) {
      return NextResponse.json(
        {
          ok: false,
          message: "Unauthorized. Invalid admin key.",
        },
        { status: 401 }
      );
    }

    const normalized = normalizeCmsData(body.data);

    const response = await fetch(writeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        action: "saveCms",
        data: normalized,
      }),
    });

    const text = await response.text();

    return NextResponse.json(
      {
        ok: response.ok,
        message: text || "CMS data forwarded to Apps Script.",
        data: normalized,
      },
      { status: response.ok ? 200 : 502 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to save CMS data.",
      },
      { status: 500 }
    );
  }
}
