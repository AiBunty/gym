import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";

const getAppsScriptUrls = () => {
  const directUrls = [
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

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    const verification = verifyAdminToken(token);
    if (!verification.ok) {
      return NextResponse.json(
        { ok: false, message: verification.message },
        { status: 401 }
      );
    }

    const appsScriptUrls = getAppsScriptUrls();
    if (appsScriptUrls.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Apps Script URL is not configured" },
        { status: 500 }
      );
    }

    let lastError = "";

    for (const appsScriptUrl of appsScriptUrls) {
      try {
        const response = await fetch(appsScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "getPersonalTrainingUsers",
          }),
          cache: "no-store",
        });

        const text = await response.text();
        if (!response.ok) {
          lastError = `PT leads fetch failed with ${response.status}`;
          continue;
        }

        if (looksLikeHtml(text)) {
          lastError = "Apps Script returned HTML instead of JSON";
          continue;
        }

        let result: unknown = null;
        try {
          result = JSON.parse(text);
        } catch {
          lastError = "Invalid JSON response from Apps Script";
          continue;
        }

        if (!(result as { ok?: boolean }).ok) {
          lastError = ((result as { message?: string }).message || "Failed to fetch personal training users");
          continue;
        }

        return NextResponse.json({
          ok: true,
          data: (result as { data?: unknown }).data,
        });
      } catch (innerError) {
        lastError = innerError instanceof Error ? innerError.message : "Failed to fetch personal training users";
      }
    }

    return NextResponse.json(
      { ok: false, message: lastError || "Failed to fetch personal training users" },
      { status: 502 }
    );
  } catch (error) {
    console.error("Get personal training users error:", error);
    return NextResponse.json(
      { ok: false, message: "Server error" },
        { status: 500 }
      );
    }
}
