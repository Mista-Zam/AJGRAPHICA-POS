/**
 * One-time migration script for applying the Supabase schema.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=your_pat node scripts/migrate.js
 *
 * Or:
 *   Set SUPABASE_ACCESS_TOKEN in your environment, then run:
 *   node scripts/migrate.js
 *
 * Generate a PAT at: https://supabase.com/dashboard/account/tokens
 */

const PROJECT_REF = "pxaklzjiuncwgbzuqvis";
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error("Missing SUPABASE_ACCESS_TOKEN environment variable.");
  console.error("Generate one at: https://supabase.com/dashboard/account/tokens");
  process.exit(1);
}

const fs = require("fs");
const path = require("path");

const migrationPath = path.join(__dirname, "..", "supabase", "migrations", "001_create_tables.sql");
const sql = fs.readFileSync(migrationPath, "utf-8");

async function run() {
  console.log("Applying migration...");

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Migration failed (${response.status}):`, body);
    process.exit(1);
  }

  console.log("Migration applied successfully!");
}

run().catch((err) => {
  console.error("Unexpected error:", err.message);
  process.exit(1);
});
