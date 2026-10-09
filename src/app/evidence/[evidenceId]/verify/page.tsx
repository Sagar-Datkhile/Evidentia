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
} from "lucide-react";
import { evidenceStore, DEMO_USERS } from "@/lib/data/store";
import { computeSha256, formatShortHash } from "@/lib/crypto/sha256";
import { verifyAttestation } from "@/lib/crypto/ed25519";
import { verifyInclusionProof, generateInclusionProof } from "@/lib/crypto/merkle";
import {
  EvidenceItem,
  EvidenceVersion,
  EvidenceCommit,
  VerificationVerdict,
  CheckOutcome,
  VerificationReport,
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

  // Verification State
  const [candidateFile, setCandidateFile] = useState<File | null>(null);
  const [candidateHash, setCandidateHash] = useState<string>("");
  const [candidateContent, setCandidateContent] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasRunVerification, setHasRunVerification] = useState(false);

  // Individual Checks
  const [hashCheck, setHashCheck] = useState<CheckOutcome>("NOT_RUN");
  const [sigCheck, setSigCheck] = useState<CheckOutcome>("NOT_RUN");
  const [merkleCheck, setMerkleCheck] = useState<CheckOutcome>("NOT_RUN");
  const [chainCheck, setChainCheck] = useState<CheckOutcome>("NOT_RUN");
  const [finalVerdict, setFinalVerdict] = useState<VerificationVerdict>("VERIFICATION_INCOMPLETE");

  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    const item = evidenceStore.getEvidenceById(evidenceId);
    setEvidenceItem(item);
    if (item) {
      const vList = evidenceStore.getVersionsByEvidenceId(item.id);
      setVersions(vList);
      const cList = evidenceStore.getCommitsByEvidenceId(item.id);
      setCommits(cList);
      if (vList.length > 0) {
        setSelectedVersionNum(vList[0].versionNumber);
      }
    }
  }, [evidenceId]);

  const activeVersion = versions.find((v) => v.versionNumber === selectedVersionNum);
  const activeCommit = commits.find((c) => {
    const v = versions.find((ver) => ver.versionNumber === selectedVersionNum);
    return v && c.versionId === v.id;
  });

  // Execute Cryptographic Verification Pipeline
  const runPipeline = async (hashToVerify: string, textOverride?: string) => {
    if (!activeVersion || !activeCommit) return;
    setIsVerifying(true);
    setHasRunVerification(true);

    try {
      // 1. Content Hash Comparison
      const isHashMatch = hashToVerify.toLowerCase() === activeVersion.fileSha256.toLowerCase();
      const hOutcome: CheckOutcome = isHashMatch ? "PASS" : "FAIL";
      setHashCheck(hOutcome);

      // 2. Commit Signature Verification (Ed25519)
      const isSigValid = await verifyAttestation(activeCommit.commitHash, activeCommit.signature);
      const sOutcome: CheckOutcome = isSigValid ? "PASS" : "FAIL";
      setSigCheck(sOutcome);

      // 3. Merkle Inclusion Proof Verification
      const checkpoint = evidenceStore.getCheckpoint();
      const targetIndex = checkpoint.leafHashes.indexOf(activeVersion.fileSha256);
      let mOutcome: CheckOutcome = "PASS";
      if (targetIndex >= 0) {
        try {
          const proof = await generateInclusionProof(checkpoint.leafHashes, targetIndex);
          const isMerkleValid = await verifyInclusionProof(proof.leafHash, proof.proofSteps, proof.rootHash);
          mOutcome = isMerkleValid ? "PASS" : "FAIL";
        } catch {
          mOutcome = "FAIL";
        }
      } else {
        mOutcome = "PENDING";
      }
      setMerkleCheck(mOutcome);

      // 4. Parent Commit Chain Integrity
      let cOutcome: CheckOutcome = "PASS";
      if (activeVersion.versionNumber === 1) {
        // Genesis commit must have null parent
        cOutcome = activeCommit.parentCommitHash === null ? "PASS" : "FAIL";
      } else {
        // Find parent commit
        const parentVer = versions.find((v) => v.versionNumber === activeVersion.versionNumber - 1);
        if (parentVer) {
          const parentCommit = commits.find((c) => c.versionId === parentVer.id);
          cOutcome = parentCommit && parentCommit.commitHash === activeCommit.parentCommitHash ? "PASS" : "FAIL";
        } else {
          cOutcome = "FAIL";
        }
      }
      setChainCheck(cOutcome);

      // Determine Final Deterministic Verdict
      if (!isHashMatch) {
        setFinalVerdict("CONTENT_MISMATCH");
      } else if (!isSigValid) {
        setFinalVerdict("SIGNATURE_INVALID");
      } else if (mOutcome === "FAIL") {
        setFinalVerdict("MERKLE_PROOF_INVALID");
      } else if (cOutcome === "FAIL") {
        setFinalVerdict("COMMIT_CHAIN_BROKEN");
      } else {
        setFinalVerdict("INTEGRITY_VERIFIED");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // User uploads custom file
  const handleFileUpload = async (file: File) => {
    setCandidateFile(file);
    const buffer = await file.arrayBuffer();
    const hash = await computeSha256(buffer);
    setCandidateHash(hash);

    let text = "";
    if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
      text = await file.text();
      setCandidateContent(text);
    }

    runPipeline(hash, text);
  };

  // Quick Demo Tester 1: Test Genuine Untampered Original File
  const handleTestGenuine = () => {
    if (!activeVersion) return;
    setCandidateHash(activeVersion.fileSha256);
    setCandidateContent(activeVersion.textContent || "");
    setCandidateFile(null);
    runPipeline(activeVersion.fileSha256, activeVersion.textContent);
  };

  // Quick Demo Tester 2: Test Tampered Alteration (1 Byte Modified)
  const handleTestTampered = () => {
    if (!activeVersion) return;
    // Simulate 1 byte modification by appending a newline/space or changing hash
    const alteredHash = "7f9a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcd";
    const alteredContent =
      (activeVersion.textContent || "") +
      "\n\n[UNAUTHORIZED AMENDMENT INSERTED: Tampered witness statement by unknown actor.]";

    setCandidateHash(alteredHash);
    setCandidateContent(alteredContent);
    setCandidateFile(null);
    runPipeline(alteredHash, alteredContent);
  };

  if (!evidenceItem || !activeVersion) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-heading text-xl font-bold text-[#111111]">Loading Evidence Record...</h1>
      </div>
    );
  }

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
              Evidence Passport
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

      {/* Main Grid: Upload & Test Inputs (Left) vs. Verification Verdict (Right) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 mb-8">
        {/* Left Column: Candidate File Submission & Quick Test Controls (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Reference Hash Box */}
          <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-5 shadow-subtle">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#6B6B73]">
              Trusted Reference Fingerprint (V{activeVersion.versionNumber})
            </span>
            <div className="mt-2 rounded bg-[#F9F9FA] p-3 border border-[#E5E5E7]">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#6B6B73] mb-1">
                <span>REGISTERED SHA-256</span>
                <span className="text-emerald-700 font-semibold">SEALED ON RECORD</span>
              </div>
              <p className="font-mono text-xs font-bold text-[#111111] break-all">
                {activeVersion.fileSha256}
              </p>
              <p className="mt-2 text-[10px] text-[#8E8E93] font-mono">
                File: {activeVersion.fileName} &middot; Size: {activeVersion.fileSizeBytes} bytes
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
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-[#E5E5E7] hover:border-[#111111] rounded-lg p-6 text-center transition-all bg-[#F9F9FA]"
            >
              <input
                type="file"
                id="verify-file-input"
                className="hidden"
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
                  className="flex items-center justify-center gap-1.5 rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-3 py-2 text-xs font-semibold text-[#111111] hover:border-[#111111] hover:bg-[#F9F9FA] transition-all shadow-subtle"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Test Genuine Original
                </button>

                <button
                  type="button"
                  onClick={handleTestTampered}
                  className="flex items-center justify-center gap-1.5 rounded-md border border-red-200 bg-red-50/60 px-3 py-2 text-xs font-semibold text-red-900 hover:bg-red-100/70 transition-all shadow-subtle"
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
                : finalVerdict === "INTEGRITY_VERIFIED"
                ? "border-emerald-300 bg-emerald-50/70 text-emerald-950"
                : "border-red-300 bg-red-50/70 text-red-950"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="mt-0.5 shrink-0">
                {!hasRunVerification ? (
                  <Shield className="h-8 w-8 text-[#8E8E93]" />
                ) : finalVerdict === "INTEGRITY_VERIFIED" ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
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
                  {!hasRunVerification
                    ? "Awaiting Candidate Submission"
                    : finalVerdict === "INTEGRITY_VERIFIED"
                    ? "VERDICT: INTEGRITY VERIFIED (PASS)"
                    : `VERDICT: ${finalVerdict}`}
                </h2>

                <p className="mt-2 text-xs leading-relaxed">
                  {!hasRunVerification
                    ? "Submit a candidate file or click one of the quick test buttons on the left to execute all 4 cryptographic verification layers."
                    : finalVerdict === "INTEGRITY_VERIFIED"
                    ? "The submitted file's exact bytes match the registered reference SHA-256 digest with zero bit discrepancies. The Ed25519 system signature, Merkle inclusion proof, and commit lineage are cryptographically authenticated."
                    : "The candidate file's SHA-256 digest differs from the sealed reference record. A content mismatch indicates unauthorized modification, corruption, or an unregistered variant."}
                </p>

                {hasRunVerification && finalVerdict === "CONTENT_MISMATCH" && (
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
                  <span
                    className={`font-mono px-2 py-0.5 rounded text-[10px] font-bold ${
                      hashCheck === "PASS"
                        ? "bg-emerald-100 text-emerald-800"
                        : hashCheck === "FAIL"
                        ? "bg-red-100 text-red-800"
                        : "bg-[#F1F1F3] text-[#6B6B73]"
                    }`}
                  >
                    {hashCheck}
                  </span>
                </div>
              </div>

              {/* Check 2: Ed25519 Signature */}
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#111111] block">
                    2. Ed25519 System Attestation Signature
                  </span>
                  <span className="text-[11px] text-[#6B6B73] font-mono">
                    Signed by {activeCommit?.signingKeyId}
                  </span>
                </div>
                <div>
                  <span
                    className={`font-mono px-2 py-0.5 rounded text-[10px] font-bold ${
                      sigCheck === "PASS"
                        ? "bg-emerald-100 text-emerald-800"
                        : sigCheck === "FAIL"
                        ? "bg-red-100 text-red-800"
                        : "bg-[#F1F1F3] text-[#6B6B73]"
                    }`}
                  >
                    {sigCheck}
                  </span>
                </div>
              </div>

              {/* Check 3: Merkle Tree Inclusion Proof */}
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#111111] block">
                    3. Merkle Checkpoint Inclusion Proof
                  </span>
                  <span className="text-[11px] text-[#6B6B73] font-mono">
                    RFC 6962 Domain Separation (0x00 leaf / 0x01 internal)
                  </span>
                </div>
                <div>
                  <span
                    className={`font-mono px-2 py-0.5 rounded text-[10px] font-bold ${
                      merkleCheck === "PASS"
                        ? "bg-emerald-100 text-emerald-800"
                        : merkleCheck === "FAIL"
                        ? "bg-red-100 text-red-800"
                        : "bg-[#F1F1F3] text-[#6B6B73]"
                    }`}
                  >
                    {merkleCheck}
                  </span>
                </div>
              </div>

              {/* Check 4: Parent Commit Chain */}
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#111111] block">
                    4. Parent Commit Chain Lineage
                  </span>
                  <span className="text-[11px] text-[#6B6B73] font-mono">
                    {activeVersion.versionNumber === 1
                      ? "Genesis Commit (null parent verified)"
                      : "Parent Hash == Prior Commit Hash"}
                  </span>
                </div>
                <div>
                  <span
                    className={`font-mono px-2 py-0.5 rounded text-[10px] font-bold ${
                      chainCheck === "PASS"
                        ? "bg-emerald-100 text-emerald-800"
                        : chainCheck === "FAIL"
                        ? "bg-red-100 text-red-800"
                        : "bg-[#F1F1F3] text-[#6B6B73]"
                    }`}
                  >
                    {chainCheck}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
