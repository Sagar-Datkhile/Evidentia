import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next") || "/dashboard";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Prevent open redirect vulnerabilities
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  if (error) {
    console.error("OAuth callback error:", error, errorDescription);
    const redirectUrl = new URL("/auth/sign-in", requestUrl.origin);
    redirectUrl.searchParams.set("error", errorDescription || error);
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("Error exchanging code for session:", exchangeError.message);
        const redirectUrl = new URL("/auth/sign-in", requestUrl.origin);
        redirectUrl.searchParams.set("error", exchangeError.message);
        return NextResponse.redirect(redirectUrl);
      }

      if (data?.user) {
        // Synchronize authenticated user profile into Supabase profiles table
        const user = data.user;
        const metadata = user.user_metadata || {};
        const fullName =
          metadata.full_name ||
          metadata.name ||
          user.email?.split("@")[0] ||
          "Judicial Officer";
        const avatarUrl = metadata.avatar_url || metadata.picture || null;

        // Ensure user profile exists with safe default role 'pending'
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .maybeSingle();

        if (!existingProfile) {
          await supabase.from("profiles").insert({
            id: user.id,
            email: user.email,
            full_name: fullName,
            avatar_url: avatarUrl,
            role: "pending",
            is_active: true,
          });
        }
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch (err: any) {
      console.error("Unexpected callback failure:", err);
      const redirectUrl = new URL("/auth/sign-in", requestUrl.origin);
      redirectUrl.searchParams.set("error", "Failed to complete authentication exchange.");
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(new URL("/auth/sign-in", requestUrl.origin));
}
