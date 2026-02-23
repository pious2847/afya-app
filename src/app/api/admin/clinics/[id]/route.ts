import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clinics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { name, address, phone, type, latitude, longitude } = body;

    if (!name || !address) {
      return NextResponse.json(
        { ok: false, error: "Name and address required" },
        { status: 400 }
      );
    }

    await db
      .update(clinics)
      .set({
        name,
        address,
        phone: phone || null,
        type: type || "clinic",
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
      })
      .where(eq(clinics.id, id));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin clinic update error:", e);
    return NextResponse.json(
      { ok: false, error: "Failed to update" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    await db.delete(clinics).where(eq(clinics.id, id));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin clinic delete error:", e);
    return NextResponse.json(
      { ok: false, error: "Failed to delete" },
      { status: 500 }
    );
  }
}
