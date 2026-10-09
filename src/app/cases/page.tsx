"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FolderGit2, Plus, Search, Filter, Shield, Calendar, Users, ArrowRight } from "lucide-react";
import { evidenceStore, DEMO_USERS } from "@/lib/data/store";
import { Case } from "@/lib/supabase/types";

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>(evidenceStore.getCases());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Case Form State
  const [newCaseNumber, setNewCaseNumber] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newJurisdiction, setNewJurisdiction] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseNumber || !newTitle || !newJurisdiction) return;

    const created = evidenceStore.createCase({
      id: newCaseNumber.trim(),
      caseNumber: newCaseNumber.trim(),
      title: newTitle.trim(),
      jurisdiction: newJurisdiction.trim(),
      status: "Active",
      incidentDate: new Date().toISOString(),
      description: newDescription.trim() || "Official judicial investigation dossier.",
      createdBy: "usr_police_01",
    });

    setCases(evidenceStore.getCases());
    setShowCreateModal(false);
    setNewCaseNumber("");
    setNewTitle("");
    setNewJurisdiction("");
    setNewDescription("");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#6B6B73]">
              Judicial Dockets
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
            Case Management
          </h1>
          <p className="mt-1 text-xs text-[#6B6B73]">
            Court dockets and investigations with assigned zero-trust digital evidence records.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-md bg-[#111111] px-4 py-2 text-xs font-semibold text-[#FFFFFF] shadow-subtle hover:bg-[#262626] transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Case Docket
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-4 shadow-subtle mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8E8E93]" />
            <input
              type="text"
              placeholder="Search case number, title, bench..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] pl-9 pr-3 py-2 text-xs text-[#111111] placeholder-[#8E8E93] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-[#6B6B73]" />
            <span className="text-xs text-[#6B6B73] font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-3 py-1.5 text-xs text-[#111111] focus:border-[#111111] focus:outline-none font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Under Analysis">Under Analysis</option>
              <option value="In Trial">In Trial</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cases List */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {filteredCases.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle hover:border-[#111111] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-mono text-xs font-bold text-[#111111]">{c.caseNumber}</span>
                <span className="rounded bg-[#F1F1F3] px-2 py-0.5 font-mono text-[10px] font-medium text-[#6B6B73]">
                  {c.status}
                </span>
              </div>

              <h3 className="font-heading text-base font-bold text-[#111111]">{c.title}</h3>
              <p className="mt-1 text-xs text-[#6B6B73] line-clamp-2 leading-relaxed">
                {c.description}
              </p>

              <div className="mt-4 pt-3 border-t border-[#F1F1F3] space-y-1.5 text-xs text-[#6B6B73]">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-[#8E8E93]" />
                  <span>{c.jurisdiction}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-[#8E8E93]" />
                  <span>Registered: {new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-[#8E8E93]" />
                  <span>
                    {c.assignedUsers?.length || 2} Assigned Officers & Analysts
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F1F1F3] flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-[#111111]">
                {c.evidenceCount} Sealed Evidence Items
              </span>
              <Link
                href={`/cases/${c.id}`}
                className="flex items-center gap-1 rounded-md bg-[#111111] px-3.5 py-1.5 text-xs font-semibold text-[#FFFFFF] hover:bg-[#262626] transition-colors"
              >
                Inspect Docket
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-modal animate-in zoom-in-95">
            <h2 className="font-heading text-lg font-bold text-[#111111]">
              Register New Case Docket
            </h2>
            <p className="mt-1 text-xs text-[#6B6B73]">
              Assign an official case number and court jurisdiction.
            </p>

            <form onSubmit={handleCreateCase} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1">
                  Case Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CASE-2026-0105"
                  value={newCaseNumber}
                  onChange={(e) => setNewCaseNumber(e.target.value)}
                  className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1">
                  Case Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State vs. Enterprise Intrusion Group"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1">
                  Court Jurisdiction / Bench <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High Court of Delhi - Cyber Division"
                  value={newJurisdiction}
                  onChange={(e) => setNewJurisdiction(e.target.value)}
                  className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1">
                  Investigation Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief factual context of the alleged incident and evidence mandate."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-2 border-t border-[#F1F1F3]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-4 py-2 text-xs font-medium text-[#6B6B73] hover:text-[#111111]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#111111] px-4 py-2 text-xs font-semibold text-[#FFFFFF] hover:bg-[#262626]"
                >
                  Create Docket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
