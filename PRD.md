# Product Requirements Document (PRD) — EVIDENTIA
**Version:** 1.0  
**Status:** Approved / Active Development  
**Tagline:** *Every Record. Every Handoff. Verifiable.*  
**Category:** Zero-Trust, Tamper-Evident Digital Evidence Management  

---

## 1. Executive Summary & Problem Statement

### 1.1 The Judicial & Forensic Crisis
In traditional judicial and law enforcement systems, digital evidence (First Information Reports, CCTV captures, autopsy logs, ballistics data, electronic forensics, and witness recordings) faces critical trust vulnerabilities:
- **Silent Overwriting & Tampering:** Digital files are frequently copied across servers, USB drives, and shared folders without immutable audit records, leaving room for unauthorized alteration.
- **Ambiguous Chain of Custody:** Handoffs between police stations, forensic laboratories, and prosecutor offices rely on manual paper registers or modifiable database logs without cryptographic attestation.
- **Lack of Non-Destructive Versioning:** Legitimate updates (e.g., forensic supplemental reports, revised transcription notes) often overwrite or obscure the original registered evidence, raising admissibility disputes.
- **Superficial "Integrity Badges":** Legacy systems display arbitrary "100% verified" claims without verifiable SHA-256 computation, signed commit lineage, or cryptographic Merkle tree inclusion proofs.

### 1.2 The EVIDENTIA Solution
EVIDENTIA is a zero-trust, tamper-evident digital evidence management platform engineered on a **Git-inspired versioning model** and **cryptographic attestation layers**:
1. **Immutable Registration (V1):** The original file is registered with an exact SHA-256 hash calculated over the unmodified bytes and protected by AES-256-GCM envelope encryption in private storage. V1 is permanently sealed and never overwritten.
2. **Parent-Linked Commit Chains:** Any authorized revision produces a separate version (V2, V3...) linked to its parent commit hash with mandatory commit messages, actor identity, and server-side cryptographic signatures.
3. **Step-Up Authentication & Dual-Factor Verification:** Passkeys / WebAuthn (FIDO2 / Windows Hello) require explicit biometric or hardware authentication before committing revisions or transferring custody, with approved OTP fallback.
4. **Deterministic Tamper Detection:** Submitted files are compared byte-for-byte against trusted hashes. Clear explainable outcomes (`INTEGRITY_VERIFIED`, `CONTENT_MISMATCH`, `SIGNATURE_INVALID`, `MERKLE_PROOF_INVALID`, `COMMIT_CHAIN_BROKEN`) ensure absolute scientific and judicial clarity.
5. **Merkle Checkpoint Verification:** Versions are grouped into deterministic Merkle batches with domain-separated SHA-256 trees (`0x00` leaf, `0x01` parent) and signed checkpoint roots for independent inclusion proofs.
6. **Auditable Custody Graph:** Interactive visual timeline displaying both content version commits and custody transfer milestones with full audit trails.

---

## 2. Target Personas & User Roles

EVIDENTIA enforces role-based access control (RBAC) backed by Supabase Auth and Row Level Security (RLS):

| Role | Key Persona | Responsibilities & Capabilities |
| :--- | :--- | :--- |
| **Admin** | Chief Evidence Officer / Court Clerk Administrator | Manages approved users and organizations; provisions role assignments; audits system security logs; manages data retention and key rotation policies. |
| **Police Officer** | Investigating Officer (IO) | Registers new criminal cases and initial evidence (V1); initiates evidence custody transfers to forensic labs; creates authorized version updates; inspects initial verification reports. |
| **Forensic Analyst** | Lab Scientist / Digital Examiner | Accesses assigned evidence; verifies incoming physical/digital file integrity; conducts analysis and submits forensic reports as authorized versions or auxiliary evidence; inspects document diffs. |
| **Public Prosecutor** | Assistant State Attorney / Court Prosecutor | Reviews case dockets and assigned evidence; inspects cryptographic Evidence Passports; verifies Merkle proofs, signatures, and custody chains; exports court-admissible reports. |

---

## 3. Scope & Key Product Modules

### 3.1 Public Editorial Landing Page
- Monochrome editorial aesthetic matching the LawSpeaks design philosophy.
- Visual hero highlighting the core mission: "Every Record. Every Handoff. Verifiable."
- Original 3D evidence dossier, cryptographic node motif, and fingerprint artwork.
- Interactive features: Problem vs. Solution breakdown, Cryptographic Trust Layers, Role-Based Workflows, Security Architecture summary, and Clear CTA.

### 3.2 Authentication & Role Management
- Supabase Auth (Email / Password + Session JWT).
- Role-based dashboard redirect (Admin, Police, Forensic Analyst, Prosecutor).
- Defense-in-depth authorization: server-side verification in Route Handlers + PostgreSQL RLS.
- No user self-promotion; strict organization and case assignment checks.

### 3.3 Case Management System
- Case registration with official case number, court jurisdiction, incident date, and status (`Active`, `Under Analysis`, `In Trial`, `Archived`).
- Assignment of verified investigators, forensic analysts, and prosecutors.
- Scoped case-level evidence dockets.

### 3.4 Evidence Registration & Envelope Encryption
- Private multi-format file upload (PDF, DOCX, TXT, PNG, JPG, MP4, Audio, Binary).
- Client-side and server-side exact byte SHA-256 computation.
- AES-256-GCM envelope encryption with unique nonce and server-managed key.
- Creation of immutable Version 1 (`V1`) record and initial signed commit.
- Storage in strictly private Supabase storage bucket (`private-evidence`).

### 3.5 Git-Inspired Version Control & Commit Engine
- Immutable V1 registration: originals are never overwritten.
- Authorized revisions require:
  - Parent commit hash reference (`parent_commit_hash`).
  - Mandatory commit message describing the alteration.
  - Optional investigative notes.
  - Authenticated actor ID and server timestamp.
  - Ed25519 system attestation signature.
- Canonical commit hash serialization:
  `SHA-256(canonical_json(evidence_id, version_num, file_hash, parent_hash, actor_id, timestamp, message, note))`

### 3.6 Step-Up Authentication & Audit Documentation
- WebAuthn / Passkeys (Windows Hello, Touch ID, YubiKey) for high-impact actions (creating new versions, transferring custody).
- Server-issued operation-bound challenges with 5-minute expiry.
- Policy-approved OTP fallback for legacy environments.
- Optional consent-based webcam capture for forensic handoff verification:
  - Explicit user opt-in and permission modal.
  - Preview, retake, and skip controls.
  - WebP compression and storage in `private-auth-captures`.
  - Never treated as biometric authentication or automatic capture.

### 3.7 Merkle Checkpoint Engine
- Batching of registered evidence versions into deterministic Merkle trees.
- Domain separation:
  - Leaf hash: `SHA-256(0x00 || canonical_leaf_data)`
  - Internal parent hash: `SHA-256(0x01 || left_hash || right_hash)`
- Merkle inclusion proof generation (sibling hashes and left/right directions).
- Checkpoint registry with Ed25519 signed roots.
- Explicit `CHECKPOINT_PENDING` status for unfinalized batches.

### 3.8 Tamper Detection & Document Diff Engine
- Verifier uploads or submits a candidate file against an existing Evidence ID and reference version.
- Exact SHA-256 byte comparison.
- Multi-tier cryptographic checks:
  1. Content hash comparison (`PASS` / `FAIL`).
  2. Commit signature verification (`PASS` / `FAIL`).
  3. Merkle inclusion proof verification (`PASS` / `FAIL`).
  4. Parent commit chain integrity (`PASS` / `FAIL`).
- Semantic Diff Engine:
  - Line-by-line and word diff for TXT and extractable documents.
  - DOCX paragraph diff.
  - Side-by-side and unified views with additions/removals highlighted.
  - Visual before/after comparison for images.
- Deterministic outcomes:
  `INTEGRITY_VERIFIED`, `CONTENT_MISMATCH`, `UNREGISTERED_VERSION`, `SIGNATURE_INVALID`, `MERKLE_PROOF_INVALID`, `COMMIT_CHAIN_BROKEN`, `VERIFICATION_INCOMPLETE`.

### 3.9 Interactive Custody Timeline & Evidence Passport
- Clickable Git-style graph combining version commits and custody handoffs.
- Node inspection drawer: commit details, diff against parent, Ed25519 signature, Merkle proof, actor and auth method.
- Evidence Passport: comprehensive tamper-evident certificate with QR token, verification summary, and printable exportable report.

---

## 4. Acceptance Criteria & Validation Matrix

| ID | Feature | Acceptance Criterion | Verification Method |
| :--- | :--- | :--- | :--- |
| **AC-01** | Immutable V1 | Original file uploaded creates V1; database prohibits UPDATE or DELETE on historical version row. | API & RLS test |
| **AC-02** | Authorized V2 Creation | Creating V2 creates a separate row with `parent_commit_hash == V1.commit_hash`; V1 bytes remain unaltered. | Version creation test |
| **AC-03** | Step-Up Auth Enforcement | Submitting new version without valid WebAuthn challenge verification or approved OTP returns HTTP 403. | Step-up auth test |
| **AC-04** | Exact SHA-256 Detection | Submitting identical bytes produces `INTEGRITY_VERIFIED`; modifying 1 single byte produces `CONTENT_MISMATCH`. | Binary alteration test |
| **AC-05** | Merkle Proof Verification | Valid inclusion proof resolves to signed root; tampering with sibling hash produces `MERKLE_PROOF_INVALID`. | Cryptographic test |
| **AC-06** | Ed25519 Attestation | Commits are signed with Ed25519; verification verifies against public key. | Signature check |
| **AC-07** | Private Storage | Direct unauthenticated HTTP access to evidence file storage returns HTTP 403; access only via signed URL. | Storage policy test |
| **AC-08** | Monochrome Design | All screens adhere to `#F9F9FA` background, `#111111` foreground, Manrope/Inter typography, responsive at 320px+. | Visual & responsive QA |

---

## 5. Non-Goals & Architectural Boundaries
- **No Public Blockchain:** Blockchains introduce legal privacy liabilities (GDPR/right-to-be-forgotten conflicts with criminal data) and gas costs. EVIDENTIA uses cryptographic Merkle checkpoints with Ed25519 attestation instead.
- **No Public Evidence Buckets:** Evidence is never stored in public buckets.
- **No Black-Box "AI" Integrity Scoring:** Tamper detection is strictly cryptographic and deterministic. No stochastic AI hallucination is permitted in judicial evidence verification.
- **No Automated Facial Recognition / Biometrics:** Webcam captures are purely timestamped visual audit receipts; they are never converted to biometric templates.
- **No Unexecuted Checks Marked as Passed:** Verifier reports only mark checks that actually ran with unambiguous statuses (`PASS`, `FAIL`, `NOT_RUN`, `UNAVAILABLE`, `PENDING`).
