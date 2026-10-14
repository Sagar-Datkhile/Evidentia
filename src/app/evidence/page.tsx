"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Copy,
  Check,
  Shield,
  Loader2,
  AlertCircle,
  GitCommit,
} from "lucide-react";
import { evidenceStore } from "@/lib/data/store";
import { EvidenceItem, getVerificationBadgeStyle } from "@/lib/supabase/types";
import { formatShortHash } from "@/lib/crypto/sha256";
import { useAuth } from "@/components/auth/AuthProvider";

export default function EvidenceListPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Load evidence: prefer Supabase API, fall back to in-memory store ──────────
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Not signed in → use in-memory demo data
      setEvidenceList(evidenceStore.getAllEvidence());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    fetch("/api/evidence/list")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const fromApi: EvidenceItem[] = data.evidence ?? [];
        // Merge with in-memory demo data (deduplicate by id)
        const demoItems = evidenceStore.getAllEvidence();
        const ids = new Set(fromApi.map((e) => e.id));
        const merged = [...fromApi, ...demoItems.filter((e) => !ids.has(e.id))];
        setEvidenceList(merged);
      })
      .catch((err) => {
        // On API error, fall back to in-memory store with warning
        console.warn("[EvidenceList] API failed, using demo store:", err.message);
        setEvidenceList(evidenceStore.getAllEvidence());
        setLoadError("Live database unavailable — showing cached demo data.");
      })
      .finally(() => setIsLoading(false));
  }, [authLoading, user]);

  const filteredEvidence = evidenceList.filter((item) => {
    const matchesSearch =
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.originalFileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
              Evidence Repository
            </span>
            {user && (
              <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                Live DB
              </span>
            )}
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
            Digital Evidence Registry
          </h1>
          <p className="mt-1 text-xs text-[#6B6B73]">
            Immutable records · raw-byte SHA-256 hashes · version commit trees · AES-256-GCM encrypted at rest
          </p>
        </div>

        <Link
          href="/evidence/new"
          className="flex items-center gap-1.5 rounded-md bg-[#111111] px-4 py-2 text-xs font-semibold text-[#FFFFFF] shadow-subtle hover:bg-[#262626] transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          Register New Evidence
        </Link>
      </div>

      {/* Load Error Warning */}
      {loadError && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {loadError}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-4 shadow-subtle mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8E8E93]" />
            <input
              type="text"
              placeholder="Search EV-ID, title, case, or filename…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] pl-9 pr-3 py-2 text-xs text-[#111111] placeholder-[#8E8E93] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-[#6B6B73]" />
            <span className="text-xs text-[#6B6B73] font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-3 py-1.5 text-xs text-[#111111] focus:border-[#111111] focus:outline-none font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="Document">Document</option>
              <option value="Digital Image">Digital Image</option>
              <option value="Video">Video</option>
              <option value="Audio">Audio</option>
              <option value="Forensic Dump">Forensic Dump</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table / Cards */}
      <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] shadow-subtle overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-xs font-mono text-[#6B6B73]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading evidence from secure registry…
          </div>
        ) : filteredEvidence.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Shield className="h-10 w-10 text-[#E5E5E7] mb-3" />
            <p className="text-sm font-semibold text-[#111111]">No evidence records found</p>
            <p className="text-xs text-[#6B6B73] mt-1">
              {searchQuery || categoryFilter !== "ALL"
                ? "Try clearing your search or filter."
                : "Register the first evidence item to get started."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E5E7] bg-[#F9F9FA] text-[11px] font-mono uppercase text-[#6B6B73]">
                    <th className="px-5 py-3 font-semibold">Evidence ID</th>
                    <th className="px-5 py-3 font-semibold">Title &amp; Case</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Version</th>
                    <th className="px-5 py-3 font-semibold">V1 Hash</th>
                    <th className="px-4 py-3 font-semibold">Integrity</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F1F3] text-xs">
                  {filteredEvidence.map((item) => {
                    const hash =
                      item.v1Sha256 ||
                      item.fileSha256 ||
                      evidenceStore.getVersion(item.id, 1)?.fileSha256 ||
                      null;
                    const badge = getVerificationBadgeStyle(item.verificationStatus);

                    return (
                      <tr key={item.id} className="hover:bg-[#F9F9FA] transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-[#111111] whitespace-nowrap">
                          {item.id}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-[#111111]">{item.title}</div>
                          <div className="text-[11px] text-[#6B6B73] font-mono mt-0.5">
                            {item.caseNumber} &middot; {item.originalFileName}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="rounded bg-[#F1F1F3] px-2 py-0.5 text-[10px] font-mono text-[#6B6B73]">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-mono font-semibold text-white">
                            V{item.currentVersionNumber}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-[11px] text-[#6B6B73] whitespace-nowrap">
                          {!hash ? (
                            <span className="text-[#8E8E93] font-mono text-[10px]">Hash unavailable</span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span>{formatShortHash(hash, 6, 6)}</span>
                              <button
                                onClick={() => copyToClipboard(hash, item.id)}
                                className="text-[#8E8E93] hover:text-[#111111] transition-colors"
                                title="Copy full SHA-256"
                              >
                                {copiedId === item.id ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-mono font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/evidence/${item.id}/verify`}
                              className="rounded border border-[#E5E5E7] bg-[#FFFFFF] px-2.5 py-1 text-[11px] font-semibold text-[#111111] hover:border-[#111111]"
                            >
                              Verify
                            </Link>
                            <Link
                              href={`/evidence/${item.id}/timeline`}
                              className="rounded border border-[#E5E5E7] bg-[#FFFFFF] px-2.5 py-1 text-[11px] font-semibold text-[#111111] hover:border-[#111111]"
                            >
                              Timeline
                            </Link>
                            <Link
                              href={`/evidence/${item.id}/passport`}
                              className="rounded bg-[#111111] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#262626]"
                            >
                              Report
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Fallback */}
            <div className="block md:hidden divide-y divide-[#F1F1F3]">
              {filteredEvidence.map((item) => {
                const hash =
                  item.v1Sha256 ||
                  item.fileSha256 ||
                  evidenceStore.getVersion(item.id, 1)?.fileSha256 ||
                  null;
                const badge = getVerificationBadgeStyle(item.verificationStatus);

                return (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#111111]">{item.id}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-[#F1F1F3] px-2 py-0.5 text-[10px] font-mono text-[#6B6B73]">
                          {item.category}
                        </span>
                        <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-mono font-semibold text-white">
                          V{item.currentVersionNumber}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-heading text-sm font-bold text-[#111111]">{item.title}</h3>
                      <p className="text-[11px] text-[#6B6B73] font-mono mt-0.5">
                        {item.caseNumber} &middot; {item.originalFileName}
                      </p>
                    </div>

                    <div className="flex items-center justify-between rounded bg-[#F9F9FA] p-2 font-mono text-[10px] text-[#6B6B73]">
                      <span>
                        V1 Hash: {hash ? formatShortHash(hash, 6, 6) : "Unavailable"}
                      </span>
                      {hash && (
                        <button
                          onClick={() => copyToClipboard(hash, item.id)}
                          className="text-[#111111] font-semibold flex items-center gap-1"
                        >
                          {copiedId === item.id ? "Copied" : "Copy"}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <Link
                        href={`/evidence/${item.id}/verify`}
                        className="rounded border border-[#E5E5E7] bg-[#FFFFFF] py-1.5 text-center text-[11px] font-semibold text-[#111111]"
                      >
                        Verify
                      </Link>
                      <Link
                        href={`/evidence/${item.id}/timeline`}
                        className="rounded border border-[#E5E5E7] bg-[#FFFFFF] py-1.5 text-center text-[11px] font-semibold text-[#111111]"
                      >
                        Timeline
                      </Link>
                      <Link
                        href={`/evidence/${item.id}/passport`}
                        className="rounded bg-[#111111] py-1.5 text-center text-[11px] font-semibold text-white"
                      >
                        Report
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer stats */}
      {!isLoading && (
        <div className="mt-3 flex items-center gap-3 text-[11px] font-mono text-[#8E8E93]">
          <GitCommit className="h-3.5 w-3.5" />
          <span>
            {filteredEvidence.length} record{filteredEvidence.length !== 1 ? "s" : ""} shown
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
        </div>
      )}
    </div>
  );
}
