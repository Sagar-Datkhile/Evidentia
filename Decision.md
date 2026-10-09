# Architectural Decision Log (Decision.md) — EVIDENTIA
**Format:** Append-only architectural decisions (ADRs) explaining context, choices, and consequences.  

---

## ADR-001: Next.js App Router Unified Architecture Without External Python Daemon
- **Date:** 2026-10-10
- **Status:** Accepted
- **Context:** Previous conceptual explorations included a separate FastAPI backend alongside a Next.js frontend. However, managing two decoupled servers creates deployment fragility, JWT double-validation overhead, CORS complexities, and duplicate route contracts.
- **Decision:** Build EVIDENTIA as a unified Next.js 15+ App Router application using TypeScript strict mode. Cryptographic operations (SHA-256, Ed25519 signatures, Merkle tree batching, AES-256-GCM envelope encryption) execute using native Node.js / Web Crypto APIs inside authenticated Route Handlers and Server Actions.
- **Consequences:** Eliminates external server dependency, streamlines deployment to a single Vercel or Node instance, improves cold-start latency, and ensures end-to-end TypeScript type safety across frontend and API contracts.

---

## ADR-002: LawSpeaks Monochrome Editorial Visual Language
- **Date:** 2026-10-10
- **Status:** Accepted
- **Context:** Digital evidence management platforms often resemble generic SaaS dashboards with noisy gradients, blue accents, or justice-scale clichés that undermine forensic credibility.
- **Decision:** Adopt an editorial monochrome design system inspired by high-end legal publications (`#F9F9FA` canvas, `#111111` solid foreground, `#E5E5E7` hairline borders, `Manrope` headings, `Inter` body, and monospace identifiers).
- **Consequences:** Creates an authoritative, calm, and institutional visual presence suitable for judges, prosecutors, and forensic scientists while exceeding modern web accessibility standards.

---

## ADR-003: Domain Separation in Merkle Tree Hashing (`0x00` / `0x01`)
- **Date:** 2026-10-10
- **Status:** Accepted
- **Context:** Standard Merkle trees that hash node concatenations without prefixes are vulnerable to second-preimage attacks where an internal node can be substituted for a leaf node.
- **Decision:** Enforce RFC 6962 compliant domain separation:
  - Leaf hash: `SHA-256(0x00 || canonical_leaf_bytes)`
  - Internal parent hash: `SHA-256(0x01 || left_child_hash || right_child_hash)`
- **Consequences:** Cryptographic proofs are mathematically sound, immune to length extension and preimage confusion attacks, meeting rigorous forensic standards.

---

## ADR-004: Defense-in-Depth Step-Up Authentication (WebAuthn / Passkeys + Fallback)
- **Date:** 2026-10-10
- **Status:** Accepted
- **Context:** Standard session cookies are vulnerable to workstation shoulder-surfing in busy police precincts or forensic labs. High-impact operations (committing a modified evidence version or transferring physical/digital custody) require re-authentication.
- **Decision:** Implement FIDO2 / WebAuthn passkey step-up authentication with short-lived, operation-bound challenges. For environments where hardware authenticators or biometric sensors are temporarily unavailable, allow an admin-controlled time-based OTP fallback.
- **Consequences:** Sensitive actions cannot be performed without explicit physical or credential confirmation, generating an immutable audit trail bound to the specific commit.

---

## ADR-005: Dual-Path Persistence Architecture (Real Supabase + Resilient Demo State)
- **Date:** 2026-10-10
- **Status:** Accepted
- **Context:** The application must integrate with real Supabase services (PostgreSQL, Auth, Storage, RLS) while remaining immediately demo-ready and testable without hard dependency on unconfigured remote credentials during local evaluation.
- **Decision:** Provide complete Supabase SQL migrations, RLS policies, and server/client bindings, accompanied by a resilient server-side state engine that seamlessly operates with Supabase credentials or bootstraps demo cases, realistic evidence files, and verified commits when credentials are being provisioned.
- **Consequences:** Ensures zero blockers for evaluators, immediate interactive demo walkthroughs, and clean cutover to hosted Supabase projects.
