/**
 * Seed script for demo clinics. Run with: pnpm tsx src/scripts/seed-clinics.ts
 * Ensure DATABASE_URL is set in .env
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { clinics } from "../lib/db/schema";

const DEMO_CLINICS = [
  {
    name: "Rural Health Center - Mtwara",
    address: "Mtwara District, Tanzania",
    latitude: -10.3,
    longitude: 40.18,
    phone: "+255 23 123 4567",
    type: "health_center",
  },
  {
    name: "Kilimanjaro Community Clinic",
    address: "Moshi, Kilimanjaro Region, Tanzania",
    latitude: -3.35,
    longitude: 37.34,
    phone: "+255 27 275 1234",
    type: "clinic",
  },
  {
    name: "Kisumu District Hospital",
    address: "Kisumu, Kenya",
    latitude: -0.1022,
    longitude: 34.7617,
    phone: "+254 57 202 3456",
    type: "hospital",
  },
  {
    name: "Nairobi East Health Centre",
    address: "Eastlands, Nairobi, Kenya",
    latitude: -1.2921,
    longitude: 36.8219,
    phone: "+254 20 123 4567",
    type: "clinic",
  },
  {
    name: "Accra General Clinic",
    address: "Accra Central, Ghana",
    latitude: 5.6037,
    longitude: -0.187,
    phone: "+233 30 223 4567",
    type: "clinic",
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }
  const sql = neon(url);
  const db = drizzle(sql);
  await db.insert(clinics).values(DEMO_CLINICS);
  console.log(`Seeded ${DEMO_CLINICS.length} clinics.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
