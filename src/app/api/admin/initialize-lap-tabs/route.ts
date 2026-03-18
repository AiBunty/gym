import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";

function getAppsScriptUrls(): string[] {
  const directUrls = [
    process.env.APPS_SCRIPT_CMS_WRITE_URL,
    process.env.APPS_SCRIPT_CMS_URL,
  ].filter(Boolean) as string[];

  const deploymentId = process.env.NEXT_PUBLIC_APPSCRIPT_DEPLOYMENT_ID;
  const deploymentUrl = deploymentId
    ? `https://script.google.com/macros/s/${deploymentId}/exec`
    : null;

  return Array.from(new Set([...directUrls, ...(deploymentUrl ? [deploymentUrl] : [])]));
}

function looksLikeHtml(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html");
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const verification = verifyAdminToken(String(payload?.token || ""));

    if (!verification.ok) {
      return NextResponse.json({ ok: false, message: verification.message }, { status: 401 });
    }

    const urls = getAppsScriptUrls();
    if (urls.length === 0) {
      return NextResponse.json({ ok: false, message: "Apps Script URL is not configured." }, { status: 500 });
    }

    let lastError = "";

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ action: "initializeLapTabs" }),
        });

        const text = await response.text();
        if (!response.ok || looksLikeHtml(text)) {
          lastError = `Init request failed (${response.status})`;
          continue;
        }

        const result = JSON.parse(text) as { ok?: boolean; message?: string; data?: unknown };
        if (!result.ok) {
          lastError = result.message || "Initialization failed";
          continue;
        }

        return NextResponse.json({
          ok: true,
          message: "LAP tabs initialized successfully.",
          data: result.data,
        });
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Initialization failed";
      }
    }

    return NextResponse.json({ ok: false, message: lastError || "Initialization failed" }, { status: 502 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Initialization failed",
      },
      { status: 500 }
    );
  }
}
