import { NextResponse, NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await props.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to get the case. RLS policies on "cases" should protect it.
    const { data: caseRecord, error } = await supabase
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .single();

    if (error || !caseRecord) {
      return NextResponse.json({ error: "Case not found or unauthorized" }, { status: 404 });
    }

    // Map case to frontend schema
    const mapped = {
      id: caseRecord.id,
      caseNumber: caseRecord.case_number,
      title: caseRecord.title,
      jurisdiction: caseRecord.jurisdiction,
      status: caseRecord.status,
      incidentDate: caseRecord.incident_date,
      description: caseRecord.description,
      createdBy: caseRecord.created_by,
      createdAt: caseRecord.created_at,
      updatedAt: caseRecord.updated_at,
    };

    return NextResponse.json({ case: mapped });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
