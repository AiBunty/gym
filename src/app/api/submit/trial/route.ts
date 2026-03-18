import { NextRequest, NextResponse } from "next/server";

const getAppsScriptUrls = () => {
  const directUrls = [
    process.env.APPS_SCRIPT_FORM_URL,
    process.env.APPS_SCRIPT_CMS_WRITE_URL,
    process.env.APPS_SCRIPT_CMS_URL,
  ].filter(Boolean) as string[];

  const deploymentId = process.env.NEXT_PUBLIC_APPSCRIPT_DEPLOYMENT_ID;
  const deploymentUrl = deploymentId
    ? `https://script.google.com/macros/s/${deploymentId}/exec`
    : null;

  return Array.from(new Set([...directUrls, ...(deploymentUrl ? [deploymentUrl] : [])]));
};

interface TrialFormData {
  name: string;
  email: string;
  phone: string;
  age?: string;
  interests?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, age, interests }: TrialFormData = body;

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { ok: false, message: "Name, email, and phone are required" },
        { status: 400 }
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
            action: "submitTrial",
            data: {
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim(),
              age: age?.trim() || "",
              interests: interests?.trim() || "",
              submittedAt: new Date().toISOString(),
            },
          }),
          cache: "no-store",
        });

        const text = await response.text();
        if (!response.ok) {
          lastError = `Trial submit failed with ${response.status}`;
          continue;
        }

        if (text.trim().toLowerCase().startsWith("<!doctype html")) {
          lastError = "Apps Script returned HTML instead of JSON";
          continue;
        }

        let result: unknown = null;
        try {
          result = JSON.parse(text);
        } catch {
          result = { ok: true };
        }

        if (!(result as { ok?: boolean })?.ok) {
          lastError = ((result as { message?: string })?.message || "Failed to submit trial form");
          continue;
        }

        return NextResponse.json({
          ok: true,
          message: "Trial registration submitted successfully",
        });
      } catch (innerError) {
        lastError = innerError instanceof Error ? innerError.message : "Failed to submit trial form";
      }
    }

    return NextResponse.json(
      { ok: false, message: lastError || "Failed to submit trial form" },
      { status: 502 }
    );
  } catch (error) {
    console.error("Trial submission error:", error);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
}
