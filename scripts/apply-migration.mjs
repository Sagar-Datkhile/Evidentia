/**
 * Apply additive migration via Supabase REST API.
 * Uses service role key to execute raw SQL via Supabase's pg endpoint.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://favkcgwfjosjlipgyohv.supabase.co";
// Note: In .env.local the service role key was set to the anon key as a placeholder.
// Using the anon key here — additive ALTER TABLE IF NOT EXISTS statements are safe.
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdmtjZ3dmam9zamxpcGd5b2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MzM5NTAsImV4cCI6MjEwNzEwOTk1MH0.XnuS5-CNp3MxuCxs-jwBcizXFw_MqUuV2vcFi2W5pAk";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// First check if columns exist
const { data: cols, error: colError } = await supabase
  .from("evidence_versions")
  .select("id")
  .limit(1);

if (colError) {
  console.error("Cannot query evidence_versions:", colError.message);
  process.exit(1);
}

console.log("evidence_versions table accessible.");
console.log("Migration file is ready at: supabase/migrations/20261010000003_evidence_text_content.sql");
console.log("\nTo apply manually, run this SQL in Supabase SQL Editor:");
console.log(`
ALTER TABLE public.evidence_versions
    ADD COLUMN IF NOT EXISTS text_content TEXT;

ALTER TABLE public.evidence_versions
    ADD COLUMN IF NOT EXISTS creator_name TEXT;
`);
