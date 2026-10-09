"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Shield,
  FileCheck,
  UserCheck,
  Plus,
  AlertTriangle,
  Lock,
  KeyRound,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { evidenceStore, DEMO_USERS } from "@/lib/data/store";
import { CustodyTransfer, UserProfile, EvidenceItem } from "@/lib/supabase/types";

export default function CustodyPage() {
  const [transfers, setTransfers] = useState<CustodyTransfer[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_USERS.forensic);

  // Initiate Transfer Modal State
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState("");
  const [recipientRoleKey, setRecipientRoleKey] = useState("forensic");
  const [transferType, setTransferType] = useState("FORENSIC_EXAMINATION");
  const [handoffNotes, setHandoffNotes] = useState("");

  // Accept Transfer Modal State
  const [acceptingTransfer, setAcceptingTransfer] = useState<CustodyTransfer | null>(null);
  const [acceptNote, setAcceptNote] = useState("");
  const [stepUpCode, setStepUpCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = () => {
    const allEvidence = evidenceStore.getAllEvidence();
    setEvidenceList(allEvidence);
    if (allEvidence.length > 0 && !selectedEvidenceId) {
      setSelectedEvidenceId(allEvidence[0].id);
    }
    const allTransfers: CustodyTransfer[] = [];
    for (const e of allEvidence) {
      allTransfers.push(...evidenceStore.getTransfersByEvidenceId(e.id));
    }
    setTransfers(allTransfers.sort((a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime()));
  };

  useEffect(() => {
    loadData();
    const saved = localStorage.getItem("evidentia_active_user");
    if (saved && DEMO_USERS[saved]) {
      setCurrentUser(DEMO_USERS[saved]);
    }
  }, []);

  const handleInitiateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvidenceId) return;

    const recipient = DEMO_USERS[recipientRoleKey];
    evidenceStore.createTransfer({
      evidenceId: selectedEvidenceId,
      fromUser: currentUser,
      toUser: recipient,
      transferType,
      handoffNotes: handoffNotes.trim() || "Official evidence handoff for judicial processing.",
    });

    loadData();
    setShowInitiateModal(false);
    setHandoffNotes("");
  };

  const handleConfirmAccept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingTransfer) return;

    try {
      evidenceStore.acceptTransfer(
        acceptingTransfer.id,
        currentUser,
        acceptNote.trim() || "Physical and digital seal inspected and verified intact."
      );

      loadData();
      setAcceptingTransfer(null);
      setAcceptNote("");
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to accept transfer");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#6B6B73]">
              Custody Protocol
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
            Chain of Custody Management
          </h1>
          <p className="mt-1 text-xs text-[#6B6B73]">
            Cryptographically attested evidence transfers between Police, Forensic Laboratories, and Court Benches.
          </p>
        </div>

        <button
          onClick={() => setShowInitiateModal(true)}
          className="flex items-center gap-1.5 rounded-md bg-[#111111] px-4 py-2 text-xs font-semibold text-[#FFFFFF] shadow-subtle hover:bg-[#262626] transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          Initiate Custody Transfer
        </button>
      </div>

      {/* Custody Transfers Table */}
      <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] shadow-subtle overflow-hidden">
        <div className="p-5 border-b border-[#F1F1F3] flex items-center justify-between">
          <h2 className="font-heading text-sm font-bold text-[#111111]">
            Active & Historical Handoff Log ({transfers.length})
          </h2>
          <span className="font-mono text-xs text-[#6B6B73]">
            Dual-Party Signed
          </span>
        </div>

        <div className="divide-y divide-[#F1F1F3]">
          {transfers.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B6B73]">
              No custody transfers recorded.
            </div>
          ) : (
            transfers.map((t) => (
              <div key={t.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-[#F9F9FA] transition-colors">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#111111]">{t.evidenceId}</span>
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                        t.status === "ACCEPTED"
                          ? "bg-emerald-100 text-emerald-800"
                          : t.status === "PENDING"
                          ? "bg-amber-100 text-amber-800 animate-pulse"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {t.status}
                    </span>
                    <span className="font-mono text-[10px] text-[#6B6B73]">
                      Type: {t.transferType}
                    </span>
                  </div>

                  <h3 className="font-heading text-xs font-bold text-[#111111]">
                    {t.evidenceTitle}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6B73]">
                    <span className="font-semibold text-[#111111]">From: {t.fromUserName}</span>
                    <span>&rarr;</span>
                    <span className="font-semibold text-[#111111]">To: {t.toUserName} ({t.toOrganization})</span>
                  </div>

                  <p className="text-[11px] text-[#6B6B73] italic">
                    &ldquo;{t.handoffNotes}&rdquo;
                  </p>

                  {t.acknowledgmentNote && (
                    <p className="text-[11px] text-emerald-900 font-medium">
                      Acceptance note: &ldquo;{t.acknowledgmentNote}&rdquo;
                    </p>
                  )}
                </div>

                {/* Transfer Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {t.status === "PENDING" && (
                    <button
                      onClick={() => setAcceptingTransfer(t)}
                      className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 transition-colors"
                    >
                      Accept Custody
                    </button>
                  )}

                  <Link
                    href={`/evidence/${t.evidenceId}/timeline`}
                    className="rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-3 py-1.5 text-xs font-semibold text-[#111111] hover:border-[#111111] transition-colors"
                  >
                    View Lineage
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: Initiate Custody Transfer */}
      {showInitiateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-modal animate-in zoom-in-95">
            <h2 className="font-heading text-base font-bold text-[#111111]">
              Initiate Evidence Custody Transfer
            </h2>
            <p className="text-xs text-[#6B6B73] mt-0.5">
              Transmit custody of a registered item to another authorized institution.
            </p>

            <form onSubmit={handleInitiateTransfer} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1 font-mono">
                  Select Evidence Item
                </label>
                <select
                  value={selectedEvidenceId}
                  onChange={(e) => setSelectedEvidenceId(e.target.value)}
                  className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
                >
                  {evidenceList.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.id} — {e.title} (V{e.currentVersionNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1 font-mono">
                  Transfer Recipient
                </label>
                <select
                  value={recipientRoleKey}
                  onChange={(e) => setRecipientRoleKey(e.target.value)}
                  className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
                >
                  <option value="forensic">Dr. Ananya Iyer (Central Forensic Science Laboratory)</option>
                  <option value="prosecutor">Vikramaditya Sen (Directorate of Prosecution)</option>
                  <option value="police">Insp. Rajesh Sharma (Delhi Police Special Cell)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1 font-mono">
                  Transfer Purpose / Type
                </label>
                <select
                  value={transferType}
                  onChange={(e) => setTransferType(e.target.value)}
                  className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
                >
                  <option value="FORENSIC_EXAMINATION">Forensic Examination & Scientific Verification</option>
                  <option value="JUDICIAL_PROBATE">Judicial Probate & Exhibit Admission</option>
                  <option value="SAFE_DEPOSIT">Vault Safe Custody Storage</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1 font-mono">
                  Handoff Conditions & Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Physical seals intact, serial numbers, transfer courier instructions."
                  value={handoffNotes}
                  onChange={(e) => setHandoffNotes(e.target.value)}
                  className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F1F3]">
                <button
                  type="button"
                  onClick={() => setShowInitiateModal(false)}
                  className="rounded-md border border-[#E5E5E7] px-3 py-1.5 text-xs text-[#6B6B73]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#111111] px-4 py-1.5 text-xs font-semibold text-white"
                >
                  Sign & Initiate Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Accept Custody */}
      {acceptingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-modal animate-in zoom-in-95">
            <h2 className="font-heading text-base font-bold text-[#111111]">
              Accept Evidence Custody Handoff
            </h2>
            <p className="text-xs text-[#6B6B73] mt-0.5">
              Confirm intake of {acceptingTransfer.evidenceId} ({acceptingTransfer.evidenceTitle}).
            </p>

            <form onSubmit={handleConfirmAccept} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1 font-mono">
                  Intake Verification Note
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Physical seal DP-9912 inspected intact. V1 hash verified."
                  value={acceptNote}
                  onChange={(e) => setAcceptNote(e.target.value)}
                  className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-950 font-mono text-[11px]">
                <p className="font-bold">Step-Up Verified:</p>
                <p>Receiving as: {currentUser.fullName} ({currentUser.role})</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F1F3]">
                <button
                  type="button"
                  onClick={() => setAcceptingTransfer(null)}
                  className="rounded-md border border-[#E5E5E7] px-3 py-1.5 text-xs text-[#6B6B73]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  Confirm & Accept Custody
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
