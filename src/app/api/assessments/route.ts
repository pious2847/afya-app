import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assessments } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ ok: true, assessments: [] });
    }

    const rows = await db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(desc(assessments.createdAt))
      .limit(50);

    return NextResponse.json({
      ok: true,
      assessments: rows.map((r) => ({
        id: r.id,
        riskLevel: r.riskLevel,
        symptoms: r.symptoms,
        createdAt: r.createdAt,
      })),
    });
  } catch (e) {
    console.error("Assessments fetch error:", e);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch" },
      { status: 500 }
    );
  }
}
