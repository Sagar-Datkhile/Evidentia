/**
 * EVIDENTIA Domain Model & Supabase Types
 */

export type UserRole = "Admin" | "Police Officer" | "Forensic Analyst" | "Public Prosecutor";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
  badgeNumber?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
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
  diffSummary?: {
    additionsCount: number;
    deletionsCount: number;
    hasChanges: boolean;
  };
  verifierId: string;
  verifierName: string;
  createdAt: string;
  reportHash?: string;
}
