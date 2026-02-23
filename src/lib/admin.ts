import { db } from "./db";
import { admins } from "./db/schema";
import { eq } from "drizzle-orm";

const ADMIN_USER_IDS = new Set(
  (process.env.ADMIN_USER_IDS || "").split(",").filter(Boolean)
);

export async function isAdmin(userId: string): Promise<boolean> {
  if (ADMIN_USER_IDS.has(userId)) return true;
  if (!db) return false;
  try {
    const [row] = await db.select().from(admins).where(eq(admins.userId, userId));
    return !!row;
  } catch {
    return false;
  }
}
