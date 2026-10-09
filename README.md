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

### 3. Environment Variables & Supabase Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL (e.g., `https://xyzcompany.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Safe public anon key for client-side queries
- `SUPABASE_SERVICE_ROLE_KEY`: Privileged key used only server-side for backend administration

### 4. Database Schema & Migrations
Apply the PostgreSQL migrations in your Supabase SQL editor or via Supabase CLI:
1. `supabase/migrations/20261010000001_evidentia_core_schema.sql`: Core tables, historical immutability triggers, and RLS policies.
2. `supabase/migrations/20261010000002_auth_and_profiles_enhancement.sql`: Profiles `phone` column, `pending` default role, automatic profile trigger `handle_new_user()`, and role elevation protection trigger `protect_profile_role()`.

### 5. Google OAuth Setup (Optional)
To enable "Continue with Google" sign-in:
1. Create OAuth credentials in **Google Cloud Console** (OAuth 2.0 Client ID for Web application).
2. Set Authorized Redirect URI: `https://<your-project-id>.supabase.co/auth/v1/callback`.
3. In **Supabase Dashboard** -> **Authentication** -> **Providers** -> **Google**:
   - Enable Google provider.
   - Enter your Google Client ID and Client Secret.
4. In **Supabase Dashboard** -> **Authentication** -> **URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Additional Redirect URLs: `http://localhost:3000/auth/callback` (and your production domain).

### 6. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Authentication & Role Architecture
- **Unauthenticated State:** Landing page renders a clean "Sign In" button in the navbar. Protected routes redirect unauthenticated traffic to `/auth/sign-in`.
- **Registration Flow:** Users register at `/auth/sign-up` with Full Name, Email, Phone Number (international format validated), and Password.
- **Safe Default Role:** All new accounts receive the `pending` authorization status. Privileged roles (`police`, `forensic`, `prosecutor`, `admin`) are assigned exclusively by system administrators.
- **Elevation Protection:** PostgreSQL triggers prevent users from modifying or escalating their own role.
- **Session Management:** Built on `@supabase/ssr` using HTTP cookies, refresh token rotation, and Next.js middleware.

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
