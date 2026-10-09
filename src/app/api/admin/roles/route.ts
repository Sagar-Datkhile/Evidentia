import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const updateRoleSchema = z.object({
  targetUserId: z.string().uuid("Invalid user ID"),
  targetRole: z.enum(["user", "admin"], {
    errorMap: () => ({ message: "Role must be either 'user' or 'admin'" }),
  }),
});

/**
 * GET /api/admin/roles
 * Lists user accounts and their assigned roles. Strictly protected for admins.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: callerUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !callerUser) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required" },
        { status: 401 }
      );
    }

    // Check caller role in database
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", callerUser.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "admin" || !callerProfile.is_active) {
      return NextResponse.json(
        { error: "Forbidden: Administrator privileges required" },
        { status: 403 }
      );
    }

    // Fetch all profiles using service-role client
    const adminClient = createAdminClient();
    const { data: profiles, error: queryError } = await adminClient
      .from("profiles")
      .select("id, email, full_name, role, is_active, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (queryError) {
      return NextResponse.json(
        { error: "Failed to query profiles: " + queryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: profiles.map((p) => ({
        id: p.id,
        email: p.email,
        fullName: p.full_name,
        role: p.role,
        isActive: p.is_active,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/roles
 * Promotes or demotes a target user. Protected for active administrators.
 * Uses service-role client, prevents self-promotion/demotion, and logs the change.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: callerUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !callerUser) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required" },
        { status: 401 }
      );
    }

    // Verify caller is an active administrator in database
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role, is_active, full_name")
      .eq("id", callerUser.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "admin" || !callerProfile.is_active) {
      return NextResponse.json(
        { error: "Forbidden: Administrator privileges required to manage roles" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }

    const { targetUserId, targetRole } = parsed.data;

    // Self-modification forbidden
    if (targetUserId === callerUser.id) {
      return NextResponse.json(
        { error: "Forbidden: Modifying your own administrator role is not permitted." },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Verify target user exists
    const { data: targetProfile, error: fetchError } = await adminClient
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", targetUserId)
      .maybeSingle();

    if (fetchError || !targetProfile) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    const previousRole = targetProfile.role;

    // Perform role update via privileged service-role client
    const { data: updatedProfile, error: updateError } = await adminClient
      .from("profiles")
      .update({
        role: targetRole,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetUserId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update role: " + updateError.message },
        { status: 500 }
      );
    }

    // Audit log role change
    const auditRecord = {
      event_type: "ROLE_MODIFIED",
      actor_id: callerUser.id,
      target_entity: "profiles",
      target_id: targetUserId,
      details: {
        actorEmail: callerUser.email,
        targetEmail: targetProfile.email,
        previousRole,
        newRole: targetRole,
        timestamp: new Date().toISOString(),
      },
    };

    try {
      await adminClient.from("audit_events").insert(auditRecord);
    } catch (auditErr) {
      console.warn("Audit log insert non-critical warning:", auditErr);
    }

    console.log(
      `[AUDIT] Role changed for ${targetProfile.email} (${targetUserId}) from ${previousRole} to ${targetRole} by admin ${callerUser.email}`
    );

    return NextResponse.json({
      success: true,
      message: `User role successfully updated to ${targetRole}.`,
      user: {
        id: updatedProfile.id,
        email: updatedProfile.email,
        fullName: updatedProfile.full_name,
        role: updatedProfile.role,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
