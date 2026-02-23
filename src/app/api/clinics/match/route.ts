import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics } from "@/lib/db/schema";

const FALLBACK_CLINICS = [
  { id: "demo-1", name: "Rural Health Center - Mtwara", address: "Mtwara District, Tanzania", phone: "+255 23 123 4567", type: "health_center" },
  { id: "demo-2", name: "Kilimanjaro Community Clinic", address: "Moshi, Kilimanjaro Region", phone: "+255 27 275 1234", type: "clinic" },
  { id: "demo-3", name: "Kisumu District Hospital", address: "Kisumu, Kenya", phone: "+254 57 202 3456", type: "hospital" },
];

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { riskLevel = "low", symptoms = [] } = body;

    const symptomSet = new Set((symptoms as string[]).map((s: string) => s.toLowerCase()));

    let rows: { id: string; name: string; address: string; phone: string | null; type: string }[] = [];

    if (db) {
      const all = await db.select().from(clinics).where(eq(clinics.isActive, true)).limit(20);
      rows = all.map((r) => ({
        id: r.id,
        name: r.name,
        address: r.address,
        phone: r.phone,
        type: r.type,
      }));
    }

    if (rows.length === 0) rows = FALLBACK_CLINICS;

    const score = (c: { type: string }) => {
      if (riskLevel === "emergency" || riskLevel === "high") {
        return c.type === "hospital" ? 3 : c.type === "health_center" ? 2 : 1;
      }
      if (riskLevel === "medium") {
        return c.type === "health_center" ? 3 : c.type === "clinic" ? 2 : 1;
      }
      return c.type === "clinic" ? 3 : 2;
    };

    const sorted = [...rows].sort((a, b) => score(b) - score(a));

    return NextResponse.json({
      ok: true,
      clinics: sorted,
      matchHint:
        riskLevel === "emergency" || riskLevel === "high"
          ? "We recommend hospitals or health centers for your risk level."
          : riskLevel === "medium"
            ? "Health centers or clinics are a good fit."
            : "A nearby clinic can help if symptoms persist.",
    });
  } catch (e) {
    console.error("Match error:", e);
    return NextResponse.json(
      { ok: false, error: "Failed to match" },
      { status: 500 }
    );
  }
}
