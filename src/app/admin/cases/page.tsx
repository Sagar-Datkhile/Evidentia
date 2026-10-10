"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Shield, FolderGit2, Loader2, AlertCircle } from "lucide-react";
import { Case } from "@/lib/supabase/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

export default function AdminCasesPage() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    
    if (!user || profile?.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetch("/api/admin/cases")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load cases");
        return res.json();
      })
      .then(data => {
        setCases(data.cases || []);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, profile, isLoading, router]);

  if (isLoading || loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#6B6B73]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-[#111111]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#6B6B73]">
              Admin Console
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
            Case Management
          </h1>
          <p className="mt-1 text-xs text-[#6B6B73]">
            Manage evidence dockets and access assignments.
          </p>
        </div>

        <Link
          href="/admin/cases/new"
          className="flex items-center gap-1.5 rounded-md bg-[#111111] px-4 py-2 text-xs font-semibold text-[#FFFFFF] shadow-subtle hover:bg-[#262626] transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Case Docket
        </Link>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          {error}
        </div>
      )}

      <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] shadow-subtle overflow-hidden">
        {cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderGit2 className="h-10 w-10 text-[#E5E5E7] mb-3" />
            <p className="text-sm font-semibold text-[#111111]">No cases exist</p>
            <p className="text-xs text-[#6B6B73] mt-1">Create the first case to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E7] bg-[#F9F9FA] text-[11px] font-mono uppercase text-[#6B6B73]">
                  <th className="px-5 py-3 font-semibold">Case Number</th>
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Jurisdiction</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F1F3] text-xs">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F9F9FA] transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-[#111111] whitespace-nowrap">
                      {c.caseNumber}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[#111111]">{c.title}</div>
                    </td>
                    <td className="px-4 py-4 text-[#6B6B73]">
                      {c.jurisdiction}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-800 border border-emerald-200">
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/cases/${c.id}`}
                        className="rounded border border-[#E5E5E7] bg-[#FFFFFF] px-3 py-1.5 text-xs font-semibold text-[#111111] hover:border-[#111111] shadow-sm transition-all"
                      >
                        Manage Assignments
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
