import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase admin client that bypasses Row Level Security.
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set to the **service_role** key
 * (NOT the anon key). Both can be found in Supabase → Project Settings → API.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-evidentia.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // Detect the known misconfiguration: service role key set to the anon key.
  // Both JWTs contain different "role" claims; anon has role:"anon", service has role:"service_role".
  if (serviceRoleKey && serviceRoleKey === anonKey) {
    console.error(
      "\n" +
      "╔══════════════════════════════════════════════════════════════════╗\n" +
      "║  EVIDENTIA CONFIG ERROR — SERVICE ROLE KEY MISCONFIGURED         ║\n" +
      "║                                                                  ║\n" +
      "║  SUPABASE_SERVICE_ROLE_KEY is set to the ANON key value.         ║\n" +
      "║  The admin client will NOT bypass RLS, causing profile errors.   ║\n" +
      "║                                                                  ║\n" +
      "║  Fix: Copy the 'service_role' key from:                          ║\n" +
      "║    Supabase Dashboard → Project Settings → API → service_role    ║\n" +
      "║  Paste it into .env.local as SUPABASE_SERVICE_ROLE_KEY           ║\n" +
      "║  Then restart the dev server.                                    ║\n" +
      "╚══════════════════════════════════════════════════════════════════╝\n"
    );
  }

  if (!serviceRoleKey) {
    console.warn("[admin.ts] SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations will fail.");
  }

  return createClient(supabaseUrl, serviceRoleKey || anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
