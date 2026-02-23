import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";

/**
 * Geocode an address to latitude/longitude using Google Geocoding API.
 * Used when adding clinics so we can sort by distance for "nearby" feature.
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) {
      return NextResponse.json(
        { ok: false, error: "Geocoding not configured" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address")?.trim();
    if (!address) {
      return NextResponse.json(
        { ok: false, error: "Address required" },
        { status: 400 }
      );
    }

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("key", key);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) {
      return NextResponse.json(
        { ok: false, error: "Address not found" },
        { status: 404 }
      );
    }

    const r = data.results[0];
    const loc = r.geometry?.location;
    if (!loc?.lat || !loc?.lng) {
      return NextResponse.json(
        { ok: false, error: "No coordinates found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      lat: loc.lat,
      lng: loc.lng,
      formattedAddress: r.formatted_address || address,
    });
  } catch (e) {
    console.error("Geocode error:", e);
    return NextResponse.json(
      { ok: false, error: "Geocoding failed" },
      { status: 500 }
    );
  }
}
