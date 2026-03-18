import { NextResponse } from "next/server";
import { normalizeCmsData } from "@/lib/cms";
import { verifyAdminToken } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

type SaveBody = {
  adminKey?: string;
  token?: string;
  data?: unknown;
};

function getWriteUrls(): string[] {
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
}

function looksLikeHtml(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html");
}

export async function POST(request: Request) {
  const configuredAdminKey = process.env.ADMIN_PANEL_KEY;
  const writeUrls = getWriteUrls();

  if (writeUrls.length === 0) {
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

    const keyAuthorized = Boolean(configuredAdminKey && body.adminKey && body.adminKey === configuredAdminKey);
    const tokenAuthorized = Boolean(body.token && verifyAdminToken(body.token).ok);

    if (!keyAuthorized && !tokenAuthorized) {
      return NextResponse.json(
        {
          ok: false,
          message: "Unauthorized. Provide a valid admin key or login token.",
        },
        { status: 401 }
      );
    }

    const normalized = normalizeCmsData(body.data);

    let lastError = "";

    for (const writeUrl of writeUrls) {
      try {
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
        if (!response.ok) {
          lastError = `Save request failed with ${response.status}`;
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
          result = { ok: true, message: text || "CMS saved." };
        }

        if (!result.ok) {
          lastError = result.message || "Save failed in Apps Script";
          continue;
        }

        return NextResponse.json(
          {
            ok: true,
            message: result.message || "CMS data forwarded to Apps Script.",
            data: normalized,
          },
          { status: 200 }
        );
      } catch (innerError) {
        lastError = innerError instanceof Error ? innerError.message : "Save request failed";
      }
    }

    return NextResponse.json(
      {
        ok: false,
        message: lastError || "Failed to save CMS data.",
      },
      { status: 502 }
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
