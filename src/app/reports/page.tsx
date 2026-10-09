"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Shield,
  Layers,
  KeyRound,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Search,
} from "lucide-react";
import { evidenceStore, initialCheckpoint } from "@/lib/data/store";
import { formatShortHash } from "@/lib/crypto/sha256";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"audit" | "merkle" | "keys">("audit");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const evidenceList = evidenceStore.getAllEvidence();
  const allEvents = [];
  for (const e of evidenceList) {
    allEvents.push(...evidenceStore.getCustodyEventsByEvidenceId(e.id));
  }
  const sortedEvents = allEvents.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const checkpoint = evidenceStore.getCheckpoint();

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#6B6B73]">
              Audit & Attestation
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
            Reports & Security Registry
          </h1>
          <p className="mt-1 text-xs text-[#6B6B73]">
            Tamper-evident verification certificates, Merkle checkpoint batches, and immutable audit logs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E5E5E7] mb-6">
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "audit"
              ? "border-[#111111] text-[#111111]"
              : "border-transparent text-[#6B6B73] hover:text-[#111111]"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Audit Event Logs ({sortedEvents.length})
        </button>

        <button
          onClick={() => setActiveTab("merkle")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "merkle"
              ? "border-[#111111] text-[#111111]"
              : "border-transparent text-[#6B6B73] hover:text-[#111111]"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Merkle Checkpoint Registry
        </button>

        <button
          onClick={() => setActiveTab("keys")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "keys"
              ? "border-[#111111] text-[#111111]"
              : "border-transparent text-[#6B6B73] hover:text-[#111111]"
          }`}
        >
          <KeyRound className="h-3.5 w-3.5" />
          Attestation Keys & Security
        </button>
      </div>

      {/* Tab 1: Audit Events */}
      {activeTab === "audit" && (
        <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] shadow-subtle overflow-hidden">
          <div className="p-4 bg-[#F9F9FA] border-b border-[#E5E5E7] flex items-center justify-between text-xs font-mono text-[#6B6B73]">
            <span>IMMUTABLE SYSTEM EVENT LINEAGE</span>
            <span>APPEND-ONLY LOG</span>
          </div>

          <div className="divide-y divide-[#F1F1F3]">
            {sortedEvents.map((evt) => (
              <div key={evt.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#111111]">{evt.eventType}</span>
                    <span className="font-mono text-[10px] text-[#6B6B73] bg-[#F1F1F3] px-1.5 py-0.5 rounded">
                      {evt.evidenceId}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#6B6B73]">
                    Actor: <strong className="text-[#111111]">{evt.actorName}</strong> &middot;{" "}
                    {JSON.stringify(evt.details)}
                  </p>
                </div>
                <div className="font-mono text-[11px] text-[#8E8E93] shrink-0">
                  {new Date(evt.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Merkle Checkpoint Registry */}
      {activeTab === "merkle" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle">
            <div className="flex items-center justify-between pb-4 border-b border-[#F1F1F3] mb-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-[#6B6B73]">
                  RFC 6962 Finalized Batch
                </span>
                <h2 className="font-heading text-lg font-bold text-[#111111]">
                  Merkle Batch #{checkpoint.batchNumber}
                </h2>
              </div>
              <span className="rounded bg-emerald-50 px-2.5 py-1 text-xs font-mono font-bold text-emerald-800 border border-emerald-200">
                FINALIZED & ATTESTED
              </span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#6B6B73] uppercase">Signed Merkle Root Hash:</span>
                <p className="font-bold text-[#111111] break-all bg-[#F9F9FA] p-2.5 rounded border border-[#E5E5E7] mt-0.5">
                  {checkpoint.rootHash}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-[#6B6B73] uppercase">Ed25519 Checkpoint Signature:</span>
                <p className="text-[#111111] break-all bg-[#F9F9FA] p-2 rounded border border-[#E5E5E7] mt-0.5">
                  {checkpoint.signature}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-[10px] text-[#6B6B73] uppercase">Total Leaf Nodes:</span>
                  <p className="font-bold text-sm text-[#111111]">{checkpoint.leafCount} evidence leaves</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B6B73] uppercase">Finalization Timestamp:</span>
                  <p className="text-[#111111]">{new Date(checkpoint.finalizedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Leaf Hashes List */}
          <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle">
            <h3 className="font-heading text-sm font-bold text-[#111111] pb-3 border-b border-[#F1F1F3] mb-4">
              Batch Leaves (0x00 Domain Separated)
            </h3>
            <div className="space-y-2 font-mono text-xs">
              {checkpoint.leafHashes.map((leaf, idx) => (
                <div key={idx} className="flex items-center justify-between bg-[#F9F9FA] p-2 rounded border border-[#E5E5E7]">
                  <span className="text-[#6B6B73]">Leaf [{idx}]:</span>
                  <span className="text-[#111111] font-bold">{formatShortHash(leaf, 14, 14)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Attestation Keys */}
      {activeTab === "keys" && (
        <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle space-y-4">
          <div className="pb-4 border-b border-[#F1F1F3]">
            <h2 className="font-heading text-lg font-bold text-[#111111]">
              Cryptographic Key Governance
            </h2>
            <p className="text-xs text-[#6B6B73] mt-0.5">
              Attestation signing keys and master envelope encryption configuration.
            </p>
          </div>

          <div className="rounded-lg bg-[#F9F9FA] p-4 border border-[#E5E5E7] space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B73]">Primary Attestation Key ID:</span>
              <span className="font-bold text-[#111111]">key_evidentia_primary_2026</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B73]">Algorithm:</span>
              <span className="font-bold text-[#111111]">Ed25519 (RFC 8032)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B73]">Status:</span>
              <span className="text-emerald-700 font-bold">ACTIVE & OPERATIONAL</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B73]">Envelope Master Cipher:</span>
              <span className="text-[#111111]">AES-256-GCM (Unique 12-byte IV per object)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
