import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assessments } from "@/lib/db/schema";
import { eq, sql, gte, count } from "drizzle-orm";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdmin(userId);

    if (!db) {
      return NextResponse.json({
        ok: true,
        user: { total: 0, byRisk: {}, recent: [] },
        system: admin ? { total: 0, byRisk: {}, weekly: [] } : null,
      });
    }

    // User stats
    const userCount = await db
      .select({ count: count() })
      .from(assessments)
      .where(eq(assessments.userId, userId));

    const userByRisk = await db
      .select({
        riskLevel: assessments.riskLevel,
        count: count(),
      })
      .from(assessments)
      .where(eq(assessments.userId, userId))
      .groupBy(assessments.riskLevel);

    const userRecent = await db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(sql`${assessments.createdAt} DESC`)
      .limit(5);

    const byRisk = Object.fromEntries(
      userByRisk.map((r) => [r.riskLevel, Number(r.count)])
    );

    let system = null;
    if (admin) {
      const totalCount = await db.select({ count: count() }).from(assessments);
      const systemByRisk = await db
        .select({
          riskLevel: assessments.riskLevel,
          count: count(),
        })
        .from(assessments)
        .groupBy(assessments.riskLevel);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weeklyData = await db
        .select({
          date: sql<string>`DATE(${assessments.createdAt})`,
          count: count(),
        })
        .from(assessments)
        .where(gte(assessments.createdAt, weekAgo))
        .groupBy(sql`DATE(${assessments.createdAt})`)
        .orderBy(sql`DATE(${assessments.createdAt})`);

      system = {
        total: totalCount[0]?.count ?? 0,
        byRisk: Object.fromEntries(
          systemByRisk.map((r) => [r.riskLevel, Number(r.count)])
        ),
        weekly: weeklyData.map((r) => ({
          date: r.date,
          count: Number(r.count),
        })),
      };
    }

    return NextResponse.json({
      ok: true,
      user: {
        total: userCount[0]?.count ?? 0,
        byRisk,
        recent: userRecent,
      },
      system,
    });
  } catch (e) {
    console.error("Analytics error:", e);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
