/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Shield,
  FileCheck,
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
  Sparkles,
  Search,
  BookOpen,
  FolderGit2,
  ArrowRightLeft,
  FileText,
  ChevronDown,
} from "lucide-react";
import {
  initialCases,
  initialEvidence,
  initialCommits,
  initialCheckpoint,
} from "@/lib/data/store";

export default function HomePage() {
  const [selectedRoleTab, setSelectedRoleTab] = useState<
    "police" | "forensic" | "prosecutor" | "admin"
  >("police");

  // Hammer & cards animation trigger
  const [hammerActive, setHammerActive] = useState(false);
  const hammerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (videoRef.current) {
             videoRef.current.currentTime = 0;
             videoRef.current.play().catch(e => console.error("Video play error:", e));
          }
        } else {
          if (videoRef.current) {
             videoRef.current.pause();
          }
          setHammerActive(false);
        }
      },
      { threshold: 0.5 }
    );

    if (hammerRef.current) {
      observer.observe(hammerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= 2.0 && !hammerActive) {
      setHammerActive(true);
    }
  };

  const totalEvidenceCount = initialEvidence.length;
  const totalCommitsCount = initialCommits.length;
  const totalCasesCount = initialCases.length;
  const totalLeavesCount = initialCheckpoint.leafCount;

  return (
    <div className="w-full bg-[#F9F9FA] text-[#111111] overflow-x-hidden">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION: LawSpeaks Reference.mp4 Layout with Judicory.gif */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative border-b border-[#E5E5E7] bg-[#F9F9FA] px-4 pt-4 pb-16 sm:px-6 sm:pt-8 sm:pb-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Left Content (Matches Reference.mp4 Typography & Spacing) */}
            <div className="lg:col-span-6 z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E5E7] bg-white px-3.5 py-1 shadow-subtle mb-6">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#111111]">
                  Zero-Trust Evidence Integrity
                </span>
                <span className="text-[#E5E5E7]">&vert;</span>
                <span className="font-mono text-[11px] text-[#6B6B73]">
                  RFC 6962 &middot; Ed25519
                </span>
              </div>

              <h1 className="font-heading text-4xl font-extrabold tracking-tight text-[#111111] sm:text-5xl lg:text-6xl leading-[1.08]">
                Understand Your <br />
                <span className="relative inline-block">
                  Legal Evidence.
                  <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#111111]/15 rounded-full" />
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base font-normal leading-relaxed text-[#6B6B73] sm:text-lg">
                EVIDENTIA provides citizens, judicial courts, and forensic examiners
                with tamper-evident verification. Clear, immutable, and mathematically
                verifiable proof for legal defense and digital chain-of-custody.
              </p>

              {/* Dual Action Buttons matching Reference.mp4 */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#111111] px-6 py-3.5 text-sm font-semibold text-white shadow-subtle transition-all duration-200 hover:bg-[#262626] hover:shadow-editorial hover:-translate-y-0.5"
                >
                  Ask Question / Explore
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/evidence/EV-2026-0042-01/verify"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#D1D1D6] bg-white/80 backdrop-blur-sm px-6 py-3.5 text-sm font-semibold text-[#111111] shadow-subtle transition-all duration-200 hover:border-[#111111] hover:bg-white hover:-translate-y-0.5"
                >
                  <Shield className="h-4 w-4 text-[#111111]" />
                  Know Rights & Verify
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
                  <span>Parent-Linked Commit DAG</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Passkey Step-Up Auth</span>
                </div>
              </div>
            </div>

            {/* Right Visual: Enhanced Judicory.gif Scale of Justice */}
            <div className="lg:col-span-6 flex justify-center items-center relative">
              {/* Subtle ambient lighting behind the scale */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-80 w-80 rounded-full bg-gradient-to-tr from-[#E5E5E7]/40 via-white/50 to-transparent blur-3xl opacity-80" />
              </div>

              <div className="relative w-full max-w-2xl lg:max-w-4xl flex items-center justify-center p-2">
                {/* 
                  Judicory.gif modifications:
                  1. mix-blend-mode: multiply seamlessly removes the off-white gif background
                  2. judiciary-glow CSS class adds smooth breathing drop-shadow levitation
                  3. Responsive sizing with crisp rendering
                */}
                <img
                  src="/assets/judicory.gif"
                  alt="LawSpeaks & Evidentia Scale of Justice — Real-time Judicial Balance"
                  className="w-full h-auto max-h-[700px] object-contain judiciary-glow select-none scale-110"
                  style={{
                    mixBlendMode: "multiply",
                    WebkitUserSelect: "none",
                  }}
                  loading="eager"
                />

                {/* Micro Judicial Badge Floating Over Scale */}
                <div className="absolute bottom-4 right-4 rounded-lg border border-[#E5E5E7] bg-white/95 backdrop-blur-md px-3 py-1.5 shadow-subtle flex items-center gap-2 font-mono text-[11px] text-[#111111]">
                  <Scale className="h-3.5 w-3.5 text-[#111111]" />
                  <span className="font-semibold">EQUITY &amp; BALANCE</span>
                  <span className="text-[#8E8E93]">&middot; 60 FPS</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator for smooth scrolling */}
        <div className="mt-8 flex justify-center">
          <a
            href="#interactive-hammer"
            className="flex items-center gap-1.5 text-xs text-[#8E8E93] font-mono hover:text-[#111111] transition-colors"
          >
            <span>SCROLL TO EXPLORE ARCHITECTURE</span>
            <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
          </a>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2. GAVEL STRIKE & SURROUNDING FLOATING CARDS (Reference Frames 2, 3, 4) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section
        id="interactive-hammer"
        ref={hammerRef}
        className="relative border-b border-[#E5E5E7] bg-[#F4F4F6] py-16 sm:py-24 overflow-hidden"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#6B6B73]">
              Interactive Legal System
            </span>
            <h2 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">
              Every Gavel Strike. Grounded In Proof.
            </h2>
            <p className="mt-3 text-sm text-[#6B6B73] leading-relaxed">
              Explore the six pillars of zero-trust forensic integrity, engineered
              to withstand judicial scrutiny under evidence admissibility standards.
            </p>
          </div>

          {/* Bento Grid with Center Gavel & Surrounding Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Top Left: Law Library */}
            <div
              className={`rounded-2xl border border-[#E5E5E7] bg-white p-6 shadow-subtle flex flex-col justify-between transition-all duration-500 hover:border-[#111111] hover:shadow-editorial hover:-translate-y-1 ${
                hammerActive ? "card-pop" : "opacity-0"
              }`}
              style={{ animationDelay: "100ms" }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-[#F1F1F3] flex items-center justify-center text-[#111111]">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E93]">
                    ACTS &amp; CODES
                  </span>
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-[#111111]">
                  Law Library
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#6B6B73]">
                  Direct access to raw legal codes, evidence acts of India (Cr.P.C. 65B),
                  and statutory chain-of-custody protocols.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#F1F1F3]">
                <Link
                  href="/cases"
                  className="font-mono text-xs font-bold text-[#111111] flex items-center gap-1.5 hover:underline"
                >
                  TRY <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Top Center: Ask */}
            <div
              className={`rounded-2xl border border-[#E5E5E7] bg-white p-6 shadow-subtle flex flex-col justify-between transition-all duration-500 hover:border-[#111111] hover:shadow-editorial hover:-translate-y-1 ${
                hammerActive ? "card-pop" : "opacity-0"
              }`}
              style={{ animationDelay: "200ms" }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-[#F1F1F3] flex items-center justify-center text-[#111111]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E93]">
                    INTELLIGENCE
                  </span>
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-[#111111]">
                  Ask AI &amp; Inquire
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#6B6B73]">
                  Describe your legal issue in plain words and receive structured
                  guidance based on Indian law and forensic precedent.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#F1F1F3]">
                <Link
                  href="/dashboard"
                  className="font-mono text-xs font-bold text-[#111111] flex items-center gap-1.5 hover:underline"
                >
                  TRY <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Top Right: Know Rights */}
            <div
              className={`rounded-2xl border border-[#E5E5E7] bg-white p-6 shadow-subtle flex flex-col justify-between transition-all duration-500 hover:border-[#111111] hover:shadow-editorial hover:-translate-y-1 ${
                hammerActive ? "card-pop" : "opacity-0"
              }`}
              style={{ animationDelay: "300ms" }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-[#F1F1F3] flex items-center justify-center text-[#111111]">
                    <Scale className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E93]">
                    CITIZEN RIGHTS
                  </span>
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-[#111111]">
                  Know Rights
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#6B6B73]">
                  Comprehensive guides on your fundamental rights during search,
                  seizure, interrogation, and digital device surrender.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#F1F1F3]">
                <Link
                  href="/custody"
                  className="font-mono text-xs font-bold text-[#111111] flex items-center gap-1.5 hover:underline"
                >
                  TRY <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Middle Section: Centerpiece Gavel Video from Reference */}
            <div className="md:col-span-3 flex justify-center items-center py-4">
              <div className="relative w-full max-w-3xl flex flex-col items-center justify-center p-4">
                <video
                  ref={videoRef}
                  src="/assets/hammer.mp4"
                  muted
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  className="w-full h-auto object-contain max-h-[460px] select-none"
                  style={{ mixBlendMode: "multiply", backgroundColor: "transparent" }}
                />
                <div className="mt-2 text-center text-xs font-mono text-[#6B6B73]">
                  <span>IMPACT OF LAW &middot; TAMPER PROOF SEAL SEED</span>
                </div>
              </div>
            </div>

            {/* Bottom Left: Case Examples */}
            <div
              className={`rounded-2xl border border-[#E5E5E7] bg-white p-6 shadow-subtle flex flex-col justify-between transition-all duration-500 hover:border-[#111111] hover:shadow-editorial hover:-translate-y-1 ${
                hammerActive ? "card-pop" : "opacity-0"
              }`}
              style={{ animationDelay: "400ms" }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-[#F1F1F3] flex items-center justify-center text-[#111111]">
                    <FolderGit2 className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E93]">
                    PRECEDENT
                  </span>
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-[#111111]">
                  Case Examples
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#6B6B73]">
                  Learn from historical rulings and similar legal contexts with
                  verified timeline replays and parent-linked audit records.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#F1F1F3]">
                <Link
                  href="/cases/CASE-2026-0042"
                  className="font-mono text-xs font-bold text-[#111111] flex items-center gap-1.5 hover:underline"
                >
                  TRY <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Bottom Center: Action Guide */}
            <div
              className={`rounded-2xl border border-[#E5E5E7] bg-white p-6 shadow-subtle flex flex-col justify-between transition-all duration-500 hover:border-[#111111] hover:shadow-editorial hover:-translate-y-1 ${
                hammerActive ? "card-pop" : "opacity-0"
              }`}
              style={{ animationDelay: "500ms" }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-[#F1F1F3] flex items-center justify-center text-[#111111]">
                    <ArrowRightLeft className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E93]">
                    PROCEDURAL
                  </span>
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-[#111111]">
                  Action Guide
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#6B6B73]">
                  Step-by-step procedural instructions for FIR registration,
                  electronic custody transfer, RTI filing, and lab handoffs.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#F1F1F3]">
                <Link
                  href="/custody"
                  className="font-mono text-xs font-bold text-[#111111] flex items-center gap-1.5 hover:underline"
                >
                  TRY <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Bottom Right: Risk Checker (Exact Black Card with Shield from Reference Frame 4!) */}
            <div
              className={`rounded-2xl border border-[#222222] bg-[#111111] text-white p-6 shadow-editorial flex flex-col justify-between transition-all duration-500 hover:border-white hover:-translate-y-1 ${
                hammerActive ? "card-pop" : "opacity-0"
              }`}
              style={{ animationDelay: "600ms" }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-[#222222] flex items-center justify-center text-white">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E93]">
                    FORENSIC VERIFY
                  </span>
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-white">
                  Risk Checker
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#AEAEB2]">
                  Evaluate the potential legal implications and verify byte-level
                  integrity against unauthorized document modification.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#262626]">
                <Link
                  href="/evidence/EV-2026-0042-01/verify"
                  className="font-mono text-xs font-bold text-white flex items-center gap-1.5 hover:underline"
                >
                  TRY <ArrowRight className="h-3.5 w-3.5 text-white" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 3. SITUATIONAL EVIDENCE & FORENSIC CODEX (Reference Frames 5, 6, 7) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section
        id="situational-evidence"
        className="relative border-b border-[#E5E5E7] bg-[#F9F9FA] py-16 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left: Situational Evidence Black Card with Fingerprint Icon (Frame 6) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md rounded-2xl border border-[#222222] bg-[#111111] text-white p-8 shadow-editorial transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[380px]">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E93]">
                    FORENSIC INGESTION
                  </span>
                  <h3 className="mt-3 font-heading text-2xl font-bold tracking-tight text-white">
                    Situational Evidence
                  </h3>
                  <p className="mt-3 text-xs leading-relaxed text-[#AEAEB2]">
                    Input details about a specific event—whether a property dispute,
                    chain-of-custody handoff, or digital forensics complaint—and get
                    tailored analysis of where you stand.
                  </p>
                </div>

                {/* Center Illuminated Fingerprint Graphic matching Reference */}
                <div className="my-8 flex justify-center items-center">
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-[#1C1C1E] border border-[#2A2A2E] shadow-inner">
                    <Fingerprint className="h-14 w-14 text-white stroke-[1.5] animate-pulse" />
                    <div className="absolute inset-0 rounded-2xl bg-white/5 pointer-events-none" />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#262626]">
                  <Link
                    href="/evidence/new"
                    className="font-mono text-xs font-bold text-white flex items-center gap-2 hover:underline"
                  >
                    TRY &amp; REGISTER EVENT <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: The Open Legal Book / Codex (Frame 6 & 7) */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-[#E5E5E7] bg-white p-6 sm:p-8 shadow-editorial">
                <div className="flex items-center justify-between border-b border-[#F1F1F3] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#111111] text-white flex items-center justify-center">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-heading text-base font-bold text-[#111111]">
                        THE CONSTITUTION OF INDIA &middot; STATUTORY CODEX
                      </h4>
                      <p className="text-[11px] font-mono text-[#6B6B73]">
                        SECTION 65B ELECTRONIC ADMISSIBILITY &middot; FORENSIC SEAL
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-800">
                    ADMISSIBLE V1
                  </span>
                </div>

                {/* Open Book Display with Editorial Legal Column Layout */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FAF9F5] p-6 rounded-xl border border-[#EBE8DF] shadow-inner font-serif text-[12px] leading-relaxed text-[#2C2C2C]">
                  {/* Left Page */}
                  <div className="border-r border-[#EBE8DF] pr-4">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#8E8E93] block mb-2">
                      ARTICLE 20 &middot; PROCEDURAL DUE PROCESS
                    </span>
                    <p className="italic mb-3">
                      &ldquo;No person accused of any offence shall be compelled to be a witness against himself, and evidence registered shall reflect true unaltered custody...&rdquo;
                    </p>
                    <p className="text-[#555555]">
                      Under digital evidentiary law, evidence must demonstrate an
                      unbroken hash lineage from the instant of seizure to judicial presentation.
                    </p>
                  </div>

                  {/* Right Page */}
                  <div className="pl-2">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#8E8E93] block mb-2">
                      EVIDENTIA RFC 6962 CRYPTOGRAPHIC ATTESTATION
                    </span>
                    <div className="bg-white p-3 rounded border border-[#E5E5E7] font-mono text-[10px] space-y-1 text-[#111111]">
                      <div className="text-[#6B6B73]">ROOT ATTESTATION:</div>
                      <div className="truncate text-emerald-700 font-bold">
                        9ffc6c4f8f50d20c3b438bcfe1fc25f3...
                      </div>
                      <div className="text-[#6B6B73] pt-1">ED25519 VERIFICATION:</div>
                      <div className="text-emerald-700 font-semibold">VALID (IMMUTABLE)</div>
                    </div>
                    <p className="mt-3 text-[11px] text-[#555555]">
                      Every record committed to EVIDENTIA generates an irreversible Merkle inclusion proof.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#F1F1F3]">
                  <span className="font-mono text-xs text-[#6B6B73]">
                    DOCKET EV-2026-0042 &middot; 3 ACTIVE COMMITS SEALED
                  </span>
                  <Link
                    href="/evidence/EV-2026-0042-01/passport"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#111111] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[#262626]"
                  >
                    View Evidence Passport
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 4. REAL KPI SUMMARY METRICS */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section id="metrics" className="border-b border-[#E5E5E7] bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="border-l-2 border-[#111111] pl-4">
              <span className="font-mono text-xs uppercase tracking-wider text-[#6B6B73]">
                Court Dockets
              </span>
              <p className="mt-1 font-heading text-3xl font-extrabold text-[#111111]">
                {totalCasesCount}
              </p>
              <p className="text-[11px] text-[#8E8E93]">Active Investigations</p>
            </div>
            <div className="border-l-2 border-[#111111] pl-4">
              <span className="font-mono text-xs uppercase tracking-wider text-[#6B6B73]">
                Sealed Records
              </span>
              <p className="mt-1 font-heading text-3xl font-extrabold text-[#111111]">
                {totalEvidenceCount}
              </p>
              <p className="text-[11px] text-[#8E8E93]">Original Private Files</p>
            </div>
            <div className="border-l-2 border-[#111111] pl-4">
              <span className="font-mono text-xs uppercase tracking-wider text-[#6B6B73]">
                Signed Commits
              </span>
              <p className="mt-1 font-heading text-3xl font-extrabold text-[#111111]">
                {totalCommitsCount}
              </p>
              <p className="text-[11px] text-[#8E8E93]">Ed25519 Attestations</p>
            </div>
            <div className="border-l-2 border-[#111111] pl-4">
              <span className="font-mono text-xs uppercase tracking-wider text-[#6B6B73]">
                Merkle Leaves
              </span>
              <p className="mt-1 font-heading text-3xl font-extrabold text-[#111111]">
                {totalLeavesCount}
              </p>
              <p className="text-[11px] text-[#8E8E93]">RFC 6962 Checkpoint Sealed</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 5. ROLE-BASED GOVERNANCE (Lifecycle Tabs) */}
      {/* ───────────────────────────────────────────────────────────────── */}
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
              Strictly segmented permissions enforced by cryptographic authorization and server-side verification.
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
                      ? "bg-[#111111] text-white shadow-sm"
                      : "border border-[#E5E5E7] bg-white text-[#6B6B73] hover:border-[#111111] hover:text-[#111111]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Role Tab Content */}
          <div className="mt-6 rounded-xl border border-[#E5E5E7] bg-white p-6 shadow-subtle">
            {selectedRoleTab === "police" && (
              <div>
                <h3 className="font-heading text-lg font-bold text-[#111111]">
                  Police Officer: Investigation &amp; Initial Seizure
                </h3>
                <p className="mt-2 text-xs text-[#6B6B73] leading-relaxed">
                  Investigating officers register criminal cases, upload initial seized
                  files (V1 FIRs, bodycam footage, drive dumps), initiate custody handoffs
                  to forensic laboratories, and create authorized amendments with mandatory
                  commit rationale.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
                    <span className="font-mono text-[10px] text-[#6B6B73]">CAPABILITY 01</span>
                    <p className="text-xs font-semibold text-[#111111] mt-1">Register New Cases &amp; V1</p>
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
                  Forensic Analyst: Scientific Verification &amp; Analysis
                </h3>
                <p className="mt-2 text-xs text-[#6B6B73] leading-relaxed">
                  Forensic examiners receive evidence batches, verify incoming physical/digital
                  hashes, perform paragraph and visual diff comparisons, and submit forensic
                  reports as signed commits or supplemental files.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
                    <span className="font-mono text-[10px] text-[#6B6B73]">CAPABILITY 01</span>
                    <p className="text-xs font-semibold text-[#111111] mt-1">Tamper Verification Pipeline</p>
                    <p className="text-[11px] text-[#6B6B73] mt-0.5">Multi-check cryptographic verdict on candidate bytes.</p>
                  </div>
                  <div className="rounded-lg bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
                    <span className="font-mono text-[10px] text-[#6B6B73]">CAPABILITY 02</span>
                    <p className="text-xs font-semibold text-[#111111] mt-1">Document &amp; Image Diff</p>
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
                  Public Prosecutor: Court Docket &amp; Admissibility
                </h3>
                <p className="mt-2 text-xs text-[#6B6B73] leading-relaxed">
                  Attorneys review case evidence dockets, verify complete custody timelines,
                  inspect Merkle inclusion proofs and Ed25519 root signatures, and export
                  court-admissible Evidence Passports complying with electronic evidence laws.
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
                  System Administrator: Governance &amp; Policy Audit
                </h3>
                <p className="mt-2 text-xs text-[#6B6B73] leading-relaxed">
                  Court registrars and IT administrators oversee user provisioning, assign
                  investigators to case dockets, review append-only audit event logs, and manage
                  key rotation metadata.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
                    <span className="font-mono text-[10px] text-[#6B6B73]">CAPABILITY 01</span>
                    <p className="text-xs font-semibold text-[#111111] mt-1">User &amp; Role Provisioning</p>
                    <p className="text-[11px] text-[#6B6B73] mt-0.5">Admin-controlled role assignments only.</p>
                  </div>
                  <div className="rounded-lg bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
                    <span className="font-mono text-[10px] text-[#6B6B73]">CAPABILITY 02</span>
                    <p className="text-xs font-semibold text-[#111111] mt-1">Immutable Audit Logs</p>
                    <p className="text-[11px] text-[#6B6B73] mt-0.5">Browse security, access, and verification events.</p>
                  </div>
                  <div className="rounded-lg bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
                    <span className="font-mono text-[10px] text-[#6B6B73]">CAPABILITY 03</span>
                    <p className="text-xs font-semibold text-[#111111] mt-1">Key &amp; Batch Checkpoints</p>
                    <p className="text-[11px] text-[#6B6B73] mt-0.5">Monitor Merkle batches and signing key metadata.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 6. CALL TO ACTION SECTION */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section className="bg-[#111111] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-extrabold sm:text-4xl tracking-tight">
            Every Record. Every Handoff. Verifiable.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-[#AEAEB2] leading-relaxed">
            Experience tamper-evident judicial evidence management. Test candidate file
            verification against real SHA-256 hashes, review version commit DAGs, and
            export verified Evidence Passports.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-white px-6 py-3.5 text-xs font-bold text-[#111111] shadow-subtle transition-all hover:bg-[#F1F1F3]"
            >
              Launch Live Dashboard
            </Link>
            <Link
              href="/evidence/EV-2026-0042-01/verify"
              className="rounded-full border border-[#3A3A3C] bg-[#1C1C1E] px-6 py-3.5 text-xs font-bold text-white transition-all hover:border-white"
            >
              Test Tamper Detection
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
