/**
 * Apply additive migration for evidence_versions columns using Supabase REST pg function.
 * Runs from Node.js with: node --input-type=module scripts/run-migration.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://favkcgwfjosjlipgyohv.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdmtjZ3dmam9zamxpcGd5b2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MzM5NTAsImV4cCI6MjEwNzEwOTk1MH0.XnuS5-CNp3MxuCxs-jwBcizXFw_MqUuV2vcFi2W5pAk";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Check current columns on evidence_versions
const { data, error } = await supabase
  .from("evidence_versions")
  .select("id, file_sha256")
  .limit(1);

if (error) {
  console.error("DB connection test failed:", error.message);
} else {
  console.log("✓ DB connection OK. evidence_versions accessible.");
  console.log("Sample row:", data);
}

// Try to insert a test to check if text_content column already exists
const { error: colCheckError } = await supabase
  .from("evidence_versions")
  .select("text_content, creator_name")
  .limit(1);

if (colCheckError) {
  console.log("\n⚠  Columns text_content / creator_name not yet present.");
  console.log("\nPlease run the following SQL in the Supabase Dashboard SQL Editor:");
  console.log("  https://supabase.com/dashboard/project/favkcgwfjosjlipgyohv/editor");
  console.log("\n--- SQL to run ---");
  console.log(`ALTER TABLE public.evidence_versions
    ADD COLUMN IF NOT EXISTS text_content TEXT;

ALTER TABLE public.evidence_versions
    ADD COLUMN IF NOT EXISTS creator_name TEXT;`);
  console.log("--- END SQL ---\n");
} else {
  console.log("✓ Columns text_content and creator_name already present. Migration complete.");
}
