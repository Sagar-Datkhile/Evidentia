# 🛡️ EVIDENTIA – Zero-Trust, Tamper-Evident Digital Evidence Management System

<p align="center">
  <img src="SCREENSHOTS/Screenshot 2026-10-10 090831.png" width="100%" alt="Evidentia Banner">
</p>

<p align="center">
<b>Zero-Trust Architecture • Content-Addressable Cryptography • Chain of Custody • Judicial Auditability</b>
</p>

---

# 🎥 Demo Video

<p align="center">
  <img src="Judicory.gif" width="80%" alt="Evidentia Demo Workflow">
</p>
<p align="center"><i>Interactive evidence sealing, chain-of-custody transfer, and tamper-detection walkthrough.</i></p>

---

# 📸 UI Preview

<table>
  <tr>
    <td align="center">
      <strong>Evidence Vault & Dashboard</strong><br>
      <img src="SCREENSHOTS/Screenshot 2026-10-10 090831.png" width="400" alt="Evidence Vault">
    </td>
    <td align="center">
      <strong>Immutable Evidence Registration (V1)</strong><br>
      <img src="SCREENSHOTS/Screenshot 2026-10-10 090845.png" width="400" alt="Registration">
    </td>
  </tr>

  <tr>
    <td align="center">
      <strong>Cryptographic Tamper Detection</strong><br>
      <img src="SCREENSHOTS/Screenshot 2026-10-10 090908.png" width="400" alt="Tamper Verification">
    </td>
    <td align="center">
      <strong>Git-Inspired Commit Timeline</strong><br>
      <img src="SCREENSHOTS/Screenshot 2026-10-10 090919.png" width="400" alt="Timeline">
    </td>
  </tr>

  <tr>
    <td align="center">
      <strong>Chain of Custody & Step-Up Auth</strong><br>
      <img src="SCREENSHOTS/Screenshot 2026-10-10 090949.png" width="400" alt="Custody Transfer">
    </td>
    <td align="center">
      <strong>Prosecutor Evidence Passport</strong><br>
      <img src="SCREENSHOTS/Screenshot 2026-10-10 091012.png" width="400" alt="Passport Audit">
    </td>
  </tr>

  <tr>
    <td align="center" colspan="2">
      <strong>Admin Console & Role-Based Case Assignments</strong><br>
      <img src="SCREENSHOTS/Screenshot 2026-10-10 091107.png" width="450" alt="Admin Console">
    </td>
  </tr>
</table>

---

---

![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-emerald?style=flat-square&logo=supabase)
![Cryptography](https://img.shields.io/badge/Cryptography-SHA--256%20%7C%20Ed25519-purple?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

# 📖 Overview

**EVIDENTIA** is an enterprise-grade, zero-trust digital evidence management platform engineered for judicial and forensic integrity. Inspired by Git's content-addressable commit architecture and modern zero-trust security standards, EVIDENTIA ensures that digital legal records, autopsy reports, forensic extractions, and First Information Reports (FIRs) can be registered, versioned, transferred, and audited without ever overwriting or compromising the immutable original evidence.

Unlike traditional cloud drives or document repositories where files can be silently modified or overwritten, EVIDENTIA generates unalterable SHA-256 cryptographic digests, RFC 6962 Merkle tree checkpoints, and Ed25519 server signatures at the exact moment of registration.

---

# 🎯 Problem Statement

Modern law enforcement agencies and judicial systems face critical challenges in maintaining digital evidence integrity:

* **Risk of Evidence Tampering:** Digital files (photos, PDFs, logs) can easily be altered, corrupted, or replaced without leaving an obvious trace.
* **Broken Chain of Custody:** Paper logs and informal transfers fail to cryptographically verify who possessed evidence at any given time.
* **Overwritten Versions:** Revisions or amendments often overwrite original records, making court presentation vulnerable to suppression motions.
* **Lack of Independent Judicial Auditability:** Judges, prosecutors, and defense attorneys lack simple, mathematical mechanisms to verify evidence validity without trusting third-party intermediaries.

EVIDENTIA solves these problems by creating a mathematically verifiable, audit-ready cryptographic ledger for every piece of digital evidence.

---

# ✨ Key Features

## 🔒 Immutable Evidence Registration (V1)
Files are hashed (`SHA-256`) client-side and server-validated before permanent storage in private buckets. Version 1 is permanently sealed and serves as the unalterable source of truth.

---

## 🌳 Git-Inspired Commit Chains & Versioning
Authorized revisions create new, parent-linked versions (V2, V3...) containing parent hashes, commit messages, actor signatures, and server-side attestations without modifying previous versions.

---

## 🔍 Deterministic Tamper Detection
Uploaded or presented files are evaluated against registered cryptographic manifests, outputting explicit verdicts:
* `INTEGRITY_VERIFIED`
* `CONTENT_MISMATCH`
* `SIGNATURE_INVALID`
* `MERKLE_PROOF_INVALID`

---

## 🤝 Cryptographic Chain of Custody & Handoffs
Transfers between Police Officers, Forensic Analysts, and Prosecutors require explicit handoff workflows, step-up biometric/passkey verification, and optional consent-based photographic records.

---

## 🔑 Step-Up Passkey Authentication
High-impact operations (custody handoffs, version commits) trigger FIDO2 / WebAuthn passkey prompts (Windows Hello, Touch ID) backed by policy-governed fallback mechanisms.

---

## 🛂 Prosecutor Evidence Passport & Merkle Audit
Generates a court-ready Evidence Passport containing complete hash lineage, Ed25519 signatures, sibling Merkle inclusion proofs, and one-click PDF audit exports.

---

## 🛡️ Strict Case-Level Access Control (RLS)
Built on a minimal global role system (`user` vs `admin`) with fine-grained PostgreSQL Row Level Security (`can_access_case`), restricting docket visibility strictly to assigned investigators.

---

# 🏗️ System Architecture

```text
Evidence Input / File Upload
              │
              ▼
  Client-Side Cryptographic Hash (SHA-256)
              │
              ▼
  Metadata & Parent Version Binding (V1 ➔ V2)
              │
              ▼
  RFC 6962 Domain Merkle Tree Checkpoint
              │
              ▼
  Ed25519 Server Attestation Signature
              │
              ▼
  Supabase Private Storage + PostgreSQL (RLS)
              │
              ▼
  Judicial Audit & Evidence Passport Generation
```

---

# 🔍 Cryptographic Pipeline

The project implements a zero-trust cryptographic workflow:

1. **Client Sealing:** The user selects a digital evidence file. The browser computes a byte-for-byte SHA-256 hash using the native Web Crypto API.
2. **Version Linking:** If submitting a revision, the new hash is cryptographically bound to the parent version hash (`parent_hash`).
3. **Merkle Batching:** Evidence batches construct an RFC 6962 compliant Merkle Tree using domain separation prefixes (`0x00` for leaf nodes, `0x01` for interior parent nodes).
4. **Attestation Signing:** The backend validates payload integrity and signs the Merkle root using an Ed25519 private key.
5. **Deterministic Verification:** Submitted files generate live hashes compared against stored state to produce exact diffs or full integrity passes.

---

# 🛠️ Tech Stack

### Frontend & Application Framework
* **Framework:** Next.js 15+ (App Router)
* **Language:** TypeScript (Strict Mode)
* **Styling:** Tailwind CSS, Lucide React Icons, Framer Motion

### Backend & Infrastructure
* **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Auth)
* **Storage:** Supabase Private Encrypted Buckets
* **API Architecture:** Next.js Route Handlers with Zod Validation

### Cryptography & Security Engine
* **Hashing:** SHA-256 via Web Crypto API
* **Tree Structure:** RFC 6962 Domain-Separated Merkle Trees
* **Signatures:** Ed25519 Digital Signatures
* **Authentication:** FIDO2 / WebAuthn Passkeys, Google OAuth 2.0, HTTP-only Cookies

---

# 📂 Project Structure

```text
Evidentia/
│
├── SCREENSHOTS/                  # UI Preview & Documentation Media
│   ├── Screenshot 2026-10-10 090831.png
│   ├── Screenshot 2026-10-10 090845.png
│   ├── Screenshot 2026-10-10 090908.png
│   ├── Screenshot 2026-10-10 090919.png
│   ├── Screenshot 2026-10-10 090949.png
│   ├── Screenshot 2026-10-10 091012.png
│   └── Screenshot 2026-10-10 091107.png
│
├── Judicory.gif                  # Demo Video / Walkthrough GIF
├── EVIDENTA VIDEO REDME.mp4      # Demo Walkthrough Video File
│
├── src/
│   ├── app/
│   │   ├── admin/                # Admin Console & Access Control
│   │   ├── api/                  # API Endpoints (Auth, Evidence, Verification)
│   │   ├── auth/                 # Sign In, Sign Up, Callback Routes
│   │   ├── evidence/             # Evidence Vault, Registration, Verification
│   │   ├── profile/              # User Profile & Security Settings
│   │   ├── reports/              # Judicial Reports & Audit Exports
│   │   └── page.tsx              # Landing Page
│   │
│   ├── components/
│   │   ├── layout/               # Navbar, Footer, Container Layouts
│   │   ├── ui/                   # Reusable UI Controls (Badges, Buttons, Cards)
│   │   └── verify/               # Interactive Verification Components
│   │
│   └── lib/
│       ├── crypto/               # Core Cryptographic & Merkle Engine
│       └── supabase/             # Server/Client Database Helpers
│
├── supabase/
│   └── migrations/               # PostgreSQL Schema, Triggers, & RLS Policies
│
├── package.json
├── README.md
└── tsconfig.json
```

---

# 🔒 Security Measures

EVIDENTIA enforces robust security practices across all layers:

* **PostgreSQL Row Level Security (RLS):** Strict table-level policies guarantee users only view dockets they are explicitly assigned to.
* **Role Elevation Defense:** PostgreSQL triggers block users from modifying their own role (`user` vs `admin`).
* **Content-Addressable Verification:** Every record relies on hash integrity rather than file path trust.
* **Step-Up Biometric Authentication:** Critical actions require passkey re-authentication.
* **Strict Zod Input Validation:** All client requests undergo schema sanitization before processing.

---

# 🚀 Quickstart & Setup

### 1. Installation
```bash
git clone https://github.com/Pranav9949/Evidentia.git
cd Evidentia
npm install
```

### 2. Environment Configuration
Create a `.env.local` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Database Migration
Run the SQL scripts in `supabase/migrations/` in your Supabase SQL Editor to apply core schemas, functions, and RLS rules.

### 4. Run Local Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to launch Evidentia.

---

# 🚀 Future Improvements

* **Decentralized Blockchain Anchor:** Optional ledger anchoring (Polygon / Ethereum) for cross-jurisdictional legal notarization.
* **Automated Forensic Anomaly Detection:** Machine-learning powered file header and metadata anomaly scanning.
* **Hardware Security Enclave Signing:** Native mobile integration for hardware-isolated key storage.
* **Offline Field Capture:** Offline-first progressive web app (PWA) capability for scene-of-crime evidence recording.

---

# 👨‍💻 Author

**Evidentia Engineering Team**

Interested in:
* Cryptography & Digital Forensics
* Zero-Trust System Architecture
* Next.js & Full-Stack Security
* Cloud Native Database Security & RLS

---

# 📄 License & Disclaimer

EVIDENTIA is licensed under the **MIT License**.

*Disclaimer: EVIDENTIA is designed to assist law enforcement, legal professionals, and forensic analysts in maintaining evidence integrity. System deployment in actual judicial proceedings should be validated against local jurisdictional statutory evidence acts.*
