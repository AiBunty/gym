import { NextResponse } from "next/server";
import { normalizeCmsData } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET() {
  const cmsUrl = process.env.APPS_SCRIPT_CMS_URL;

  if (!cmsUrl) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        message: "APPS_SCRIPT_CMS_URL is not configured.",
      },
      { status: 200 }
    );
  }

  try {
    const response = await fetch(cmsUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`CMS request failed with ${response.status}`);
    }

    const raw = await response.json();
    const data = normalizeCmsData(raw);

    return NextResponse.json(
      {
        ok: true,
        configured: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        message: error instanceof Error ? error.message : "Failed to fetch CMS data.",
      },
      { status: 500 }
    );
  }
}
