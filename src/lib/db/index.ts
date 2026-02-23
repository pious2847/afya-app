import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    return drizzle(neon(url));
  } catch {
    return null;
  }
}

export const db = createDb();
