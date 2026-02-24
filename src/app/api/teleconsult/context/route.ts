import { NextResponse } from "next/server";
import { getNearbyHospitals } from "@/lib/nearby-hospitals";

/**
 * Returns context string for AI agent (nearby hospitals) to inject into prompt.
 * Used by LiveAICallElevenLabs to give the voice agent awareness of local facilities.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { ok: false, error: "lat and lng required" },
        { status: 400 }
      );
    }

    const hospitals = await getNearbyHospitals(lat, lng, {
      limit: 8,
      includePlaces: true,
    });

    if (hospitals.length === 0) {
      return NextResponse.json({
        ok: true,
        context: "",
        hospitals: [],
      });
    }

    const lines = hospitals.map(
      (h) =>
        `- ${h.name}, ${h.address} (${h.distanceText})${h.phone ? `, phone: ${h.phone}` : ""}`
    );
    const context = `NEARBY HOSPITALS AND HEALTH FACILITIES (use only when clinically appropriate - e.g. emergency, urgent care, or when user asks):
${lines.join("\n")}
Only suggest these when the user's condition warrants medical facility visit. Prefer the closest one. If user asks for directions, mention they can use the "Find Clinics" page for maps.`;

    return NextResponse.json({
      ok: true,
      context,
      hospitals,
    });
  } catch (e) {
    console.error("Teleconsult context error:", e);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch context" },
      { status: 500 }
    );
  }
}
