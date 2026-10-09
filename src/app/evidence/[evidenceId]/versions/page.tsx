"use client";

import React, { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GitBranch,
  Upload,
  Lock,
  KeyRound,
  Camera,
  CheckCircle2,
  AlertCircle,
  Shield,
  ArrowRight,
  FileCheck,
  RefreshCw,
} from "lucide-react";
import { evidenceStore, DEMO_USERS } from "@/lib/data/store";
import { computeSha256 } from "@/lib/crypto/sha256";
import { EvidenceItem, EvidenceVersion, UserProfile } from "@/lib/supabase/types";

interface PageProps {
  params: Promise<{ evidenceId: string }>;
}

export default function EvidenceCreateVersionPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const evidenceId = resolvedParams.evidenceId;

  const [evidenceItem, setEvidenceItem] = useState<EvidenceItem | undefined>(undefined);
  const [versions, setVersions] = useState<EvidenceVersion[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_USERS.police);

  // Form State
  const [parentVersionNum, setParentVersionNum] = useState<number>(1);
  const [commitMessage, setCommitMessage] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [calculatedHash, setCalculatedHash] = useState<string>("");
  const [textContent, setTextContent] = useState<string>("");

  // Step-Up Auth Modal & State
  const [showStepUpModal, setShowStepUpModal] = useState(false);
  const [stepUpMethod, setStepUpMethod] = useState<"passkey" | "otp">("passkey");
  const [otpCode, setOtpCode] = useState("");
  const [stepUpVerified, setStepUpVerified] = useState(false);
  const [proofToken, setProofToken] = useState<string | null>(null);

  // Optional Consent Webcam State
  const [enableWebcamConsent, setEnableWebcamConsent] = useState(false);
  const [showWebcamModal, setShowWebcamModal] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const item = evidenceStore.getEvidenceById(evidenceId);
    setEvidenceItem(item);
    if (item) {
      const vList = evidenceStore.getVersionsByEvidenceId(item.id);
      setVersions(vList);
      setParentVersionNum(item.currentVersionNumber);
    }

    const saved = localStorage.getItem("evidentia_active_user");
    if (saved && DEMO_USERS[saved]) {
      setCurrentUser(DEMO_USERS[saved]);
    }
  }, [evidenceId]);

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMsg(null);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const hash = await computeSha256(buffer);
      setCalculatedHash(hash);

      if (selectedFile.type.startsWith("text/") || selectedFile.name.endsWith(".txt")) {
        const text = await selectedFile.text();
        setTextContent(text);
      }
    } catch (err: any) {
      setErrorMsg("Failed to compute SHA-256: " + err.message);
    }
  };

  // Step-Up Authentication Verification
  const handleVerifyStepUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (stepUpMethod === "otp" && otpCode.trim() !== "881920") {
      setErrorMsg("Invalid OTP code. For demo simulation, enter policy OTP code: 881920");
      return;
    }

    const token = `vprf_${stepUpMethod}_${Date.now()}`;
    setProofToken(token);
    setStepUpVerified(true);
    setShowStepUpModal(false);

    // If webcam consent was checked, trigger optional webcam modal
    if (enableWebcamConsent) {
      startCamera();
    }
  };

  // Webcam Controls
  const startCamera = async () => {
    setShowWebcamModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable in this environment:", err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL("image/webp", 0.85);
        setCapturedPhoto(dataUrl);
      }
    }
    stopCamera();
    setShowWebcamModal(false);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleSubmitVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !calculatedHash) {
      setErrorMsg("Please select candidate revision file.");
      return;
    }
    if (!commitMessage.trim()) {
      setErrorMsg("Mandatory commit message required.");
      return;
    }
    if (!stepUpVerified) {
      setShowStepUpModal(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await evidenceStore.createVersion({
        evidenceId,
        parentVersionNumber: parentVersionNum,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || "application/octet-stream",
        fileSha256: calculatedHash,
        textContent: textContent || undefined,
        commitMessage: commitMessage.trim(),
        note: note.trim() || undefined,
        actor: currentUser,
        stepUpProofToken: proofToken || undefined,
      });

      router.push(`/evidence/${evidenceId}/timeline`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to commit version");
      setIsSubmitting(false);
    }
  };

  if (!evidenceItem) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-heading text-xl font-bold text-[#111111]">Loading Version Workflow...</h1>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
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
        <span className="font-bold text-[#111111]">
          Create Version V{evidenceItem.currentVersionNumber + 1}
        </span>
      </div>

      <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 sm:p-8 shadow-subtle">
        <div className="border-b border-[#F1F1F3] pb-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-wider text-[#6B6B73]">
              Non-Destructive Version Control
            </span>
            <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-semibold text-white">
              Target Version: V{evidenceItem.currentVersionNumber + 1}
            </span>
          </div>

          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
            Authorized Evidence Revision: {evidenceItem.title}
          </h1>
          <p className="mt-1 text-xs text-[#6B6B73]">
            Creating a revision links to the parent commit hash without modifying or overwriting prior historical versions.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Action Halted</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitVersion} className="space-y-6">
          {/* Parent Version Selection */}
          <div className="rounded-lg border border-[#E5E5E7] bg-[#F9F9FA] p-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111] font-mono mb-1.5">
              Select Parent Version To Branch From
            </label>
            <select
              value={parentVersionNum}
              onChange={(e) => setParentVersionNum(Number(e.target.value))}
              className="rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-3 py-2 text-xs font-mono font-semibold text-[#111111]"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.versionNumber}>
                  Version {v.versionNumber} ({v.isGenesis ? "Genesis V1" : v.fileName}) &middot; Hash:{" "}
                  {v.fileSha256.slice(0, 12)}...
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#6B6B73] mt-2">
              The new version commit will cryptographically link to the parent commit hash of this version.
            </p>
          </div>

          {/* Candidate Revision File Upload */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-2 font-mono">
              Candidate Revised File <span className="text-red-500">*</span>
            </label>

            <div className="border-2 border-dashed border-[#E5E5E7] hover:border-[#111111] rounded-xl p-6 text-center transition-all bg-[#FFFFFF]">
              <input
                type="file"
                id="version-file-upload"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {file ? (
                <div className="space-y-2">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                  <p className="font-bold text-xs text-[#111111]">{file.name}</p>
                  <p className="text-[11px] text-[#6B6B73] font-mono">
                    Size: {(file.size / 1024).toFixed(2)} KB &middot; Hash: {calculatedHash}
                  </p>
                  <label
                    htmlFor="version-file-upload"
                    className="inline-block text-xs font-semibold text-[#111111] underline cursor-pointer mt-1"
                  >
                    Select different file
                  </label>
                </div>
              ) : (
                <label htmlFor="version-file-upload" className="cursor-pointer block">
                  <Upload className="mx-auto h-8 w-8 text-[#8E8E93] mb-2" />
                  <p className="font-semibold text-xs text-[#111111]">
                    Click to upload revised file copy
                  </p>
                  <p className="text-[10px] text-[#6B6B73] mt-0.5">
                    Original V1 is permanently preserved and will never be overwritten.
                  </p>
                </label>
              )}
            </div>
          </div>

          {/* Mandatory Commit Message */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#111111] font-mono">
                Mandatory Revision Commit Message <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-[#6B6B73] font-mono">Required For Provenance</span>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Added supplemental witness statements from Inspector Roy"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
            />
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-medium text-[#111111] mb-1 font-mono">
              Judicial Order / Amendment Note (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Section 4(b) updated per High Court interim order #HC-ORD-8812."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
            />
          </div>

          {/* Step-Up Authentication Status & Options */}
          <div className="rounded-xl border border-[#E5E5E7] bg-[#F9F9FA] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#111111]" />
                <h3 className="font-heading text-xs font-bold text-[#111111]">
                  Step-Up Re-Authentication Requirement
                </h3>
              </div>
              {stepUpVerified ? (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-800">
                  <CheckCircle2 className="h-3 w-3" />
                  AUTHENTICATED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-800">
                  RE-AUTH REQUIRED
                </span>
              )}
            </div>

            <p className="text-[11px] text-[#6B6B73] leading-relaxed">
              Creating a judicial version commit requires biometric passkey (Windows Hello, Touch ID) or policy-approved OTP confirmation bound to this exact commit digest.
            </p>

            {/* Optional Webcam Checkbox */}
            <div className="pt-2 border-t border-[#E5E5E7] flex items-center gap-2">
              <input
                type="checkbox"
                id="webcam-consent"
                checked={enableWebcamConsent}
                onChange={(e) => setEnableWebcamConsent(e.target.checked)}
                className="rounded border-[#E5E5E7] text-[#111111] focus:ring-0"
              />
              <label htmlFor="webcam-consent" className="text-xs text-[#111111] cursor-pointer">
                <strong>Optional Consent:</strong> Include visual custody documentation capture via webcam (never treated as biometric authentication).
              </label>
            </div>

            {!stepUpVerified && (
              <button
                type="button"
                onClick={() => setShowStepUpModal(true)}
                className="mt-2 flex items-center gap-1.5 rounded-md border border-[#111111] bg-[#111111] px-3.5 py-1.5 text-xs font-semibold text-white shadow-subtle hover:bg-[#262626]"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Perform Step-Up Authentication Now
              </button>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1F1F3]">
            <Link
              href={`/evidence/${evidenceId}/timeline`}
              className="rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-4 py-2.5 text-xs font-semibold text-[#6B6B73] hover:text-[#111111]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="flex items-center gap-2 rounded-md bg-[#111111] px-5 py-2.5 text-xs font-semibold text-[#FFFFFF] shadow-subtle hover:bg-[#262626] disabled:opacity-50"
            >
              {isSubmitting ? "Attesting & Committing V" + (evidenceItem.currentVersionNumber + 1) : "Commit Version V" + (evidenceItem.currentVersionNumber + 1)}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Step-Up Authentication Modal */}
      {showStepUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-modal animate-in zoom-in-95">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-[#111111]" />
              <h2 className="font-heading text-base font-bold text-[#111111]">
                FIDO2 / WebAuthn Step-Up Re-Authentication
              </h2>
            </div>
            <p className="text-xs text-[#6B6B73]">
              Confirm your identity to authorize appending version commit to {evidenceId}.
            </p>

            <div className="mt-4 flex gap-2 border-b border-[#F1F1F3] pb-3">
              <button
                type="button"
                onClick={() => setStepUpMethod("passkey")}
                className={`rounded px-3 py-1.5 text-xs font-semibold ${
                  stepUpMethod === "passkey"
                    ? "bg-[#111111] text-white"
                    : "bg-[#F1F1F3] text-[#6B6B73]"
                }`}
              >
                Passkey (Windows Hello / FIDO2)
              </button>
              <button
                type="button"
                onClick={() => setStepUpMethod("otp")}
                className={`rounded px-3 py-1.5 text-xs font-semibold ${
                  stepUpMethod === "otp"
                    ? "bg-[#111111] text-white"
                    : "bg-[#F1F1F3] text-[#6B6B73]"
                }`}
              >
                Policy OTP Fallback
              </button>
            </div>

            <form onSubmit={handleVerifyStepUp} className="mt-4 space-y-4">
              {stepUpMethod === "passkey" ? (
                <div className="rounded-lg bg-[#F9F9FA] p-4 text-center border border-[#E5E5E7]">
                  <KeyRound className="mx-auto h-8 w-8 text-[#111111] mb-2 animate-bounce" />
                  <p className="font-bold text-xs text-[#111111]">
                    Touch security key or scan Windows Hello / Touch ID
                  </p>
                  <p className="text-[11px] text-[#6B6B73] mt-1 font-mono">
                    Challenge: {calculatedHash ? calculatedHash.slice(0, 16) + "..." : "OP_BIND_CHALLENGE"}
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-[#111111] mb-1 font-mono">
                    Enter Judicial Authorization OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter code: 881920"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs font-mono font-bold tracking-widest text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
                  />
                  <p className="text-[10px] text-[#8E8E93] mt-1 font-mono">
                    Demo OTP code for testing: 881920
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F1F3]">
                <button
                  type="button"
                  onClick={() => setShowStepUpModal(false)}
                  className="rounded-md border border-[#E5E5E7] px-3 py-1.5 text-xs text-[#6B6B73]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#111111] px-4 py-1.5 text-xs font-semibold text-white"
                >
                  Verify & Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Optional Webcam Modal */}
      {showWebcamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-modal animate-in zoom-in-95">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="h-5 w-5 text-[#111111]" />
              <h2 className="font-heading text-base font-bold text-[#111111]">
                Visual Handoff Documentation (Optional)
              </h2>
            </div>
            <p className="text-xs text-[#6B6B73]">
              Consent-based visual audit receipt. Stored in private storage; never used as biometric template.
            </p>

            <div className="mt-4 overflow-hidden rounded-lg bg-[#111111] aspect-video flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setShowWebcamModal(false);
                }}
                className="text-xs text-[#6B6B73] hover:text-[#111111]"
              >
                Skip Photo
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="rounded-md bg-[#111111] px-4 py-1.5 text-xs font-semibold text-white"
              >
                Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
