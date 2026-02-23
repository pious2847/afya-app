import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clinics } from "@/lib/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";

/**
 * Haversine distance in km (approximate)
 */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const typeFilter = searchParams.get("type"); // hospital | health_center | clinic
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { ok: false, error: "lat and lng required" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json({ ok: true, clinics: [] });
    }

    let rows = await db
      .select()
      .from(clinics)
      .where(
        and(
          eq(clinics.isActive, true),
          isNotNull(clinics.latitude),
          isNotNull(clinics.longitude)
        )
      )
      .limit(100);

    if (typeFilter) {
      rows = rows.filter((r) => r.type === typeFilter);
    }

    const withDistance = rows.map((r) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      phone: r.phone,
      type: r.type,
      latitude: r.latitude,
      longitude: r.longitude,
      distanceKm: haversineKm(lat, lng, r.latitude!, r.longitude!),
    }));

    withDistance.sort((a, b) => a.distanceKm - b.distanceKm);

    const clinicsWithDistance = withDistance.slice(0, limit).map((c) => ({
      id: c.id,
      name: c.name,
      address: c.address,
      phone: c.phone,
      type: c.type,
      latitude: c.latitude,
      longitude: c.longitude,
      distanceKm: Math.round(c.distanceKm * 10) / 10,
      distanceText:
        c.distanceKm < 1
          ? `${Math.round(c.distanceKm * 1000)} m away`
          : `${c.distanceKm.toFixed(1)} km away`,
    }));

    return NextResponse.json({
      ok: true,
      clinics: clinicsWithDistance,
    });
  } catch (e) {
    console.error("Nearby clinics error:", e);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch nearby clinics" },
      { status: 500 }
    );
  }
}
