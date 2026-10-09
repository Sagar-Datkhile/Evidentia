"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  UploadCloud,
  FileCheck,
  Shield,
  Lock,
  CheckCircle2,
  AlertCircle,
  Hash,
  ArrowRight,
  FileText,
  KeyRound,
} from "lucide-react";
import { evidenceStore, DEMO_USERS } from "@/lib/data/store";
import { computeSha256 } from "@/lib/crypto/sha256";
import { Case, UserProfile } from "@/lib/supabase/types";
import { useAuth } from "@/components/auth/AuthProvider";

function EvidenceNewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCaseId = searchParams.get("caseId") || "";

  const { user, profile, isLoading: authLoading } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => profile || DEMO_USERS.police);

  // Form Fields
  const [selectedCaseId, setSelectedCaseId] = useState(preselectedCaseId);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"Document" | "Digital Image" | "Audio" | "Video" | "Forensic Dump" | "Other">("Document");
  const [commitMessage, setCommitMessage] = useState("");
  const [note, setNote] = useState("");

  // File & Hash State
  const [file, setFile] = useState<File | null>(null);
  const [calculatedHash, setCalculatedHash] = useState<string>("");
  const [textContent, setTextContent] = useState<string>("");
  const [isHashing, setIsHashing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/sign-in?next=/evidence/new");
      return;
    }

    if (profile) {
      setCurrentUser(profile);
    } else {
      const saved = localStorage.getItem("evidentia_active_user");
      if (saved && DEMO_USERS[saved]) {
        setCurrentUser(DEMO_USERS[saved]);
      }
    }

    setCases(evidenceStore.getCases());
    if (preselectedCaseId) {
      setSelectedCaseId(preselectedCaseId);
    } else if (evidenceStore.getCases().length > 0) {
      setSelectedCaseId(evidenceStore.getCases()[0].id);
    }
  }, [preselectedCaseId, authLoading, user, profile, router]);

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMsg(null);
    setIsHashing(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const hash = await computeSha256(buffer);
      setCalculatedHash(hash);

      // If text file, read text content for diffing
      if (
        selectedFile.type.startsWith("text/") ||
        selectedFile.name.endsWith(".txt") ||
        selectedFile.name.endsWith(".log") ||
        selectedFile.name.endsWith(".json")
      ) {
        const text = await selectedFile.text();
        setTextContent(text);
      } else {
        setTextContent("");
      }
    } catch (err: any) {
      setErrorMsg("Failed to compute SHA-256 hash: " + err.message);
    } finally {
      setIsHashing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !calculatedHash) {
      setErrorMsg("Please select an evidence file to compute raw-byte SHA-256.");
      return;
    }
    if (!commitMessage.trim()) {
      setErrorMsg("Commit message is mandatory for judicial provenance.");
      return;
    }
    if (!selectedCaseId) {
      setErrorMsg("Please select an associated case docket.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const result = await evidenceStore.registerEvidence({
        caseId: selectedCaseId,
        title: title.trim() || file.name,
        category,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || "application/octet-stream",
        fileSha256: calculatedHash,
        textContent: textContent || undefined,
        commitMessage: commitMessage.trim(),
        note: note.trim() || undefined,
        actor: currentUser,
      });

      router.push(`/evidence/${result.evidence.id}/timeline`);
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-xs font-mono text-[#6B6B73]">
        <Link href="/evidence" className="hover:text-[#111111] transition-colors">
          Evidence
        </Link>
        <span>/</span>
        <span className="font-bold text-[#111111]">Register New V1</span>
      </div>

      <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 sm:p-8 shadow-subtle">
        <div className="border-b border-[#F1F1F3] pb-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-wider text-[#6B6B73]">
              Genesis Evidence Intake
            </span>
            <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 border border-emerald-200">
              Immutable V1 Sealing
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
            Register Digital Evidence
          </h1>
          <p className="mt-1 text-xs text-[#6B6B73]">
            Computes exact SHA-256 over unmodified bytes and creates parent-linked genesis commit.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Registration Halted</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Dropzone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-2 font-mono">
              1. Evidence Binary / Document <span className="text-red-500">*</span>
            </label>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                file
                  ? "border-[#111111] bg-[#F9F9FA]"
                  : "border-[#E5E5E7] hover:border-[#111111] bg-[#FFFFFF]"
              }`}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {file ? (
                <div className="space-y-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#111111]">{file.name}</p>
                    <p className="text-xs text-[#6B6B73] font-mono mt-0.5">
                      {(file.size / 1024).toFixed(2)} KB &middot; {file.type || "application/octet-stream"}
                    </p>
                  </div>

                  {isHashing ? (
                    <p className="text-xs font-mono text-amber-700 animate-pulse">
                      Computing raw-byte SHA-256 digest...
                    </p>
                  ) : calculatedHash ? (
                    <div className="rounded-lg bg-[#FFFFFF] border border-[#E5E5E7] p-3 text-left max-w-xl mx-auto shadow-subtle">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#6B6B73] mb-1">
                        <span>COMPUTED RAW SHA-256 DIGEST</span>
                        <span className="text-emerald-700 font-semibold">VERIFIED</span>
                      </div>
                      <p className="font-mono text-xs font-bold text-[#111111] break-all">
                        {calculatedHash}
                      </p>
                    </div>
                  ) : null}

                  <label
                    htmlFor="file-upload"
                    className="inline-block mt-2 text-xs font-semibold text-[#111111] underline cursor-pointer"
                  >
                    Select different file
                  </label>
                </div>
              ) : (
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <UploadCloud className="mx-auto h-10 w-10 text-[#8E8E93] mb-3" />
                  <p className="font-semibold text-sm text-[#111111]">
                    Click to select file, or drag and drop here
                  </p>
                  <p className="text-xs text-[#6B6B73] mt-1">
                    PDF, DOCX, TXT, PNG, MP4, RAW memory dumps (Any file format supported)
                  </p>
                </label>
              )}
            </div>
          </div>

          {/* Case Docket Selection & Category */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#111111] mb-1 font-mono">
                Assigned Case Docket <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.caseNumber} — {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111111] mb-1 font-mono">
                Evidence Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
              >
                <option value="Document">Document (FIR, Report, Legal Affidavit)</option>
                <option value="Digital Image">Digital Image (Crime Scene Photo)</option>
                <option value="Video">Video (CCTV, Surveillance, Bodycam)</option>
                <option value="Audio">Audio (Call Intercept, Wiretap, Witness Voice)</option>
                <option value="Forensic Dump">Forensic Dump (Disk Image, RAM capture)</option>
                <option value="Other">Other Binary Artifact</option>
              </select>
            </div>
          </div>

          {/* Evidence Title */}
          <div>
            <label className="block text-xs font-medium text-[#111111] mb-1 font-mono">
              Evidence Title / Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Original Seizure Report - Server Rack 4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
            />
          </div>

          {/* Commit Message & Notes */}
          <div className="rounded-lg border border-[#E5E5E7] bg-[#F9F9FA] p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#111111] font-mono">
                  Mandatory Commit Message <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-[#6B6B73] font-mono">Required for Audit</span>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. Genesis FIR registration from Special Cell Station 14"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="w-full rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111111] mb-1 font-mono">
                Chain of Custody Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Details of physical seals, seizing officers, witness signatures, or transfer conditions."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
              />
            </div>
          </div>

          {/* Security & Attestation Declaration */}
          <div className="rounded-lg bg-[#F1F1F3] p-4 text-xs text-[#6B6B73] space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center gap-2 text-[#111111] font-bold">
              <Shield className="h-4 w-4" />
              <span>Cryptographic Attestation Notice:</span>
            </div>
            <p>
              Submitting this form seals this file as immutable Version 1 (V1). An Ed25519 system signature will attest the commit hash and add the file to the current Merkle batch.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1F1F3]">
            <Link
              href="/evidence"
              className="rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-4 py-2.5 text-xs font-semibold text-[#6B6B73] hover:text-[#111111]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isHashing || !file}
              className="flex items-center gap-2 rounded-md bg-[#111111] px-5 py-2.5 text-xs font-semibold text-[#FFFFFF] shadow-subtle hover:bg-[#262626] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Registering & Signing Commit..." : "Seal & Register Evidence V1"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EvidenceNewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono">Loading form...</div>}>
      <EvidenceNewForm />
    </Suspense>
  );
}
