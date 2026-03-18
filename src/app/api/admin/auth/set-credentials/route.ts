import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";

const getAppsScriptUrls = () => {
  const directUrls = [
    process.env.APPS_SCRIPT_CMS_WRITE_URL,
    process.env.APPS_SCRIPT_CMS_URL,
  ].filter(Boolean) as string[];

  const deploymentId = process.env.NEXT_PUBLIC_APPSCRIPT_DEPLOYMENT_ID;
  const deploymentUrl = deploymentId
    ? `https://script.google.com/macros/s/${deploymentId}/exec`
    : null;

  return Array.from(new Set([...directUrls, ...(deploymentUrl ? [deploymentUrl] : [])]));
};

function looksLikeHtml(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html");
}

type SetCredentialsBody = {
  token?: string;
  username?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SetCredentialsBody;
    const token = String(body.token || "");
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!token) {
      return NextResponse.json({ ok: false, message: "Token required" }, { status: 401 });
    }

    const verification = verifyAdminToken(token);
    if (!verification.ok) {
      return NextResponse.json({ ok: false, message: verification.message }, { status: 401 });
    }

    if (!username) {
      return NextResponse.json({ ok: false, message: "Username is required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const appsScriptUrls = getAppsScriptUrls();
    if (appsScriptUrls.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Apps Script auth URL is not configured" },
        { status: 500 }
      );
    }

    let lastError = "";

    for (const appsScriptUrl of appsScriptUrls) {
      try {
        const url = new URL(appsScriptUrl);
        url.searchParams.set("action", "setAdminCredentials");
        url.searchParams.set("username", username);
        url.searchParams.set("password", password);

        const response = await fetch(url.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "setAdminCredentials",
            username,
            password,
          }),
          cache: "no-store",
        });

        const text = await response.text();

        if (!response.ok) {
          lastError = `Credentials endpoint failed with ${response.status}`;
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
          lastError = result.message || "Failed to save admin credentials";
          continue;
        }

        return NextResponse.json({
          ok: true,
          message: "Admin credentials saved in Google Sheet.",
        });
      } catch (innerError) {
        lastError = innerError instanceof Error ? innerError.message : "Failed to save admin credentials";
      }
    }

    return NextResponse.json({
      ok: false,
      message: lastError || "Failed to save admin credentials",
    }, {
      status: 502,
    });
  } catch (error) {
    console.error("Set credentials error:", error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
