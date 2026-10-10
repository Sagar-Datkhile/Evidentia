import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const createCaseSchema = z.object({
  caseNumber: z.string().min(3),
  title: z.string().min(3),
  jurisdiction: z.string().min(3),
  description: z.string().optional(),
});

/**
 * GET /api/admin/cases
 * List all cases in the system (Admins only).
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: callerUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !callerUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", callerUser.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "admin" || !callerProfile.is_active) {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const adminClient = createAdminClient();
    const { data: cases, error } = await adminClient
      .from("cases")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ cases });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/cases
 * Create a new case (Admins only).
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: callerUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !callerUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", callerUser.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "admin" || !callerProfile.is_active) {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { caseNumber, title, jurisdiction, description } = parsed.data;
    
    // Auto-generate a stable ID for the case based on caseNumber to match existing schema style
    // e.g., CASE-2026-0042
    const caseId = caseNumber.toUpperCase();

    const adminClient = createAdminClient();
    const { data: createdCase, error: insertError } = await adminClient
      .from("cases")
      .insert({
        id: caseId,
        case_number: caseNumber,
        title,
        jurisdiction,
        description,
        status: "Active",
        created_by: callerUser.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ case: createdCase }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
