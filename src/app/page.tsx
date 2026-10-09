"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Shield,
  FileCheck,
  GitBranch,
  ArrowRight,
  Fingerprint,
  Lock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  History,
  FileSearch,
  Scale,
  Building2,
  UserCheck,
} from "lucide-react";
import { DEMO_USERS, initialCases, initialEvidence, initialCommits, initialCheckpoint } from "@/lib/data/store";

export default function HomePage() {
  const [selectedRoleTab, setSelectedRoleTab] = useState<"police" | "forensic" | "prosecutor" | "admin">("police");

  const totalEvidenceCount = initialEvidence.length;
  const totalCommitsCount = initialCommits.length;
  const totalCasesCount = initialCases.length;
  const totalLeavesCount = initialCheckpoint.leafCount;

  return (
    <div className="w-full">
      {/* --------------------------------------------------------------------- */}
      {/* 1. EDITORIAL HERO SECTION */}
      {/* --------------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-[#E5E5E7] bg-[#F9F9FA] pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Content */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E5E7] bg-[#FFFFFF] px-3 py-1 shadow-subtle mb-6">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#111111]">
                  Zero-Trust Judicial DEMS
                </span>
                <span className="text-[#E5E5E7]">&vert;</span>
                <span className="font-mono text-[11px] text-[#6B6B73]">RFC 6962 &middot; Ed25519</span>
              </div>

              <h1 className="font-heading text-4xl font-extrabold tracking-tight text-[#111111] sm:text-5xl lg:text-6xl leading-[1.08]">
                Every Record. <br />
                Every Handoff. <br />
                <span className="underline decoration-[#E5E5E7] decoration-4 underline-offset-8">
                  Verifiable.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base font-normal leading-relaxed text-[#6B6B73] sm:text-lg">
                Cryptographic integrity, secure custody, and transparent version history for judicial and forensic evidence without overwriting originals.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex items-center">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-md bg-[#111111] px-5 py-3 text-sm font-semibold text-[#FFFFFF] shadow-subtle transition-all hover:bg-[#262626] hover:shadow-editorial"
                >
                  Explore Platform
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Security badges */}
              <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-[#E5E5E7] pt-6 text-xs text-[#6B6B73]">
                <div className="flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Immutable V1 Original</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Git Parent Commit Chains</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Passkey Step-Up Auth</span>
                </div>
              </div>
            </div>

            {/* Right Visual: Original 3D Dossier Render */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="overflow-hidden rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-2 shadow-editorial">
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-[#F1F1F3]">
                    <Image
                      src="/assets/evidentia_hero_dossier.jpg"
                      alt="EVIDENTIA Original 3D Monochrome Evidence Dossier and Cryptographic Node Motif"
                      fill
                      priority
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between px-2 pb-1 text-[11px] text-[#6B6B73]">
                    <span className="font-mono">EV-DOSSIER-NODE-2026</span>
                    <span className="font-mono text-emerald-700 font-medium">CRYPTOGRAPHICALLY SEALED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 2. REAL QUIET KPI METRICS (No Fake SaaS Data) */}
      {/* --------------------------------------------------------------------- */}
      <section className="border-b border-[#E5E5E7] bg-[#FFFFFF] py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="border-l-2 border-[#111111] pl-4">
              <span className="font-mono text-xs uppercase tracking-wider text-[#6B6B73]">Active Cases</span>
              <p className="mt-1 font-heading text-3xl font-extrabold text-[#111111]">{totalCasesCount}</p>
              <p className="text-[11px] text-[#8E8E93]">Assigned High Court Dockets</p>
            </div>
            <div className="border-l-2 border-[#111111] pl-4">
              <span className="font-mono text-xs uppercase tracking-wider text-[#6B6B73]">Sealed Evidence</span>
              <p className="mt-1 font-heading text-3xl font-extrabold text-[#111111]">{totalEvidenceCount}</p>
              <p className="text-[11px] text-[#8E8E93]">Original Private Files</p>
            </div>
            <div className="border-l-2 border-[#111111] pl-4">
              <span className="font-mono text-xs uppercase tracking-wider text-[#6B6B73]">Attested Commits</span>
              <p className="mt-1 font-heading text-3xl font-extrabold text-[#111111]">{totalCommitsCount}</p>
              <p className="text-[11px] text-[#8E8E93]">Ed25519 Signed Lineages</p>
            </div>
            <div className="border-l-2 border-[#111111] pl-4">
              <span className="font-mono text-xs uppercase tracking-wider text-[#6B6B73]">Merkle Leaves</span>
              <p className="mt-1 font-heading text-3xl font-extrabold text-[#111111]">{totalLeavesCount}</p>
              <p className="text-[11px] text-[#8E8E93]">RFC 6962 Checkpoint Sealed</p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 3. PROBLEM VS. SOLUTION EDITORIAL MATRIX */}
      {/* --------------------------------------------------------------------- */}
      <section className="border-b border-[#E5E5E7] bg-[#F9F9FA] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#6B6B73]">
              Forensic Integrity Gap
            </span>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
              Why Legacy Evidence Management Fails In Court
            </h2>
            <p className="mt-3 text-sm text-[#6B6B73]">
              The critical difference between arbitrary cloud storage and zero-trust tamper-evident architecture.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Card 1 */}
            <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle">
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#F1F1F3] text-[#111111]">
                <History className="h-4 w-4" />
              </div>
              <h3 className="font-heading text-base font-bold text-[#111111]">Silent Overwrites vs. Immutable V1</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#6B6B73]">
                <strong className="text-[#111111]">Legacy:</strong> Updates overwrite the original file on disk, obscuring initial crime scene state and risking judicial dismissal.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#111111] font-medium border-t border-[#F1F1F3] pt-2">
                <strong>EVIDENTIA:</strong> V1 is permanently sealed at exact upload. All revisions are parent-linked commits with mandatory edit rationales.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle">
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#F1F1F3] text-[#111111]">
                <Fingerprint className="h-4 w-4" />
              </div>
              <h3 className="font-heading text-base font-bold text-[#111111]">Paper Logs vs. Attested Custody</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#6B6B73]">
                <strong className="text-[#111111]">Legacy:</strong> Custody relies on paper register notebooks vulnerable to backdating, loss, and unverified signatures.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#111111] font-medium border-t border-[#F1F1F3] pt-2">
                <strong>EVIDENTIA:</strong> Dual-party handoffs with FIDO2 passkey verification, timestamped audit chains, and optional consent-based visual receipts.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle">
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#F1F1F3] text-[#111111]">
                <Shield className="h-4 w-4" />
              </div>
              <h3 className="font-heading text-base font-bold text-[#111111]">Fake Badges vs. Merkle Proofs</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#6B6B73]">
                <strong className="text-[#111111]">Legacy:</strong> SaaS dashboards show static &quot;100% verified&quot; icons without verifiable mathematical evidence.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#111111] font-medium border-t border-[#F1F1F3] pt-2">
                <strong>EVIDENTIA:</strong> Byte-level SHA-256 computation, domain-separated Merkle trees, and verifiable sibling inclusion proofs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 4. CRYPTOGRAPHIC TRUST LAYERS */}
      {/* --------------------------------------------------------------------- */}
      <section className="border-b border-[#E5E5E7] bg-[#FFFFFF] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#6B6B73]">
              Under The Hood
            </span>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
              5-Layer Defense-in-Depth Cryptography
            </h2>
            <p className="mt-3 text-sm text-[#6B6B73]">
              Every piece of evidence is fortified through mathematically sound zero-trust protocols.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Layer 1 */}
            <div className="group rounded-xl border border-[#E5E5E7] bg-[#F9F9FA] p-6 transition-all hover:border-[#111111] hover:bg-[#FFFFFF]">
              <div className="flex items-center justify-between text-xs font-mono text-[#6B6B73]">
                <span>LAYER 01</span>
                <span className="font-semibold text-[#111111]">CONTENT INTEGRITY</span>
              </div>
              <h3 className="mt-3 font-heading text-base font-bold text-[#111111]">Raw-Byte SHA-256 Sealing</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#6B6B73]">
                Calculated directly over original unmodified bytes. Even a single bit flip produces an unassailable content mismatch verdict.
              </p>
              <div className="mt-4 rounded bg-[#F1F1F3] p-2 font-mono text-[10px] text-[#111111] truncate">
                SHA256(raw_unmodified_bytes)
              </div>
            </div>

            {/* Layer 2 */}
            <div className="group rounded-xl border border-[#E5E5E7] bg-[#F9F9FA] p-6 transition-all hover:border-[#111111] hover:bg-[#FFFFFF]">
              <div className="flex items-center justify-between text-xs font-mono text-[#6B6B73]">
                <span>LAYER 02</span>
                <span className="font-semibold text-[#111111]">VERSION CONTROL</span>
              </div>
              <h3 className="mt-3 font-heading text-base font-bold text-[#111111]">Git-Inspired Commit DAG</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#6B6B73]">
                Each revision links to its exact parent commit hash. Breaks in the chain are mathematically impossible to forge or hide.
              </p>
              <div className="mt-4 rounded bg-[#F1F1F3] p-2 font-mono text-[10px] text-[#111111] truncate">
                SHA256(canon(evId, vNum, fileHash, parentHash, actor, msg))
              </div>
            </div>

            {/* Layer 3 */}
            <div className="group rounded-xl border border-[#E5E5E7] bg-[#F9F9FA] p-6 transition-all hover:border-[#111111] hover:bg-[#FFFFFF]">
              <div className="flex items-center justify-between text-xs font-mono text-[#6B6B73]">
                <span>LAYER 03</span>
                <span className="font-semibold text-[#111111]">PROOF OF BATCH</span>
              </div>
              <h3 className="mt-3 font-heading text-base font-bold text-[#111111]">RFC 6962 Domain Merkle Tree</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#6B6B73]">
                Domain separation prefixes (0x00 for leaves, 0x01 for internal nodes) eliminate second-preimage collision attacks.
              </p>
              <div className="mt-4 rounded bg-[#F1F1F3] p-2 font-mono text-[10px] text-[#111111] truncate">
                Leaf = SHA256(0x00 || data); Parent = SHA256(0x01 || L || R)
              </div>
            </div>

            {/* Layer 4 */}
            <div className="group rounded-xl border border-[#E5E5E7] bg-[#F9F9FA] p-6 transition-all hover:border-[#111111] hover:bg-[#FFFFFF]">
              <div className="flex items-center justify-between text-xs font-mono text-[#6B6B73]">
                <span>LAYER 04</span>
                <span className="font-semibold text-[#111111]">SYSTEM ATTESTATION</span>
              </div>
              <h3 className="mt-3 font-heading text-base font-bold text-[#111111]">Ed25519 Checkpoint Signatures</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#6B6B73]">
                Merkle roots and finalized version commits are digitally signed by protected attestation keys for verifiable authenticity.
              </p>
              <div className="mt-4 rounded bg-[#F1F1F3] p-2 font-mono text-[10px] text-[#111111] truncate">
                Ed25519_Sign(merkle_root_hash)
              </div>
            </div>

            {/* Layer 5 */}
            <div className="group rounded-xl border border-[#E5E5E7] bg-[#F9F9FA] p-6 transition-all hover:border-[#111111] hover:bg-[#FFFFFF]">
              <div className="flex items-center justify-between text-xs font-mono text-[#6B6B73]">
                <span>LAYER 05</span>
                <span className="font-semibold text-[#111111]">RE-AUTHENTICATION</span>
              </div>
              <h3 className="mt-3 font-heading text-base font-bold text-[#111111]">FIDO2 / WebAuthn Step-Up</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#6B6B73]">
                Windows Hello, Touch ID, and hardware tokens protect high-impact operations with operation-bound 5-minute challenges.
              </p>
              <div className="mt-4 rounded bg-[#F1F1F3] p-2 font-mono text-[10px] text-[#111111] truncate">
                WebAuthn(challenge = SHA256(op_digest))
              </div>
            </div>

            {/* Storage Layer */}
            <div className="group rounded-xl border border-[#E5E5E7] bg-[#F9F9FA] p-6 transition-all hover:border-[#111111] hover:bg-[#FFFFFF]">
              <div className="flex items-center justify-between text-xs font-mono text-[#6B6B73]">
                <span>STORAGE</span>
                <span className="font-semibold text-[#111111]">CONFIDENTIALITY</span>
              </div>
              <h3 className="mt-3 font-heading text-base font-bold text-[#111111]">Private Envelope Encryption</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#6B6B73]">
                AES-256-GCM encryption with unique nonces. Strictly private Supabase storage buckets; no public URL access ever.
              </p>
              <div className="mt-4 rounded bg-[#F1F1F3] p-2 font-mono text-[10px] text-[#111111] truncate">
                AES-GCM-256(iv: 12 bytes, key: KMS)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 5. ROLE-BASED WORKFLOWS */}
      {/* --------------------------------------------------------------------- */}
      <section className="border-b border-[#E5E5E7] bg-[#F9F9FA] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#6B6B73]">
              Role-Based Governance
            </span>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
              Engineered for the Whole Justice Lifecycle
            </h2>
            <p className="mt-3 text-sm text-[#6B6B73]">
              Strictly segmented permissions enforced by Supabase Row Level Security and server-side verification.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="mt-8 flex flex-wrap gap-2 border-b border-[#E5E5E7] pb-3">
            {(
              [
                { key: "police", label: "Police Officer", icon: Shield },
                { key: "forensic", label: "Forensic Analyst", icon: FileSearch },
                { key: "prosecutor", label: "Public Prosecutor", icon: Scale },
                { key: "admin", label: "System Administrator", icon: Building2 },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isSelected = selectedRoleTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedRoleTab(tab.key)}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-[#111111] text-[#FFFFFF] shadow-sm"
                      : "border border-[#E5E5E7] bg-[#FFFFFF] text-[#6B6B73] hover:border-[#111111] hover:text-[#111111]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Role Tab Content */}
          <div className="mt-6 rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle">
            {selectedRoleTab === "police" && (
              <div>
                <h3 className="font-heading text-lg font-bold text-[#111111]">
                  Police Officer: Investigation & Initial Seizure
                </h3>
                <p className="mt-2 text-xs text-[#6B6B73] leading-relaxed">
                  Investigating officers register criminal cases, upload initial seized files (V1 FIRs, bodycam footage, drive dumps), initiate custody handoffs to forensic laboratories, and create authorized amendments with mandatory commit rationale.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
                    <span className="font-mono text-[10px] text-[#6B6B73]">CAPABILITY 01</span>
                    <p className="text-xs font-semibold text-[#111111] mt-1">Register New Cases & V1</p>
                    <p className="text-[11px] text-[#6B6B73] mt-0.5">Calculates exact SHA-256 before private storage.</p>
                  </div>
                  <div className="rounded-lg bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
                    <span className="font-mono text-[10px] text-[#6B6B73]">CAPABILITY 02</span>
                    <p className="text-xs font-semibold text-[#111111] mt-1">Initiate Lab Handoffs</p>
                    <p className="text-[11px] text-[#6B6B73] mt-0.5">Signs custody transfer with step-up authentication.</p>
                  </div>
                  <div className="rounded-lg bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
                    <span className="font-mono text-[10px] text-[#6B6B73]">CAPABILITY 03</span>
                    <p className="text-xs font-semibold text-[#111111] mt-1">Create Authorized Revisions</p>
                    <p className="text-[11px] text-[#6B6B73] mt-0.5">Parent-linked commits without overwriting V1.</p>
                  </div>
                </div>
              </div>
            )}

            {selectedRoleTab === "forensic" && (
              <div>
                <h3 className="font-heading text-lg font-bold text-[#111111]">
                  Forensic Analyst: Scientific Verification & Analysis
                </h3>
                <p className="mt-2 text-xs text-[#6B6B73] leading-relaxed">
                  Forensic examiners receive evidence batches, verify incoming physical/digital hashes, perform paragraph and visual diff comparisons, and submit forensic reports as signed commits or supplemental files.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
                    <span className="font-mono text-[10px] text-[#6B6B73]">CAPABILITY 01</span>
                    <p className="text-xs font-semibold text-[#111111] mt-1">Tamper Verification Pipeline</p>
                    <p className="text-[11px] text-[#6B6B73] mt-0.5">Multi-check cryptographic verdict on candidate bytes.</p>
                  </div>
                  <div className="rounded-lg bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
                    <span className="font-mono text-[10px] text-[#6B6B73]">CAPABILITY 02</span>
                    <p className="text-xs font-semibold text-[#111111] mt-1">Document & Image Diff</p>
                    <p className="text-[11px] text-[#6B6B73] mt-0.5">Line-by-line additions and deletions highlighting.</p>
                  </div>
                  <div className="rounded-lg bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
                    <span className="font-mono text-[10px] text-[#6B6B73]">CAPABILITY 03</span>
                    <p className="text-xs font-semibold text-[#111111] mt-1">Custody Acceptance</p>
                    <p className="text-[11px] text-[#6B6B73] mt-0.5">Verifies seal integrity upon intake.</p>
                  </div>
                </div>
              </div>
            )}

            {selectedRoleTab === "prosecutor" && (
              <div>
                <h3 className="font-heading text-lg font-bold text-[#111111]">
                  Public Prosecutor: Court Docket & Admissibility
                </h3>
                <p className="mt-2 text-xs text-[#6B6B73] leading-relaxed">
                  Attorneys review case evidence dockets, verify complete custody timelines, inspect Merkle inclusion proofs and Ed25519 root signatures, and export court-admissible Evidence Passports complying with electronic evidence laws.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
                    <span className="font-mono text-[10px] text-[#6B6B73]">CAPABILITY 01</span>
                    <p className="text-xs font-semibold text-[#111111] mt-1">Evidence Passport</p>
                    <p className="text-[11px] text-[#6B6B73] mt-0.5">Exportable certificate with verification tokens.</p>
                  </div>
                  <div className="rounded-lg bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
                    <span className="font-mono text-[10px] text-[#6B6B73]">CAPABILITY 02</span>
                    <p className="text-xs font-semibold text-[#111111] mt-1">Audit Trail Inspection</p>
                    <p className="text-[11px] text-[#6B6B73] mt-0.5">Inspect every actor, timestamp, and custody handoff.</p>
                  </div>
                  <div className="rounded-lg bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
                    <span className="font-mono text-[10px] text-[#6B6B73]">CAPABILITY 03</span>
                    <p className="text-xs font-semibold text-[#111111] mt-1">Merkle Proof Validation</p>
                    <p className="text-[11px] text-[#6B6B73] mt-0.5">Independently check sibling tree branches.</p>
                  </div>
                </div>
              </div>
            )}

            {selectedRoleTab === "admin" && (
              <div>
                <h3 className="font-heading text-lg font-bold text-[#111111]">
                  System Administrator: Governance & Policy Audit
                </h3>
                <p className="mt-2 text-xs text-[#6B6B73] leading-relaxed">
                  Court registrars and IT administrators oversee user provisioning, assign investigators to case dockets, review append-only audit event logs, and manage key rotation metadata.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
                    <span className="font-mono text-[10px] text-[#6B6B73]">CAPABILITY 01</span>
                    <p className="text-xs font-semibold text-[#111111] mt-1">User & Role Provisioning</p>
                    <p className="text-[11px] text-[#6B6B73] mt-0.5">Admin-controlled role assignments only.</p>
                  </div>
                  <div className="rounded-lg bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
                    <span className="font-mono text-[10px] text-[#6B6B73]">CAPABILITY 02</span>
                    <p className="text-xs font-semibold text-[#111111] mt-1">Immutable Audit Logs</p>
                    <p className="text-[11px] text-[#6B6B73] mt-0.5">Browse security, access, and verification events.</p>
                  </div>
                  <div className="rounded-lg bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
                    <span className="font-mono text-[10px] text-[#6B6B73]">CAPABILITY 03</span>
                    <p className="text-xs font-semibold text-[#111111] mt-1">Key & Batch Checkpoints</p>
                    <p className="text-[11px] text-[#6B6B73] mt-0.5">Monitor Merkle batches and signing key metadata.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 6. CALL TO ACTION */}
      {/* --------------------------------------------------------------------- */}
      <section className="bg-[#111111] py-16 text-[#FFFFFF] sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-extrabold sm:text-4xl tracking-tight">
            Ready to Experience Cryptographic Evidence Integrity?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-[#AEAEB2] leading-relaxed">
            Test the live platform now. Register evidence, test candidate file verification against real SHA-256 hashes, review version commit trees, and export verified Evidence Passports.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-md bg-[#FFFFFF] px-6 py-3 text-sm font-semibold text-[#111111] shadow-subtle transition-all hover:bg-[#F1F1F3]"
            >
              Launch Live Dashboard
            </Link>
            <Link
              href="/cases/CASE-2026-0042"
              className="rounded-md border border-[#3A3A3C] bg-[#1C1C1E] px-6 py-3 text-sm font-semibold text-[#FFFFFF] transition-all hover:border-[#FFFFFF]"
            >
              Inspect Case 0042 Docket
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
