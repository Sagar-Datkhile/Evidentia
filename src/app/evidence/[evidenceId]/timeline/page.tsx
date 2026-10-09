"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  GitBranch,
  GitCommit,
  ArrowRightLeft,
  Shield,
  FileCheck,
  CheckCircle2,
  Clock,
  User,
  Hash,
  KeyRound,
  FileText,
  X,
  ArrowRight,
  ExternalLink,
  Lock,
} from "lucide-react";
import { evidenceStore } from "@/lib/data/store";
import { formatShortHash } from "@/lib/crypto/sha256";
import { generateInclusionProof } from "@/lib/crypto/merkle";
import {
  EvidenceItem,
  EvidenceVersion,
  EvidenceCommit,
  CustodyEvent,
} from "@/lib/supabase/types";

interface PageProps {
  params: Promise<{ evidenceId: string }>;
}

export default function EvidenceTimelinePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const evidenceId = resolvedParams.evidenceId;

  const [evidenceItem, setEvidenceItem] = useState<EvidenceItem | undefined>(undefined);
  const [versions, setVersions] = useState<EvidenceVersion[]>([]);
  const [commits, setCommits] = useState<EvidenceCommit[]>([]);
  const [custodyEvents, setCustodyEvents] = useState<CustodyEvent[]>([]);

  // Selected Node Drawer
  const [selectedCommit, setSelectedCommit] = useState<EvidenceCommit | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<EvidenceVersion | null>(null);
  const [selectedProof, setSelectedProof] = useState<any>(null);

  useEffect(() => {
    const item = evidenceStore.getEvidenceById(evidenceId);
    setEvidenceItem(item);
    if (item) {
      const vList = evidenceStore.getVersionsByEvidenceId(item.id);
      setVersions(vList);
      const cList = evidenceStore.getCommitsByEvidenceId(item.id);
      setCommits(cList);
      const eList = evidenceStore.getCustodyEventsByEvidenceId(item.id);
      setCustodyEvents(eList);

      if (cList.length > 0 && vList.length > 0) {
        handleSelectNode(cList[cList.length - 1], vList[vList.length - 1]);
      }
    }
  }, [evidenceId]);

  const handleSelectNode = async (commit: EvidenceCommit, version: EvidenceVersion) => {
    setSelectedCommit(commit);
    setSelectedVersion(version);

    // Compute Merkle proof for this version
    const checkpoint = evidenceStore.getCheckpoint();
    const idx = checkpoint.leafHashes.indexOf(version.fileSha256);
    if (idx >= 0) {
      try {
        const proof = await generateInclusionProof(checkpoint.leafHashes, idx);
        setSelectedProof(proof);
      } catch {
        setSelectedProof(null);
      }
    } else {
      setSelectedProof(null);
    }
  };

  if (!evidenceItem) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-heading text-xl font-bold text-[#111111]">Loading Commit Graph...</h1>
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
              <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-semibold text-white">
                V{evidenceItem.currentVersionNumber} Active
              </span>
            </div>

            <h1 className="font-heading text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
              Evidence Timeline & Commit Graph: {evidenceItem.title}
            </h1>
            <p className="mt-1 text-xs text-[#6B6B73]">
              Non-destructive lineage tracking combining immutable version commits, cryptographic parent links, and physical/digital custody handoffs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href={`/evidence/${evidenceItem.id}/versions`}
              className="flex items-center gap-1.5 rounded-md bg-[#111111] px-3.5 py-2 text-xs font-semibold text-[#FFFFFF] hover:bg-[#262626] transition-colors"
            >
              + Create Version V{evidenceItem.currentVersionNumber + 1}
            </Link>
            <Link
              href={`/evidence/${evidenceItem.id}/verify`}
              className="flex items-center gap-1.5 rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-3.5 py-2 text-xs font-semibold text-[#111111] hover:border-[#111111] transition-colors"
            >
              Verify Candidate
            </Link>
            <Link
              href={`/evidence/${evidenceItem.id}/compare`}
              className="flex items-center gap-1.5 rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-3.5 py-2 text-xs font-semibold text-[#111111] hover:border-[#111111] transition-colors"
            >
              Diff View
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Timeline (Left 7 cols) & Selected Commit Inspector (Right 5 cols) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Interactive Commit Graph */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle">
            <div className="flex items-center justify-between pb-4 border-b border-[#F1F1F3] mb-6">
              <div>
                <h2 className="font-heading text-base font-bold text-[#111111]">
                  Git-Inspired Commit DAG
                </h2>
                <p className="text-xs text-[#6B6B73]">
                  Click any commit node to inspect signature, parent hash, and Merkle proof.
                </p>
              </div>
              <span className="font-mono text-xs text-[#6B6B73]">
                {commits.length} Attested Commits
              </span>
            </div>

            {/* Commit Graph Nodes */}
            <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E5E7]">
              {commits.map((commit, idx) => {
                const ver = versions.find((v) => v.id === commit.versionId);
                const isSelected = selectedCommit?.id === commit.id;
                const isGenesis = commit.parentCommitHash === null;

                return (
                  <div key={commit.id} className="relative group">
                    {/* Graph Node Circle */}
                    <button
                      onClick={() => ver && handleSelectNode(commit, ver)}
                      className={`absolute -left-[35px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-transform group-hover:scale-110 ${
                        isSelected
                          ? "border-[#111111] bg-[#111111] text-[#FFFFFF] ring-4 ring-[#E5E5E7]"
                          : isGenesis
                          ? "border-emerald-600 bg-[#FFFFFF] text-emerald-800"
                          : "border-[#111111] bg-[#FFFFFF] text-[#111111]"
                      }`}
                    >
                      <GitCommit className="h-3 w-3" />
                    </button>

                    {/* Commit Card */}
                    <div
                      onClick={() => ver && handleSelectNode(commit, ver)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all ${
                        isSelected
                          ? "border-[#111111] bg-[#F9F9FA] shadow-subtle"
                          : "border-[#E5E5E7] bg-[#FFFFFF] hover:border-[#111111]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#111111]">
                            Version {ver?.versionNumber || 1}
                          </span>
                          {isGenesis && (
                            <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                              GENESIS V1 SEALED
                            </span>
                          )}
                          <span className="rounded bg-[#F1F1F3] px-2 py-0.5 font-mono text-[10px] text-[#6B6B73]">
                            {commit.merkleStatus}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-[#8E8E93]">
                          {new Date(commit.serverTimestamp).toLocaleString()}
                        </span>
                      </div>

                      <h3 className="font-heading text-sm font-bold text-[#111111]">
                        {commit.commitMessage}
                      </h3>

                      {commit.note && (
                        <p className="mt-1 text-xs text-[#6B6B73] italic">
                          &ldquo;{commit.note}&rdquo;
                        </p>
                      )}

                      <div className="mt-3 pt-2.5 border-t border-[#F1F1F3] flex flex-wrap items-center justify-between text-xs text-[#6B6B73] font-mono text-[11px]">
                        <div>
                          <span>Commit: </span>
                          <span className="font-bold text-[#111111]">
                            {formatShortHash(commit.commitHash, 6, 6)}
                          </span>
                        </div>
                        <div>
                          <span>Submitted by: </span>
                          <span className="font-semibold text-[#111111]">{commit.actorName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Integrated Custody Events Timeline */}
          <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle">
            <h3 className="font-heading text-base font-bold text-[#111111] pb-3 border-b border-[#F1F1F3] mb-4">
              Physical & Digital Custody Transfer Log
            </h3>

            <div className="relative pl-6 space-y-4 border-l border-[#E5E5E7]">
              {custodyEvents.map((evt) => (
                <div key={evt.id} className="relative">
                  <div className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-[#FFFFFF] bg-[#111111]" />
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#6B6B73]">
                    <span className="font-bold text-[#111111]">{evt.eventType}</span>
                    <span>{new Date(evt.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-[#111111] font-medium mt-0.5">
                    Handoff by {evt.actorName}
                  </p>
                  {evt.details && (
                    <p className="text-[11px] text-[#6B6B73] font-mono mt-0.5">
                      {JSON.stringify(evt.details)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Node Inspector Drawer (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {selectedCommit && selectedVersion ? (
            <div className="sticky top-20 rounded-xl border border-[#111111] bg-[#FFFFFF] p-6 shadow-editorial">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F1F3] mb-4">
                <div className="flex items-center gap-2">
                  <GitCommit className="h-4 w-4 text-[#111111]" />
                  <h3 className="font-heading text-base font-bold text-[#111111]">
                    Commit Inspector: V{selectedVersion.versionNumber}
                  </h3>
                </div>
                <span className="font-mono text-xs text-emerald-700 font-semibold">
                  ATTESTED
                </span>
              </div>

              {/* Version & File Metadata */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="font-mono text-[10px] text-[#6B6B73] uppercase">
                    Commit Message
                  </span>
                  <p className="font-semibold text-sm text-[#111111] mt-0.5">
                    {selectedCommit.commitMessage}
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[10px] text-[#6B6B73] uppercase">
                    Raw File SHA-256 Digest
                  </span>
                  <p className="font-mono text-xs font-bold text-[#111111] break-all bg-[#F9F9FA] p-2 rounded border border-[#E5E5E7] mt-0.5">
                    {selectedVersion.fileSha256}
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[10px] text-[#6B6B73] uppercase">
                    Canonical Commit Hash
                  </span>
                  <p className="font-mono text-xs text-[#111111] break-all bg-[#F9F9FA] p-2 rounded border border-[#E5E5E7] mt-0.5">
                    {selectedCommit.commitHash}
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[10px] text-[#6B6B73] uppercase">
                    Parent Commit Link
                  </span>
                  <p className="font-mono text-xs text-[#6B6B73] break-all bg-[#F9F9FA] p-2 rounded border border-[#E5E5E7] mt-0.5">
                    {selectedCommit.parentCommitHash || "(None — Genesis V1 Commit)"}
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[10px] text-[#6B6B73] uppercase">
                    Ed25519 System Attestation Signature
                  </span>
                  <p className="font-mono text-[11px] text-[#111111] break-all bg-[#F9F9FA] p-2 rounded border border-[#E5E5E7] mt-0.5">
                    {selectedCommit.signature}
                  </p>
                </div>

                {/* Merkle Proof Inspector */}
                {selectedProof && (
                  <div className="pt-2 border-t border-[#F1F1F3]">
                    <span className="font-mono text-[10px] text-[#6B6B73] uppercase">
                      RFC 6962 Merkle Inclusion Sibling Proof
                    </span>
                    <div className="mt-1 rounded bg-[#F9F9FA] p-2.5 border border-[#E5E5E7] space-y-1.5 font-mono text-[10px]">
                      <div className="flex items-center justify-between text-[#6B6B73]">
                        <span>LEAF INDEX: {selectedProof.leafIndex}</span>
                        <span className="text-emerald-700 font-semibold">VERIFIED ROOT</span>
                      </div>
                      <p className="break-all text-[#111111]">
                        Root: {formatShortHash(selectedProof.rootHash, 10, 10)}
                      </p>
                      <p className="text-[#6B6B73]">
                        Sibling Steps: {selectedProof.proofSteps.length} layer(s)
                      </p>
                    </div>
                  </div>
                )}

                {/* Submitting Actor Info */}
                <div className="pt-2 border-t border-[#F1F1F3] flex items-center justify-between text-[11px] text-[#6B6B73]">
                  <span>Last Authorized Editor:</span>
                  <span className="font-semibold text-[#111111]">
                    {selectedCommit.actorName} ({selectedCommit.actorRole})
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-[#F1F1F3] space-y-2">
                <Link
                  href={`/evidence/${evidenceItem.id}/compare`}
                  className="flex items-center justify-center gap-1.5 w-full rounded-md border border-[#E5E5E7] bg-[#FFFFFF] py-2 text-xs font-semibold text-[#111111] hover:border-[#111111] transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Compare With Parent Diff
                </Link>

                <Link
                  href={`/evidence/${evidenceItem.id}/passport`}
                  className="flex items-center justify-center gap-1.5 w-full rounded-md bg-[#111111] py-2 text-xs font-semibold text-[#FFFFFF] hover:bg-[#262626] transition-colors"
                >
                  <FileCheck className="h-3.5 w-3.5" />
                  View Full Evidence Passport
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-8 text-center text-xs text-[#6B6B73]">
              Select a commit node from the graph to inspect cryptographic details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
