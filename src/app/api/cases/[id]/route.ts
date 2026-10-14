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

    // Fetch evidence items for this case
    const { data: evidenceRows } = await supabase
      .from("evidence")
      .select("*, cases!inner(case_number), evidence_versions(id, version_number, file_sha256)")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });

    const evidenceIds = (evidenceRows ?? []).map((r: any) => r.id);
    const latestReportsMap: Record<string, any> = {};
    if (evidenceIds.length > 0) {
      try {
        const { data: reports } = await supabase
          .from("verification_reports")
          .select("id, evidence_id, verdict, check_hash, check_sig, check_merkle, check_chain, created_at")
          .in("evidence_id", evidenceIds)
          .order("created_at", { ascending: false });

        if (reports) {
          for (const rep of reports) {
            if (!latestReportsMap[rep.evidence_id]) {
              latestReportsMap[rep.evidence_id] = rep;
            }
          }
        }
      } catch (e) {
        console.warn("[cases/:id] could not load verification reports:", e);
      }
    }

    const evidence = (evidenceRows ?? []).map((row: any) => {
      const versions = row.evidence_versions ?? [];
      const v1 = versions.find((v: any) => v.version_number === 1);
      const active = versions.find((v: any) => v.version_number === row.current_version_number) ?? v1;
      const rep = latestReportsMap[row.id];

      // Inline derive or canonical fallback
      let verificationStatus = "PENDING";
      if (rep?.verdict === "INTEGRITY_VERIFIED") verificationStatus = "VERIFIED";
      else if (rep?.verdict === "CONTENT_MISMATCH") verificationStatus = "MISMATCH";
      else if (
        rep?.verdict === "SIGNATURE_INVALID" ||
        rep?.verdict === "MERKLE_PROOF_INVALID" ||
        rep?.verdict === "COMMIT_CHAIN_BROKEN"
      ) verificationStatus = "INTEGRITY_FAILURE";
      else if (rep?.verdict === "VERIFICATION_INCOMPLETE") {
        verificationStatus = rep?.check_hash === "PASS" ? "HASH_MATCH" : "VERIFICATION_INCOMPLETE";
      }

      return {
        id: row.id,
        caseId: row.case_id,
        caseNumber: row.cases?.case_number ?? row.case_id,
        title: row.title,
        category: row.category,
        incidentDate: row.incident_date,
        currentVersionNumber: row.current_version_number,
        storageBucket: row.storage_bucket,
        originalFileName: row.original_file_name,
        isSealed: row.is_sealed,
        createdBy: row.created_by,
        createdAt: row.created_at,
        v1Sha256: v1?.file_sha256 ? v1.file_sha256.trim() : null,
        fileSha256: active?.file_sha256 ? active.file_sha256.trim() : v1?.file_sha256?.trim() ?? null,
        verificationStatus,
      };
    });

    return NextResponse.json({ case: mapped, evidence });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
