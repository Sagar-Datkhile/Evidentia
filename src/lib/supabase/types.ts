/**
 * EVIDENTIA Domain Model & Supabase Types
 */

export type AppRole = "user" | "admin";
export type StandardRole = AppRole;
export type LegacyRole = "Admin" | "Police Officer" | "Forensic Analyst" | "Public Prosecutor" | "pending" | "police" | "forensic" | "prosecutor";
export type UserRole = AppRole | LegacyRole;

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  designation?: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
  badgeNumber?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export function normalizeRole(role?: string | null): AppRole {
  if (!role) return "user";
  const r = role.toLowerCase().trim();
  if (r === "admin") return "admin";
  return "user";
}

export function formatRoleLabel(role?: string | null): string {
  const norm = normalizeRole(role);
  return norm === "admin" ? "Admin" : "User";
}

export function isAdmin(role?: string | null): boolean {
  return normalizeRole(role) === "admin";
}

export function canRegisterEvidence(role?: string | null): boolean {
  return true;
}

export function canPerformForensics(role?: string | null): boolean {
  return true;
}

export type CaseStatus = "Active" | "Under Analysis" | "In Trial" | "Archived";

export interface Case {
  id: string; // e.g. "CASE-2026-0042"
  caseNumber: string;
  title: string;
  jurisdiction: string;
  status: CaseStatus;
  incidentDate: string;
  description: string;
  evidenceCount: number;
  assignedUsers: {
    userId: string;
    fullName: string;
    role: UserRole;
  }[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type EvidenceCategory = "Document" | "Digital Image" | "Audio" | "Video" | "Forensic Dump" | "Other";

export type VerificationStatus =
  | "PENDING"
  | "VERIFYING"
  | "VERIFIED"
  | "HASH_MATCH"
  | "MISMATCH"
  | "VERIFICATION_INCOMPLETE"
  | "INTEGRITY_FAILURE"
  | "ERROR";

export interface EvidenceItem {
  id: string; // e.g. "EV-2026-0042-01"
  caseId: string;
  caseNumber: string;
  title: string;
  category: EvidenceCategory;
  incidentDate: string;
  currentVersionNumber: number;
  storageBucket: string;
  originalFileName: string;
  isSealed: boolean;
  createdBy: string;
  createdAt: string;
  v1Sha256?: string | null;
  fileSha256?: string | null;
  verificationStatus?: VerificationStatus;
}

export interface EvidenceVersion {
  id: string;
  evidenceId: string;
  versionNumber: number;
  fileSha256: string;
  ciphertextSha256?: string;
  storagePath: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  encryptionIv?: string;
  isGenesis: boolean;
  createdBy: string;
  creatorName: string;
  createdAt: string;
  textContent?: string;
}

export type MerkleStatus = "PENDING" | "BATCHED" | "CHECKPOINTED";

export interface EvidenceCommit {
  id: string;
  versionId: string;
  evidenceId: string;
  commitHash: string;
  parentCommitHash: string | null;
  commitMessage: string;
  note?: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  serverTimestamp: string;
  signature: string;
  signingKeyId: string;
  merkleStatus: MerkleStatus;
  stepUpProofToken?: string;
}

export type CustodyStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";

export interface CustodyTransfer {
  id: string;
  evidenceId: string;
  evidenceTitle: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  toOrganization: string;
  transferType: string;
  status: CustodyStatus;
  initiatedAt: string;
  acceptedAt?: string;
  handoffNotes: string;
  acknowledgmentNote?: string;
  captureStoragePath?: string;
}

export interface CustodyEvent {
  id: string;
  evidenceId: string;
  transferId?: string;
  eventType: "REGISTERED" | "VERSION_COMMITTED" | "TRANSFER_INITIATED" | "TRANSFER_ACCEPTED" | "INTEGRITY_VERIFIED" | "ACCESSED";
  actorId: string;
  actorName: string;
  details: Record<string, any>;
  timestamp: string;
}

export type VerificationVerdict =
  | "INTEGRITY_VERIFIED"
  | "CONTENT_MISMATCH"
  | "UNREGISTERED_VERSION"
  | "SIGNATURE_INVALID"
  | "MERKLE_PROOF_INVALID"
  | "COMMIT_CHAIN_BROKEN"
  | "VERIFICATION_INCOMPLETE";

export type CheckOutcome = "PASS" | "FAIL" | "NOT_RUN" | "UNAVAILABLE" | "PENDING";

export interface VerificationReport {
  id: string;
  evidenceId: string;
  targetVersionId?: string;
  targetVersionNumber: number;
  candidateSha256: string;
  referenceSha256: string;
  verdict: VerificationVerdict;
  checks: {
    hashComparison: CheckOutcome;
    commitSignature: CheckOutcome;
    merkleInclusion: CheckOutcome;
    commitChain: CheckOutcome;
  };
  checkHash?: CheckOutcome;
  checkSig?: CheckOutcome;
  checkMerkle?: CheckOutcome;
  checkChain?: CheckOutcome;
  riskLevel?: string;
  findings?: any[];
  diffSummary?: {
    additionsCount: number;
    deletionsCount: number;
    hasChanges: boolean;
  } | null;
  verifierId?: string | null;
  verifierName?: string;
  createdAt: string;
  reportHash?: string;
}

export function formatVerificationStatus(status?: VerificationStatus | null): string {
  switch (status) {
    case "VERIFYING":
      return "Verifying...";
    case "VERIFIED":
      return "Verified";
    case "HASH_MATCH":
      return "Hash Match";
    case "MISMATCH":
      return "Mismatch Detected";
    case "VERIFICATION_INCOMPLETE":
      return "Verification Incomplete";
    case "INTEGRITY_FAILURE":
      return "Integrity Failure";
    case "ERROR":
      return "Verification Failed";
    case "PENDING":
    default:
      return "Not Verified";
  }
}

export function getVerificationBadgeStyle(status?: VerificationStatus | null): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case "VERIFIED":
      return {
        label: "Verified",
        bg: "bg-emerald-50",
        text: "text-emerald-800",
        border: "border-emerald-200",
      };
    case "HASH_MATCH":
      return {
        label: "Hash Match",
        bg: "bg-blue-50",
        text: "text-blue-800",
        border: "border-blue-200",
      };
    case "MISMATCH":
      return {
        label: "Mismatch Detected",
        bg: "bg-red-50",
        text: "text-red-800",
        border: "border-red-200",
      };
    case "INTEGRITY_FAILURE":
      return {
        label: "Integrity Failure",
        bg: "bg-red-50",
        text: "text-red-900",
        border: "border-red-300",
      };
    case "VERIFICATION_INCOMPLETE":
      return {
        label: "Verification Incomplete",
        bg: "bg-amber-50",
        text: "text-amber-800",
        border: "border-amber-200",
      };
    case "VERIFYING":
      return {
        label: "Verifying...",
        bg: "bg-neutral-100",
        text: "text-neutral-700",
        border: "border-neutral-300",
      };
    case "ERROR":
      return {
        label: "Verification Failed",
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
      };
    case "PENDING":
    default:
      return {
        label: "Not Verified",
        bg: "bg-[#F1F1F3]",
        text: "text-[#6B6B73]",
        border: "border-[#E5E5E7]",
      };
  }
}

