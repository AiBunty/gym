import { NextResponse } from "next/server";
import { normalizeCmsData } from "@/lib/cms";

export const dynamic = "force-dynamic";

function getCmsUrls(): string[] {
  const directUrls = [
    process.env.APPS_SCRIPT_CMS_URL,
    process.env.APPS_SCRIPT_CMS_WRITE_URL,
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

function unwrapCmsPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const record = raw as Record<string, unknown>;
  return record.data ?? raw;
}

function hasCmsValues(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;

  const record = raw as Record<string, unknown>;
  const cmsKeys = [
    "pricingPlans",
    "batchTimings",
    "featuredEvent",
    "lapPlans",
    "personalTraining",
    "emailSettings",
    "emailTemplates",
  ];

  return cmsKeys.some((key) => {
    const value = record[key];
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0;
    return Boolean(value);
  });
}

export async function GET() {
  const cmsUrls = getCmsUrls();

  if (cmsUrls.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        usingDefaults: true,
        message: "Apps Script CMS URL is not configured.",
        data: normalizeCmsData(null),
      },
      { status: 200 }
    );
  }

  try {
    let lastError = "";

    for (const cmsUrl of cmsUrls) {
      try {
        const response = await fetch(cmsUrl, {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        const text = await response.text();
        if (!response.ok) {
          lastError = `CMS request failed with ${response.status}`;
          continue;
        }

        if (looksLikeHtml(text)) {
          lastError = "Apps Script returned HTML instead of JSON";
          continue;
        }

        const raw = JSON.parse(text);
        const payload = unwrapCmsPayload(raw);
        const data = normalizeCmsData(payload);

        return NextResponse.json(
          {
            ok: true,
            configured: true,
            usingDefaults: !hasCmsValues(payload),
            data,
          },
          { status: 200 }
        );
      } catch (innerError) {
        lastError = innerError instanceof Error ? innerError.message : "Failed to fetch CMS data.";
      }
    }

    return NextResponse.json(
      {
        ok: false,
        configured: true,
        usingDefaults: true,
        message: lastError || "Failed to fetch CMS data.",
        data: normalizeCmsData(null),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        usingDefaults: true,
        message: error instanceof Error ? error.message : "Failed to fetch CMS data.",
        data: normalizeCmsData(null),
      },
      { status: 200 }
    );
  }
}
