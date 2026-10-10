/**
 * GET /api/evidence/[id]
 * Returns full evidence detail: item, versions, and commits.
 * Access is enforced via RLS (can_access_case).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: evidenceId } = await props.params;

    const supabase = await createServerSupabaseClient();
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

    // Fetch custody events (support both occurred_at and timestamp schema conventions)
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
    };

    const versions = (versionsRaw ?? []).map((v: any) => ({
      id: v.id,
      evidenceId: v.evidence_id,
      versionNumber: v.version_number,
      fileSha256: v.file_sha256,
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

    return NextResponse.json({ evidence, versions, commits, custodyEvents });
  } catch (err: any) {
    console.error("[GET /api/evidence/[id]]", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch evidence." },
      { status: 500 }
    );
  }
}
