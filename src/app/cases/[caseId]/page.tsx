"use client";

import React, { use } from "react";
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
} from "lucide-react";
import { evidenceStore } from "@/lib/data/store";

interface PageProps {
  params: Promise<{ caseId: string }>;
}

export default function CaseDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const caseItem = evidenceStore.getCaseById(resolvedParams.caseId);

  if (!caseItem) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold text-[#111111]">Case Docket Not Found</h1>
        <p className="mt-2 text-xs text-[#6B6B73]">The requested case ID &quot;{resolvedParams.caseId}&quot; does not exist.</p>
        <Link
          href="/cases"
          className="mt-6 inline-flex rounded-md bg-[#111111] px-4 py-2 text-xs font-semibold text-white"
        >
          Return to Cases
        </Link>
      </div>
    );
  }

  const evidenceList = evidenceStore.getEvidenceByCaseId(caseItem.id);

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

        {/* Assigned Participants */}
        <div className="mt-6 pt-4 border-t border-[#F1F1F3]">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#6B6B73]">
            Assigned Judicial Participants
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {caseItem.assignedUsers.map((u) => (
              <div
                key={u.userId}
                className="flex items-center gap-2 rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-1.5 text-xs"
              >
                <div className="h-2 w-2 rounded-full bg-[#111111]" />
                <span className="font-semibold text-[#111111]">{u.fullName}</span>
                <span className="text-[#8E8E93]">({u.role})</span>
              </div>
            ))}
          </div>
        </div>
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
            {evidenceList.map((item) => (
              <div
                key={item.id}
                className="py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
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
                  </div>

                  <h3 className="font-heading text-sm font-bold text-[#111111]">{item.title}</h3>
                  <p className="mt-1 text-xs text-[#6B6B73] font-mono">
                    Original File: {item.originalFileName} &middot; Bucket: {item.storageBucket}
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
                    Passport
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
