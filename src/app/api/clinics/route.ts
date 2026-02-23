import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clinics } from "@/lib/db/schema";

const FALLBACK_CLINICS = [
  { id: "demo-1", name: "Rural Health Center - Mtwara", address: "Mtwara District, Tanzania", phone: "+255 23 123 4567", type: "health_center" },
  { id: "demo-2", name: "Kilimanjaro Community Clinic", address: "Moshi, Kilimanjaro Region, Tanzania", phone: "+255 27 275 1234", type: "clinic" },
  { id: "demo-3", name: "Kisumu District Hospital", address: "Kisumu, Kenya", phone: "+254 57 202 3456", type: "hospital" },
  { id: "demo-4", name: "Accra General Clinic", address: "Accra Central, Ghana", phone: "+233 30 223 4567", type: "clinic" },
];

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ ok: true, clinics: FALLBACK_CLINICS });
    }
    const rows = await db.select().from(clinics).limit(50);
    if (rows.length === 0) {
      return NextResponse.json({ ok: true, clinics: FALLBACK_CLINICS });
    }
    return NextResponse.json({
      ok: true,
      clinics: rows.map((r) => ({
        id: r.id,
        name: r.name,
        address: r.address,
        phone: r.phone,
        type: r.type,
        latitude: r.latitude ?? undefined,
        longitude: r.longitude ?? undefined,
      })),
    });
  } catch {
    return NextResponse.json({ ok: true, clinics: FALLBACK_CLINICS });
  }
}
