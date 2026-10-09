# EVIDENTIA — Zero-Trust, Tamper-Evident Digital Evidence Management
*Every Record. Every Handoff. Verifiable.*

---

## Overview
**EVIDENTIA** is a zero-trust digital evidence management platform engineered for judicial and forensic integrity. Inspired by Git's content-addressable commit model and modern cryptographic zero-trust architectures, EVIDENTIA ensures that legal records, autopsy reports, forensic extractions, and First Information Reports (FIRs) can be registered, versioned, transferred, and audited without ever overwriting or losing the immutable original.

---

## Core Pillars
1. **Immutable Registration (V1):** Uploaded evidence is hashed (`SHA-256`) byte-for-byte at the exact moment of registration and stored in encrypted private storage. V1 is permanently sealed.
2. **Git-Inspired Commit Chains:** Authorized revisions generate new, parent-linked versions (V2, V3...) with mandatory commit messages, actor signatures, and server-side attestation.
3. **Deterministic Tamper Detection:** Submitted files are compared against registered versions with explicit, unassailable verdicts (`INTEGRITY_VERIFIED`, `CONTENT_MISMATCH`, `SIGNATURE_INVALID`, `MERKLE_PROOF_INVALID`).
4. **Domain-Separated Merkle Checkpoints:** Evidence batches generate RFC 6962 compliant Merkle trees (`0x00` leaf, `0x01` parent) with Ed25519-signed checkpoint roots and sibling inclusion proofs.
5. **Step-Up Authentication & Custody:** High-impact operations (version commits, custody handoffs) require FIDO2 / WebAuthn passkey verification (Windows Hello, Touch ID) with policy-governed OTP fallback and optional consent-based custody photos.
6. **Monochrome Editorial Visual System:** A refined, distraction-free aesthetic (`#F9F9FA`, `#111111`, `Manrope`, `Inter`) designed for courtroom credibility and judicial review.

---

## Tech Stack
- **Framework:** Next.js 15+ App Router, React 19, TypeScript (Strict Mode)
- **Styling:** Tailwind CSS, Lucide React, Framer Motion
- **Cryptography:** Web Crypto API (`SHA-256`, `Ed25519`, `AES-256-GCM`), Domain-Separated Merkle Trees
- **Authentication & Data:** Supabase (PostgreSQL, Row Level Security, Auth, Private Storage)
- **Validation:** Zod schemas for all API payloads and forms

---

## Quickstart Guide

### 1. Prerequisites
- Node.js 18.18+ (Node 24 recommended)
- npm 10+

### 2. Installation
```bash
git clone https://github.com/Pranav9949/Evidentia.git
cd Evidentia
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project credentials (URL, anon key, service-role key).

### 4. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Walkthrough Script
1. **Explore Landing:** Open the landing page, review the trust architecture, and select **Sign In / Demo Portal**.
2. **Role Dashboard:** Switch between **Police Officer**, **Forensic Analyst**, **Public Prosecutor**, and **Admin** to observe tailored dockets.
3. **Register Evidence (V1):** Upload an official FIR document as a Police Officer; review the computed SHA-256 hash and signed commit.
4. **Tamper Detection (Exact Match):** Submit the identical file to `/evidence/[id]/verify`; verify all 4 green checkmarks (`PASS`).
5. **Tamper Detection (Tampered File):** Submit a file with 1 byte modified; observe immediate `CONTENT_MISMATCH` with line-by-line diff.
6. **Authorized Versioning (V2):** Create a new version with an official amendment, complete step-up authentication, and view the parent-linked commit in the interactive timeline.
7. **Custody Transfer:** Initiate a custody transfer to the Forensic Lab with optional consent-based photo capture; accept custody as an Analyst.
8. **Prosecutor Passport:** View and export the cryptographic Evidence Passport with Merkle inclusion proof and Ed25519 root signature.

---

## License
MIT License. Copyright (c) 2026 EVIDENTIA Contributors.
