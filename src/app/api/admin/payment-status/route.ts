import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";

const getAppsScriptUrls = () => {
  const directUrls = [
    process.env.APPS_SCRIPT_CMS_WRITE_URL,
    process.env.APPS_SCRIPT_CMS_URL,
    process.env.APPS_SCRIPT_FORM_URL,
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

type PaymentStatusBody = {
  token?: string;
  rowIndex?: number;
  paidStatus?: "PAID" | "UNPAID";
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PaymentStatusBody;

    const verification = verifyAdminToken(String(body.token || ""));
    if (!verification.ok) {
      return NextResponse.json({ ok: false, message: verification.message }, { status: 401 });
    }

    const rowIndex = Number(body.rowIndex);
    const paidStatus = String(body.paidStatus || "UNPAID").toUpperCase() === "PAID" ? "PAID" : "UNPAID";

    if (!Number.isFinite(rowIndex) || rowIndex < 2) {
      return NextResponse.json({ ok: false, message: "Valid row index is required." }, { status: 400 });
    }

    const appsScriptUrls = getAppsScriptUrls();
    if (appsScriptUrls.length === 0) {
      return NextResponse.json({ ok: false, message: "Apps Script URL is not configured." }, { status: 500 });
    }

    let lastError = "";

    for (const appsScriptUrl of appsScriptUrls) {
      try {
        const response = await fetch(appsScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "updatePaymentStatus",
            rowIndex,
            paidStatus,
          }),
          cache: "no-store",
        });

        const text = await response.text();
        if (!response.ok) {
          lastError = `Payment status update failed with ${response.status}`;
          continue;
        }

        if (looksLikeHtml(text)) {
          lastError = "Apps Script returned HTML instead of JSON";
          continue;
        }

        let result: { ok?: boolean; message?: string } = {};
        try {
          result = JSON.parse(text);
        } catch {
          lastError = "Invalid JSON response from Apps Script";
          continue;
        }

        if (!result.ok) {
          lastError = result.message || "Failed to update payment status";
          continue;
        }

        return NextResponse.json({
          ok: true,
          message: `Marked as ${paidStatus}.`,
        });
      } catch (innerError) {
        lastError = innerError instanceof Error ? innerError.message : "Failed to update payment status";
      }
    }

    return NextResponse.json({ ok: false, message: lastError || "Failed to update payment status" }, { status: 502 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
