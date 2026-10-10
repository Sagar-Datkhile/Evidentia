import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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
