/**
 * GET /api/evidence/[id]
 * Returns full evidence detail: item, versions, commits, custody events,
 * and historical verification reports.
 * Access is enforced via RLS (can_access_case).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deriveVerificationStatus } from "@/lib/supabase/evidence-service";

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: evidenceId } = await props.params;

    const authHeader = _req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
    const supabase = await createServerSupabaseClient(bearerToken);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the evidence record. RLS policy ensures the user can only see evidence
    // for cases they have access to (can_access_case).
    const { data: evidenceRow, error: evidenceError } = await supabase
      .from("evidence")
      .select("*, cases!inner(case_number)")
      .eq("id", evidenceId)
      .single();

    if (evidenceError || !evidenceRow) {
      return NextResponse.json(
        { error: "Evidence not found or you do not have access." },
        { status: 404 }
      );
    }

    // Fetch versions
    const { data: versionsRaw, error: versionsError } = await supabase
      .from("evidence_versions")
      .select("*")
      .eq("evidence_id", evidenceId)
      .order("version_number", { ascending: true });

    if (versionsError) {
      console.error("[GET /api/evidence/[id]] versions error:", versionsError.message);
    }

    // Fetch commits
    const { data: commitsRaw, error: commitsError } = await supabase
      .from("evidence_commits")
      .select("*")
      .eq("evidence_id", evidenceId)
      .order("server_timestamp", { ascending: true });

    if (commitsError) {
      console.error("[GET /api/evidence/[id]] commits error:", commitsError.message);
    }

    // Fetch custody events
    let custodyRaw: any[] | null = null;
    const { data: cOccurred, error: cOccurredError } = await supabase
      .from("custody_events")
      .select("*")
      .eq("evidence_id", evidenceId)
      .order("occurred_at", { ascending: true });

    if (cOccurredError) {
      const { data: cTime } = await supabase
        .from("custody_events")
        .select("*")
        .eq("evidence_id", evidenceId)
        .order("timestamp", { ascending: true });
      custodyRaw = cTime ?? [];
    } else {
      custodyRaw = cOccurred ?? [];
    }

    // Fetch verification reports
    const admin = createAdminClient();
    const { data: reportsRaw, error: reportsError } = await admin
      .from("verification_reports")
      .select("*, profiles:verifier_id(full_name)")
      .eq("evidence_id", evidenceId)
      .order("created_at", { ascending: false });

    if (reportsError) {
      console.warn("[GET /api/evidence/[id]] reports error:", reportsError.message);
    }

    const versions = (versionsRaw ?? []).map((v: any) => ({
      id: v.id,
      evidenceId: v.evidence_id,
      versionNumber: v.version_number,
      fileSha256: v.file_sha256 ? v.file_sha256.trim() : "",
      ciphertextSha256: v.ciphertext_sha256,
      storagePath: v.storage_path,
      fileName: v.file_name,
      fileSizeBytes: v.file_size_bytes,
      mimeType: v.mime_type,
      encryptionIv: v.encryption_iv,
      isGenesis: v.is_genesis,
      createdBy: v.created_by,
      creatorName: v.creator_name ?? "Unknown",
      createdAt: v.created_at,
      textContent: v.text_content,
    }));

    const v1 = versions.find((v: any) => v.versionNumber === 1);
    const activeVersion =
      versions.find((v: any) => v.versionNumber === evidenceRow.current_version_number) ?? v1;

    const verificationReports = (reportsRaw ?? []).map((r: any) => {
      const targetVer = versions.find((v: any) => v.id === r.target_version_id);
      return {
        id: r.id,
        evidenceId: r.evidence_id,
        targetVersionId: r.target_version_id,
        targetVersionNumber: targetVer?.versionNumber ?? 1,
        candidateSha256: r.candidate_sha256,
        referenceSha256: r.reference_sha256,
        verdict: r.verdict,
        checks: {
          hashComparison: r.check_hash ?? "NOT_RUN",
          commitSignature: r.check_sig ?? "NOT_RUN",
          merkleInclusion: r.check_merkle ?? "NOT_RUN",
          commitChain: r.check_chain ?? "NOT_RUN",
        },
        checkHash: r.check_hash ?? "NOT_RUN",
        checkSig: r.check_sig ?? "NOT_RUN",
        checkMerkle: r.check_merkle ?? "NOT_RUN",
        checkChain: r.check_chain ?? "NOT_RUN",
        riskLevel: r.risk_level,
        findings: r.findings,
        diffSummary: r.diff_summary,
        verifierId: r.verifier_id,
        verifierName: r.profiles?.full_name ?? "Authorized Verifier",
        createdAt: r.created_at,
      };
    });

    const latestReport = verificationReports[0] || null;
    const verificationStatus = latestReport
      ? deriveVerificationStatus(latestReport.verdict, latestReport.checkHash)
      : "PENDING";

    const evidence = {
      id: evidenceRow.id,
      caseId: evidenceRow.case_id,
      caseNumber: evidenceRow.cases?.case_number ?? evidenceRow.case_id,
      title: evidenceRow.title,
      category: evidenceRow.category,
      incidentDate: evidenceRow.incident_date,
      currentVersionNumber: evidenceRow.current_version_number,
      storageBucket: evidenceRow.storage_bucket,
      originalFileName: evidenceRow.original_file_name,
      isSealed: evidenceRow.is_sealed,
      createdBy: evidenceRow.created_by,
      createdAt: evidenceRow.created_at,
      v1Sha256: v1?.fileSha256 ?? null,
      fileSha256: activeVersion?.fileSha256 ?? v1?.fileSha256 ?? null,
      verificationStatus,
    };

    const commits = (commitsRaw ?? []).map((c: any) => ({
      id: c.id,
      versionId: c.version_id,
      evidenceId: c.evidence_id,
      commitHash: c.commit_hash,
      parentCommitHash: c.parent_commit_hash,
      commitMessage: c.commit_message,
      note: c.note,
      actorId: c.actor_id,
      actorName: c.actor_name ?? "Unknown",
      actorRole: c.actor_role ?? "user",
      serverTimestamp: c.server_timestamp,
      signature: c.signature,
      signingKeyId: c.signing_key_id,
      merkleStatus: c.merkle_status ?? "PENDING",
    }));

    const custodyEvents = (custodyRaw ?? []).map((e: any) => ({
      id: e.id,
      evidenceId: e.evidence_id,
      eventType: e.event_type,
      actorId: e.actor_id,
      details: e.details,
      timestamp: e.timestamp || e.occurred_at || e.created_at || new Date().toISOString(),
    }));

    return NextResponse.json({
      evidence,
      versions,
      commits,
      custodyEvents,
      verificationReports,
      latestReport,
      verificationStatus,
    });
  } catch (err: any) {
    console.error("[GET /api/evidence/[id]]", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch evidence." },
      { status: 500 }
    );
  }
}
