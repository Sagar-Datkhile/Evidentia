"use client";

import React, { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FolderGit2,
  FileCheck,
  Plus,
  Shield,
  Calendar,
  Users,
  GitBranch,
  ArrowRight,
  FileSearch,
  ExternalLink,
  Search,
  X,
  Loader2,
  Trash2,
} from "lucide-react";
import { evidenceStore } from "@/lib/data/store";
import { formatShortHash } from "@/lib/crypto/sha256";
import { getVerificationBadgeStyle } from "@/lib/supabase/types";
import { useAuth } from "@/components/auth/AuthProvider";

interface PageProps {
  params: Promise<{ caseId: string }>;
}

// ---- Subcomponent for dynamic case participant management ----
function CaseParticipants({ caseId }: { caseId: string }) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [assignedRole, setAssignedRole] = useState("Police Officer");
  const [isAssigning, setIsAssigning] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  // Load assignments
  const loadAssignments = async () => {
    try {
      const res = await fetch(`/api/cases/${encodeURIComponent(caseId)}/assignments`);
      if (!res.ok) throw new Error("Failed to load assignments");
      const data = await res.json();
      setAssignments(data.assignments || []);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [caseId]);

  // Debounced search
  useEffect(() => {
    if (!isAdmin) return;
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          // Exclude already assigned users
          const assignedIds = new Set(assignments.map((a) => a.user_id));
          const filtered = (data.users || []).filter((u: any) => !assignedIds.has(u.id));
          setSearchResults(filtered);
        }
      } catch (e) {
        console.error("Search error", e);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isAdmin, assignments]);

  // Handle outside click for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAssign = async () => {
    if (!selectedUser) return;
    setIsAssigning(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/cases/${encodeURIComponent(caseId)}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, assignedRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Assignment failed");
      }
      setSelectedUser(null);
      setSearchQuery("");
      await loadAssignments();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRevoke = async (userId: string) => {
    if (!window.confirm("Are you sure you want to remove this user's access to this case?")) return;
    try {
      const res = await fetch(
        `/api/cases/${encodeURIComponent(caseId)}/assignments?userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Revocation failed");
      }
      await loadAssignments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="mt-6 pt-4 border-t border-[#F1F1F3]">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#6B6B73]">
          ASSIGNED JUDICIAL PARTICIPANTS
        </span>
        <div className="mt-4 flex items-center gap-2 text-xs text-[#6B6B73]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading participants...
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-4 border-t border-[#F1F1F3]">
      <span className="font-mono text-[10px] uppercase tracking-wider text-[#6B6B73]">
        ASSIGNED JUDICIAL PARTICIPANTS
      </span>

      {errorMsg && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
          {errorMsg}
        </div>
      )}

      {/* Admin Assignment UI */}
      {isAdmin && (
        <div className="mt-3 mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 rounded-lg border border-[#E5E5E7] bg-[#F9F9FA]">
          <div className="relative flex-1 w-full" ref={searchRef}>
            {selectedUser ? (
              <div className="flex h-9 w-full items-center justify-between rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-3 py-1.5 text-xs shadow-sm">
                <span className="font-semibold text-[#111111] truncate">
                  {selectedUser.full_name || selectedUser.email}
                </span>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-[#8E8E93] hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#8E8E93]" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setDropdownOpen(true);
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    className="h-9 w-full rounded-md border border-[#E5E5E7] bg-[#FFFFFF] pl-8 pr-3 text-xs text-[#111111] placeholder-[#8E8E93] focus:border-[#111111] focus:outline-none shadow-sm"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-[#8E8E93]" />
                  )}
                </div>

                {dropdownOpen && searchQuery.trim().length >= 2 && (
                  <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-[#E5E5E7] bg-[#FFFFFF] py-1 shadow-lg">
                    {searchResults.length === 0 && !isSearching ? (
                      <div className="px-3 py-2 text-xs text-[#6B6B73]">No matching users found.</div>
                    ) : (
                      searchResults.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setSelectedUser(u);
                            setDropdownOpen(false);
                            setSearchQuery("");
                          }}
                          className="flex w-full flex-col px-3 py-1.5 text-left hover:bg-[#F9F9FA]"
                        >
                          <span className="text-xs font-semibold text-[#111111] truncate">
                            {u.full_name || "Unknown"}
                          </span>
                          <span className="text-[10px] text-[#6B6B73] truncate font-mono">
                            {u.email}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex w-full sm:w-auto items-center gap-2">
            <select
              value={assignedRole}
              onChange={(e) => setAssignedRole(e.target.value)}
              className="h-9 rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-3 text-xs text-[#111111] focus:border-[#111111] focus:outline-none shadow-sm"
            >
              <option value="Police Officer">Police Officer</option>
              <option value="Forensic Analyst">Forensic Analyst</option>
              <option value="Public Prosecutor">Public Prosecutor</option>
              <option value="Case Observer">Case Observer</option>
            </select>
            <button
              onClick={handleAssign}
              disabled={!selectedUser || isAssigning}
              className="h-9 rounded-md bg-[#111111] px-3 text-xs font-semibold text-[#FFFFFF] shadow-subtle hover:bg-[#262626] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isAssigning ? "Assigning..." : "Assign User"}
            </button>
          </div>
        </div>
      )}

      {/* Participants List */}
      {assignments.length === 0 ? (
        <div className="mt-3 text-xs text-[#6B6B73] italic">
          {isAdmin
            ? "No participants assigned yet. Search for a registered user to assign them to this case."
            : "No participants are currently assigned to this case."}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {assignments.map((a) => (
            <div
              key={`${a.case_id}-${a.user_id}`}
              className="group flex items-center gap-2 rounded-md border border-[#E5E5E7] bg-[#F9F9FA] pl-3 pr-1 py-1 text-xs transition-colors hover:border-[#D1D1D6]"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111111] text-[9px] font-bold text-white uppercase">
                  {a.profiles.full_name ? a.profiles.full_name.substring(0, 2) : "UU"}
                </div>
                <span className="font-semibold text-[#111111]">{a.profiles.full_name || "Unknown User"}</span>
                <span className="text-[#8E8E93] text-[11px]">({a.assigned_role})</span>
              </div>
              
              {isAdmin && (
                <button
                  onClick={() => handleRevoke(a.user_id)}
                  className="ml-1 rounded-sm p-1 text-[#8E8E93] opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all focus:opacity-100"
                  title="Revoke Access"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// --------------------------------------------------------------

export default function CaseDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  
  const [caseItem, setCaseItem] = useState<any>(null);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadCase() {
      try {
        const res = await fetch(`/api/cases/${encodeURIComponent(resolvedParams.caseId)}`);
        if (!res.ok) {
          throw new Error("Case not found or unauthorized");
        }
        const data = await res.json();
        setCaseItem(data.case);
        const apiEvidence = data.evidence || [];
        const demoEvidence = evidenceStore.getEvidenceByCaseId(resolvedParams.caseId);
        const ids = new Set(apiEvidence.map((e: any) => e.id));
        setEvidenceList([...apiEvidence, ...demoEvidence.filter((e) => !ids.has(e.id))]);
      } catch (err: any) {
        setErrorMsg(err.message);
        // Fallback to demo evidence
        const demoEvidence = evidenceStore.getEvidenceByCaseId(resolvedParams.caseId);
        setEvidenceList(demoEvidence);
      } finally {
        setLoading(false);
      }
    }
    loadCase();
  }, [resolvedParams.caseId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#111111]" />
      </div>
    );
  }

  if (errorMsg || !caseItem) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold text-[#111111]">Case Docket Not Found</h1>
        <p className="mt-2 text-xs text-[#6B6B73]">The requested case ID &quot;{resolvedParams.caseId}&quot; does not exist or you do not have permission.</p>
        <Link
          href="/cases"
          className="mt-6 inline-flex rounded-md bg-[#111111] px-4 py-2 text-xs font-semibold text-white"
        >
          Return to Cases
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <div className="mb-4 flex items-center gap-2 text-xs font-mono text-[#6B6B73]">
        <Link href="/cases" className="hover:text-[#111111] transition-colors">
          Cases
        </Link>
        <span>/</span>
        <span className="font-bold text-[#111111]">{caseItem.caseNumber}</span>
      </div>

      {/* Case Header Card */}
      <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-[#111111]">
                {caseItem.caseNumber}
              </span>
              <span className="rounded bg-[#F1F1F3] px-2 py-0.5 font-mono text-[10px] font-medium text-[#6B6B73]">
                {caseItem.status}
              </span>
              <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                Tamper-Evident Docket
              </span>
            </div>

            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-[#111111] sm:text-3xl">
              {caseItem.title}
            </h1>

            <p className="mt-2 text-xs text-[#6B6B73] leading-relaxed max-w-3xl">
              {caseItem.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#6B6B73] pt-3 border-t border-[#F1F1F3]">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-[#8E8E93]" />
                <span>{caseItem.jurisdiction}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#8E8E93]" />
                <span>Incident: {new Date(caseItem.incidentDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <Link
            href={`/evidence/new?caseId=${caseItem.id}`}
            className="flex items-center gap-1.5 rounded-md bg-[#111111] px-4 py-2 text-xs font-semibold text-[#FFFFFF] shadow-subtle hover:bg-[#262626] transition-all shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Evidence Item
          </Link>
        </div>

        {/* Dynamic Assigned Participants component replaces the hardcoded list */}
        <CaseParticipants caseId={caseItem.id} />
      </div>

      {/* Evidence Items Section */}
      <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle">
        <div className="flex items-center justify-between pb-4 border-b border-[#F1F1F3] mb-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-[#111111]">
              Registered Digital Evidence ({evidenceList.length})
            </h2>
            <p className="text-xs text-[#6B6B73]">
              Cryptographically sealed files, immutable Genesis V1, and authorized version commits.
            </p>
          </div>
        </div>

        {evidenceList.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#6B6B73]">
            No evidence records registered under this case yet.
          </div>
        ) : (
          <div className="divide-y divide-[#F1F1F3]">
            {evidenceList.map((item) => {
              const hash =
                item.v1Sha256 ||
                item.fileSha256 ||
                evidenceStore.getVersion(item.id, 1)?.fileSha256 ||
                null;
              const badge = getVerificationBadgeStyle(item.verificationStatus);

              return (
                <div
                  key={item.id}
                  className="py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#111111]">{item.id}</span>
                      <span className="rounded bg-[#F1F1F3] px-2 py-0.5 font-mono text-[10px] font-medium text-[#111111]">
                        Version {item.currentVersionNumber}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-[#6B6B73]">
                        {item.category}
                      </span>
                      {item.isSealed && (
                        <span className="rounded bg-amber-50 px-2 py-0.5 font-mono text-[10px] text-amber-800 border border-amber-200">
                          SEALED
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-mono font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <h3 className="font-heading text-sm font-bold text-[#111111]">{item.title}</h3>
                    <p className="mt-1 text-xs text-[#6B6B73] font-mono">
                      Original File: {item.originalFileName} &middot; Bucket: {item.storageBucket}
                    </p>
                    <p className="mt-0.5 text-[11px] font-mono text-[#6B6B73]">
                      SHA-256:{" "}
                      {hash ? (
                        <span className="text-[#111111] font-semibold" title={hash}>
                          {formatShortHash(hash, 8, 8)}
                        </span>
                      ) : (
                        <span className="text-[#8E8E93] italic">Hash unavailable</span>
                      )}
                    </p>
                  </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/evidence/${item.id}/verify`}
                    className="flex items-center gap-1.5 rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-3 py-1.5 text-xs font-semibold text-[#111111] hover:border-[#111111] transition-colors"
                  >
                    <FileSearch className="h-3.5 w-3.5 text-[#6B6B73]" />
                    Verify Integrity
                  </Link>

                  <Link
                    href={`/evidence/${item.id}/timeline`}
                    className="flex items-center gap-1.5 rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-3 py-1.5 text-xs font-semibold text-[#111111] hover:border-[#111111] transition-colors"
                  >
                    <GitBranch className="h-3.5 w-3.5 text-[#6B6B73]" />
                    Commit Graph
                  </Link>

                  <Link
                    href={`/evidence/${item.id}/compare`}
                    className="flex items-center gap-1.5 rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-3 py-1.5 text-xs font-semibold text-[#111111] hover:border-[#111111] transition-colors"
                  >
                    Diff Engine
                  </Link>

                  <Link
                    href={`/evidence/${item.id}/passport`}
                    className="flex items-center gap-1.5 rounded-md bg-[#111111] px-3 py-1.5 text-xs font-semibold text-[#FFFFFF] hover:bg-[#262626] transition-colors"
                  >
                    Report
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
