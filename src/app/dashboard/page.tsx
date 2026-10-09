"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  FolderGit2,
  FileCheck,
  ArrowRightLeft,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Plus,
  FileSearch,
  Scale,
  Building2,
  Lock,
  GitBranch,
} from "lucide-react";
import {
  evidenceStore,
  DEMO_USERS,
} from "@/lib/data/store";
import { UserProfile, Case, EvidenceItem, CustodyTransfer, CustodyEvent, formatRoleLabel } from "@/lib/supabase/types";
import { formatShortHash } from "@/lib/crypto/sha256";
import { useAuth } from "@/components/auth/AuthProvider";

export default function DashboardPage() {
  const { user, profile, canRegister } = useAuth();
  const [activeUser, setActiveUser] = useState<UserProfile>(() => {
    return profile || DEMO_USERS.police;
  });
  const [cases, setCases] = useState<Case[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [transfers, setTransfers] = useState<CustodyTransfer[]>([]);
  const [custodyEvents, setCustodyEvents] = useState<CustodyEvent[]>([]);

  useEffect(() => {
    if (profile) {
      setActiveUser(profile);
    } else {
      const saved = localStorage.getItem("evidentia_active_user");
      if (saved && DEMO_USERS[saved]) {
        setActiveUser(DEMO_USERS[saved]);
      }
    }

    const refreshData = () => {
      setCases(evidenceStore.getCases());
      setEvidenceList(evidenceStore.getAllEvidence());
      const allTransfers: CustodyTransfer[] = [];
      const allEvents: CustodyEvent[] = [];
      for (const e of evidenceStore.getAllEvidence()) {
        allTransfers.push(...evidenceStore.getTransfersByEvidenceId(e.id));
        allEvents.push(...evidenceStore.getCustodyEventsByEvidenceId(e.id));
      }
      setTransfers(allTransfers);
      setCustodyEvents(allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    };

    refreshData();

    // Listen for role change events from Navbar
    const handleUserChange = (e: any) => {
      if (e.detail) {
        setActiveUser(e.detail);
        refreshData();
      }
    };

    window.addEventListener("evidentia_user_changed", handleUserChange);
    return () => window.removeEventListener("evidentia_user_changed", handleUserChange);
  }, []);

  const pendingTransfers = transfers.filter((t) => t.status === "PENDING");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ------------------------------------------------------------------- */}
      {/* HEADER & ROLE BANNER */}
      {/* ------------------------------------------------------------------- */}
      <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#6B6B73]">
                Role Dashboard &middot; {formatRoleLabel(activeUser.role)}
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-800 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Session Authenticated
              </span>
            </div>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
              Welcome, {activeUser.fullName}
            </h1>
            <p className="mt-1 text-xs text-[#6B6B73]">
              {activeUser.organizationName || "Judicial Operations"} {activeUser.badgeNumber ? `· Badge #${activeUser.badgeNumber}` : `· ${activeUser.email}`}
            </p>
          </div>

          {/* Quick Context Action */}
          <div className="flex flex-wrap items-center gap-2.5">
            {canRegister && (
              <Link
                href="/evidence/new"
                className="flex items-center gap-1.5 rounded-md bg-[#111111] px-4 py-2 text-xs font-semibold text-[#FFFFFF] shadow-subtle transition-all hover:bg-[#262626]"
              >
                <Plus className="h-3.5 w-3.5" />
                Register Evidence
              </Link>
            )}
            <Link
              href="/cases"
              className="flex items-center gap-1.5 rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-4 py-2 text-xs font-medium text-[#111111] shadow-subtle transition-all hover:border-[#111111]"
            >
              <FolderGit2 className="h-3.5 w-3.5 text-[#6B6B73]" />
              View Case Dockets
            </Link>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* KPI METRIC CARDS */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-5 shadow-subtle">
          <span className="font-mono text-[11px] text-[#6B6B73]">ASSIGNED CASES</span>
          <p className="mt-2 font-heading text-2xl font-bold text-[#111111]">{cases.length}</p>
          <p className="mt-1 text-[11px] text-[#8E8E93]">Court-mandated investigations</p>
        </div>

        <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-5 shadow-subtle">
          <span className="font-mono text-[11px] text-[#6B6B73]">EVIDENCE ITEMS</span>
          <p className="mt-2 font-heading text-2xl font-bold text-[#111111]">{evidenceList.length}</p>
          <p className="mt-1 text-[11px] text-[#8E8E93]">Sealed original items</p>
        </div>

        <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-5 shadow-subtle">
          <span className="font-mono text-[11px] text-[#6B6B73]">PENDING HANDOFFS</span>
          <p className="mt-2 font-heading text-2xl font-bold text-[#111111]">{pendingTransfers.length}</p>
          <p className="mt-1 text-[11px] text-[#8E8E93]">Custody transfer requests</p>
        </div>

        <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-5 shadow-subtle">
          <span className="font-mono text-[11px] text-[#6B6B73]">MERKLE ATTESTATION</span>
          <p className="mt-2 font-heading text-2xl font-bold text-emerald-700">ACTIVE</p>
          <p className="mt-1 text-[11px] text-[#8E8E93]">Ed25519 system signature</p>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* ROLE-SPECIFIC QUICK ACTIONS & ALERTS */}
      {/* ------------------------------------------------------------------- */}
      {pendingTransfers.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="text-xs font-bold text-amber-900">
                Action Required: {pendingTransfers.length} Custody Transfer Request Pending
              </h3>
              <p className="mt-0.5 text-xs text-amber-800">
                Evidence transfer requires verification of seal and step-up authentication.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Link
                  href="/custody"
                  className="rounded-md bg-amber-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-900"
                >
                  Review In Custody Hub &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MAIN TWO-COLUMN WORKFLOW SECTION */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Assigned Cases & Primary Evidence Table (8 cols) */}
        <div className="space-y-8 lg:col-span-8">
          {/* Active Cases Docket */}
          <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle">
            <div className="flex items-center justify-between pb-4 border-b border-[#F1F1F3]">
              <div>
                <h2 className="font-heading text-base font-bold text-[#111111]">
                  Active Judicial Cases
                </h2>
                <p className="text-xs text-[#6B6B73]">
                  Case dockets under active digital evidence supervision
                </p>
              </div>
              <Link
                href="/cases"
                className="text-xs font-semibold text-[#111111] hover:underline flex items-center gap-1"
              >
                All Cases <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="divide-y divide-[#F1F1F3] mt-2">
              {cases.map((c) => (
                <div key={c.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#111111]">{c.caseNumber}</span>
                      <span className="rounded bg-[#F1F1F3] px-2 py-0.5 font-mono text-[10px] text-[#6B6B73]">
                        {c.status}
                      </span>
                    </div>
                    <h3 className="mt-1 text-sm font-semibold text-[#111111]">{c.title}</h3>
                    <p className="text-xs text-[#6B6B73] mt-0.5">{c.jurisdiction}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs text-[#6B6B73] mr-2">
                      {c.evidenceCount} items
                    </span>
                    <Link
                      href={`/cases/${c.id}`}
                      className="rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-1.5 text-xs font-semibold text-[#111111] hover:border-[#111111] transition-colors"
                    >
                      Open Docket
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Registry Quick View */}
          <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle">
            <div className="flex items-center justify-between pb-4 border-b border-[#F1F1F3]">
              <div>
                <h2 className="font-heading text-base font-bold text-[#111111]">
                  Evidence Registry
                </h2>
                <p className="text-xs text-[#6B6B73]">
                  Sealed records, version commits, and verification status
                </p>
              </div>
              <Link
                href="/evidence"
                className="text-xs font-semibold text-[#111111] hover:underline flex items-center gap-1"
              >
                All Evidence <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="divide-y divide-[#F1F1F3] mt-2">
              {evidenceList.map((item) => (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#111111]">{item.id}</span>
                      <span className="rounded bg-[#F1F1F3] px-1.5 py-0.5 font-mono text-[10px] text-[#6B6B73]">
                        V{item.currentVersionNumber}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-[#6B6B73]">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="mt-1 text-xs font-semibold text-[#111111]">{item.title}</h3>
                    <p className="text-[11px] text-[#8E8E93] mt-0.5 font-mono">
                      File: {item.originalFileName} &middot; Case: {item.caseNumber}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/evidence/${item.id}/verify`}
                      className="rounded border border-[#E5E5E7] bg-[#FFFFFF] px-2.5 py-1 text-[11px] font-semibold text-[#111111] hover:border-[#111111] transition-colors"
                      title="Verify candidate file against trusted hash"
                    >
                      Verify
                    </Link>
                    <Link
                      href={`/evidence/${item.id}/timeline`}
                      className="rounded border border-[#E5E5E7] bg-[#FFFFFF] px-2.5 py-1 text-[11px] font-semibold text-[#111111] hover:border-[#111111] transition-colors"
                    >
                      Timeline
                    </Link>
                    <Link
                      href={`/evidence/${item.id}/passport`}
                      className="rounded bg-[#111111] px-2.5 py-1 text-[11px] font-semibold text-[#FFFFFF] hover:bg-[#262626] transition-colors"
                    >
                      Passport
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Custody Activity Stream & Cryptographic Status (4 cols) */}
        <div className="space-y-8 lg:col-span-4">
          {/* Cryptographic Trust Box */}
          <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-5 shadow-subtle">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-[#111111]" />
              <h3 className="font-heading text-sm font-bold text-[#111111]">
                Attestation Engine Status
              </h3>
            </div>
            <div className="space-y-2.5 text-xs text-[#6B6B73]">
              <div className="flex items-center justify-between border-b border-[#F1F1F3] pb-2">
                <span>System Attestation</span>
                <span className="font-mono text-emerald-700 font-semibold">Ed25519 Online</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#F1F1F3] pb-2">
                <span>Domain Merkle Tree</span>
                <span className="font-mono text-[#111111]">RFC 6962 Compliant</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#F1F1F3] pb-2">
                <span>Envelope Encryption</span>
                <span className="font-mono text-[#111111]">AES-256-GCM</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Step-Up Authentication</span>
                <span className="font-mono text-[#111111]">FIDO2 / Passkeys</span>
              </div>
            </div>
          </div>

          {/* Recent Custody & Commit Events */}
          <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-5 shadow-subtle">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#F1F1F3]">
              <h3 className="font-heading text-sm font-bold text-[#111111]">
                Recent Audit Lineage
              </h3>
              <Clock className="h-3.5 w-3.5 text-[#6B6B73]" />
            </div>

            <div className="relative pl-4 space-y-5 border-l border-[#E5E5E7]">
              {custodyEvents.slice(0, 5).map((evt) => (
                <div key={evt.id} className="relative">
                  {/* Dot */}
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[#FFFFFF] bg-[#111111]" />
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#6B6B73]">
                    <span className="font-semibold text-[#111111]">{evt.eventType}</span>
                    <span>{new Date(evt.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-[#111111]">
                    {evt.evidenceId}
                  </p>
                  <p className="text-[11px] text-[#6B6B73]">
                    By {evt.actorName}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#F1F1F3]">
              <Link
                href="/reports"
                className="text-xs font-semibold text-[#111111] hover:underline flex items-center justify-center gap-1"
              >
                View Full Audit Logs &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
