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

## 3. Evidence & Versioning Endpoints

### 3.1 `POST /api/evidence`
- **Description:** Register new evidence and create immutable Version 1 (`V1`).
- **Body (Multipart FormData or JSON):**
  ```json
  {
    "caseId": "CASE-2026-0042",
    "title": "Original First Information Report (FIR)",
    "category": "Document",
    "incidentDate": "2026-10-01T08:30:00Z",
    "fileSha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    "fileName": "FIR_Case_0042_Official.txt",
    "fileSizeBytes": 4096,
    "fileData": "<base64_or_signed_upload_key>",
    "commitMessage": "Initial official FIR registration from Station 14"
  }
  ```
- **Response 201:**
  ```json
  {
    "evidenceId": "EV-2026-0042-01",
    "version": {
      "versionNumber": 1,
      "commitHash": "a1b2c3d4...",
      "signature": "ed25519_sig...",
      "merkleStatus": "CHECKPOINT_PENDING"
    }
  }
  ```

### 3.2 `POST /api/evidence/:id/versions`
- **Description:** Create a new authorized evidence version (V2, V3...).
- **Body:**
  ```json
  {
    "parentVersionNumber": 1,
    "parentCommitHash": "a1b2c3d4...",
    "fileSha256": "8c4129...",
    "fileName": "FIR_Case_0042_Revised.txt",
    "commitMessage": "Added supplemental witness statements from Inspector Roy",
    "note": "Section 4(b) updated per judicial order",
    "stepUpProofToken": "vprf_991823a7"
  }
  ```

### 3.3 `POST /api/evidence/:id/verify`
- **Description:** Deterministic tamper detection against a candidate file.
- **Body:**
  ```json
  {
    "targetVersionNumber": 1,
    "candidateSha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    "candidateContent": "<optional_text_content_for_diff>"
  }
  ```
- **Response 200:**
  ```json
  {
    "verdict": "INTEGRITY_VERIFIED",
    "checks": {
      "sha256Comparison": "PASS",
      "commitSignature": "PASS",
      "merkleInclusionProof": "PASS",
      "commitChainIntegrity": "PASS"
    },
    "referenceHash": "4b2277...",
    "candidateHash": "4b2277...",
    "timestamp": "2026-10-10T03:26:00Z"
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
