import { NextResponse } from "next/server";
import { loadCmsConfigFromRemote, sendSubmissionEmails } from "@/lib/email";

function getSubmitUrls(): string[] {
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
}

function looksLikeHtml(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html");
}

export async function POST(request: Request) {
  const submitUrls = getSubmitUrls();

  if (submitUrls.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        message: "Apps Script URL is not configured.",
      },
      { status: 500 }
    );
  }

  try {
    const payload = await request.json();
    const data = payload && typeof payload.data === "object" ? payload.data : {};
    const name = String((data as Record<string, unknown>).name || "").trim();
    const phone = String((data as Record<string, unknown>).phone || "").trim();
    const email = String((data as Record<string, unknown>).email || "").trim();

    if (!name || !phone || !email) {
      return NextResponse.json(
        {
          ok: false,
          message: "Name, mobile number, and email are required.",
        },
        { status: 400 }
      );
    }

    const formType = String(payload?.formType || "").toLowerCase();
    if (formType === "weight_loss_program") {
      const startDate = String((data as Record<string, unknown>).startDate || "").trim();
      const planName = String((data as Record<string, unknown>).planName || "").trim().toLowerCase();

      if (startDate && planName.includes("lap")) {
        const cms = await loadCmsConfigFromRemote();
        const matchedPlan = (cms.lapPlans || []).find((plan) =>
          plan.title.trim().toLowerCase() === planName
        );

        const cutoffHours = Number(matchedPlan?.registrationCutoffHours ?? 6);
        const startAt = new Date(`${startDate}T00:00:00`);
        const cutoffAt = new Date(startAt.getTime() - cutoffHours * 60 * 60 * 1000);

        if (!Number.isNaN(cutoffAt.getTime()) && Date.now() >= cutoffAt.getTime()) {
          return NextResponse.json(
            {
              ok: false,
              message: `Registration is closed for this LAP session. It closes ${cutoffHours} hours before start date.`,
            },
            { status: 400 }
          );
        }
      }
    }

    const requestBody = JSON.stringify({
      ...payload,
      source: "wani-club-level-up-site",
      submittedAt: new Date().toISOString(),
    });

    let lastError = "";

    for (const submitUrl of submitUrls) {
      try {
        const response = await fetch(submitUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: requestBody,
          cache: "no-store",
        });

        const text = await response.text();

        if (!response.ok) {
          lastError = `Request failed with ${response.status}`;
          continue;
        }

        if (looksLikeHtml(text)) {
          lastError = "Apps Script returned HTML instead of JSON";
          continue;
        }

        return NextResponse.json(
          {
            ok: true,
            message: text || "Submission forwarded to Apps Script.",
            target: submitUrl,
            email: await (async () => {
              try {
                return await sendSubmissionEmails({
                  formType: String(payload.formType || ""),
                  submittedAt: new Date().toISOString(),
                  name,
                  email,
                  phone,
                  program: String((data as Record<string, unknown>).program || ""),
                  planName: String((data as Record<string, unknown>).planName || ""),
                  planPrice: String((data as Record<string, unknown>).planPrice || ""),
                  goal: String((data as Record<string, unknown>).goal || ""),
                });
              } catch (mailError) {
                return {
                  ok: false,
                  skipped: false,
                  error: mailError instanceof Error ? mailError.message : "Email failed",
                };
              }
            })(),
          },
          { status: 200 }
        );
      } catch (innerError) {
        lastError = innerError instanceof Error ? innerError.message : "Submission request failed";
      }
    }

    return NextResponse.json(
      {
        ok: false,
        message: lastError || "Failed to submit form data to Apps Script.",
      },
      { status: 502 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to submit form data.",
      },
      { status: 500 }
    );
  }
}
