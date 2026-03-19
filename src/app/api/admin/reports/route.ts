import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";

const getAppsScriptUrls = () => {
  const directUrls = [
    process.env.APPS_SCRIPT_FORM_URL,
    process.env.APPS_SCRIPT_CMS_WRITE_URL,
    process.env.APPS_SCRIPT_CMS_URL,
  ].filter(Boolean) as string[];

  const deploymentInput = process.env.NEXT_PUBLIC_APPSCRIPT_DEPLOYMENT_ID?.trim();
  const isFullUrl = !!deploymentInput && /^https?:\/\//i.test(deploymentInput);
  const deploymentUrlS = deploymentInput
    ? isFullUrl
      ? deploymentInput
      : `https://script.google.com/macros/s/${deploymentInput}/exec`
    : null;
  const deploymentUrlD = deploymentInput && !isFullUrl
    ? `https://script.google.com/macros/d/${deploymentInput}/usercopy/exec`
    : null;

  return Array.from(
    new Set([
      ...directUrls,
      ...(deploymentUrlS ? [deploymentUrlS] : []),
      ...(deploymentUrlD ? [deploymentUrlD] : []),
    ])
  );
};

function looksLikeHtml(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html");
}

function normalizeRegistrations(input: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(input)) return [];

  return input.map((item, index) => {
    const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const rowIndexCandidate =
      Number(row.rowIndex) ||
      Number(row.rowNumber) ||
      Number(row.row) ||
      Number(row.sheetRow) ||
      Number(row.sheetRowIndex) ||
      (index + 2);

    return {
      ...row,
      rowIndex: Number.isFinite(rowIndexCandidate) ? rowIndexCandidate : index + 2,
    };
  });
}

export async function POST(request: Request) {
  const adminKey = process.env.ADMIN_PANEL_KEY;

  if (!adminKey) {
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
    const token = String(payload?.token || "");
    const key = String(payload?.adminKey || "");

    const tokenVerification = token ? verifyAdminToken(token) : { ok: false };
    const keyVerification = key === adminKey;

    // Validate token or admin key
    if (!tokenVerification.ok && !keyVerification) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid session or admin key.",
        },
        { status: 401 }
      );
    }

    const appsScriptUrls = getAppsScriptUrls();
    if (appsScriptUrls.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Apps Script URL is not configured." },
        { status: 500 }
      );
    }

    let lastError = "";

    for (const appsScriptUrl of appsScriptUrls) {
      try {
        const response = await fetch(appsScriptUrl, {
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
          lastError = `Registrations fetch failed with ${response.status}`;
          continue;
        }

        if (looksLikeHtml(text)) {
          lastError = "Apps Script returned HTML instead of JSON";
          continue;
        }

        let data: unknown;
        try {
          data = JSON.parse(text);
        } catch {
          lastError = "Invalid JSON response from Apps Script";
          continue;
        }

        const record = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
        const rawRegistrations =
          Array.isArray(record.registrations)
            ? record.registrations
            : Array.isArray((record.data as Record<string, unknown> | undefined)?.registrations)
              ? ((record.data as Record<string, unknown>).registrations as unknown[])
              : [];

        const registrations = normalizeRegistrations(rawRegistrations);

        return NextResponse.json({
          ok: true,
          data: {
            registrations,
          },
        });
      } catch (innerError) {
        lastError = innerError instanceof Error ? innerError.message : "Failed to fetch registrations from Apps Script.";
      }
    }

    return NextResponse.json(
      {
        ok: false,
        message: lastError || "Failed to fetch registrations from Apps Script.",
      },
      { status: 502 }
    );
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
