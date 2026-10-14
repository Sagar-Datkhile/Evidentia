import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .limit(1);

  if (error) {
    // If we can't select, let's try calling a raw query via RPC or we can't do that easily.
    // Wait, the postgrest API doesn't support raw SQL.
  }
  
  return NextResponse.json({ data, error });
}
