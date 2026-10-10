/**
 * GET /api/cases/list
 * Returns cases accessible to the authenticated user via RLS (can_access_case).
 * Used by the evidence registration form to populate the case dropdown.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listCasesForUser } from "@/lib/supabase/evidence-service";

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

    const cases = await listCasesForUser(supabase);
    return NextResponse.json({ cases });
  } catch (err: any) {
    console.error("[GET /api/cases/list]", err);
    return NextResponse.json({ error: err.message ?? "Failed to fetch cases." }, { status: 500 });
  }
}
