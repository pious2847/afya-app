import { NextResponse } from "next/server";
import { getNearbyHospitals } from "@/lib/nearby-hospitals";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 20);
    const includePlaces = searchParams.get("places") !== "false";

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { ok: false, error: "lat and lng required" },
        { status: 400 }
      );
    }

    const hospitals = await getNearbyHospitals(lat, lng, {
      limit,
      includePlaces,
    });

    return NextResponse.json({
      ok: true,
      hospitals,
    });
  } catch (e) {
    console.error("Nearby hospitals error:", e);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch nearby hospitals" },
      { status: 500 }
    );
  }
}
