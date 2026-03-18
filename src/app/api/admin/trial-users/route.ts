import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";

const getAppsScriptUrl = () => {
  const deploymentId = process.env.NEXT_PUBLIC_APPSCRIPT_DEPLOYMENT_ID;
  if (!deploymentId) {
    throw new Error("NEXT_PUBLIC_APPSCRIPT_DEPLOYMENT_ID not configured");
  }
  return `https://script.google.com/macros/d/${deploymentId}/usercopy/exec`;
};

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

    // Call Apps Script to get trial users
    const appsScriptUrl = getAppsScriptUrl();
    const response = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "getTrialUsers",
      }),
    });

    const result = await response.json();

    if (!result?.ok) {
      return NextResponse.json(
        { ok: false, message: result?.message || "Failed to fetch trial users" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Get trial users error:", error);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
}
