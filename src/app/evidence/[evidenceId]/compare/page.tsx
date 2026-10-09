"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  GitCompare,
  FileText,
  Columns,
  Rows,
  ArrowRight,
  ShieldAlert,
  GitBranch,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { evidenceStore } from "@/lib/data/store";
import { computeTextDiff, DiffSummary } from "@/lib/diff/text-diff";
import { EvidenceItem, EvidenceVersion } from "@/lib/supabase/types";

interface PageProps {
  params: Promise<{ evidenceId: string }>;
}

export default function EvidenceComparePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const evidenceId = resolvedParams.evidenceId;

  const [evidenceItem, setEvidenceItem] = useState<EvidenceItem | undefined>(undefined);
  const [versions, setVersions] = useState<EvidenceVersion[]>([]);
  const [baseVerNum, setBaseVerNum] = useState<number>(1);
  const [compareVerNum, setCompareVerNum] = useState<number>(2);
  const [viewMode, setViewMode] = useState<"split" | "unified">("split");
  const [diffResult, setDiffResult] = useState<DiffSummary | null>(null);

  useEffect(() => {
    const item = evidenceStore.getEvidenceById(evidenceId);
    setEvidenceItem(item);
    if (item) {
      const vList = evidenceStore.getVersionsByEvidenceId(item.id);
      setVersions(vList);
      if (vList.length >= 2) {
        setBaseVerNum(vList[0].versionNumber);
        setCompareVerNum(vList[1].versionNumber);
      } else if (vList.length === 1) {
        setBaseVerNum(1);
        setCompareVerNum(1);
      }
    }
  }, [evidenceId]);

  const baseVersion = versions.find((v) => v.versionNumber === baseVerNum);
  const compareVersion = versions.find((v) => v.versionNumber === compareVerNum);

  useEffect(() => {
    const baseText = baseVersion?.textContent || "No text content available for base version.";
    const compareText = compareVersion?.textContent || "No text content available for compare version.";
    const diff = computeTextDiff(baseText, compareText);
    setDiffResult(diff);
  }, [baseVersion, compareVersion]);

  if (!evidenceItem) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-heading text-xl font-bold text-[#111111]">Loading Diff Engine...</h1>
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
        <Link href={`/evidence/${evidenceItem.id}`} className="hover:text-[#111111] transition-colors">
          {evidenceItem.id}
        </Link>
        <span>/</span>
        <span className="font-bold text-[#111111]">Document Diff</span>
      </div>

      {/* Header */}
      <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-[#111111]">{evidenceItem.id}</span>
              <span className="rounded bg-[#F1F1F3] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#111111]">
                Semantic Diff Engine
              </span>
            </div>

            <h1 className="font-heading text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
              Version Comparison: {evidenceItem.title}
            </h1>
            <p className="mt-1 text-xs text-[#6B6B73]">
              Side-by-side and unified paragraph comparison highlighting added, deleted, and preserved text.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/evidence/${evidenceItem.id}/verify`}
              className="flex items-center gap-1.5 rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-3.5 py-2 text-xs font-semibold text-[#111111] hover:border-[#111111]"
            >
              Verify Pipeline
            </Link>
            <Link
              href={`/evidence/${evidenceItem.id}/timeline`}
              className="flex items-center gap-1.5 rounded-md bg-[#111111] px-3.5 py-2 text-xs font-semibold text-[#FFFFFF] hover:bg-[#262626]"
            >
              <GitBranch className="h-3.5 w-3.5" />
              Commit Graph
            </Link>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-6 rounded-md border border-[#E5E5E7] bg-[#F9F9FA] p-3 text-xs text-[#6B6B73] flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-[#8E8E93] shrink-0" />
          <span>
            <strong>Judicial Caveat:</strong> A semantic document diff illustrates text variances for investigator analysis. It is an explanatory aid and does not constitute independent cryptographic proof of authorship or tampering intent.
          </span>
        </div>

        {/* Version Pickers & View Mode */}
        <div className="mt-6 pt-4 border-t border-[#F1F1F3] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#6B6B73]">Base Version:</span>
              <select
                value={baseVerNum}
                onChange={(e) => setBaseVerNum(Number(e.target.value))}
                className="rounded border border-[#E5E5E7] bg-[#FFFFFF] px-2.5 py-1 text-xs font-mono font-semibold"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.versionNumber}>
                    V{v.versionNumber} ({v.isGenesis ? "Genesis" : v.fileName})
                  </option>
                ))}
              </select>
            </div>

            <ArrowRight className="h-3.5 w-3.5 text-[#8E8E93] hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="font-mono text-[#6B6B73]">Compare Version:</span>
              <select
                value={compareVerNum}
                onChange={(e) => setCompareVerNum(Number(e.target.value))}
                className="rounded border border-[#E5E5E7] bg-[#FFFFFF] px-2.5 py-1 text-xs font-mono font-semibold"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.versionNumber}>
                    V{v.versionNumber} ({v.isGenesis ? "Genesis" : v.fileName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggle Split / Unified */}
          <div className="flex items-center gap-1 rounded-md border border-[#E5E5E7] bg-[#F9F9FA] p-0.5 self-start sm:self-auto">
            <button
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-all ${
                viewMode === "split"
                  ? "bg-[#FFFFFF] text-[#111111] shadow-subtle"
                  : "text-[#6B6B73] hover:text-[#111111]"
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              Side-by-Side
            </button>
            <button
              onClick={() => setViewMode("unified")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-all ${
                viewMode === "unified"
                  ? "bg-[#FFFFFF] text-[#111111] shadow-subtle"
                  : "text-[#6B6B73] hover:text-[#111111]"
              }`}
            >
              <Rows className="h-3.5 w-3.5" />
              Unified
            </button>
          </div>
        </div>
      </div>

      {/* Diff Statistics Bar */}
      {diffResult && (
        <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-4 shadow-subtle mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-mono font-bold text-[#111111]">
              DIFF SUMMARY:
            </span>
            <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-emerald-800 font-semibold border border-emerald-200">
              +{diffResult.additionsCount} additions
            </span>
            <span className="rounded bg-red-50 px-2 py-0.5 font-mono text-red-800 font-semibold border border-red-200">
              -{diffResult.deletionsCount} deletions
            </span>
            <span className="font-mono text-[#6B6B73]">
              {diffResult.unchangedCount} unchanged lines
            </span>
          </div>

          <div className="text-[11px] text-[#6B6B73] font-mono">
            {diffResult.hasChanges ? "Variance detected between versions" : "Identical content"}
          </div>
        </div>
      )}

      {/* Diff Viewer Canvas */}
      <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] shadow-subtle overflow-hidden">
        {viewMode === "split" ? (
          /* Split View */
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E5E5E7]">
            {/* Left: Base Version */}
            <div>
              <div className="border-b border-[#E5E5E7] bg-[#F9F9FA] px-4 py-2.5 text-xs font-mono font-semibold text-[#111111] flex items-center justify-between">
                <span>V{baseVersion?.versionNumber} &middot; {baseVersion?.fileName}</span>
                <span className="text-[#8E8E93] text-[10px]">ORIGINAL / BASE</span>
              </div>
              <div className="p-4 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap space-y-1">
                {diffResult?.lines
                  .filter((l) => l.type !== "added")
                  .map((line, idx) => (
                    <div
                      key={idx}
                      className={`px-2 py-0.5 rounded ${
                        line.type === "removed"
                          ? "bg-red-50 text-red-950 border-l-2 border-red-600 font-medium"
                          : "text-[#111111]"
                      }`}
                    >
                      <span className="inline-block w-6 text-[#8E8E93] select-none text-[10px]">
                        {line.oldLineNumber || " "}
                      </span>
                      {line.content}
                    </div>
                  ))}
              </div>
            </div>

            {/* Right: Compare Version */}
            <div>
              <div className="border-b border-[#E5E5E7] bg-[#F9F9FA] px-4 py-2.5 text-xs font-mono font-semibold text-[#111111] flex items-center justify-between">
                <span>V{compareVersion?.versionNumber} &middot; {compareVersion?.fileName}</span>
                <span className="text-emerald-700 text-[10px]">REVISED / CANDIDATE</span>
              </div>
              <div className="p-4 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap space-y-1">
                {diffResult?.lines
                  .filter((l) => l.type !== "removed")
                  .map((line, idx) => (
                    <div
                      key={idx}
                      className={`px-2 py-0.5 rounded ${
                        line.type === "added"
                          ? "bg-emerald-50 text-emerald-950 border-l-2 border-emerald-600 font-medium"
                          : "text-[#111111]"
                      }`}
                    >
                      <span className="inline-block w-6 text-[#8E8E93] select-none text-[10px]">
                        {line.newLineNumber || " "}
                      </span>
                      {line.content}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          /* Unified View */
          <div>
            <div className="border-b border-[#E5E5E7] bg-[#F9F9FA] px-4 py-2.5 text-xs font-mono font-semibold text-[#111111] flex items-center justify-between">
              <span>Unified Diff: V{baseVersion?.versionNumber} vs V{compareVersion?.versionNumber}</span>
              <span className="text-[#8E8E93] text-[10px]">UNIFIED GIT STYLE</span>
            </div>
            <div className="p-4 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap space-y-1">
              {diffResult?.lines.map((line, idx) => (
                <div
                  key={idx}
                  className={`px-2 py-0.5 rounded flex items-start gap-2 ${
                    line.type === "added"
                      ? "bg-emerald-50 text-emerald-950 border-l-2 border-emerald-600 font-medium"
                      : line.type === "removed"
                      ? "bg-red-50 text-red-950 border-l-2 border-red-600 font-medium"
                      : "text-[#111111]"
                  }`}
                >
                  <span className="select-none font-bold text-[11px] w-4">
                    {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                  </span>
                  <span className="inline-block w-8 text-[#8E8E93] select-none text-[10px]">
                    {line.newLineNumber || line.oldLineNumber || " "}
                  </span>
                  <span>{line.content}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
