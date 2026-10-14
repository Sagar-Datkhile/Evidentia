import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const assignmentSchema = z.object({
  userId: z.string().uuid(),
  assignedRole: z.string().min(2),
});

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await props.params;
    console.log(`[Assignments GET] Hit for caseId: ${caseId}`);
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: callerUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !callerUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify case access by checking if RLS allows us to read the case
    console.log(`[Assignments GET] Checking access for user: ${callerUser.id} via cases table`);
    const { data: caseRecord, error: accessError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .maybeSingle();

    console.log(`[Assignments GET] accessError: ${accessError?.message}`);
    if (accessError || !caseRecord) {
      return NextResponse.json({ error: "Forbidden: Not authorized to view this case" }, { status: 403 });
    }

    // Fetch assignments using admin client to ensure we can join profiles correctly
    // or standard client if RLS permits profiles read (which it does: "Profiles readable by authenticated users")
    const { data: assignments, error } = await supabase
      .from("case_assignments")
      .select("*, profiles!case_assignments_user_id_fkey(id, email, full_name, role)")
      .eq("case_id", caseId);

    if (error) {
      console.error("[Assignments GET Error]:", error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    console.log(`[Assignments GET] Returned ${assignments?.length} assignments`);
    return NextResponse.json({ assignments });
  } catch (err: any) {
    console.error("[Assignments Catch Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await props.params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: callerUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !callerUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify caller is admin
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", callerUser.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "admin" || !callerProfile.is_active) {
      return NextResponse.json({ error: "Forbidden: Admins only can assign users" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = assignmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { userId, assignedRole } = parsed.data;

    // Insert assignment
    const { data: assignment, error } = await supabase
      .from("case_assignments")
      .insert({
        case_id: caseId,
        user_id: userId,
        assigned_role: assignedRole,
      })
      .select("*, profiles!case_assignments_user_id_fkey(id, email, full_name, role)")
      .single();

    if (error) {
      if (error.code === "23505") { // Unique violation
        return NextResponse.json({ error: "User is already assigned to this case" }, { status: 400 });
      }
      throw error;
    }

    // Log the assignment event
    await supabase.from("audit_events").insert({
      event_type: 'CASE_ACCESS_GRANTED',
      actor_id: callerUser.id,
      target_entity: 'case_assignments',
      target_id: `${caseId}::${userId}`,
      details: {
        case_id: caseId,
        user_id: userId,
        assigned_role: assignedRole,
        granted_by: callerUser.id,
      }
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await props.params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: callerUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !callerUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify caller is admin
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", callerUser.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "admin" || !callerProfile.is_active) {
      return NextResponse.json({ error: "Forbidden: Admins only can revoke access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Perform deletion
    const { error } = await supabase
      .from("case_assignments")
      .delete()
      .match({ case_id: caseId, user_id: userId });

    if (error) throw error;

    // Log revocation for audit-backed mechanism
    await supabase.from("audit_events").insert({
      event_type: 'CASE_ACCESS_REVOKED',
      actor_id: callerUser.id,
      target_entity: 'case_assignments',
      target_id: `${caseId}::${userId}`,
      details: {
        case_id: caseId,
        user_id: userId,
        revoked_by: callerUser.id,
        reason: searchParams.get("reason") || "Admin revocation",
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
