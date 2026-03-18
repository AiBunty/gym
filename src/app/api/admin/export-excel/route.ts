import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  try {
    const { token, data, fileName } = await request.json();

    const verification = verifyAdminToken(token);
    if (!verification.ok) {
      return NextResponse.json(
        { ok: false, message: verification.message },
        { status: 401 }
      );
    }

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { ok: false, message: "Invalid data format" },
        { status: 400 }
      );
    }

    // Convert data to CSV
    const headers = Object.keys(data[0] || {}).filter((key) => !key.startsWith("_"));
    const csv = [
      headers.join(","),
      ...data.map((row: any) =>
        headers
          .map((header) => {
            const value = row[header] || "";
            // Escape quotes and wrap in quotes if contains comma
            const escaped = String(value).replace(/"/g, '""');
            return escaped.includes(",") ? `"${escaped}"` : escaped;
          })
          .join(",")
      ),
    ].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName || "export"}.csv"`,
      },
    });
  } catch (error) {
    console.error("Excel export error:", error);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
}
