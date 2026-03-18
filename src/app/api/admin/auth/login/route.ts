import { NextRequest, NextResponse } from "next/server";
import { createAdminToken } from "@/lib/adminAuth";

const getAppsScriptUrl = () => {
  const deploymentId = process.env.NEXT_PUBLIC_APPSCRIPT_DEPLOYMENT_ID;
  if (!deploymentId) {
    throw new Error("NEXT_PUBLIC_APPSCRIPT_DEPLOYMENT_ID not configured");
  }
  return `https://script.google.com/macros/d/${deploymentId}/usercopy/exec`;
};

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { ok: false, message: "Username and password required" },
        { status: 400 }
      );
    }

    // Call Apps Script to validate credentials
    const appsScriptUrl = getAppsScriptUrl();
    const response = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "validateAdmin",
        username,
        password,
      }),
    });

    const result = await response.json();

    if (!result?.ok) {
      return NextResponse.json(
        { ok: false, message: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = createAdminToken(username);

    return NextResponse.json({
      ok: true,
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
}
