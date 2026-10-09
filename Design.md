# Design System & Technical Specification — EVIDENTIA
**Tagline:** *Every Record. Every Handoff. Verifiable.*  
**Design Reference:** LawSpeaks Monochrome Editorial Aesthetic  

---

## 1. Visual Design System

### 1.1 Color Palette & Token Definitions
The visual system prioritizes seriousness, institutional credibility, clarity, and zero-distraction editorial typography:

| Token Name | Hex Code | HSL / CSS Variable | Usage |
| :--- | :--- | :--- | :--- |
| `--background` | `#F9F9FA` | `hsl(240, 7%, 98%)` | Application root canvas background |
| `--foreground` | `#111111` | `hsl(0, 0%, 7%)` | Primary high-contrast text and solid fills |
| `--surface` | `#FFFFFF` | `hsl(0, 0%, 100%)` | Cards, elevated dialogs, inspector panels |
| `--secondary-surface` | `#F1F1F3` | `hsl(240, 5%, 95%)` | Input fields, table header bars, chips, badges |
| `--border` | `#E5E5E7` | `hsl(240, 3%, 90%)` | Subtle structural dividers and component borders |
| `--border-subtle` | `#EEEEF0` | `hsl(240, 5%, 94%)` | Secondary grid lines and faint item borders |
| `--muted` | `#6B6B73` | `hsl(240, 3%, 43%)` | Secondary labels, descriptions, timestamps |
| `--primary` | `#111111` | `hsl(0, 0%, 7%)` | Primary call-to-action buttons |
| `--primary-foreground`| `#FFFFFF` | `hsl(0, 0%, 100%)` | Primary button text |
| `--status-pass` | `#16A34A` | `hsl(142, 71%, 36%)` | Integrity PASS indicator (sparingly used) |
| `--status-fail` | `#DC2626` | `hsl(0, 84%, 60%)` | Tampering / MISMATCH indicator (sparingly used) |
| `--status-pending` | `#D97706` | `hsl(38, 92%, 50%)` | Pending checkpoint / step-up auth indicator |

### 1.2 Typography
- **Headings & Display:** `Manrope`, sans-serif. Weighted 500, 600, 700. Clean, geometric, modern authority.
- **Body & Controls:** `Inter`, sans-serif. Weighted 400, 500, 600. Optimized legibility across desktop and mobile.
- **Hashes, Keys & Identifiers:** `JetBrains Mono` / `SFMono` / `Consolas`, monospace. For SHA-256 digests, EV-IDs (`EV-2026-XXXX`), commit hashes, and Merkle roots.

### 1.3 Components & Visual Hierarchy
1. **Translucent Sticky Header:** Glassmorphism with `rgba(249, 249, 250, 0.85)` backdrop blur, razor-thin bottom border `#E5E5E7`.
2. **Minimalist Black Buttons:** Clean rectangular or slightly rounded (`rounded-md` / `6px`) primary buttons with crisp hover transition.
3. **Soft-Gray Secondary Actions:** `#F1F1F3` background with `#111111` text, providing quiet tactile contrast.
4. **Editorial Hero Section:** High-contrast typographic headline ("Every Record. Every Handoff. Verifiable."), spacious layout, original 3D monochrome evidence dossier & cryptographic node motif graphic.
5. **Quiet KPI Cards:** Real numerical metrics (Total Registered, Verified Commits, Active Cases, Merkle Checkpoints) presented without flashy animations.
6. **Git-Inspired Version Graph:** Interactive node-and-edge visualization rendering V1, V2, V3 commit trees alongside custody transfer nodes.
7. **Document & Visual Diff Engine:** Side-by-side or unified view with soft green tint for additions and soft red tint for deletions.

---

## 2. Information Architecture & Navigation

```
Public Landing (/)
├── Explore Features / How It Works
├── Cryptographic Trust Layers
├── Problem & Solution Matrix
└── Authentication Portal (/auth/login, /auth/register)
    │
    ▼
Role Dashboard (/dashboard)
├── Police Officer Hub
│   ├── Case Dossiers (/cases)
│   ├── Register Evidence (/evidence/new)
│   ├── Evidence Repository (/evidence)
│   └── Custody Transfer Requests (/custody)
├── Forensic Analyst Hub
│   ├── Assigned Evidence Dockets (/cases/[caseId])
│   ├── Tamper Verification Pipeline (/evidence/[id]/verify)
│   ├── Document & Image Diff Inspector (/evidence/[id]/compare)
│   └── Submit Forensic Report / Version (/evidence/[id]/versions)
├── Public Prosecutor Hub
│   ├── Case Trial Review (/cases/[caseId])
│   ├── Evidence Passport Inspector (/evidence/[id]/passport)
│   ├── Merkle Inclusion Proof Viewer (/merkle/proof/[versionId])
│   └── Export Admissible Report (/reports)
└── Admin Hub
    ├── User & Role Governance (/admin/users)
    ├── Security & Audit Event Logs (/admin/audit)
    └── Key Rotation & Retention Settings (/settings/security)
```

---

## 3. Cryptographic Trust Architecture & Data Flows

```
[Candidate File Upload]
        │
        ▼
[Compute SHA-256 over exact raw bytes]
        │
        ├── Compare candidate_hash == reference.file_sha256
        │       ├── Match   ──► [Status: CONTENT_MATCH]
        │       └── Mismatch ──► [Status: CONTENT_MISMATCH] ──► [Trigger Semantic Diff Engine]
        │
        ├── Check 2: Ed25519 Commit Signature
        │       └── Verify server attestation public key
        │
        ├── Check 3: Merkle Inclusion Proof
        │       └── Compute Leaf: SHA-256(0x00 || canonical_leaf)
        │       └── Traverse sibling path: SHA-256(0x01 || left || right)
        │       └── Verify signed Checkpoint Root
        │
        └── Check 4: Parent Commit Chain
                └── Trace parent_commit_hash backward to genesis V1
                        │
                        ▼
             [Deterministic Verdict]
             - INTEGRITY_VERIFIED
             - CONTENT_MISMATCH
             - UNREGISTERED_VERSION
             - SIGNATURE_INVALID
             - MERKLE_PROOF_INVALID
             - COMMIT_CHAIN_BROKEN
             - VERIFICATION_INCOMPLETE
```

---

## 4. Responsive Rules & Accessibility Standards

- **Mobile First Approach:** Viewports from 320px width supported seamlessly without horizontal scrolling (`overflow-x: hidden`).
- **Touch Target Minimum:** All interactive elements (buttons, nav items, timeline nodes) have minimum 44px x 44px hit areas.
- **Hash Display:** Monospace hashes truncate gracefully with an inline copy-to-clipboard button and tooltip.
- **Diff Viewer Responsive Mode:** Switches from dual side-by-side columns to unified single-column diff view on screens `< 768px`.
- **Timeline Graph Fallback:** Renders as vertical chronological expandable cards on mobile devices.
- **Accessible Contrast:** All text meets WCAG 2.1 AA standards (minimum 4.5:1 contrast against `#F9F9FA` canvas).
- **Reduced Motion Support:** Respects `@media (prefers-reduced-motion: reduce)` by disabling decorative transitions.
