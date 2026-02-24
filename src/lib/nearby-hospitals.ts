import { db } from "./db";
import { clinics } from "./db/schema";
import { and, eq, isNotNull } from "drizzle-orm";

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

export type HospitalInfo = {
  name: string;
  address: string;
  phone: string | null;
  distanceKm: number;
  distanceText: string;
  source?: "platform" | "google";
};

async function fetchFromGooglePlaces(
  lat: number,
  lng: number,
  limit: number
): Promise<HospitalInfo[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return [];

  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask":
            "places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber",
        },
        body: JSON.stringify({
          includedTypes: ["hospital"],
          maxResultCount: limit,
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: 25000,
            },
          },
        }),
      }
    );

    const data = await res.json();
    const places = (data?.places || []) as {
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
      nationalPhoneNumber?: string;
    }[];

    return places.map((p) => {
      const name = p.displayName?.text || p.formattedAddress || "Hospital";
      const loc = p.location;
      const plat = loc?.latitude != null && loc?.longitude != null;
      const km = plat
        ? haversineKm(lat, lng, loc!.latitude!, loc!.longitude!)
        : 0;
      return {
        name,
        address: p.formattedAddress || "",
        phone: p.nationalPhoneNumber || null,
        distanceKm: Math.round(km * 10) / 10,
        distanceText:
          km < 1
            ? `${Math.round(km * 1000)} m away`
            : `${km.toFixed(1)} km away`,
        source: "google" as const,
      };
    });
  } catch (e) {
    console.error("Google Places nearby hospitals error:", e);
    return [];
  }
}

export async function getNearbyHospitals(
  lat: number,
  lng: number,
  options?: { limit?: number; includePlaces?: boolean }
): Promise<HospitalInfo[]> {
  const limit = Math.min(options?.limit ?? 10, 20);
  const includePlaces = options?.includePlaces !== false;

  const results: HospitalInfo[] = [];
  const seen = new Set<string>();

  if (db) {
    const rows = await db
      .select()
      .from(clinics)
      .where(
        and(
          eq(clinics.isActive, true),
          isNotNull(clinics.latitude),
          isNotNull(clinics.longitude)
        )
      )
      .limit(50);

    const hospitals = rows.filter(
      (r) => r.type === "hospital" || r.type === "health_center"
    );

    for (const r of hospitals) {
      const km = haversineKm(lat, lng, r.latitude!, r.longitude!);
      const key = `${r.name.toLowerCase()}-${r.address?.toLowerCase().slice(0, 30)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        name: r.name,
        address: r.address,
        phone: r.phone,
        distanceKm: Math.round(km * 10) / 10,
        distanceText:
          km < 1
            ? `${Math.round(km * 1000)} m away`
            : `${km.toFixed(1)} km away`,
        source: "platform",
      });
    }
  }

  if (includePlaces) {
    const fromPlaces = await fetchFromGooglePlaces(lat, lng, limit);
    for (const h of fromPlaces) {
      const key = `${h.name.toLowerCase()}-${h.address?.toLowerCase().slice(0, 30)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(h);
    }
  }

  results.sort((a, b) => a.distanceKm - b.distanceKm);
  return results.slice(0, limit);
}
