"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  FileSearch,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  FileCheck,
  Copy,
  Check,
  ArrowRight,
  GitBranch,
  FileText,
  Upload,
  RefreshCw,
  Clock,
  Loader2,
  Lock,
} from "lucide-react";
import { evidenceStore } from "@/lib/data/store";
import { computeSha256, formatShortHash } from "@/lib/crypto/sha256";
import {
  EvidenceItem,
  EvidenceVersion,
  EvidenceCommit,
  VerificationVerdict,
  VerificationStatus,
  CheckOutcome,
  formatVerificationStatus,
  getVerificationBadgeStyle,
} from "@/lib/supabase/types";

interface PageProps {
  params: Promise<{ evidenceId: string }>;
}

export default function EvidenceVerifyPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const evidenceId = resolvedParams.evidenceId;

  const [evidenceItem, setEvidenceItem] = useState<EvidenceItem | undefined>(undefined);
  const [versions, setVersions] = useState<EvidenceVersion[]>([]);
  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(1);
  const [commits, setCommits] = useState<EvidenceCommit[]>([]);
  const [isLoadingRecord, setIsLoadingRecord] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Verification State
  const [candidateFile, setCandidateFile] = useState<File | null>(null);
  const [candidateHash, setCandidateHash] = useState<string>("");
  const [candidateContent, setCandidateContent] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasRunVerification, setHasRunVerification] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Individual Checks
  const [hashCheck, setHashCheck] = useState<CheckOutcome>("NOT_RUN");
  const [sigCheck, setSigCheck] = useState<CheckOutcome>("NOT_RUN");
  const [merkleCheck, setMerkleCheck] = useState<CheckOutcome>("NOT_RUN");
  const [chainCheck, setChainCheck] = useState<CheckOutcome>("NOT_RUN");
  const [finalVerdict, setFinalVerdict] = useState<VerificationVerdict>("VERIFICATION_INCOMPLETE");
  const [finalStatus, setFinalStatus] = useState<VerificationStatus>("PENDING");

  const [copiedReferenceHash, setCopiedReferenceHash] = useState(false);
  const [copiedCandidateHash, setCopiedCandidateHash] = useState(false);

  // ── Load Evidence from Supabase (fallback to demo store) ─────────────────────
  useEffect(() => {
    setIsLoadingRecord(true);
    setLoadError(null);

    fetch(`/api/evidence/${evidenceId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setEvidenceItem(data.evidence);
        const vList: EvidenceVersion[] = data.versions ?? [];
        setVersions(vList);
        setCommits(data.commits ?? []);
        if (vList.length > 0) {
          setSelectedVersionNum(vList[0].versionNumber);
        }

        // Hydrate from latest verification report if available
        if (data.latestReport) {
          const lr = data.latestReport;
          setHasRunVerification(true);
          setFinalVerdict(lr.verdict);
          setFinalStatus(data.verificationStatus ?? "PENDING");
          setCandidateHash(lr.candidateSha256);
          setHashCheck(lr.checks?.hashComparison ?? "NOT_RUN");
          setSigCheck(lr.checks?.commitSignature ?? "NOT_RUN");
          setMerkleCheck(lr.checks?.merkleInclusion ?? "NOT_RUN");
          setChainCheck(lr.checks?.commitChain ?? "NOT_RUN");
        }
      })
      .catch((err) => {
        // Fallback to in-memory store
        const demo = evidenceStore.getEvidenceById(evidenceId);
        if (demo) {
          setEvidenceItem(demo);
          const vList = evidenceStore.getVersionsByEvidenceId(demo.id);
          setVersions(vList);
          setCommits(evidenceStore.getCommitsByEvidenceId(demo.id));
          if (vList.length > 0) setSelectedVersionNum(vList[0].versionNumber);
        } else {
          setLoadError(err.message || "Failed to load evidence record.");
        }
      })
      .finally(() => {
        setIsLoadingRecord(false);
      });
  }, [evidenceId]);

  const activeVersion = versions.find((v) => v.versionNumber === selectedVersionNum);
  const activeCommit = commits.find((c) => {
    const v = versions.find((ver) => ver.versionNumber === selectedVersionNum);
    return v && c.versionId === v.id;
  });

  // ── Execute Server-Side Verification Pipeline ────────────────────────────────
  const runPipeline = async (hashToVerify?: string, textOverride?: string) => {
    if (!activeVersion) return;
    setIsVerifying(true);
    setVerificationError(null);

    try {
      const res = await fetch(`/api/evidence/${evidenceId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetVersionNumber: selectedVersionNum,
          candidateSha256: hashToVerify || undefined,
          candidateContent: textOverride || candidateContent || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Server verification failed (${res.status})`);
      }

      setHasRunVerification(true);
      setFinalVerdict(data.verdict);
      setFinalStatus(data.status);
      setCandidateHash(data.candidateHash || hashToVerify || activeVersion.fileSha256);

      if (data.checks) {
        setHashCheck(data.checks.rawByteHashMatch ?? "NOT_RUN");
        setSigCheck(data.checks.commitSignature ?? "NOT_RUN");
        setMerkleCheck(data.checks.merkleInclusionProof ?? "NOT_RUN");
        setChainCheck(data.checks.parentCommitChain ?? "NOT_RUN");
      }
    } catch (err: any) {
      setVerificationError(err.message || "Verification request failed.");
      setHasRunVerification(true);
      setFinalStatus("ERROR");
    } finally {
      setIsVerifying(false);
    }
  };

  // ── Candidate File Upload ───────────────────────────────────────────────────
  const handleFileUpload = async (file: File) => {
    setCandidateFile(file);
    try {
      const buffer = await file.arrayBuffer();
      const hash = await computeSha256(buffer);
      setCandidateHash(hash);

      let text = "";
      if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
        text = await file.text();
        setCandidateContent(text);
      }

      await runPipeline(hash, text);
    } catch (e: any) {
      setVerificationError("Could not process candidate file: " + e.message);
    }
  };

  // ── Test Genuine Original (Verify Stored Bytes or Trusted Hash) ──────────────
  const handleVerifyStoredFile = () => {
    setCandidateFile(null);
    setCandidateContent("");
    runPipeline(); // Empty hash signals server to verify raw stored blob
  };

  const handleTestGenuine = () => {
    if (!activeVersion) return;
    setCandidateHash(activeVersion.fileSha256);
    setCandidateContent(activeVersion.textContent || "");
    setCandidateFile(null);
    runPipeline(activeVersion.fileSha256, activeVersion.textContent);
  };

  // ── Test Tampered (1 Byte Mod) ──────────────────────────────────────────────
  const handleTestTampered = () => {
    if (!activeVersion) return;
    const alteredHash = "7f9a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcd";
    const alteredContent =
      (activeVersion.textContent || "") +
      "\n\n[UNAUTHORIZED AMENDMENT INSERTED: Tampered witness statement by unknown actor.]";

    setCandidateHash(alteredHash);
    setCandidateContent(alteredContent);
    setCandidateFile(null);
    runPipeline(alteredHash, alteredContent);
  };

  const copyToClipboard = (text: string, isRef: boolean) => {
    navigator.clipboard.writeText(text);
    if (isRef) {
      setCopiedReferenceHash(true);
      setTimeout(() => setCopiedReferenceHash(false), 2000);
    } else {
      setCopiedCandidateHash(true);
      setTimeout(() => setCopiedCandidateHash(false), 2000);
    }
  };

  if (isLoadingRecord) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#6B6B73] mx-auto mb-3" />
        <h1 className="font-heading text-base font-bold text-[#111111]">
          Loading Evidence Record from Vault...
        </h1>
      </div>
    );
  }

  if (loadError || !evidenceItem || !activeVersion) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-3" />
        <h1 className="font-heading text-xl font-bold text-[#111111]">Evidence Record Not Found</h1>
        <p className="text-xs text-[#6B6B73] mt-2 mb-6">
          {loadError || "Could not retrieve the specified evidence docket."}
        </p>
        <Link
          href="/evidence"
          className="rounded-md bg-[#111111] px-4 py-2 text-xs font-semibold text-white hover:bg-[#262626]"
        >
          &larr; Back to Evidence
        </Link>
      </div>
    );
  }

  const badgeStyle = getVerificationBadgeStyle(
    isVerifying ? "VERIFYING" : hasRunVerification ? finalStatus : "PENDING"
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-xs font-mono text-[#6B6B73]">
        <Link href="/evidence" className="hover:text-[#111111] transition-colors">
          Evidence
        </Link>
        <span>/</span>
        <Link href={`/cases/${evidenceItem.caseId}`} className="hover:text-[#111111] transition-colors">
          {evidenceItem.caseNumber}
        </Link>
        <span>/</span>
        <span className="font-bold text-[#111111]">{evidenceItem.id}</span>
      </div>

      {/* Header */}
      <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-[#111111]">{evidenceItem.id}</span>
              <span className="rounded bg-[#F1F1F3] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#111111]">
                {evidenceItem.category}
              </span>
              <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#FFFFFF]">
                Active V{evidenceItem.currentVersionNumber}
              </span>
              <span
                className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
              >
                {badgeStyle.label}
              </span>
            </div>

            <h1 className="font-heading text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
              Tamper Detection Pipeline: {evidenceItem.title}
            </h1>
            <p className="mt-1 text-xs text-[#6B6B73]">
              Deterministic multi-layer verification: Raw SHA-256 byte comparison, Ed25519 system signature, Merkle tree inclusion, and commit chain lineage.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/evidence/${evidenceItem.id}/timeline`}
              className="flex items-center gap-1.5 rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-3.5 py-2 text-xs font-semibold text-[#111111] hover:border-[#111111] transition-colors"
            >
              <GitBranch className="h-3.5 w-3.5 text-[#6B6B73]" />
              Commit Timeline
            </Link>
            <Link
              href={`/evidence/${evidenceItem.id}/passport`}
              className="flex items-center gap-1.5 rounded-md bg-[#111111] px-3.5 py-2 text-xs font-semibold text-[#FFFFFF] hover:bg-[#262626] transition-colors"
            >
              <FileCheck className="h-3.5 w-3.5" />
              Evidence Report
            </Link>
          </div>
        </div>

        {/* Reference Version Selector */}
        <div className="mt-6 pt-4 border-t border-[#F1F1F3] flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-[#111111] font-mono">
            Select Reference Version to Verify Against:
          </span>
          <div className="flex items-center gap-1.5">
            {versions.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setSelectedVersionNum(v.versionNumber);
                  setHasRunVerification(false);
                }}
                disabled={isVerifying}
                className={`rounded px-3 py-1 text-xs font-mono font-semibold transition-all ${
                  selectedVersionNum === v.versionNumber
                    ? "bg-[#111111] text-[#FFFFFF]"
                    : "border border-[#E5E5E7] bg-[#F9F9FA] text-[#6B6B73] hover:text-[#111111]"
                }`}
              >
                Version {v.versionNumber} {v.isGenesis ? "(Genesis Original)" : "(Amendment)"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 mb-8">
        {/* Left Column: Candidate Submission & Controls (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Reference Hash Box */}
          <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-5 shadow-subtle">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#6B6B73]">
                Trusted Reference Fingerprint (V{activeVersion.versionNumber})
              </span>
              <button
                onClick={() => copyToClipboard(activeVersion.fileSha256, true)}
                className="flex items-center gap-1 text-[11px] font-mono text-[#6B6B73] hover:text-[#111111] transition-colors"
                title="Copy reference SHA-256"
              >
                {copiedReferenceHash ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="rounded bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#6B6B73] mb-1">
                <span>SEALED SHA-256</span>
                <span className="text-emerald-700 font-semibold">IMMUTABLE BASELINE</span>
              </div>
              <p className="font-mono text-xs font-bold text-[#111111] break-all">
                {activeVersion.fileSha256}
              </p>
              <p className="mt-2 text-[10px] text-[#8E8E93] font-mono">
                File: {activeVersion.fileName} &middot; Size: {activeVersion.fileSizeBytes} bytes
              </p>
            </div>

            {/* Direct Vault Verification Button */}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleVerifyStoredFile}
                disabled={isVerifying}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-[#111111] px-4 py-2.5 text-xs font-semibold text-white shadow-subtle hover:bg-[#262626] disabled:opacity-50 transition-all"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Verifying Vault Object…
                  </>
                ) : (
                  <>
                    <Shield className="h-3.5 w-3.5" />
                    Verify Stored Evidence Bytes
                  </>
                )}
              </button>
              <p className="text-[10px] text-[#8E8E93] text-center mt-1 font-mono">
                Downloads private storage ciphertext and computes raw unencrypted SHA-256
              </p>
            </div>
          </div>

          {/* Candidate Upload Dropzone */}
          <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-5 shadow-subtle">
            <h3 className="font-heading text-sm font-bold text-[#111111] mb-1">
              Submit Candidate File For Verification
            </h3>
            <p className="text-xs text-[#6B6B73] mb-4">
              Select or drop any file to compute candidate SHA-256 and run through the pipeline.
            </p>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!isVerifying && e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-[#E5E5E7] hover:border-[#111111] rounded-lg p-6 text-center transition-all bg-[#F9F9FA]"
            >
              <input
                type="file"
                id="verify-file-input"
                className="hidden"
                disabled={isVerifying}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="verify-file-input" className="cursor-pointer block">
                <Upload className="mx-auto h-8 w-8 text-[#8E8E93] mb-2" />
                <p className="text-xs font-semibold text-[#111111]">
                  Click to select candidate file
                </p>
                <p className="text-[10px] text-[#6B6B73] mt-0.5">or drag file directly into box</p>
              </label>
            </div>

            {/* Quick Demo Test Buttons */}
            <div className="mt-5 pt-4 border-t border-[#F1F1F3]">
              <span className="font-mono text-[10px] uppercase text-[#6B6B73] block mb-2">
                Evaluator Instant Test Controls:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleTestGenuine}
                  disabled={isVerifying}
                  className="flex items-center justify-center gap-1.5 rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-3 py-2 text-xs font-semibold text-[#111111] hover:border-[#111111] hover:bg-[#F9F9FA] transition-all shadow-subtle disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Test Genuine Original
                </button>

                <button
                  type="button"
                  onClick={handleTestTampered}
                  disabled={isVerifying}
                  className="flex items-center justify-center gap-1.5 rounded-md border border-red-200 bg-red-50/60 px-3 py-2 text-xs font-semibold text-red-900 hover:bg-red-100/70 transition-all shadow-subtle disabled:opacity-50"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  Test Tampered (1 Byte Mod)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Layer Verdict & Checks Display (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Final Verdict Banner */}
          <div
            className={`rounded-xl border p-6 shadow-subtle transition-all ${
              !hasRunVerification
                ? "border-[#E5E5E7] bg-[#FFFFFF]"
                : finalStatus === "VERIFIED"
                ? "border-emerald-300 bg-emerald-50/70 text-emerald-950"
                : finalStatus === "HASH_MATCH"
                ? "border-blue-300 bg-blue-50/70 text-blue-950"
                : "border-red-300 bg-red-50/70 text-red-950"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="mt-0.5 shrink-0">
                {isVerifying ? (
                  <Loader2 className="h-8 w-8 animate-spin text-[#111111]" />
                ) : !hasRunVerification ? (
                  <Shield className="h-8 w-8 text-[#8E8E93]" />
                ) : finalStatus === "VERIFIED" ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                ) : finalStatus === "HASH_MATCH" ? (
                  <CheckCircle2 className="h-8 w-8 text-blue-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                    DETERMINISTIC VERDICT
                  </span>
                  <span className="font-mono text-[10px] text-[#6B6B73]">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>

                <h2 className="font-heading text-xl font-extrabold tracking-tight mt-1">
                  {isVerifying
                    ? "Executing Multi-Layer Verification Pipeline…"
                    : !hasRunVerification
                    ? "Awaiting Verification Run"
                    : finalStatus === "VERIFIED"
                    ? "VERDICT: INTEGRITY VERIFIED (PASS)"
                    : finalStatus === "HASH_MATCH"
                    ? "VERDICT: HASH MATCH (PASS - BATCH PENDING)"
                    : `VERDICT: ${formatVerificationStatus(finalStatus)}`}
                </h2>

                <p className="mt-2 text-xs leading-relaxed">
                  {isVerifying
                    ? "Reading stored evidence object, validating cryptographic signatures and checking Merkle tree roots."
                    : !hasRunVerification
                    ? "Click 'Verify Stored Evidence Bytes' or submit a candidate file on the left to execute all 4 cryptographic verification layers."
                    : finalStatus === "VERIFIED"
                    ? "The candidate file's exact bytes match the registered reference SHA-256 digest with zero bit discrepancies. The Ed25519 system signature, Merkle inclusion proof, and commit lineage are cryptographically authenticated."
                    : finalStatus === "HASH_MATCH"
                    ? "The file's SHA-256 matches the registered reference digest exactly. Commit attestation signature is valid. Merkle tree checkpoint is currently pending periodic batch finalization."
                    : "The candidate file's SHA-256 digest differs from the sealed reference record. A content mismatch indicates unauthorized modification, corruption, or an unregistered variant."}
                </p>

                {verificationError && (
                  <div className="mt-3 p-2.5 rounded bg-red-100 border border-red-300 text-xs text-red-900 font-mono">
                    {verificationError}
                  </div>
                )}

                {hasRunVerification && finalStatus === "MISMATCH" && (
                  <div className="mt-4 pt-3 border-t border-red-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-red-900">
                      Discrepancy Detected: Inspect semantic alterations
                    </span>
                    <Link
                      href={`/evidence/${evidenceItem.id}/compare`}
                      className="rounded-md bg-red-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-950 transition-colors"
                    >
                      Open Diff Inspector &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Candidate Hash Box (when verified) */}
          {hasRunVerification && candidateHash && (
            <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-5 shadow-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#6B6B73]">
                  Calculated Candidate Digest
                </span>
                <button
                  onClick={() => copyToClipboard(candidateHash, false)}
                  className="flex items-center gap-1 text-[11px] font-mono text-[#6B6B73] hover:text-[#111111] transition-colors"
                  title="Copy candidate SHA-256"
                >
                  {copiedCandidateHash ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="rounded bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
                <p className="font-mono text-xs font-bold text-[#111111] break-all">
                  {candidateHash}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-[#6B6B73]">Byte-level comparison result:</span>
                  <span
                    className={`font-bold ${
                      candidateHash.toLowerCase() === activeVersion.fileSha256.toLowerCase()
                        ? "text-emerald-700"
                        : "text-red-700"
                    }`}
                  >
                    {candidateHash.toLowerCase() === activeVersion.fileSha256.toLowerCase()
                      ? "100% BITWISE MATCH"
                      : "MISMATCH DETECTED"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 4 Multi-Tier Check Breakdown Cards */}
          <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle">
            <h3 className="font-heading text-sm font-bold text-[#111111] pb-3 border-b border-[#F1F1F3]">
              Independent Cryptographic Verification Checklist
            </h3>

            <div className="divide-y divide-[#F1F1F3] text-xs">
              {/* Check 1: Raw Byte Hash */}
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#111111] block">
                    1. Exact Raw-Byte SHA-256 Match
                  </span>
                  <span className="text-[11px] text-[#6B6B73] font-mono">
                    Candidate Hash == Trusted Reference Hash
                  </span>
                </div>
                <div>
                  <OutcomePill outcome={hashCheck} />
                </div>
              </div>

              {/* Check 2: Ed25519 System Signature */}
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#111111] block">
                    2. Ed25519 System Attestation Signature
                  </span>
                  <span className="text-[11px] text-[#6B6B73] font-mono">
                    Attestation signature verified with system public key
                  </span>
                </div>
                <div>
                  <OutcomePill outcome={sigCheck} />
                </div>
              </div>

              {/* Check 3: Merkle Tree Inclusion */}
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#111111] block">
                    3. RFC 6962 Domain-Separated Merkle Tree Inclusion
                  </span>
                  <span className="text-[11px] text-[#6B6B73] font-mono">
                    Leaf hash presence verified against root checkpoint
                  </span>
                </div>
                <div>
                  <OutcomePill outcome={merkleCheck} />
                </div>
              </div>

              {/* Check 4: Commit Chain Lineage */}
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#111111] block">
                    4. Parent Commit Chain Lineage
                  </span>
                  <span className="text-[11px] text-[#6B6B73] font-mono">
                    Parent hash link verified against version history
                  </span>
                </div>
                <div>
                  <OutcomePill outcome={chainCheck} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OutcomePill({ outcome }: { outcome: CheckOutcome }) {
  switch (outcome) {
    case "PASS":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          PASS
        </span>
      );
    case "FAIL":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2.5 py-1 font-mono text-[10px] font-bold text-red-800 border border-red-200">
          <XCircle className="h-3 w-3 text-red-600" />
          FAIL
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2.5 py-1 font-mono text-[10px] font-bold text-amber-800 border border-amber-200">
          <Clock className="h-3 w-3 text-amber-600" />
          PENDING
        </span>
      );
    case "UNAVAILABLE":
      return (
        <span className="inline-flex items-center rounded bg-neutral-100 px-2.5 py-1 font-mono text-[10px] font-bold text-neutral-600 border border-neutral-200">
          UNAVAILABLE
        </span>
      );
    case "NOT_RUN":
    default:
      return (
        <span className="inline-flex items-center rounded bg-[#F1F1F3] px-2.5 py-1 font-mono text-[10px] font-bold text-[#8E8E93] border border-[#E5E5E7]">
          NOT RUN
        </span>
      );
  }
}
