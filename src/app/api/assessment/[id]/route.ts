import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assessments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!db) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    const [row] = await db
      .select()
      .from(assessments)
      .where(and(eq(assessments.id, id), eq(assessments.userId, userId)));

    if (!row) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const recommendations = row.recommendations
      ? (JSON.parse(row.recommendations) as string[])
      : [];

    return NextResponse.json({
      ok: true,
      riskLevel: row.riskLevel,
      recommendations,
    });
  } catch (e) {
    console.error("Assessment fetch error:", e);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch" },
      { status: 500 }
    );
  }
}
