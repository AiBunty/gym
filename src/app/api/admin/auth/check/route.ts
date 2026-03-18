import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { ok: false, message: "Token required" },
        { status: 401 }
      );
    }

    const verification = verifyAdminToken(token);
    if (!verification.ok) {
      return NextResponse.json(
        { ok: false, message: verification.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Token valid",
      username: verification.payload.username,
    });
  } catch (error) {
    console.error("Token check error:", error);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
}
