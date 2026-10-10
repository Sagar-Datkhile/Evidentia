import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.warn("Profiles query error in /api/auth/me:", profileError.message);
    }

    const resolvedUser = {
      id: user.id,
      email: user.email,
      fullName:
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Judicial Officer",
      role: profile?.role || "user",
      phone: profile?.phone || user.user_metadata?.phone,
      avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url,
      organizationId: profile?.organization_id,
      badgeNumber: profile?.badge_number,
      isActive: profile?.is_active ?? true,
      createdAt: profile?.created_at || user.created_at,
    };

    return NextResponse.json({
      authenticated: true,
      user: resolvedUser,
    });
  } catch (error: any) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      error: error.message,
    });
  }
}
