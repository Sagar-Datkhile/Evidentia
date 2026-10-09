# Security Architecture & Threat Model (SECURITY.md) — EVIDENTIA
**Classification:** Zero-Trust Digital Evidence Management Security Specification  

---

## 1. Threat Model & Mitigations

| Threat Category | Potential Attack Vector | EVIDENTIA Architectural Mitigation |
| :--- | :--- | :--- |
| **Unauthorized File Tampering** | Insider with server or storage access modifies evidence file bytes. | Exact raw-byte SHA-256 computed at registration. Any modification produces an immediate `CONTENT_MISMATCH` verdict. Files stored encrypted with AES-256-GCM. |
| **Historical Revision Destruction** | Bad actor attempts to overwrite or delete earlier evidence versions (e.g. V1 FIR). | PostgreSQL RLS and trigger rules strictly prohibit `UPDATE` or `DELETE` on `evidence_versions` and `evidence_commits`. Historical records are append-only. |
| **Commit Spoofing** | Attacker injects a fake commit claiming to be from an authorized investigator. | Commits require valid parent commit hash lineage, signed with server Ed25519 attestation, and guarded by operation-bound WebAuthn/passkey step-up authentication. |
| **Merkle Tree Preimage Collision** | Malicious party crafts an internal node hash that matches a leaf hash. | RFC 6962 domain separation enforced: leaves are prefixed with `0x00`, parent internal nodes with `0x01`. |
| **Session Hijacking / Precinct Shoulder Surfing** | Unauthorized person uses an open browser session to approve a transfer or version. | Step-up re-authentication required: WebAuthn challenge bound to the specific operation digest expires in 5 minutes; cannot be reused or replayed. |
| **Storage Bucket Data Leakage** | Direct public HTTP URL enumeration of raw evidence files. | All buckets are strictly private (`private-evidence`, `private-auth-captures`). Reads require authenticated server-issued short-lived signed URLs (max 300s). |
| **Biometric Privacy Violation** | Storage of raw fingerprints or facial biometric vectors. | No raw biometrics stored. WebAuthn operates via public-key cryptography on the user's authenticator. Optional custody photos are compressed audit images with consent, never converted to biometric templates. |

---

## 2. Cryptographic Specifications

### 2.1 File Content Integrity
- Calculated using standard `SHA-256` over the unmodified, original file bytes before encryption.
- Expressed as a 64-character lowercase hexadecimal string.
- Separate ciphertext hash (`ciphertext_sha256`) is stored alongside the envelope encryption metadata to verify storage integrity prior to decryption.

### 2.2 Canonical Commit Hashing
To prevent JSON key ordering ambiguity or whitespace manipulation, commits are serialized canonically:
```typescript
const canonicalPayload = JSON.stringify({
  actorId: commit.actorId,
  commitMessage: commit.commitMessage.trim(),
  evidenceId: commit.evidenceId,
  fileSha256: commit.fileSha256,
  note: (commit.note || "").trim(),
  parentCommitHash: commit.parentCommitHash,
  timestamp: commit.serverTimestamp,
  versionNumber: commit.versionNumber
}, Object.keys).replace(/\s+/g, " ");

const commitHash = sha256(canonicalPayload);
```

### 2.3 Ed25519 Attestation Signing
- The EVIDENTIA trust authority maintains an Ed25519 keypair.
- When a commit is finalized, the system signs `commitHash` using the private key.
- Verification checks the signature against the registered public key in `signing_key_metadata`.

### 2.4 Merkle Tree Construction & Verification
- Leaves: For each version $i$ in batch:
  $$\text{Leaf}_i = \text{SHA-256}(0x00 \parallel \text{canonical}(\text{evidenceId}, \text{versionId}, \text{fileSha256}, \text{commitHash}))$$
- Internal Nodes: For children $L$ and $R$:
  $$\text{Parent} = \text{SHA-256}(0x01 \parallel L \parallel R)$$
- Checkpoint Root: The root of the completed tree is signed with Ed25519 and sealed with a timestamp and leaf count.

---

## 3. Storage & Secret Management
- **Secrets Location:** Server-side environment variables only (`SUPABASE_SERVICE_ROLE_KEY`, `EVIDENTIA_SIGNING_PRIVATE_KEY`, `EVIDENTIA_MASTER_KEY`).
- **Never In Client Code:** Client bundles must never contain service-role keys or signing secrets.
- **Audit Logging:** Every verification check, version creation, custody transfer, and authentication attempt generates an immutable row in `audit_events`.
