import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clinics } from "@/lib/db/schema";
import { isAdmin } from "@/lib/admin";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!(await isAdmin(userId))) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Database not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { name, address, phone, type, latitude, longitude } = body;

    if (!name || !address) {
      return NextResponse.json(
        { ok: false, error: "Name and address required" },
        { status: 400 }
      );
    }

    await db.insert(clinics).values({
      name,
      address,
      phone: phone || null,
      type: type || "clinic",
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin clinic create error:", e);
    return NextResponse.json(
      { ok: false, error: "Failed to create" },
      { status: 500 }
    );
  }
}
