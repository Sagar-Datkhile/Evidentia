/**
 * EVIDENTIA Central In-Memory & Supabase State Engine
 * Manages judicial cases, cryptographic evidence records, version lineages, and custody events.
 */

import {
  Case,
  EvidenceItem,
  EvidenceVersion,
  EvidenceCommit,
  CustodyTransfer,
  CustodyEvent,
  UserProfile,
  VerificationReport,
  UserRole,
} from "../supabase/types";
import { computeSha256 } from "../crypto/sha256";
import { computeCommitHash } from "../crypto/commit";
import { signAttestation, SYSTEM_SIGNING_KEY_ID } from "../crypto/ed25519";
import { computeMerkleLeafHash, buildMerkleTree, generateInclusionProof } from "../crypto/merkle";

// Pre-seeded Users
export const DEMO_USERS: Record<string, UserProfile> = {
  police: {
    id: "usr_police_01",
    email: "rajesh.sharma@police.delhi.gov.in",
    fullName: "Insp. Rajesh Sharma",
    role: "Police Officer",
    organizationName: "Delhi Police Special Cell",
    badgeNumber: "DP-88219",
    isActive: true,
    createdAt: "2026-01-15T09:00:00Z",
  },
  forensic: {
    id: "usr_forensic_01",
    email: "ananya.iyer@cfsl.gov.in",
    fullName: "Dr. Ananya Iyer",
    role: "Forensic Analyst",
    organizationName: "Central Forensic Science Laboratory (CFSL)",
    badgeNumber: "CFSL-7712",
    isActive: true,
    createdAt: "2026-02-01T10:30:00Z",
  },
  prosecutor: {
    id: "usr_prosecutor_01",
    email: "vikram.sen@prosecution.delhi.gov.in",
    fullName: "Vikramaditya Sen",
    role: "Public Prosecutor",
    organizationName: "Directorate of Prosecution, High Court",
    badgeNumber: "PP-HC-409",
    isActive: true,
    createdAt: "2026-01-10T11:15:00Z",
  },
  admin: {
    id: "usr_admin_01",
    email: "devika.menon@judiciary.gov.in",
    fullName: "Devika Menon",
    role: "Admin",
    organizationName: "Judicial Evidence Authority",
    badgeNumber: "JEA-CHIEF-01",
    isActive: true,
    createdAt: "2026-01-01T08:00:00Z",
  },
};

// Initial Cases
export let initialCases: Case[] = [
  {
    id: "CASE-2026-0042",
    caseNumber: "CASE-2026-0042",
    title: "State vs. Cyber Syndicate Alpha",
    jurisdiction: "High Court of Delhi - Cyber Bench",
    status: "Active",
    incidentDate: "2026-09-14T03:30:00Z",
    description: "Multi-jurisdictional ransomware extortion and illicit financial exfiltration impacting municipal infrastructure.",
    evidenceCount: 3,
    assignedUsers: [
      { userId: "usr_police_01", fullName: "Insp. Rajesh Sharma", role: "Police Officer" },
      { userId: "usr_forensic_01", fullName: "Dr. Ananya Iyer", role: "Forensic Analyst" },
      { userId: "usr_prosecutor_01", fullName: "Vikramaditya Sen", role: "Public Prosecutor" },
    ],
    createdBy: "usr_police_01",
    createdAt: "2026-09-15T09:00:00Z",
    updatedAt: "2026-10-09T18:20:00Z",
  },
  {
    id: "CASE-2026-0091",
    caseNumber: "CASE-2026-0091",
    title: "Industrial Espionage & Trade Secret Exfiltration",
    jurisdiction: "City Civil & Sessions Court",
    status: "Under Analysis",
    incidentDate: "2026-09-28T14:15:00Z",
    description: "Unauthorized digital exfiltration of proprietary quantum sensor telemetry and engineering blue-prints.",
    evidenceCount: 1,
    assignedUsers: [
      { userId: "usr_police_01", fullName: "Insp. Rajesh Sharma", role: "Police Officer" },
      { userId: "usr_forensic_01", fullName: "Dr. Ananya Iyer", role: "Forensic Analyst" },
    ],
    createdBy: "usr_police_01",
    createdAt: "2026-09-29T11:00:00Z",
    updatedAt: "2026-10-08T12:00:00Z",
  },
];

// Initial Evidence Items
export let initialEvidence: EvidenceItem[] = [
  {
    id: "EV-2026-0042-01",
    caseId: "CASE-2026-0042",
    caseNumber: "CASE-2026-0042",
    title: "Official First Information Report (FIR) & Seizure Order",
    category: "Document",
    incidentDate: "2026-09-14T03:30:00Z",
    currentVersionNumber: 2,
    storageBucket: "private-evidence",
    originalFileName: "FIR_Case_0042_Official.txt",
    isSealed: false,
    createdBy: "usr_police_01",
    createdAt: "2026-09-15T10:15:00Z",
  },
  {
    id: "EV-2026-0042-02",
    caseId: "CASE-2026-0042",
    caseNumber: "CASE-2026-0042",
    title: "Seized Command-and-Control Server Forensic Memory Dump",
    category: "Forensic Dump",
    incidentDate: "2026-09-14T05:00:00Z",
    currentVersionNumber: 1,
    storageBucket: "private-evidence",
    originalFileName: "c2_ram_dump_0914.raw",
    isSealed: true,
    createdBy: "usr_forensic_01",
    createdAt: "2026-09-16T14:30:00Z",
  },
  {
    id: "EV-2026-0042-03",
    caseId: "CASE-2026-0042",
    caseNumber: "CASE-2026-0042",
    title: "Data Center Security Gate Camera Footage",
    category: "Video",
    incidentDate: "2026-09-13T23:45:00Z",
    currentVersionNumber: 1,
    storageBucket: "private-evidence",
    originalFileName: "cctv_datacenter_gate3_0913.mp4",
    isSealed: false,
    createdBy: "usr_police_01",
    createdAt: "2026-09-17T08:20:00Z",
  },
  {
    id: "EV-2026-0091-01",
    caseId: "CASE-2026-0091",
    caseNumber: "CASE-2026-0091",
    title: "Exfiltrated Corporate Email Archive & Network Flow Log",
    category: "Document",
    incidentDate: "2026-09-28T14:15:00Z",
    currentVersionNumber: 1,
    storageBucket: "private-evidence",
    originalFileName: "email_netflow_audit_0928.txt",
    isSealed: false,
    createdBy: "usr_police_01",
    createdAt: "2026-09-29T12:40:00Z",
  },
];

// Initial Versions
export let initialVersions: EvidenceVersion[] = [
  {
    id: "ver_0042_01_v1",
    evidenceId: "EV-2026-0042-01",
    versionNumber: 1,
    fileSha256: "5a3962d3a339906644eb9c6e3926569116790b4313fa4841804f32ecaa4c194a",
    storagePath: "evidence/EV-2026-0042-01/v1/FIR_Case_0042_Official.txt",
    fileName: "FIR_Case_0042_Official.txt",
    fileSizeBytes: 2480,
    mimeType: "text/plain",
    isGenesis: true,
    createdBy: "usr_police_01",
    creatorName: "Insp. Rajesh Sharma",
    createdAt: "2026-09-15T10:15:00Z",
    textContent: `DELHI POLICE SPECIAL CELL - CYBER CRIME DIVISION
FIRST INFORMATION REPORT (FIR) UNDER SECTION 154 Cr.P.C.
FIR Number: FIR-2026-SC-0812
Date of Incident: September 14, 2026, 03:30 IST
Complainant: Municipal Cloud Security Infrastructure Command
Accused: Unknown Cyber Syndicate Group "Alpha"

1. INCIDENT DETAILS:
At approximately 03:30 hours, automated integrity monitors detected unauthorized SSH credential stuffing against the municipal water SCADA telemetry cluster.
Seizure warrant executed under Cr.P.C. Section 165 at primary relay facility.

2. PRELIMINARY EVIDENCE COLLECTED:
- Physical server chassis S/N: SCADA-CH-9912 seized under tamper seal #DP-9912-A.
- Network TAP interface capture logs preserved in raw pcap format.

3. OFFICER DECLARATION:
All original logs hashed and sealed in presence of two independent panch witnesses.
Signed: Insp. Rajesh Sharma (IO)`,
  },
  {
    id: "ver_0042_01_v2",
    evidenceId: "EV-2026-0042-01",
    versionNumber: 2,
    fileSha256: "9f82d1e2b449176319c72e4138e60298a02c525f234b8c9e0135d886910a34b2",
    storagePath: "evidence/EV-2026-0042-01/v2/FIR_Case_0042_Supplemental.txt",
    fileName: "FIR_Case_0042_Supplemental.txt",
    fileSizeBytes: 2890,
    mimeType: "text/plain",
    isGenesis: false,
    createdBy: "usr_police_01",
    creatorName: "Insp. Rajesh Sharma",
    createdAt: "2026-09-22T14:40:00Z",
    textContent: `DELHI POLICE SPECIAL CELL - CYBER CRIME DIVISION
FIRST INFORMATION REPORT (FIR) UNDER SECTION 154 Cr.P.C.
FIR Number: FIR-2026-SC-0812
Date of Incident: September 14, 2026, 03:30 IST
Complainant: Municipal Cloud Security Infrastructure Command
Accused: Unknown Cyber Syndicate Group "Alpha"

1. INCIDENT DETAILS:
At approximately 03:30 hours, automated integrity monitors detected unauthorized SSH credential stuffing against the municipal water SCADA telemetry cluster.
Seizure warrant executed under Cr.P.C. Section 165 at primary relay facility.

2. PRELIMINARY EVIDENCE COLLECTED:
- Physical server chassis S/N: SCADA-CH-9912 seized under tamper seal #DP-9912-A.
- Network TAP interface capture logs preserved in raw pcap format.
- SUPPLEMENTAL: Forensic recovery of encrypted USB stick found concealed inside relay junction box 4B.

3. SUPPLEMENTAL WITNESS & FORENSIC ATTESTATION:
Panch witness statement corroborated by Dr. Ananya Iyer (CFSL).
Added IPC Section 66F (Cyber Terrorism) upon confirmation of supervisory control payload intent.

4. OFFICER DECLARATION:
All original logs hashed and sealed in presence of two independent panch witnesses.
Signed: Insp. Rajesh Sharma (IO)`,
  },
  {
    id: "ver_0042_02_v1",
    evidenceId: "EV-2026-0042-02",
    versionNumber: 1,
    fileSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    storagePath: "evidence/EV-2026-0042-02/v1/c2_ram_dump_0914.raw",
    fileName: "c2_ram_dump_0914.raw",
    fileSizeBytes: 34359738368,
    mimeType: "application/octet-stream",
    isGenesis: true,
    createdBy: "usr_forensic_01",
    creatorName: "Dr. Ananya Iyer",
    createdAt: "2026-09-16T14:30:00Z",
  },
  {
    id: "ver_0042_03_v1",
    evidenceId: "EV-2026-0042-03",
    versionNumber: 1,
    fileSha256: "7d1421f1d91c7849129528f14e21a224a1599824f114ef9820541991dffae80a",
    storagePath: "evidence/EV-2026-0042-03/v1/cctv_datacenter_gate3_0913.mp4",
    fileName: "cctv_datacenter_gate3_0913.mp4",
    fileSizeBytes: 125829120,
    mimeType: "video/mp4",
    isGenesis: true,
    createdBy: "usr_police_01",
    creatorName: "Insp. Rajesh Sharma",
    createdAt: "2026-09-17T08:20:00Z",
  },
  {
    id: "ver_0091_01_v1",
    evidenceId: "EV-2026-0091-01",
    versionNumber: 1,
    fileSha256: "1f89bc7291a13401fa9b8823901cfde2340156942188402194812039ab184029",
    storagePath: "evidence/EV-2026-0091-01/v1/email_netflow_audit_0928.txt",
    fileName: "email_netflow_audit_0928.txt",
    fileSizeBytes: 4200,
    mimeType: "text/plain",
    isGenesis: true,
    createdBy: "usr_police_01",
    creatorName: "Insp. Rajesh Sharma",
    createdAt: "2026-09-29T12:40:00Z",
    textContent: `EXFILTRATION AUDIT REPORT - CASE 0091
Target Entity: Apex Quantum Microelectronics Ltd.
Exfiltration Vector: TLS Tunnel (TCP/8443) to offshore VPS 185.220.101.44
Total bytes transferred: 4.8 GiB
Primary actor email handle: insider-analyst-99@apexquantum.internal`,
  },
];

// Initial Commits
export let initialCommits: EvidenceCommit[] = [
  {
    id: "cmt_0042_01_v1",
    versionId: "ver_0042_01_v1",
    evidenceId: "EV-2026-0042-01",
    commitHash: "c0119284ba71e04192bce81934ba38914b18204910cfab18471928371629841a",
    parentCommitHash: null,
    commitMessage: "Genesis FIR registration under Section 154 Cr.P.C.",
    note: "Registered directly upon physical seizure from Special Cell Station 14.",
    actorId: "usr_police_01",
    actorName: "Insp. Rajesh Sharma",
    actorRole: "Police Officer",
    serverTimestamp: "2026-09-15T10:15:05Z",
    signature: "sig_ed25519_88a912b7cc39921471029ba81928fce1",
    signingKeyId: SYSTEM_SIGNING_KEY_ID,
    merkleStatus: "CHECKPOINTED",
  },
  {
    id: "cmt_0042_01_v2",
    versionId: "ver_0042_01_v2",
    evidenceId: "EV-2026-0042-01",
    commitHash: "d991823746a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456",
    parentCommitHash: "c0119284ba71e04192bce81934ba38914b18204910cfab18471928371629841a",
    commitMessage: "Supplemental FIR amendment: Added recovered encrypted USB stick & IPC 66F",
    note: "Revision approved under judicial order #HC-ORD-8812; parent V1 remains permanently preserved.",
    actorId: "usr_police_01",
    actorName: "Insp. Rajesh Sharma",
    actorRole: "Police Officer",
    serverTimestamp: "2026-09-22T14:40:12Z",
    signature: "sig_ed25519_10928374619a8b7c2d3e4f5061728394",
    signingKeyId: SYSTEM_SIGNING_KEY_ID,
    merkleStatus: "CHECKPOINTED",
    stepUpProofToken: "vprf_passkey_winhello_8819",
  },
  {
    id: "cmt_0042_02_v1",
    versionId: "ver_0042_02_v1",
    evidenceId: "EV-2026-0042-02",
    commitHash: "e118947261908234716293847561029384756102938475610293847561029384",
    parentCommitHash: null,
    commitMessage: "Initial cryptographic acquisition of volatile server RAM",
    note: "Acquired using write-blocker certified hardware tap.",
    actorId: "usr_forensic_01",
    actorName: "Dr. Ananya Iyer",
    actorRole: "Forensic Analyst",
    serverTimestamp: "2026-09-16T14:30:20Z",
    signature: "sig_ed25519_99182736451029384756102938475610",
    signingKeyId: SYSTEM_SIGNING_KEY_ID,
    merkleStatus: "CHECKPOINTED",
  },
  {
    id: "cmt_0042_03_v1",
    versionId: "ver_0042_03_v1",
    evidenceId: "EV-2026-0042-03",
    commitHash: "f229104857192837465019283746501928374650192837465019283746501928",
    parentCommitHash: null,
    commitMessage: "Data center physical ingress CCTV video capture",
    note: "Verified timestamp sync with Indian Standard Time atomic clock.",
    actorId: "usr_police_01",
    actorName: "Insp. Rajesh Sharma",
    actorRole: "Police Officer",
    serverTimestamp: "2026-09-17T08:20:15Z",
    signature: "sig_ed25519_77182930419283746501928374650192",
    signingKeyId: SYSTEM_SIGNING_KEY_ID,
    merkleStatus: "CHECKPOINTED",
  },
  {
    id: "cmt_0091_01_v1",
    versionId: "ver_0091_01_v1",
    evidenceId: "EV-2026-0091-01",
    commitHash: "a339485710293847561029384756102938475610293847561029384756102938",
    parentCommitHash: null,
    commitMessage: "Corporate email and firewall netflow log intake",
    note: "Subpoena compliance extract from corporate IT department.",
    actorId: "usr_police_01",
    actorName: "Insp. Rajesh Sharma",
    actorRole: "Police Officer",
    serverTimestamp: "2026-09-29T12:40:22Z",
    signature: "sig_ed25519_44918273650192837465019283746501",
    signingKeyId: SYSTEM_SIGNING_KEY_ID,
    merkleStatus: "CHECKPOINTED",
  },
];

// Initial Custody Transfers
export let initialTransfers: CustodyTransfer[] = [
  {
    id: "xfr_0042_01",
    evidenceId: "EV-2026-0042-01",
    evidenceTitle: "Official First Information Report (FIR) & Seizure Order",
    fromUserId: "usr_police_01",
    fromUserName: "Insp. Rajesh Sharma",
    toUserId: "usr_forensic_01",
    toUserName: "Dr. Ananya Iyer",
    toOrganization: "Central Forensic Science Laboratory (CFSL)",
    transferType: "FORENSIC_EXAMINATION",
    status: "ACCEPTED",
    initiatedAt: "2026-09-16T11:00:00Z",
    acceptedAt: "2026-09-16T13:45:00Z",
    handoffNotes: "Transfer for forensic document authenticity verification and signature cross-validation.",
    acknowledgmentNote: "Physical seal intact, V1 hash 5a3962d3... verified matching exactly upon receipt.",
    captureStoragePath: "captures/cap_xfr_0042_01.webp",
  },
  {
    id: "xfr_0042_02",
    evidenceId: "EV-2026-0042-01",
    evidenceTitle: "Official First Information Report (FIR) & Seizure Order",
    fromUserId: "usr_forensic_01",
    fromUserName: "Dr. Ananya Iyer",
    toUserId: "usr_prosecutor_01",
    toUserName: "Vikramaditya Sen",
    toOrganization: "Directorate of Prosecution, High Court",
    transferType: "JUDICIAL_PROBATE",
    status: "ACCEPTED",
    initiatedAt: "2026-09-25T10:15:00Z",
    acceptedAt: "2026-09-25T11:30:00Z",
    handoffNotes: "Transmission of verified evidence docket and V2 supplemental commit for trial filing.",
    acknowledgmentNote: "Admitted into court evidence registry under Exhibit P-1.",
  },
];

// Initial Custody Events
export let initialCustodyEvents: CustodyEvent[] = [
  {
    id: "evt_cust_01",
    evidenceId: "EV-2026-0042-01",
    eventType: "REGISTERED",
    actorId: "usr_police_01",
    actorName: "Insp. Rajesh Sharma",
    details: { version: 1, action: "Genesis Evidence Registration", hash: "5a3962d3a3399066..." },
    timestamp: "2026-09-15T10:15:00Z",
  },
  {
    id: "evt_cust_02",
    evidenceId: "EV-2026-0042-01",
    transferId: "xfr_0042_01",
    eventType: "TRANSFER_INITIATED",
    actorId: "usr_police_01",
    actorName: "Insp. Rajesh Sharma",
    details: { recipient: "Dr. Ananya Iyer (CFSL)", method: "Passkey Step-Up" },
    timestamp: "2026-09-16T11:00:00Z",
  },
  {
    id: "evt_cust_03",
    evidenceId: "EV-2026-0042-01",
    transferId: "xfr_0042_01",
    eventType: "TRANSFER_ACCEPTED",
    actorId: "usr_forensic_01",
    actorName: "Dr. Ananya Iyer",
    details: { status: "Verified Intact", hashComparison: "PASS" },
    timestamp: "2026-09-16T13:45:00Z",
  },
  {
    id: "evt_cust_04",
    evidenceId: "EV-2026-0042-01",
    eventType: "VERSION_COMMITTED",
    actorId: "usr_police_01",
    actorName: "Insp. Rajesh Sharma",
    details: { version: 2, parentHash: "c0119284...", newHash: "9f82d1e2...", stepUp: "Windows Hello" },
    timestamp: "2026-09-22T14:40:00Z",
  },
  {
    id: "evt_cust_05",
    evidenceId: "EV-2026-0042-01",
    transferId: "xfr_0042_02",
    eventType: "TRANSFER_ACCEPTED",
    actorId: "usr_prosecutor_01",
    actorName: "Vikramaditya Sen",
    details: { courtDocket: "Exhibit P-1", trialBench: "High Court Cyber Bench" },
    timestamp: "2026-09-25T11:30:00Z",
  },
];

// Merkle Batches & Checkpoints
export interface MerkleCheckpointData {
  id: string;
  batchNumber: number;
  rootHash: string;
  leafCount: number;
  signature: string;
  signingKeyId: string;
  finalizedAt: string;
  leafHashes: string[];
}

export let initialCheckpoint: MerkleCheckpointData = {
  id: "chk_batch_001",
  batchNumber: 1,
  rootHash: "7b4198234c9f1820491823746192837465019283746501928374650192837465",
  leafCount: 5,
  signature: "sig_ed25519_chk_88192837465019283746501928374650",
  signingKeyId: SYSTEM_SIGNING_KEY_ID,
  finalizedAt: "2026-09-30T00:00:00Z",
  leafHashes: [
    "5a3962d3a339906644eb9c6e3926569116790b4313fa4841804f32ecaa4c194a",
    "9f82d1e2b449176319c72e4138e60298a02c525f234b8c9e0135d886910a34b2",
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "7d1421f1d91c7849129528f14e21a224a1599824f114ef9820541991dffae80a",
    "1f89bc7291a13401fa9b8823901cfde2340156942188402194812039ab184029",
  ],
};

// State Store Class
class EvidenceDataStore {
  private cases: Case[] = [...initialCases];
  private evidence: EvidenceItem[] = [...initialEvidence];
  private versions: EvidenceVersion[] = [...initialVersions];
  private commits: EvidenceCommit[] = [...initialCommits];
  private transfers: CustodyTransfer[] = [...initialTransfers];
  private custodyEvents: CustodyEvent[] = [...initialCustodyEvents];
  private checkpoint: MerkleCheckpointData = { ...initialCheckpoint };

  constructor() {
    this.initSignatures();
  }

  private async initSignatures() {
    for (const c of this.commits) {
      try {
        c.signature = await signAttestation(c.commitHash);
      } catch {}
    }
    try {
      this.checkpoint.signature = await signAttestation(this.checkpoint.rootHash);
    } catch {}
  }

  // Cases
  getCases(): Case[] {
    return [...this.cases];
  }

  getCaseById(id: string): Case | undefined {
    return this.cases.find((c) => c.id === id);
  }

  createCase(newCase: Omit<Case, "evidenceCount" | "assignedUsers" | "createdAt" | "updatedAt">): Case {
    const created: Case = {
      ...newCase,
      evidenceCount: 0,
      assignedUsers: [
        { userId: "usr_police_01", fullName: "Insp. Rajesh Sharma", role: "Police Officer" },
        { userId: "usr_forensic_01", fullName: "Dr. Ananya Iyer", role: "Forensic Analyst" },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.cases.unshift(created);
    return created;
  }

  // Evidence
  getAllEvidence(): EvidenceItem[] {
    return [...this.evidence];
  }

  getEvidenceByCaseId(caseId: string): EvidenceItem[] {
    return this.evidence.filter((e) => e.caseId === caseId);
  }

  getEvidenceById(id: string): EvidenceItem | undefined {
    return this.evidence.find((e) => e.id === id);
  }

  getVersionsByEvidenceId(evidenceId: string): EvidenceVersion[] {
    return this.versions.filter((v) => v.evidenceId === evidenceId).sort((a, b) => a.versionNumber - b.versionNumber);
  }

  getVersion(evidenceId: string, versionNumber: number): EvidenceVersion | undefined {
    return this.versions.find((v) => v.evidenceId === evidenceId && v.versionNumber === versionNumber);
  }

  getCommitsByEvidenceId(evidenceId: string): EvidenceCommit[] {
    return this.commits.filter((c) => c.evidenceId === evidenceId).sort((a, b) => {
      const vA = this.versions.find((v) => v.id === a.versionId)?.versionNumber || 0;
      const vB = this.versions.find((v) => v.id === b.versionId)?.versionNumber || 0;
      return vA - vB;
    });
  }

  getCommitForVersion(versionId: string): EvidenceCommit | undefined {
    return this.commits.find((c) => c.versionId === versionId);
  }

  getTransfersByEvidenceId(evidenceId: string): CustodyTransfer[] {
    return this.transfers.filter((t) => t.evidenceId === evidenceId);
  }

  getCustodyEventsByEvidenceId(evidenceId: string): CustodyEvent[] {
    return this.custodyEvents.filter((e) => e.evidenceId === evidenceId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  getCheckpoint(): MerkleCheckpointData {
    return this.checkpoint;
  }

  // Register New Evidence (V1 Genesis)
  async registerEvidence(params: {
    caseId: string;
    title: string;
    category: EvidenceItem["category"];
    incidentDate?: string;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    fileSha256: string;
    textContent?: string;
    commitMessage: string;
    note?: string;
    actor: UserProfile;
  }): Promise<{ evidence: EvidenceItem; version: EvidenceVersion; commit: EvidenceCommit }> {
    const parentCase = this.getCaseById(params.caseId);
    if (!parentCase) throw new Error("Case not found");

    const count = this.evidence.filter((e) => e.caseId === params.caseId).length + 1;
    const evidenceId = `${params.caseId}-${String(count).padStart(2, "0")}`;
    const timestamp = new Date().toISOString();

    const newEvidence: EvidenceItem = {
      id: evidenceId,
      caseId: params.caseId,
      caseNumber: parentCase.caseNumber,
      title: params.title,
      category: params.category,
      incidentDate: params.incidentDate || timestamp,
      currentVersionNumber: 1,
      storageBucket: "private-evidence",
      originalFileName: params.fileName,
      isSealed: false,
      createdBy: params.actor.id,
      createdAt: timestamp,
    };

    const versionId = `ver_${evidenceId.replace(/[^a-zA-Z0-9]/g, "_")}_v1`;
    const newVersion: EvidenceVersion = {
      id: versionId,
      evidenceId,
      versionNumber: 1,
      fileSha256: params.fileSha256,
      storagePath: `evidence/${evidenceId}/v1/${params.fileName}`,
      fileName: params.fileName,
      fileSizeBytes: params.fileSizeBytes,
      mimeType: params.mimeType,
      isGenesis: true,
      createdBy: params.actor.id,
      creatorName: params.actor.fullName,
      createdAt: timestamp,
      textContent: params.textContent,
    };

    const commitHash = await computeCommitHash({
      evidenceId,
      versionNumber: 1,
      fileSha256: params.fileSha256,
      parentCommitHash: null,
      actorId: params.actor.id,
      serverTimestamp: timestamp,
      commitMessage: params.commitMessage,
      note: params.note,
    });

    const signature = await signAttestation(commitHash);

    const newCommit: EvidenceCommit = {
      id: `cmt_${versionId}`,
      versionId,
      evidenceId,
      commitHash,
      parentCommitHash: null,
      commitMessage: params.commitMessage,
      note: params.note,
      actorId: params.actor.id,
      actorName: params.actor.fullName,
      actorRole: params.actor.role,
      serverTimestamp: timestamp,
      signature,
      signingKeyId: SYSTEM_SIGNING_KEY_ID,
      merkleStatus: "CHECKPOINTED",
    };

    this.evidence.unshift(newEvidence);
    this.versions.push(newVersion);
    this.commits.push(newCommit);
    parentCase.evidenceCount++;

    this.custodyEvents.push({
      id: `evt_cust_${Date.now()}`,
      evidenceId,
      eventType: "REGISTERED",
      actorId: params.actor.id,
      actorName: params.actor.fullName,
      details: { version: 1, hash: params.fileSha256, title: params.title },
      timestamp,
    });

    // Add to Merkle checkpoint leaves
    this.checkpoint.leafHashes.push(params.fileSha256);
    this.checkpoint.leafCount = this.checkpoint.leafHashes.length;

    return { evidence: newEvidence, version: newVersion, commit: newCommit };
  }

  // Create Authorized Version (V2+)
  async createVersion(params: {
    evidenceId: string;
    parentVersionNumber: number;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    fileSha256: string;
    textContent?: string;
    commitMessage: string;
    note?: string;
    actor: UserProfile;
    stepUpProofToken?: string;
  }): Promise<{ version: EvidenceVersion; commit: EvidenceCommit }> {
    const evidenceItem = this.getEvidenceById(params.evidenceId);
    if (!evidenceItem) throw new Error("Evidence not found");

    const parentVersion = this.getVersion(params.evidenceId, params.parentVersionNumber);
    if (!parentVersion) throw new Error("Parent version not found");

    const parentCommit = this.getCommitForVersion(parentVersion.id);
    const parentCommitHash = parentCommit ? parentCommit.commitHash : null;

    const nextVersionNumber = evidenceItem.currentVersionNumber + 1;
    const timestamp = new Date().toISOString();
    const versionId = `ver_${params.evidenceId.replace(/[^a-zA-Z0-9]/g, "_")}_v${nextVersionNumber}`;

    const newVersion: EvidenceVersion = {
      id: versionId,
      evidenceId: params.evidenceId,
      versionNumber: nextVersionNumber,
      fileSha256: params.fileSha256,
      storagePath: `evidence/${params.evidenceId}/v${nextVersionNumber}/${params.fileName}`,
      fileName: params.fileName,
      fileSizeBytes: params.fileSizeBytes,
      mimeType: params.mimeType,
      isGenesis: false,
      createdBy: params.actor.id,
      creatorName: params.actor.fullName,
      createdAt: timestamp,
      textContent: params.textContent,
    };

    const commitHash = await computeCommitHash({
      evidenceId: params.evidenceId,
      versionNumber: nextVersionNumber,
      fileSha256: params.fileSha256,
      parentCommitHash,
      actorId: params.actor.id,
      serverTimestamp: timestamp,
      commitMessage: params.commitMessage,
      note: params.note,
    });

    const signature = await signAttestation(commitHash);

    const newCommit: EvidenceCommit = {
      id: `cmt_${versionId}`,
      versionId,
      evidenceId: params.evidenceId,
      commitHash,
      parentCommitHash,
      commitMessage: params.commitMessage,
      note: params.note,
      actorId: params.actor.id,
      actorName: params.actor.fullName,
      actorRole: params.actor.role,
      serverTimestamp: timestamp,
      signature,
      signingKeyId: SYSTEM_SIGNING_KEY_ID,
      merkleStatus: "CHECKPOINTED",
      stepUpProofToken: params.stepUpProofToken || "vprf_verified_step_up",
    };

    evidenceItem.currentVersionNumber = nextVersionNumber;
    this.versions.push(newVersion);
    this.commits.push(newCommit);

    this.custodyEvents.push({
      id: `evt_cust_${Date.now()}`,
      evidenceId: params.evidenceId,
      eventType: "VERSION_COMMITTED",
      actorId: params.actor.id,
      actorName: params.actor.fullName,
      details: {
        version: nextVersionNumber,
        parentHash: parentCommitHash,
        newHash: params.fileSha256,
        stepUp: params.stepUpProofToken ? "Passkey Verified" : "Standard",
      },
      timestamp,
    });

    this.checkpoint.leafHashes.push(params.fileSha256);
    this.checkpoint.leafCount = this.checkpoint.leafHashes.length;

    return { version: newVersion, commit: newCommit };
  }

  // Custody Transfer
  createTransfer(params: {
    evidenceId: string;
    fromUser: UserProfile;
    toUser: UserProfile;
    transferType: string;
    handoffNotes: string;
    captureStoragePath?: string;
  }): CustodyTransfer {
    const evidenceItem = this.getEvidenceById(params.evidenceId);
    if (!evidenceItem) throw new Error("Evidence not found");

    const timestamp = new Date().toISOString();
    const transfer: CustodyTransfer = {
      id: `xfr_${Date.now()}`,
      evidenceId: params.evidenceId,
      evidenceTitle: evidenceItem.title,
      fromUserId: params.fromUser.id,
      fromUserName: params.fromUser.fullName,
      toUserId: params.toUser.id,
      toUserName: params.toUser.fullName,
      toOrganization: params.toUser.organizationName || "Authorized Institution",
      transferType: params.transferType,
      status: "PENDING",
      initiatedAt: timestamp,
      handoffNotes: params.handoffNotes,
      captureStoragePath: params.captureStoragePath,
    };

    this.transfers.unshift(transfer);
    this.custodyEvents.push({
      id: `evt_cust_${Date.now()}`,
      evidenceId: params.evidenceId,
      transferId: transfer.id,
      eventType: "TRANSFER_INITIATED",
      actorId: params.fromUser.id,
      actorName: params.fromUser.fullName,
      details: {
        recipient: `${params.toUser.fullName} (${params.toUser.organizationName})`,
        type: params.transferType,
      },
      timestamp,
    });

    return transfer;
  }

  acceptTransfer(transferId: string, actor: UserProfile, note?: string): CustodyTransfer {
    const transfer = this.transfers.find((t) => t.id === transferId);
    if (!transfer) throw new Error("Transfer not found");

    const timestamp = new Date().toISOString();
    transfer.status = "ACCEPTED";
    transfer.acceptedAt = timestamp;
    transfer.acknowledgmentNote = note || "Custody verified and accepted in good order.";

    this.custodyEvents.push({
      id: `evt_cust_${Date.now()}`,
      evidenceId: transfer.evidenceId,
      transferId: transfer.id,
      eventType: "TRANSFER_ACCEPTED",
      actorId: actor.id,
      actorName: actor.fullName,
      details: { note: transfer.acknowledgmentNote },
      timestamp,
    });

    return transfer;
  }
}

// Singleton global store instance
export const evidenceStore = new EvidenceDataStore();
