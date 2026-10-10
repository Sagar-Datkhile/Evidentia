import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/users/search?q=query
 * Search registered users by name or email for case assignment.
 * Protected for admins only.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: callerUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !callerUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", callerUser.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "admin" || !callerProfile.is_active) {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query) {
      return NextResponse.json({ users: [] }); // return empty early
    }

    const adminClient = createAdminClient();
    
    // Search both full_name and email using ILIKE
    // Limit to 20 to prevent excessive data exposure
    const { data: users, error } = await adminClient
      .from("profiles")
      .select("id, email, full_name, role, avatar_url")
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .eq("is_active", true)
      .limit(20);

    if (error) {
      return NextResponse.json({ error: "Search failed: " + error.message }, { status: 500 });
    }

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
