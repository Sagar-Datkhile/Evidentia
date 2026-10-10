"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Shield, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AdminNewCasePage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();
  
  const [caseNumber, setCaseNumber] = useState("");
  const [title, setTitle] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [description, setDescription] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [authLoading, user, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseNumber, title, jurisdiction, description }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      router.push(`/admin/cases/${data.case.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create case");
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#6B6B73]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center gap-2 text-xs font-mono text-[#6B6B73]">
        <Link href="/admin/cases" className="hover:text-[#111111] transition-colors">
          Admin Console
        </Link>
        <span>/</span>
        <span className="font-bold text-[#111111]">New Case Docket</span>
      </div>

      <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 sm:p-8 shadow-subtle">
        <div className="border-b border-[#F1F1F3] pb-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-[#111111]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#6B6B73]">
              Case Creation
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
            Register New Docket
          </h1>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-[#111111] mb-1 font-mono">
              Case Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CASE-2026-0099"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111111] mb-1 font-mono">
              Title / Designation <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Operation Alpha Sinkhole"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111111] mb-1 font-mono">
              Jurisdiction <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. High Court of Delhi - Cyber Bench"
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111111] mb-1 font-mono">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Brief description of the incident and scope of investigation."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1F1F3]">
            <Link
              href="/admin/cases"
              className="rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-4 py-2.5 text-xs font-semibold text-[#6B6B73] hover:text-[#111111]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !caseNumber || !title || !jurisdiction}
              className="flex items-center gap-2 rounded-md bg-[#111111] px-5 py-2.5 text-xs font-semibold text-[#FFFFFF] shadow-subtle hover:bg-[#262626] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Create Case
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
