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
- [ ] Initialize Next.js 15+ App Router, Tailwind CSS, TypeScript strict mode, and Lucide React.
- [ ] Implement monochrome editorial design system tokens (`globals.css`).
- [ ] Build shared navigation components:
  - [ ] Translucent sticky header with role indicators.
  - [ ] Mobile responsive navigation drawer.
  - [ ] Accessible minimal footer.
- [ ] Build editorial landing page (`/`):
  - [ ] Hero section with headline and 3D evidence dossier visual motif.
  - [ ] Problem vs Solution comparative matrix.
  - [ ] Cryptographic Trust Layers breakdown.
  - [ ] Interactive role walkthroughs.
  - [ ] Security guarantees & CTA.
- [ ] Build role dashboard shells (`/dashboard`) for Police, Analyst, Prosecutor, and Admin.

### Phase 2: Supabase Security Foundation & Migrations
- [ ] Create `supabase/schema.sql` and versioned timestamped migrations under `supabase/migrations/`.
- [ ] Define PostgreSQL tables: `profiles`, `organizations`, `cases`, `case_assignments`, `evidence`, `evidence_versions`, `evidence_commits`, `custody_transfers`, `custody_events`, `audit_events`, `merkle_batches`, `merkle_leaves`, `merkle_checkpoints`, `webauthn_credentials`.
- [ ] Define Row Level Security (RLS) policies enforcing deny-by-default and case-assignment scoping.
- [ ] Implement private storage bucket rules (`private-evidence`, `private-auth-captures`, `private-reports`).
- [ ] Build typed Supabase client factory (`client.ts`, `server.ts`, `admin.ts`).

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
