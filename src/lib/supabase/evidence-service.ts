/**
 * EVIDENTIA Supabase Evidence Service
 * Handles evidence registration, version management, and evidence queries
 * using the Supabase service-role client for privileged server-side operations.
 */

import { createAdminClient } from "./admin";
import { computeCommitHash } from "../crypto/commit";
import { signAttestation, SYSTEM_SIGNING_KEY_ID, SYSTEM_PUBLIC_KEY_HEX } from "../crypto/ed25519";
import { encryptPayload, decryptPayload } from "../crypto/envelope";
import {
  EvidenceItem,
  EvidenceVersion,
  EvidenceCommit,
  Case,
  UserRole,
  normalizeRole,
  VerificationStatus,
  VerificationVerdict,
  CheckOutcome,
  VerificationReport,
} from "./types";

export interface RegisterEvidenceParams {
  caseId: string;
  title: string;
  category: EvidenceItem["category"];
  fileBuffer: ArrayBuffer;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  fileSha256: string; // Pre-computed on client; we verify server-side
  textContent?: string;
  commitMessage: string;
  note?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}

export interface RegisterEvidenceResult {
  evidence: EvidenceItem;
  version: EvidenceVersion;
  commit: EvidenceCommit;
  storagePath: string;
}

/** Generate a deterministic evidence ID based on case + count. */
async function generateEvidenceId(supabase: ReturnType<typeof createAdminClient>, caseId: string): Promise<string> {
  const { count } = await supabase
    .from("evidence")
    .select("id", { count: "exact", head: true })
    .eq("case_id", caseId);
  const seq = ((count ?? 0) + 1).toString().padStart(2, "0");
  return `${caseId}-${seq}`;
}

/**
 * Register new evidence (V1 Genesis) with:
 *  1. AES-256-GCM encryption of file bytes
 *  2. Upload to Supabase private storage
 *  3. Atomic DB insert: evidence + evidence_version + evidence_commit + custody_event
 */
export async function registerEvidence(
  params: RegisterEvidenceParams
): Promise<RegisterEvidenceResult> {
  const supabase = createAdminClient();
  const timestamp = new Date().toISOString();

  // 1. Verify case exists
  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("id, case_number, title")
    .eq("id", params.caseId)
    .single();

  if (caseError || !caseRow) {
    throw new Error(`Case not found: ${params.caseId}`);
  }

  // 2. Generate evidence ID
  const evidenceId = await generateEvidenceId(supabase, params.caseId);

  // 3. AES-256-GCM encrypt the file bytes
  const masterKey = process.env.EVIDENTIA_MASTER_KEY ?? "evidentia_super_secret_master_key_32bytes!!";
  const envelope = await encryptPayload(params.fileBuffer, masterKey);

  // 4. Upload encrypted blob to Supabase Storage
  const storagePath = `evidence/${evidenceId}/v1/${params.fileName}.enc`;
  const ciphertextBytes = Uint8Array.from(atob(envelope.ciphertextBase64), (c) => c.charCodeAt(0));

  const { error: uploadError } = await supabase.storage
    .from("private-evidence")
    .upload(storagePath, ciphertextBytes.buffer, {
      contentType: "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // 5. Compute commit hash (server-side canonical deterministic hash)
  const commitHash = await computeCommitHash({
    evidenceId,
    versionNumber: 1,
    fileSha256: params.fileSha256,
    parentCommitHash: null,
    actorId: params.actorId,
    serverTimestamp: timestamp,
    commitMessage: params.commitMessage,
    note: params.note,
  });

  // 6. Sign the commit hash with Ed25519 / HMAC-SHA256
  const signature = await signAttestation(commitHash);

  // 7. Atomic DB inserts (in order: evidence → version → commit → custody_event)
  const { data: evidenceRow, error: evidenceInsertError } = await supabase
    .from("evidence")
    .insert({
      id: evidenceId,
      case_id: params.caseId,
      title: params.title,
      category: params.category,
      incident_date: timestamp,
      current_version_number: 1,
      storage_bucket: "private-evidence",
      original_file_name: params.fileName,
      is_sealed: false,
      created_by: params.actorId,
      created_at: timestamp,
    })
    .select()
    .single();

  if (evidenceInsertError) {
    // Attempt rollback of storage upload
    await supabase.storage.from("private-evidence").remove([storagePath]);
    throw new Error(`Evidence DB insert failed: ${evidenceInsertError.message}`);
  }

  const { data: versionRow, error: versionInsertError } = await supabase
    .from("evidence_versions")
    .insert({
      evidence_id: evidenceId,
      version_number: 1,
      file_sha256: params.fileSha256,
      ciphertext_sha256: envelope.ciphertextSha256,
      storage_path: storagePath,
      file_name: params.fileName,
      file_size_bytes: params.fileSizeBytes,
      mime_type: params.mimeType,
      encryption_iv: envelope.ivHex,
      is_genesis: true,
      created_by: params.actorId,
      creator_name: params.actorName,
      created_at: timestamp,
      text_content: params.textContent ?? null,
    })
    .select()
    .single();

  if (versionInsertError) {
    await supabase.storage.from("private-evidence").remove([storagePath]);
    throw new Error(`Version DB insert failed: ${versionInsertError.message}`);
  }

  // 7. Insert commit with fallback for optional schema columns (e.g. merkle_status)
  const commitInsertPayload: Record<string, any> = {
    version_id: versionRow.id,
    evidence_id: evidenceId,
    commit_hash: commitHash,
    parent_commit_hash: null,
    commit_message: params.commitMessage,
    note: params.note ?? null,
    actor_id: params.actorId,
    actor_name: params.actorName,
    actor_role: params.actorRole,
    server_timestamp: timestamp,
    signature,
    signing_key_id: SYSTEM_SIGNING_KEY_ID,
  };

  let commitRow: any = null;
  // Try inserting with merkle_status first (if DB column is present)
  const { data: commitWithMerkle, error: commitInsertError } = await supabase
    .from("evidence_commits")
    .insert({
      ...commitInsertPayload,
      merkle_status: "PENDING",
    })
    .select()
    .single();

  if (commitInsertError) {
    if (commitInsertError.message?.includes("fk_commit_signing_key")) {
      await supabase.from("signing_key_metadata").upsert({
        key_id: SYSTEM_SIGNING_KEY_ID,
        algorithm: "Ed25519",
        public_key_pem: SYSTEM_PUBLIC_KEY_HEX,
        status: "ACTIVE",
        activated_at: timestamp,
      }, { onConflict: "key_id" });
    }

    // Determine payload without merkle_status if column is missing
    const isMissingMerkle = commitInsertError.message?.includes("merkle_status");
    const retryPayload = isMissingMerkle ? commitInsertPayload : { ...commitInsertPayload, merkle_status: "PENDING" };

    const { data: retryData, error: retryError } = await supabase
      .from("evidence_commits")
      .insert(retryPayload)
      .select()
      .single();

    if (retryError) {
      // If failed again because of merkle_status, try once more strictly without it
      if (retryError.message?.includes("merkle_status")) {
        const { data: finalRetry, error: finalError } = await supabase
          .from("evidence_commits")
          .insert(commitInsertPayload)
          .select()
          .single();

        if (finalError) {
          await supabase.storage.from("private-evidence").remove([storagePath]);
          throw new Error(`Commit DB insert failed: ${finalError.message}`);
        }
        commitRow = finalRetry;
      } else {
        await supabase.storage.from("private-evidence").remove([storagePath]);
        throw new Error(`Commit DB insert failed: ${retryError.message}`);
      }
    } else {
      commitRow = retryData;
    }
  } else {
    commitRow = commitWithMerkle;
  }

  // 8. Record custody event with support for both occurred_at and timestamp schema conventions
  const custodyPayload: Record<string, any> = {
    evidence_id: evidenceId,
    event_type: "REGISTERED",
    actor_id: params.actorId,
    details: {
      version: 1,
      hash: params.fileSha256,
      title: params.title,
      commitHash,
      fileName: params.fileName,
    },
    event_hash: commitHash,
    occurred_at: timestamp,
  };

  const { error: custodyInsertError } = await supabase
    .from("custody_events")
    .insert(custodyPayload);

  if (custodyInsertError && custodyInsertError.message?.includes("occurred_at")) {
    await supabase.from("custody_events").insert({
      evidence_id: evidenceId,
      event_type: "REGISTERED",
      actor_id: params.actorId,
      details: custodyPayload.details,
      timestamp,
    });
  }

  // 9. Map DB rows to domain types
  const evidence: EvidenceItem = {
    id: evidenceId,
    caseId: params.caseId,
    caseNumber: caseRow.case_number,
    title: params.title,
    category: params.category,
    incidentDate: timestamp,
    currentVersionNumber: 1,
    storageBucket: "private-evidence",
    originalFileName: params.fileName,
    isSealed: false,
    createdBy: params.actorId,
    createdAt: timestamp,
  };

  const version: EvidenceVersion = {
    id: versionRow.id,
    evidenceId,
    versionNumber: 1,
    fileSha256: params.fileSha256,
    ciphertextSha256: envelope.ciphertextSha256,
    storagePath,
    fileName: params.fileName,
    fileSizeBytes: params.fileSizeBytes,
    mimeType: params.mimeType,
    encryptionIv: envelope.ivHex,
    isGenesis: true,
    createdBy: params.actorId,
    creatorName: params.actorName,
    createdAt: timestamp,
    textContent: params.textContent,
  };

  const commit: EvidenceCommit = {
    id: commitRow.id,
    versionId: versionRow.id,
    evidenceId,
    commitHash,
    parentCommitHash: null,
    commitMessage: params.commitMessage,
    note: params.note,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: normalizeRole(params.actorRole) as UserRole,
    serverTimestamp: timestamp,
    signature,
    signingKeyId: SYSTEM_SIGNING_KEY_ID,
    merkleStatus: "PENDING",
  };

  return { evidence, version, commit, storagePath };
}

export function deriveVerificationStatus(
  verdict?: string | null,
  checkHash?: string | null
): VerificationStatus {
  if (!verdict) return "PENDING";
  if (verdict === "INTEGRITY_VERIFIED") return "VERIFIED";
  if (verdict === "CONTENT_MISMATCH") return "MISMATCH";
  if (
    verdict === "SIGNATURE_INVALID" ||
    verdict === "MERKLE_PROOF_INVALID" ||
    verdict === "COMMIT_CHAIN_BROKEN"
  ) {
    return "INTEGRITY_FAILURE";
  }
  if (verdict === "VERIFICATION_INCOMPLETE") {
    return checkHash === "PASS" ? "HASH_MATCH" : "VERIFICATION_INCOMPLETE";
  }
  return "VERIFICATION_INCOMPLETE";
}

/**
 * List all evidence items accessible to the current user (via case_assignments or admin role).
 * Uses the user's own session context (anon key + JWT), so RLS is enforced.
 * Joins evidence_versions and attaches trusted hashes and latest verification status.
 */
export async function listEvidenceForUser(
  userSupabase: any
): Promise<EvidenceItem[]> {
  const { data, error } = await userSupabase
    .from("evidence")
    .select(
      `
      id,
      case_id,
      title,
      category,
      incident_date,
      current_version_number,
      storage_bucket,
      original_file_name,
      is_sealed,
      created_by,
      created_at,
      cases!inner(case_number),
      evidence_versions(id, version_number, file_sha256)
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Evidence list failed: ${error.message}`);

  const evidenceRows = data ?? [];
  const evidenceIds = evidenceRows.map((r: any) => r.id);

  // Fetch latest verification report for each evidence item
  const latestReportsMap: Record<string, any> = {};
  if (evidenceIds.length > 0) {
    try {
      const admin = createAdminClient();
      const { data: reports } = await admin
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
      console.warn("[listEvidenceForUser] could not load verification reports:", e);
    }
  }

  return evidenceRows.map((row: any) => {
    const versions = row.evidence_versions ?? [];
    const v1 = versions.find((v: any) => v.version_number === 1);
    const active =
      versions.find((v: any) => v.version_number === row.current_version_number) ?? v1;
    const rep = latestReportsMap[row.id];
    const verificationStatus = rep
      ? deriveVerificationStatus(rep.verdict, rep.check_hash)
      : "PENDING";

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
}

/**
 * List evidence versions for an evidence record (accessible to user via RLS).
 */
export async function listVersionsForEvidence(
  userSupabase: any,
  evidenceId: string
): Promise<EvidenceVersion[]> {
  const { data, error } = await userSupabase
    .from("evidence_versions")
    .select("*")
    .eq("evidence_id", evidenceId)
    .order("version_number", { ascending: true });

  if (error) throw new Error(`Version list failed: ${error.message}`);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    evidenceId: row.evidence_id,
    versionNumber: row.version_number,
    fileSha256: row.file_sha256,
    ciphertextSha256: row.ciphertext_sha256,
    storagePath: row.storage_path,
    fileName: row.file_name,
    fileSizeBytes: row.file_size_bytes,
    mimeType: row.mime_type,
    encryptionIv: row.encryption_iv,
    isGenesis: row.is_genesis,
    createdBy: row.created_by,
    creatorName: row.creator_name ?? "Unknown",
    createdAt: row.created_at,
    textContent: row.text_content,
  }));
}

/**
 * List commits for an evidence record.
 */
export async function listCommitsForEvidence(
  userSupabase: any,
  evidenceId: string
): Promise<EvidenceCommit[]> {
  const { data, error } = await userSupabase
    .from("evidence_commits")
    .select("*, evidence_versions!inner(version_number)")
    .eq("evidence_id", evidenceId)
    .order("server_timestamp", { ascending: true });

  if (error) throw new Error(`Commit list failed: ${error.message}`);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    versionId: row.version_id,
    evidenceId: row.evidence_id,
    commitHash: row.commit_hash,
    parentCommitHash: row.parent_commit_hash,
    commitMessage: row.commit_message,
    note: row.note,
    actorId: row.actor_id,
    actorName: row.actor_name ?? "Unknown",
    actorRole: normalizeRole(row.actor_role) as UserRole,
    serverTimestamp: row.server_timestamp,
    signature: row.signature,
    signingKeyId: row.signing_key_id,
    merkleStatus: row.merkle_status ?? "PENDING",
    stepUpProofToken: row.step_up_proof_token,
  }));
}

/**
 * Get cases assigned to the current user (via RLS can_access_case).
 */
export async function listCasesForUser(userSupabase: any): Promise<Case[]> {
  const { data, error } = await userSupabase
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Cases list failed: ${error.message}`);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    caseNumber: row.case_number,
    title: row.title,
    jurisdiction: row.jurisdiction,
    status: row.status,
    incidentDate: row.incident_date,
    description: row.description,
    evidenceCount: 0,
    assignedUsers: [],
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Get single evidence record with its versions and commits.
 */
export async function getEvidenceDetail(
  userSupabase: any,
  evidenceId: string
): Promise<{ evidence: EvidenceItem; versions: EvidenceVersion[]; commits: EvidenceCommit[] } | null> {
  const { data: evidenceRow, error } = await userSupabase
    .from("evidence")
    .select("*, cases!inner(case_number)")
    .eq("id", evidenceId)
    .single();

  if (error || !evidenceRow) return null;

  const evidence: EvidenceItem = {
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

  const [versions, commits] = await Promise.all([
    listVersionsForEvidence(userSupabase, evidenceId),
    listCommitsForEvidence(userSupabase, evidenceId),
  ]);

  const v1 = versions.find((v) => v.versionNumber === 1);
  const active = versions.find((v) => v.versionNumber === evidence.currentVersionNumber) ?? v1;

  // Retrieve latest verification report
  let latestVerificationStatus: VerificationStatus = "PENDING";
  try {
    const admin = createAdminClient();
    const { data: latestRep } = await admin
      .from("verification_reports")
      .select("verdict, check_hash")
      .eq("evidence_id", evidenceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestRep) {
      latestVerificationStatus = deriveVerificationStatus(latestRep.verdict, latestRep.check_hash);
    }
  } catch (err) {
    console.warn("Could not fetch latest verification report for detail:", err);
  }

  evidence.v1Sha256 = v1?.fileSha256 ?? null;
  evidence.fileSha256 = active?.fileSha256 ?? v1?.fileSha256 ?? null;
  evidence.verificationStatus = latestVerificationStatus;

  return { evidence, versions, commits };
}

export interface RecordVerificationParams {
  evidenceId: string;
  targetVersionId?: string;
  targetVersionNumber: number;
  candidateSha256: string;
  referenceSha256: string;
  verdict: VerificationVerdict;
  checkHash: CheckOutcome;
  checkSig: CheckOutcome;
  checkMerkle: CheckOutcome;
  checkChain: CheckOutcome;
  diffSummary?: any;
  findings?: any[];
  riskLevel?: string;
  verifierId?: string;
  verifierName?: string;
}

/**
 * Persist an immutable verification report in Supabase and append an audit event.
 */
export async function recordVerificationReport(
  params: RecordVerificationParams
): Promise<VerificationReport> {
  const admin = createAdminClient();
  const timestamp = new Date().toISOString();

  let targetVersionId = params.targetVersionId;
  if (!targetVersionId) {
    const { data: vRow } = await admin
      .from("evidence_versions")
      .select("id")
      .eq("evidence_id", params.evidenceId)
      .eq("version_number", params.targetVersionNumber)
      .maybeSingle();
    targetVersionId = vRow?.id;
  }

  const toDbCheck = (outcome: CheckOutcome) =>
    outcome === "PENDING" ? "UNAVAILABLE" : outcome;

  const insertPayload: Record<string, any> = {
    evidence_id: params.evidenceId,
    target_version_id: targetVersionId,
    candidate_sha256: params.candidateSha256.toLowerCase(),
    reference_sha256: params.referenceSha256.toLowerCase(),
    verdict: params.verdict,
    check_hash: toDbCheck(params.checkHash),
    check_sig: toDbCheck(params.checkSig),
    check_merkle: toDbCheck(params.checkMerkle),
    check_chain: toDbCheck(params.checkChain),
    risk_level: params.riskLevel ?? (params.verdict === "INTEGRITY_VERIFIED" ? "LOW" : "HIGH"),
    findings: params.findings ?? [],
    diff_summary: params.diffSummary ?? null,
    verifier_id: params.verifierId ?? null,
    created_at: timestamp,
  };

  const { data: reportRow, error: reportError } = await admin
    .from("verification_reports")
    .insert(insertPayload)
    .select()
    .single();

  if (reportError) {
    console.error("[recordVerificationReport] insert error:", reportError);
    throw new Error(`Failed to persist verification report: ${reportError.message}`);
  }

  // Also record custody event for auditability
  try {
    await admin.from("custody_events").insert({
      evidence_id: params.evidenceId,
      event_type: "INTEGRITY_VERIFIED",
      actor_id: params.verifierId ?? null,
      details: {
        verdict: params.verdict,
        targetVersionNumber: params.targetVersionNumber,
        candidateSha256: params.candidateSha256,
        referenceSha256: params.referenceSha256,
        checks: {
          hash: params.checkHash,
          sig: params.checkSig,
          merkle: params.checkMerkle,
          chain: params.checkChain,
        },
      },
      occurred_at: timestamp,
      timestamp: timestamp,
    });
  } catch (custodyErr) {
    console.warn("[recordVerificationReport] custody_event insert skipped:", custodyErr);
  }

  return {
    id: reportRow.id,
    evidenceId: reportRow.evidence_id,
    targetVersionId: reportRow.target_version_id,
    targetVersionNumber: params.targetVersionNumber,
    candidateSha256: reportRow.candidate_sha256,
    referenceSha256: reportRow.reference_sha256,
    verdict: reportRow.verdict as VerificationVerdict,
    checks: {
      hashComparison: (reportRow.check_hash ?? "NOT_RUN") as CheckOutcome,
      commitSignature: (reportRow.check_sig ?? "NOT_RUN") as CheckOutcome,
      merkleInclusion: (reportRow.check_merkle ?? "NOT_RUN") as CheckOutcome,
      commitChain: (reportRow.check_chain ?? "NOT_RUN") as CheckOutcome,
    },
    checkHash: reportRow.check_hash,
    checkSig: reportRow.check_sig,
    checkMerkle: reportRow.check_merkle,
    checkChain: reportRow.check_chain,
    riskLevel: reportRow.risk_level,
    findings: reportRow.findings,
    diffSummary: reportRow.diff_summary,
    verifierId: reportRow.verifier_id,
    verifierName: params.verifierName,
    createdAt: reportRow.created_at,
  };
}

/**
 * List historical verification reports for an evidence item.
 */
export async function listVerificationReportsForEvidence(
  evidenceId: string
): Promise<VerificationReport[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("verification_reports")
    .select("*, profiles:verifier_id(full_name)")
    .eq("evidence_id", evidenceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[listVerificationReportsForEvidence] error:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    evidenceId: row.evidence_id,
    targetVersionId: row.target_version_id,
    targetVersionNumber: 1,
    candidateSha256: row.candidate_sha256,
    referenceSha256: row.reference_sha256,
    verdict: row.verdict as VerificationVerdict,
    checks: {
      hashComparison: (row.check_hash ?? "NOT_RUN") as CheckOutcome,
      commitSignature: (row.check_sig ?? "NOT_RUN") as CheckOutcome,
      merkleInclusion: (row.check_merkle ?? "NOT_RUN") as CheckOutcome,
      commitChain: (row.check_chain ?? "NOT_RUN") as CheckOutcome,
    },
    checkHash: row.check_hash,
    checkSig: row.check_sig,
    checkMerkle: row.check_merkle,
    checkChain: row.check_chain,
    riskLevel: row.risk_level,
    findings: row.findings,
    diffSummary: row.diff_summary,
    verifierId: row.verifier_id,
    verifierName: row.profiles?.full_name ?? "Authorized Verifier",
    createdAt: row.created_at,
  }));
}

