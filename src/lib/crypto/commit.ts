/**
 * EVIDENTIA Git-Inspired Commit Hashing
 * Deterministic canonical serialization and commit hash computation.
 */

import { computeSha256 } from "./sha256";

export interface CommitPayload {
  evidenceId: string;
  versionNumber: number;
  fileSha256: string;
  parentCommitHash: string | null;
  actorId: string;
  serverTimestamp: string;
  commitMessage: string;
  note?: string;
}

/**
 * Serialize commit fields into canonical deterministic string.
 * Enforces lexicographical order, trimmed strings, and normalized nulls.
 */
export function canonicalizeCommit(payload: CommitPayload): string {
  const normalized = {
    actorId: payload.actorId.trim(),
    commitMessage: payload.commitMessage.trim(),
    evidenceId: payload.evidenceId.trim(),
    fileSha256: payload.fileSha256.trim().toLowerCase(),
    note: (payload.note || "").trim(),
    parentCommitHash: payload.parentCommitHash ? payload.parentCommitHash.trim().toLowerCase() : null,
    serverTimestamp: payload.serverTimestamp.trim(),
    versionNumber: payload.versionNumber,
  };

  return JSON.stringify(normalized, Object.keys(normalized).sort());
}

/**
 * Compute the SHA-256 commit hash over the canonical commit representation.
 */
export async function computeCommitHash(payload: CommitPayload): Promise<string> {
  const canonical = canonicalizeCommit(payload);
  return await computeSha256(canonical);
}

/**
 * Verify that a commit hash accurately matches its canonical payload.
 */
export async function verifyCommitHash(payload: CommitPayload, expectedHash: string): Promise<boolean> {
  const computed = await computeCommitHash(payload);
  return computed.toLowerCase() === expectedHash.toLowerCase();
}
