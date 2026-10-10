# AGENTS.md — Operational Handbook for Coding Agents
**Project:** EVIDENTIA  
**Architecture:** Next.js App Router (TypeScript) + Supabase (PostgreSQL, Auth, Storage, RLS)  
**Strict Rule:** Read this document before proposing or applying code changes.  

---

## 1. Core Architecture & Operating Principles

1. **Integrated Next.js Architecture:**
   - Frontend and API routes live in Next.js App Router (`/src/app` and `/src/app/api`).
   - Server-side cryptographic operations, database queries, and storage operations are executed in Next.js Route Handlers and Server Actions.
   - No separate FastAPI server required. All backend orchestration is unified in Next.js with complete type safety.
   
2. **Monochrome Editorial Design System:**
   - Visual inspiration: LawSpeaks editorial monochrome aesthetic.
   - Primary background: `#F9F9FA`
   - Primary foreground: `#111111`
   - Surface: `#FFFFFF`
   - Secondary Surface: `#F1F1F3`
   - Border: `#E5E5E7`
   - Muted: `#6B6B73`
   - Typography: `Manrope` for headings, `Inter` for body, `monospace` for hashes and EV-IDs.
   - Never use saturated generic SaaS colors (no bright blues, greens, purples as primary branding).
   - Touch target minimum: 44px. Minimum supported viewport: 320px width.

3. **Supabase Zero-Trust Security Boundary:**
   - Keep `SUPABASE_SERVICE_ROLE_KEY` and signing private keys strictly server-side (never expose to client code or `NEXT_PUBLIC_` variables).
   - Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are allowed in client bundles.
   - All evidence storage is in private buckets: `private-evidence`, `private-auth-captures`, `private-reports`.
   - Never generate permanent public URLs for evidence objects; use short-lived authenticated signed URLs (max 5 minutes).

4. **Cryptographic Rigor:**
   - File SHA-256 is computed over the unmodified, original file bytes.
   - Commit hash is computed over canonical JSON serialization of the commit tuple:
     `{ evidenceId, versionNumber, fileSha256, parentCommitHash, actorId, timestamp, commitMessage, note }`
   - Merkle Tree employs explicit domain separation:
     - Leaf node: `SHA-256(0x00 || canonical_leaf_data)`
     - Parent node: `SHA-256(0x01 || left_hash || right_hash)`
   - Commit signature uses Ed25519 system attestation.
   - Never mark an unexecuted cryptographic check as passed. Statuses must be: `PASS`, `FAIL`, `NOT_RUN`, `UNAVAILABLE`, `PENDING`.

---

## 2. Standard Development Commands

```bash
# Install dependencies
npm install

# Run development server (port 3000)
npm run dev

# Run TypeScript typecheck
npx tsc --noEmit

# Run Next.js production build validation
npm run build

# Run unit and cryptographic tests
npm test
```

---

## 3. Directory Conventions

```
src/
├── app/
│   ├── layout.tsx                # Root layout with Manrope & Inter fonts, AuthProvider
│   ├── page.tsx                  # Public editorial landing page
│   ├── auth/
│   │   ├── sign-in/page.tsx      # Supabase email/password & Google OAuth sign-in
│   │   ├── sign-up/page.tsx      # User registration with international phone & default 'user' role
│   │   ├── forgot-password/page.tsx # Password recovery dispatch
│   │   ├── callback/route.ts     # OAuth session exchange & profile synchronization
│   │   └── login/page.tsx        # Legacy redirect to sign-in
│   ├── profile/page.tsx          # Authenticated user profile and admin role management console
│   ├── dashboard/page.tsx        # Role-aware dashboard hub
│   ├── cases/
│   │   ├── page.tsx              # Case management docket list
│   │   ├── new/page.tsx          # Create new case
│   │   └── [caseId]/page.tsx     # Case detail and assigned evidence
│   ├── evidence/
│   │   ├── page.tsx              # Evidence registry table & filters
│   │   ├── new/page.tsx          # Evidence registration form (V1 upload)
│   │   └── [evidenceId]/
│   │       ├── page.tsx          # Evidence overview & metadata
│   │       ├── timeline/page.tsx # Clickable Git-style commit & custody graph
│   │       ├── versions/page.tsx # Create version (V2+) with step-up auth
│   │       ├── compare/page.tsx  # Document & image diff viewer
│   │       ├── verify/page.tsx   # Tamper detection verification pipeline
│   │       └── passport/page.tsx # Cryptographic evidence passport & export
│   ├── custody/page.tsx          # Custody transfers & handoff acceptance
│   ├── reports/page.tsx          # Verification reports & audit logs
│   ├── admin/
│   │   ├── users/page.tsx        # Admin user & role management
│   │   └── audit/page.tsx        # Tamper-evident audit event log
│   └── api/
│       ├── admin/roles/route.ts  # Admin-only role management (GET list, POST promote/demote)
│       ├── auth/me/route.ts
│       ├── auth/step-up/...      # WebAuthn options, verify, OTP fallback
│       ├── cases/...             # Case CRUD & assignments
│       ├── evidence/...          # Registration, upload, versions, timeline
│       ├── merkle/...            # Batches, checkpoints, inclusion proof
│       └── custody/...           # Custody transfer workflows
├── components/
│   ├── ui/                       # Accessible UI components (buttons, dialogs, inputs)
│   ├── navigation/               # Sticky translucent navbar, mobile sheet nav, footer
│   ├── timeline/                 # Git-style version graph & custody timeline nodes
│   ├── diff/                     # Document & visual diff engine components
│   ├── verification/             # Multi-layer cryptographic verdict panels
│   └── passport/                 # Printable Evidence Passport card & report view
├── lib/
│   ├── crypto/
│   │   ├── sha256.ts             # Web Crypto streaming & buffer SHA-256
│   │   ├── commit.ts             # Canonical serialization & commit hashing
│   │   ├── ed25519.ts            # Key generation, signing, and attestation verification
│   │   ├── merkle.ts             # Domain-separated tree, batching, proofs, checkpoints
│   │   └── envelope.ts           # AES-256-GCM envelope encryption
│   ├── diff/
│   │   └── text-diff.ts          # Line/word diff algorithm & tokenizers
│   ├── supabase/
│   │   ├── client.ts             # Client-side Supabase browser client
│   │   ├── server.ts             # Server-side authenticated Supabase client (cookies)
│   │   ├── admin.ts              # Service-role privileged client (server-side only)
│   │   └── types.ts              # Database schema TypeScript types
│   ├── webauthn/                 # FIDO2 / WebAuthn challenge generation & verification
│   └── data/
│       └── store.ts              # Resilient fallback store for demo mode & integration
└── styles/
    └── globals.css               # Monochrome editorial design tokens & utilities
```

---

## 4. Current Status & Progress Tracking

- **Phase 0 (Repository Audit & Product Plan):** COMPLETE
- **Phase 1 (Design System & Navigation Shell):** COMPLETE (Editorial Navbar, Hero, Auth Buttons)
- **Phase 2 (Supabase Auth & Database Profiles):** COMPLETE (SSR Clients, Middleware, Triggers, RLS, Binary user/admin Roles, Protected Admin Promotion Handler)
- **Phase 3 (Evidence Registration & Version Commits):** In Progress
- **Phase 4 (Tamper Detection & Diff Engine):** Pending
- **Phase 5 (Passkeys & Step-Up Auth):** Pending
- **Phase 6 (Cryptographic Attestation & Merkle Engine):** Pending
- **Phase 7 (Timeline, Custody & Passport):** Pending
- **Phase 8 (Hardening, QA & Demo Walkthrough):** Pending

---

## 5. Coding Agent Rules of Engagement

1. **Preserve Working Code:** Always inspect files before modifying. Do not discard implemented functionality.
2. **No Mock Cryptography in Production Code:** Cryptographic hashes must be calculated using real Web Crypto / subtle APIs (`SHA-256`, `Ed25519`, `AES-256-GCM`).
3. **No Unhandled Errors in Routes:** All API routes must validate input with Zod, authenticate requests, and return standard JSON error structures (`{ error: string, code?: string }`).
4. **Never Rewrite Prior Architectural Decisions:** Log new decisions in `Decision.md`.
5. **Report Truthful Test Status:** Only report that a test passed if executed in terminal with code 0.
6. **Role Migration Guardrails:** Roles are strictly `'user'` and `'admin'`. Every new signup defaults to `'user'`, ignoring client metadata. All promotions/demotions must execute through the protected `/api/admin/roles` handler using the server-side service-role client. Non-administrators can never edit roles, and self-demotion is forbidden. Case access for users is strictly scoped via `can_access_case`.
