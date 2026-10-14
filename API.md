# API Specification (API.md) — EVIDENTIA
**Format:** RESTful JSON endpoints implemented in Next.js Route Handlers (`/src/app/api/...`)  
**Authorization:** Supabase Auth Bearer Tokens / Session Cookies + Case-level Access Control  

---

## 1. Authentication & Step-Up Endpoints

### 1.1 `GET /api/auth/me`
- **Description:** Retrieve current authenticated user session, assigned role, and organization.
- **Headers:** `Authorization: Bearer <jwt>` or session cookie
- **Response 200:**
  ```json
  {
    "user": {
      "id": "usr_98a72b",
      "email": "officer.sharma@police.gov.in",
      "fullName": "Insp. Rajesh Sharma",
      "role": "Police Officer",
      "organization": "Delhi Police Crime Branch",
      "badgeNumber": "DP-88219"
    }
  }
  ```

### 1.2 `POST /api/auth/step-up/start`
- **Description:** Issue a short-lived (5 min) operation-bound challenge for passkeys or OTP.
- **Body:**
  ```json
  {
    "operationType": "COMMIT_VERSION",
    "evidenceId": "EV-2026-8819",
    "targetHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
  ```
- **Response 200:**
  ```json
  {
    "challengeId": "ch_7a81b992",
    "challenge": "dGhpcy1pcy1hLXNlY3VyZS1jaGFsbGVuZ2U",
    "expiresAt": "2026-10-10T03:35:00.000Z",
    "supportedMethods": ["webauthn", "otp"]
  }
  ```

### 1.3 `POST /api/auth/step-up/verify`
- **Description:** Verify signed WebAuthn assertion or approved OTP code.
- **Body:**
  ```json
  {
    "challengeId": "ch_7a81b992",
    "authMethod": "webauthn",
    "credentialResponse": {
      "id": "cred_8819",
      "clientDataJSON": "...",
      "authenticatorData": "...",
      "signature": "..."
    }
  }
  ```
- **Response 200:**
  ```json
  {
    "verified": true,
    "proofToken": "vprf_991823a7"
  }
  ```

---

## 2. Cases Endpoints

### 2.1 `GET /api/cases`
- **Description:** List cases accessible to the authenticated role.
- **Response 200:**
  ```json
  {
    "cases": [
      {
        "id": "CASE-2026-0042",
        "title": "State vs. Cyber Syndicate Alpha",
        "jurisdiction": "High Court of Delhi",
        "status": "Active",
        "evidenceCount": 4,
        "createdAt": "2026-09-15T10:00:00Z"
      }
    ]
  }
  ```

### 2.2 `POST /api/cases`
- **Description:** Create a new case file (Authorized: Admin, Police Officer).
- **Body:**
  ```json
  {
    "caseNumber": "CASE-2026-0091",
    "title": "Industrial Espionage Breach Investigation",
    "jurisdiction": "Cyber Crime Division",
    "description": "Unauthorized exfiltration of forensic drive images."
  }
  ```

---

## 3. Evidence & Verification Endpoints

### 3.1 `POST /api/evidence/register`
- **Description:** Register new evidence, encrypt bytes via AES-256-GCM into `private-evidence`, and store canonical 64-char SHA-256 in `evidence_versions.file_sha256`. Validates client-side hash against server raw-byte recalculation.
- **Headers:** `Authorization: Bearer <jwt>` or session cookie
- **Body (Multipart FormData):**
  - `file`: Raw binary file buffer
  - `caseId`: e.g. `"CASE-2026-0105"`
  - `title`: e.g. `"Primary Scene Inspection Report"`
  - `category`: `"Document" | "Digital Image" | "Audio" | "Video" | "Forensic Dump" | "Other"`
  - `commitMessage`: e.g. `"Initial registration of scene documentation"`
  - `clientSha256` (optional): 64-char hex hash from browser preview (rejected with 400 if mismatched)
  - `note` (optional): Custody notes
- **Response 201:**
  ```json
  {
    "evidence": {
      "id": "CASE-2026-0105-05",
      "caseId": "CASE-2026-0105",
      "caseNumber": "CASE-2026-0105",
      "title": "Primary Scene Inspection Report",
      "category": "Document",
      "currentVersionNumber": 1,
      "storageBucket": "private-evidence",
      "originalFileName": "scene_report.pdf",
      "createdAt": "2026-10-10T06:09:40.000Z"
    },
    "version": {
      "id": "b3e0c7a1-...",
      "versionNumber": 1,
      "fileSha256": "b081790cec3a7732636628dcf57d5c866f8601c473ccf2bc6e100f2a0e40b48f",
      "storagePath": "evidence/CASE-2026-0105-05/v1/scene_report.pdf.enc"
    },
    "commit": {
      "id": "f8a91c2b-...",
      "commitHash": "e1f2a3...",
      "signature": "sig_ed25519_...",
      "merkleStatus": "PENDING"
    }
  }
  ```
- **Error 400:** Client-Server digest mismatch or missing required fields.
- **Error 401 / 403:** Unauthorized or user not assigned to case docket.

### 3.2 `GET /api/evidence/list`
- **Description:** Retrieve all registered evidence items accessible to the user with trusted SHA-256 and latest verification status.
- **Headers:** `Authorization: Bearer <jwt>` or session cookie
- **Response 200:**
  ```json
  {
    "evidence": [
      {
        "id": "CASE-2026-0105-04",
        "caseId": "CASE-2026-0105",
        "caseNumber": "CASE-2026-0105",
        "title": "DSA Checklist",
        "category": "Document",
        "currentVersionNumber": 1,
        "v1Sha256": "a3c4065ee2ea8d3a3ea725d9f7066e3325bd11f2d019757ade43ff98eedf97d6",
        "fileSha256": "a3c4065ee2ea8d3a3ea725d9f7066e3325bd11f2d019757ade43ff98eedf97d6",
        "verificationStatus": "HASH_MATCH"
      }
    ]
  }
  ```

### 3.3 `GET /api/evidence/:id`
- **Description:** Retrieve complete evidence record, version lineage, commits, custody events, and latest verification report.
- **Headers:** `Authorization: Bearer <jwt>` or session cookie
- **Response 200:**
  ```json
  {
    "evidence": {
      "id": "CASE-2026-0105-04",
      "v1Sha256": "a3c4065ee2ea8d3a3ea725d9f7066e3325bd11f2d019757ade43ff98eedf97d6",
      "fileSha256": "a3c4065ee2ea8d3a3ea725d9f7066e3325bd11f2d019757ade43ff98eedf97d6",
      "verificationStatus": "HASH_MATCH"
    },
    "versions": [...],
    "commits": [...],
    "custodyEvents": [...],
    "verificationReports": [...],
    "latestReport": {
      "verdict": "VERIFICATION_INCOMPLETE",
      "check_hash": "PASS"
    }
  }
  ```

### 3.4 `POST /api/evidence/:id/verify`
- **Description:** Authenticated verification engine. Decrypts stored ciphertext from private Supabase Storage, calculates raw-byte SHA-256, verifies Ed25519 commit signatures, checks Merkle batches, checks parent lineage, and persists findings to `verification_reports`.
- **Headers:** `Authorization: Bearer <jwt>` or session cookie
- **Body Options (JSON):**
  - `{ "verifyStoredFile": true }` (Default: Decrypts and verifies stored ciphertext bytes)
  - `{ "candidateSha256": "<64_char_hex>" }` (Compares candidate hash against trusted reference)
  - `{ "targetVersionNumber": 1, "candidateContent": "<optional_text_diff>" }`
- **Response 200 (Success / Match):**
  ```json
  {
    "verdict": "INTEGRITY_VERIFIED",
    "status": "VERIFIED",
    "uiLabel": "Verified",
    "checks": {
      "rawByteHashMatch": "PASS",
      "commitSignature": "PASS",
      "merkleInclusionProof": "PASS",
      "parentCommitChain": "PASS"
    },
    "referenceSha256": "a3c4065ee2ea8d3a3ea725d9f7066e3325bd11f2d019757ade43ff98eedf97d6",
    "candidateSha256": "a3c4065ee2ea8d3a3ea725d9f7066e3325bd11f2d019757ade43ff98eedf97d6",
    "verifiedAt": "2026-10-10T06:09:40.000Z",
    "verifiedBy": "Steve Rogers"
  }
  ```
- **Response 200 (Hash Match, Pending Merkle Batch):**
  ```json
  {
    "verdict": "VERIFICATION_INCOMPLETE",
    "status": "HASH_MATCH",
    "uiLabel": "Hash Match",
    "checks": {
      "rawByteHashMatch": "PASS",
      "commitSignature": "PASS",
      "merkleInclusionProof": "PENDING",
      "parentCommitChain": "PASS"
    }
  }
  ```
- **Response 200 (Tampered / Altered Content):**
  ```json
  {
    "verdict": "CONTENT_MISMATCH",
    "status": "MISMATCH",
    "uiLabel": "Mismatch Detected",
    "checks": {
      "rawByteHashMatch": "FAIL",
      "commitSignature": "PASS",
      "merkleInclusionProof": "PENDING",
      "parentCommitChain": "PASS"
    }
  }
  ```

---

## 4. Custody Endpoints

### 4.1 `POST /api/evidence/:id/transfers`
- **Description:** Initiate an evidence custody transfer.
- **Body:**
  ```json
  {
    "transferToUserId": "usr_forensic_01",
    "transferToOrg": "Central Forensic Science Laboratory",
    "transferType": "FORENSIC_EXAMINATION",
    "notes": "Transfer for digital signature extraction and mobile forensics",
    "stepUpProofToken": "vprf_991823a7",
    "captureStoragePath": "captures/cap_88192.webp"
  }
  ```

### 4.2 `POST /api/transfers/:id/accept`
- **Description:** Accept and confirm receipt of custody.
- **Body:**
  ```json
  {
    "stepUpProofToken": "vprf_accept_1102",
    "acknowledgmentNote": "Received intact with intact physical seal and matching V1 hash"
  }
  ```
