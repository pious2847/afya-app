/**
 * Seed admin and normal user accounts for hackathon reviewers.
 * Run with: pnpm tsx src/scripts/seed-users.ts
 *
 * Requires: CLERK_SECRET_KEY, DATABASE_URL in .env
 * Ensure Clerk has Email + Password enabled in Dashboard > User & Authentication
 */
import "dotenv/config";
import { clerkClient } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { admins } from "../lib/db/schema";

const ADMIN_EMAIL = "afyaadmin@example.com";
const USER_EMAIL = "afyauser@example.com";
const PASSWORD = "AfyaDemo2026!";

async function main() {
  const clerkSecret = process.env.CLERK_SECRET_KEY;
  const dbUrl = process.env.DATABASE_URL;

  if (!clerkSecret) {
    console.error("CLERK_SECRET_KEY is required");
    process.exit(1);
  }
  if (!dbUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const client = await clerkClient();

  // Create admin user
  let adminUser;
  try {
    adminUser = await client.users.createUser({
      emailAddress: [ADMIN_EMAIL],
      password: PASSWORD,
      firstName: "Afya",
      lastName: "Admin",
    });
    console.log("✓ Admin user created:", ADMIN_EMAIL);
  } catch (e: unknown) {
    const err = e as { errors?: { message?: string }[] };
    if (err?.errors?.[0]?.message?.includes("already exists") || String(e).includes("identifier_exists")) {
      console.log("Admin user already exists, fetching...");
      const list = await client.users.getUserList({ emailAddress: [ADMIN_EMAIL] });
      adminUser = list.data[0];
      if (!adminUser) {
        console.error("Could not find existing admin. Delete the user in Clerk Dashboard and retry.");
        process.exit(1);
      }
    } else {
      throw e;
    }
  }

  // Create normal user
  try {
    await client.users.createUser({
      emailAddress: [USER_EMAIL],
      password: PASSWORD,
      firstName: "Demo",
      lastName: "User",
    });
    console.log("✓ Normal user created:", USER_EMAIL);
  } catch (e: unknown) {
    const err = e as { errors?: { message?: string }[] };
    if (err?.errors?.[0]?.message?.includes("already exists") || String(e).includes("identifier_exists")) {
      console.log("Normal user already exists (OK)");
    } else {
      throw e;
    }
  }

  // Add admin to admins table
  const sql = neon(dbUrl);
  const db = drizzle(sql);
  try {
    await db
      .insert(admins)
      .values({ userId: adminUser.id, email: ADMIN_EMAIL })
      .onConflictDoNothing({ target: admins.userId });
    console.log("✓ Admin registered in database");
  } catch (e) {
    // Ignore if already exists
    console.log("Admin already in database (OK)");
  }

  console.log("\n--- Test credentials for reviewers ---\n");
  console.log("Admin account:");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log("  (Can access /admin, manage clinics, view analytics)\n");
  console.log("Normal user:");
  console.log(`  Email:    ${USER_EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log("  (Can use assessment, teleconsult, find clinics)\n");
  console.log("Add these to your hackathon submission form.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
