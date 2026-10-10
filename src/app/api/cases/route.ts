import { NextResponse, NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const createCaseSchema = z.object({
  caseNumber: z.string().min(3),
  title: z.string().min(3),
  jurisdiction: z.string().min(3),
  description: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    // Build the query
    // An admin should ideally see all cases (or based on admin RLS),
    // A regular user only sees cases they are assigned to.
    let query = supabase
      .from("cases")
      .select(`
        id,
        case_number,
        title,
        jurisdiction,
        status,
        incident_date,
        description,
        created_by,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false });
      
    // Supabase RLS policies on "cases" should already handle the row filtering if the client is authenticated
    // But we'll let RLS do its job. We just select all.
    const { data: cases, error } = await query;

    if (error) {
      throw error;
    }

    // Map to frontend expected shape
    const mappedCases = cases.map((c: any) => ({
      id: c.id,
      caseNumber: c.case_number,
      title: c.title,
      jurisdiction: c.jurisdiction,
      status: c.status,
      incidentDate: c.incident_date,
      description: c.description,
      createdBy: c.created_by,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      evidenceCount: 0,
      assignedCount: 0,
    }));
    
    // Aggregate assigned participant counts and evidence counts natively if possible.
    // For now, let's fetch counts manually or let RLS handle it.
    // Given the constraints, doing separate queries for counts is safe.
    
    for (const mc of mappedCases) {
      const [{ count: evCount }, { count: asCount }] = await Promise.all([
        supabase.from("evidence").select("*", { count: "exact", head: true }).eq("case_id", mc.id),
        supabase.from("case_assignments").select("*", { count: "exact", head: true }).eq("case_id", mc.id)
      ]);
      mc.evidenceCount = evCount || 0;
      mc.assignedCount = asCount || 0;
    }

    return NextResponse.json({ cases: mappedCases });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Only admins can create cases" }, { status: 403 });
    }

    const body = await req.json();
    const validated = createCaseSchema.parse(body);

    const { data: insertedCase, error } = await supabase
      .from("cases")
      .insert({
        id: validated.caseNumber, // using caseNumber as ID to match legacy schema
        case_number: validated.caseNumber,
        title: validated.title,
        jurisdiction: validated.jurisdiction,
        status: "Active",
        incident_date: new Date().toISOString(),
        description: validated.description || "Official judicial investigation docket.",
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: "A case with this number already exists." }, { status: 400 });
      }
      throw error;
    }

    // Map to frontend expected shape
    const mapped = {
      id: insertedCase.id,
      caseNumber: insertedCase.case_number,
      title: insertedCase.title,
      jurisdiction: insertedCase.jurisdiction,
      status: insertedCase.status,
      incidentDate: insertedCase.incident_date,
      description: insertedCase.description,
      createdBy: insertedCase.created_by,
      createdAt: insertedCase.created_at,
      updatedAt: insertedCase.updated_at,
      evidenceCount: 0,
      assignedCount: 0
    };

    return NextResponse.json({ case: mapped }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid case payload" }, { status: 400 });
  }
}
