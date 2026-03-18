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
    const { token, sheetName, rowIndex } = await request.json();

    const verification = verifyAdminToken(token);
    if (!verification.ok) {
      return NextResponse.json(
        { ok: false, message: verification.message },
        { status: 401 }
      );
    }

    if (!sheetName || rowIndex === undefined) {
      return NextResponse.json(
        { ok: false, message: "Sheet name and row index required" },
        { status: 400 }
      );
    }

    // Call Apps Script to delete user
    const appsScriptUrl = getAppsScriptUrl();
    const response = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "deleteUser",
        sheetName,
        rowIndex,
      }),
    });

    const result = await response.json();

    if (!result?.ok) {
      return NextResponse.json(
        { ok: false, message: result?.message || "Failed to delete user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
}
