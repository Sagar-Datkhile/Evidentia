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
- [x] Create `supabase/schema.sql` and versioned timestamped migrations (`20261010000001_evidentia_core_schema.sql`, `20261010000002_auth_and_profiles_enhancement.sql`, `evidentia_roles_user_admin.sql`).
- [x] Consolidate PostgreSQL `profiles` table to binary roles (`user`, `admin`), `CHECK (role IN ('user', 'admin'))`, defaulting to `'user'`.
- [x] Implement database trigger (`handle_new_user()`) strictly defaulting all email/password and Google OAuth signups to `'user'`, ignoring client metadata.
- [x] Enforce Row Level Security (RLS) policies and trigger-based role protection (`protect_profile_role()`) preventing self-elevation.
- [x] Enforce case access security via `can_access_case(p_case_id, p_user_id)` requiring admin or explicit `case_assignments` participation (no universal user access).
- [x] Implement protected Next.js Route Handler (`/api/admin/roles`) for admin-only user listing and promotion/demotion using service-role client with self-demotion prevention and audit logging.
- [x] Build typed Supabase client factory (`client.ts`, `server.ts`, `admin.ts`) using `@supabase/ssr`.
- [x] Implement Next.js `middleware.ts` for cookie session refresh and route protection.
- [x] Implement full authentication suite:
  - [x] `/auth/sign-in` (Email/Password, Google OAuth, show/hide password).
  - [x] `/auth/sign-up` (Full Name, Email, International phone format validation, password policy, default `'user'` role, Google OAuth).
  - [x] `/auth/forgot-password` (Email password reset).
  - [x] `/auth/callback` (OAuth session exchange & profile synchronization defaulting to `'user'`).
  - [x] `/profile` (Assigned Role: User/Admin display, read-only for normal users, admin role management console).
  - [x] Admin Case Management module (`/admin/cases`, `/admin/cases/[id]`, `/admin/users`) with Case creation, assignment, and Zero-Trust `can_access_case` integration.

### Phase 3: Evidence Registration & Version Commits
- [x] Build Evidence Registration screen (`/evidence/new`):
  - [x] Drag-and-drop file upload with format and size validation.
  - [x] Client & server exact SHA-256 computation over raw bytes.
  - [x] Client-Server digest mismatch rejection (HTTP 400).
  - [x] Metadata capture (title, case assignment, category, incident timestamp, chain notes).
  - [x] Private encrypted upload to storage (`private-evidence` with AES-256-GCM envelope).
  - [x] Atomic creation of immutable `V1` evidence and signed initial commit.
  - [x] Permanent persistence of 64-char lowercase hex SHA-256 in `evidence_versions.file_sha256`.
- [x] Build Authorized Versioning workflow (`/evidence/[id]/versions`):
  - [x] Select parent version (`V1`, `V2`, etc.).
  - [x] Candidate file upload.
  - [x] Mandatory commit message and optional notes.
  - [x] Atomic commit registration with `parent_commit_hash` link.

### Phase 4: Tamper Detection & Document Diff Engine
- [x] Build Tamper Detection verification pipeline (`/evidence/[id]/verify`):
  - [x] Verify stored ciphertext directly from private Supabase Storage (download, decrypt, recompute raw SHA-256).
  - [x] Upload candidate file to test against selected trusted version.
  - [x] Compute exact candidate SHA-256.
  - [x] Compare candidate hash with registered file SHA-256.
  - [x] Verify registered Ed25519 commit signature.
  - [x] Verify signed Merkle checkpoint and inclusion proof status (report pending truthfully).
  - [x] Verify parent commit chain backward to genesis.
  - [x] Return deterministic verdict (`INTEGRITY_VERIFIED`, `CONTENT_MISMATCH`, `VERIFICATION_INCOMPLETE`, etc.).
  - [x] Persist audit report to `verification_reports` and log event to `custody_events`.
- [x] Build Document Diff Engine (`/evidence/[id]/compare`):
  - [x] Text & extracted paragraph line/word diff.
  - [x] Side-by-side and unified mobile single-column modes.
  - [x] Additions (soft green) and deletions (soft red) highlighting.
  - [x] Visual before/after image inspector with slider/toggle.

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
