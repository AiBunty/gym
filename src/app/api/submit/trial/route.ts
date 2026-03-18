import { NextRequest, NextResponse } from "next/server";

const getAppsScriptUrl = () => {
  const deploymentId = process.env.NEXT_PUBLIC_APPSCRIPT_DEPLOYMENT_ID;
  if (!deploymentId) {
    throw new Error("NEXT_PUBLIC_APPSCRIPT_DEPLOYMENT_ID not configured");
  }
  return `https://script.google.com/macros/d/${deploymentId}/usercopy/exec`;
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

    // Call Apps Script to save trial submission
    const appsScriptUrl = getAppsScriptUrl();
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
    });

    const result = await response.json();

    if (!result?.ok) {
      return NextResponse.json(
        { ok: false, message: result?.message || "Failed to submit trial form" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Trial registration submitted successfully",
    });
  } catch (error) {
    console.error("Trial submission error:", error);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
}
