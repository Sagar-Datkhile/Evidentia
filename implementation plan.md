# Implementation Plan & Progress Tracker (implementation plan.md)
**Project:** EVIDENTIA  
**Current Status:** Phase 0 Completed, Moving to Phase 1  

---

## Milestone Roadmap

### Phase 0: Repository Audit & Architectural Living Docs
- [x] Audit workspace, file structure, and clean repository status.
- [x] Author comprehensive living documentation:
  - [x] `PRD.md` (Product specifications & validation matrix)
  - [x] `agents.md` (Operational instructions for AI coding agents)
  - [x] `Design.md` (Tokens, IA, data flows, responsive rules)
  - [x] `Decision.md` (Append-only ADRs)
  - [x] `implementation plan.md` (Milestones, tasks, blockers)
  - [x] `SECURITY.md` (Threat model, cryptographic guarantees)
  - [x] `API.md` (Route contracts, payloads, and error codes)
  - [x] `README.md` (Setup instructions, walkthrough guide)
  - [x] `.env.example` (Environment variables)

### Phase 1: Next.js Bootstrap, Design System & Navigation Shell
- [x] Initialize Next.js 15+ App Router, Tailwind CSS, TypeScript strict mode, and Lucide React.
- [x] Implement monochrome editorial design system tokens (`globals.css`).
- [x] Build shared navigation components:
  - [x] Translucent sticky header with real Supabase Auth states (Sign In button when unauthenticated, profile dropdown when authenticated).
  - [x] Mobile responsive navigation drawer with role awareness.
  - [x] Accessible minimal footer.
- [x] Build editorial landing page (`/`):
  - [x] Hero section with headline ("Every Record. Every Handoff. Verifiable.") and 3D evidence dossier visual motif.
  - [x] Remove Test Tamper Detection button while keeping Explore Platform.
  - [x] Problem vs Solution comparative matrix.
  - [x] Cryptographic Trust Layers breakdown.
  - [x] Interactive role walkthroughs.
  - [x] Security guarantees & CTA.
- [x] Build role dashboard shells (`/dashboard`) for Police, Analyst, Prosecutor, Admin, and Pending.

### Phase 2: Supabase Security Foundation, Auth & Migrations
- [x] Create `supabase/schema.sql` and versioned timestamped migrations (`20261010000001_evidentia_core_schema.sql`, `20261010000002_auth_and_profiles_enhancement.sql`).
- [x] Define PostgreSQL `profiles` table with `phone`, `role` default `'pending'`, and trigger-based provisioning (`handle_new_user()`).
- [x] Enforce Row Level Security (RLS) policies and trigger-based role protection (`protect_profile_role()`) preventing self-elevation.
- [x] Build typed Supabase client factory (`client.ts`, `server.ts`, `admin.ts`) using `@supabase/ssr`.
- [x] Implement Next.js `middleware.ts` for cookie session refresh and route protection.
- [x] Implement full authentication suite:
  - [x] `/auth/sign-in` (Email/Password, Google OAuth, show/hide password).
  - [x] `/auth/sign-up` (Full Name, Email, International phone format validation, password policy, pending role notice, Google OAuth).
  - [x] `/auth/forgot-password` (Email password reset).
  - [x] `/auth/callback` (OAuth session exchange & profile synchronization).
  - [x] `/profile` (View role, update permitted contact info).

### Phase 3: Evidence Registration & Version Commits
- [ ] Build Evidence Registration screen (`/evidence/new`):
  - [ ] Drag-and-drop file upload with format and size validation.
  - [ ] Client & server exact SHA-256 computation over raw bytes.
  - [ ] Metadata capture (title, case assignment, category, incident timestamp, chain notes).
  - [ ] Private encrypted upload to storage.
  - [ ] Atomic creation of immutable `V1` evidence and signed initial commit.
- [ ] Build Authorized Versioning workflow (`/evidence/[id]/versions`):
  - [ ] Select parent version (`V1`, `V2`, etc.).
  - [ ] Candidate file upload.
  - [ ] Mandatory commit message and optional notes.
  - [ ] Binding to pending operation digest.
  - [ ] Atomic commit registration with `parent_commit_hash` link.

### Phase 4: Tamper Detection & Document Diff Engine
- [ ] Build Tamper Detection verification pipeline (`/evidence/[id]/verify`):
  - [ ] Upload candidate file to test against selected trusted version.
  - [ ] Compute exact candidate SHA-256.
  - [ ] Compare candidate hash with registered file SHA-256.
  - [ ] Verify registered Ed25519 commit signature.
  - [ ] Verify signed Merkle checkpoint and inclusion proof.
  - [ ] Verify parent commit chain backward to genesis.
  - [ ] Return deterministic verdict (`INTEGRITY_VERIFIED`, `CONTENT_MISMATCH`, etc.).
- [ ] Build Document Diff Engine (`/evidence/[id]/compare`):
  - [ ] Text & extracted paragraph line/word diff.
  - [ ] Side-by-side and unified mobile single-column modes.
  - [ ] Additions (soft green) and deletions (soft red) highlighting.
  - [ ] Visual before/after image inspector with slider/toggle.

### Phase 5: Passkeys & Step-Up Authentication
- [ ] Build WebAuthn credential registration and verification routines.
- [ ] Implement operation-bound challenges with 5-minute expiry.
- [ ] Implement policy-approved OTP fallback for legacy devices.
- [ ] Implement optional consent-based webcam capture modal for custody handoffs:
  - [ ] Clear user consent toggle and camera stream preview.
  - [ ] Capture, retake, and skip controls.
  - [ ] Client WebP compression and storage in `private-auth-captures`.

### Phase 6: Cryptographic Attestation & Merkle Engine
- [ ] Implement Ed25519 system attestation keypair management and signature verification.
- [ ] Implement domain-separated Merkle Tree (`0x00` leaf, `0x01` parent).
- [ ] Batch evidence versions into immutable Merkle batches.
- [ ] Generate signed Merkle checkpoints.
- [ ] Generate and verify sibling inclusion proofs.

### Phase 7: Timeline, Custody & Evidence Passport
- [ ] Build interactive Git-style commit graph (`/evidence/[id]/timeline`):
  - [ ] Version commit nodes and custody event nodes.
  - [ ] Clickable node drawer with diff, notes, signatures, and Merkle proof.
- [ ] Build Custody Transfer workflow (`/custody`):
  - [ ] Transfer initiation from Police to Forensic Analyst or Court.
  - [ ] Two-party signoff with step-up authentication.
- [ ] Build Evidence Passport (`/evidence/[id]/passport`):
  - [ ] Tamper-evident certificate with verification badges.
  - [ ] Printable HTML / PDF view with report SHA-256 digest.

### Phase 8: Hardening, Automated Tests & Demo Walkthrough
- [ ] Unit & integration tests for SHA-256, Merkle proofs, Ed25519, and diff.
- [ ] Responsive UI verification (320px, 375px, 768px, 1280px).
- [ ] Execute complete end-to-end demo script.
- [ ] Final documentation update.
