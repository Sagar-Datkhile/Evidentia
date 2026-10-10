/**
 * GET /api/evidence/list
 * Returns evidence items accessible to the authenticated user via RLS.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listEvidenceForUser } from "@/lib/supabase/evidence-service";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const evidence = await listEvidenceForUser(supabase);
    return NextResponse.json({ evidence });
  } catch (err: any) {
    console.error("[GET /api/evidence/list]", err);
    return NextResponse.json({ error: err.message ?? "Failed to fetch evidence." }, { status: 500 });
  }
}
