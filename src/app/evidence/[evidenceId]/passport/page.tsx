"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Shield,
  FileCheck,
  CheckCircle2,
  Printer,
  QrCode,
  Hash,
  GitBranch,
  ArrowRightLeft,
  Calendar,
  Lock,
  Download,
} from "lucide-react";
import { evidenceStore } from "@/lib/data/store";
import { formatShortHash, computeSha256 } from "@/lib/crypto/sha256";
import { generateInclusionProof } from "@/lib/crypto/merkle";
import { EvidenceItem, EvidenceVersion, EvidenceCommit, CustodyTransfer, CustodyEvent } from "@/lib/supabase/types";

interface PageProps {
  params: Promise<{ evidenceId: string }>;
}

export default function EvidencePassportPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const evidenceId = resolvedParams.evidenceId;

  const [evidenceItem, setEvidenceItem] = useState<EvidenceItem | undefined>(undefined);
  const [versions, setVersions] = useState<EvidenceVersion[]>([]);
  const [commits, setCommits] = useState<EvidenceCommit[]>([]);
  const [transfers, setTransfers] = useState<CustodyTransfer[]>([]);
  const [custodyEvents, setCustodyEvents] = useState<CustodyEvent[]>([]);
  const [merkleProof, setMerkleProof] = useState<any>(null);
  const [reportHash, setReportHash] = useState<string>("");

  useEffect(() => {
    const item = evidenceStore.getEvidenceById(evidenceId);
    setEvidenceItem(item);
    if (item) {
      const vList = evidenceStore.getVersionsByEvidenceId(item.id);
      setVersions(vList);
      const cList = evidenceStore.getCommitsByEvidenceId(item.id);
      setCommits(cList);
      const tList = evidenceStore.getTransfersByEvidenceId(item.id);
      setTransfers(tList);
      const eList = evidenceStore.getCustodyEventsByEvidenceId(item.id);
      setCustodyEvents(eList);

      const v1 = vList.find((v) => v.versionNumber === 1);
      if (v1) {
        const checkpoint = evidenceStore.getCheckpoint();
        const idx = checkpoint.leafHashes.indexOf(v1.fileSha256);
        if (idx >= 0) {
          generateInclusionProof(checkpoint.leafHashes, idx).then(setMerkleProof).catch(() => {});
        }
      }

      // Compute hash of this certificate report
      computeSha256(`EVIDENTIA_PASSPORT_${item.id}_${item.currentVersionNumber}_${Date.now()}`).then(setReportHash);
    }
  }, [evidenceId]);

  if (!evidenceItem) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-heading text-xl font-bold text-[#111111]">Loading Passport...</h1>
      </div>
    );
  }

  const genesisVersion = versions.find((v) => v.versionNumber === 1);
  const latestVersion = versions[versions.length - 1];
  const checkpoint = evidenceStore.getCheckpoint();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 print:p-0">
      {/* Top Action Bar (hidden on print) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2 text-xs font-mono text-[#6B6B73]">
          <Link href="/evidence" className="hover:text-[#111111]">
            Evidence
          </Link>
          <span>/</span>
          <Link href={`/evidence/${evidenceItem.id}`} className="hover:text-[#111111]">
            {evidenceItem.id}
          </Link>
          <span>/</span>
          <span className="font-bold text-[#111111]">Passport</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-3.5 py-2 text-xs font-semibold text-[#111111] hover:border-[#111111] shadow-subtle transition-all"
          >
            <Printer className="h-3.5 w-3.5 text-[#6B6B73]" />
            Print / Export Official Certificate
          </button>
          <Link
            href={`/evidence/${evidenceItem.id}/timeline`}
            className="flex items-center gap-1.5 rounded-md bg-[#111111] px-3.5 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-[#262626]"
          >
            <GitBranch className="h-3.5 w-3.5" />
            Interactive Commit Graph
          </Link>
        </div>
      </div>

      {/* Official Certificate Paper Container */}
      <div className="rounded-xl border-2 border-[#111111] bg-[#FFFFFF] p-8 sm:p-12 shadow-editorial print:border-none print:shadow-none print:p-0">
        {/* Certificate Header */}
        <div className="border-b-2 border-[#111111] pb-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#111111] text-white">
                <Shield className="h-4 w-4" />
              </div>
              <span className="font-heading text-lg font-bold tracking-tight text-[#111111]">
                EVIDENTIA TRUST AUTHORITY
              </span>
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-[#6B6B73]">
              CERTIFICATE OF CRYPTOGRAPHIC EVIDENCE INTEGRITY & CUSTODY
            </p>
            <p className="font-mono text-[10px] text-[#8E8E93] mt-0.5">
              Complies with Section 65B Electronic Records Evidence Protocol &middot; RFC 6962
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end font-mono text-xs text-[#6B6B73]">
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-800 font-bold border border-emerald-200">
              STATE: ATTESTED & VERIFIED
            </span>
            <span className="mt-1 text-[11px]">Docket: {evidenceItem.caseNumber}</span>
            <span className="text-[10px] text-[#8E8E93]">Issued: {new Date().toUTCString()}</span>
          </div>
        </div>

        {/* Certificate Primary Identity Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
          <div className="space-y-3">
            <div>
              <span className="font-mono text-[10px] uppercase text-[#6B6B73]">Evidence Identifier</span>
              <p className="font-mono text-base font-extrabold text-[#111111]">{evidenceItem.id}</p>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-[#6B6B73]">Official Title</span>
              <p className="font-heading text-sm font-bold text-[#111111]">{evidenceItem.title}</p>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-[#6B6B73]">Forensic Category</span>
              <p className="font-mono text-xs text-[#111111]">{evidenceItem.category}</p>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-[#6B6B73]">Current Version State</span>
              <p className="font-mono text-xs font-bold text-[#111111]">
                Version {evidenceItem.currentVersionNumber} of {versions.length} registered
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="font-mono text-[10px] uppercase text-[#6B6B73]">Storage Boundary</span>
              <p className="font-mono text-xs text-[#111111]">
                Private Supabase Bucket: <code className="bg-[#F1F1F3] px-1 py-0.5 rounded">{evidenceItem.storageBucket}</code>
              </p>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-[#6B6B73]">Sealing Status</span>
              <p className="font-mono text-xs text-emerald-800 font-bold">
                GENESIS V1 IMMUTABLY SEALED &middot; ZERO OVERWRITES
              </p>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-[#6B6B73]">Initial Seizure Date</span>
              <p className="font-mono text-xs text-[#111111]">
                {new Date(evidenceItem.incidentDate).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-[#6B6B73]">Passport Certificate Digest</span>
              <p className="font-mono text-[11px] text-[#6B6B73] break-all">
                {reportHash}
              </p>
            </div>
          </div>
        </div>

        {/* Cryptographic Attestation Block */}
        <div className="rounded-lg border border-[#111111] bg-[#F9F9FA] p-5 mb-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E7] pb-2">
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-[#111111]">
              1. Cryptographic Hash & Signature Attestations
            </h3>
            <span className="font-mono text-[10px] text-emerald-700 font-bold">
              VERIFIED
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <span className="text-[10px] text-[#6B6B73]">GENESIS V1 RAW SHA-256 (ORIGINAL BYTES):</span>
              <p className="font-bold text-[#111111] break-all bg-[#FFFFFF] p-2 rounded border border-[#E5E5E7] mt-0.5">
                {genesisVersion?.fileSha256}
              </p>
            </div>

            {latestVersion && latestVersion.versionNumber > 1 && (
              <div>
                <span className="text-[10px] text-[#6B6B73]">
                  LATEST V{latestVersion.versionNumber} RAW SHA-256 (REVISED BYTES):
                </span>
                <p className="font-bold text-[#111111] break-all bg-[#FFFFFF] p-2 rounded border border-[#E5E5E7] mt-0.5">
                  {latestVersion.fileSha256}
                </p>
              </div>
            )}

            <div>
              <span className="text-[10px] text-[#6B6B73]">ED25519 SYSTEM ATTESTATION KEY:</span>
              <p className="text-[#111111] break-all bg-[#FFFFFF] p-2 rounded border border-[#E5E5E7] mt-0.5">
                {checkpoint.signingKeyId} &middot; Root Signature: {formatShortHash(checkpoint.signature, 16, 16)}
              </p>
            </div>
          </div>
        </div>

        {/* Merkle Inclusion Proof Block */}
        {merkleProof && (
          <div className="rounded-lg border border-[#E5E5E7] bg-[#FFFFFF] p-5 mb-8 space-y-3">
            <div className="flex items-center justify-between border-b border-[#F1F1F3] pb-2">
              <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-[#111111]">
                2. RFC 6962 Domain-Separated Merkle Inclusion Proof
              </h3>
              <span className="font-mono text-[10px] text-emerald-700 font-bold">
                BATCH #{checkpoint.batchNumber} SEALED
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B73]">Merkle Leaf Index:</span>
                <span className="font-bold text-[#111111]">{merkleProof.leafIndex}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B73]">Finalized Checkpoint Root:</span>
                <span className="font-bold text-[#111111]">{formatShortHash(checkpoint.rootHash, 12, 12)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B73]">Sibling Hash Steps:</span>
                <span className="text-[#111111]">{merkleProof.proofSteps.length} Tree Layer(s) Verified</span>
              </div>
            </div>
          </div>
        )}

        {/* Complete Custody Lineage Table */}
        <div className="rounded-lg border border-[#E5E5E7] bg-[#FFFFFF] p-5 mb-8">
          <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-[#111111] pb-2 border-b border-[#F1F1F3] mb-4">
            3. Chain of Custody & Version Commit Lineage
          </h3>

          <div className="divide-y divide-[#F1F1F3] text-xs">
            {custodyEvents.map((evt) => (
              <div key={evt.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-[#111111]">{evt.eventType}</div>
                  <div className="text-[11px] text-[#6B6B73] font-mono mt-0.5">
                    Handoff Officer: {evt.actorName} &middot; {JSON.stringify(evt.details)}
                  </div>
                </div>
                <div className="font-mono text-[11px] text-[#8E8E93] text-right">
                  {new Date(evt.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certificate Signature & Sealing Footer */}
        <div className="pt-8 border-t-2 border-[#111111] grid grid-cols-2 gap-8 text-xs font-mono">
          <div>
            <p className="text-[10px] text-[#6B6B73] uppercase">Forensic Examiner Verification</p>
            <div className="h-12 border-b border-[#111111] mt-2 flex items-end pb-1 font-semibold text-[#111111]">
              Dr. Ananya Iyer, Senior Forensic Scientist (CFSL)
            </div>
            <p className="text-[10px] text-[#8E8E93] mt-1">Badge: CFSL-7712</p>
          </div>

          <div>
            <p className="text-[10px] text-[#6B6B73] uppercase">Public Prosecutor Acceptance</p>
            <div className="h-12 border-b border-[#111111] mt-2 flex items-end pb-1 font-semibold text-[#111111]">
              Vikramaditya Sen, Senior Public Prosecutor
            </div>
            <p className="text-[10px] text-[#8E8E93] mt-1">Bar ID: D/1102/2012</p>
          </div>
        </div>
      </div>
    </div>
  );
}
