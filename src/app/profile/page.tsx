"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  User as UserIcon,
  Phone,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Building,
  BadgeAlert,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatRoleLabel } from "@/lib/supabase/types";

function validateInternationalPhone(phone: string): boolean {
  if (!phone) return true; // Optional if already present
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  const e164Regex = /^\+?[1-9]\d{6,14}$/;
  return e164Regex.test(cleaned);
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, role, isLoading: authLoading, updateProfile, signOut } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/sign-in?next=/profile");
    }
    if (profile) {
      setFullName(profile.fullName || "");
      setPhone(profile.phone || "");
      setAvatarUrl(profile.avatarUrl || "");
    }
  }, [user, profile, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);

    if (phone && !validateInternationalPhone(phone)) {
      setPhoneError("Please enter a valid international phone number format (e.g., +91 98765 43210).");
      return;
    }

    setIsSaving(true);
    const res = await updateProfile({
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      avatarUrl: avatarUrl.trim() || undefined,
    });

    setIsSaving(false);
    if (!res.success) {
      setErrorMessage(res.error || "Failed to update profile.");
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#111111]" />
      </div>
    );
  }

  const roleLabel = formatRoleLabel(profile?.role);
  const isPending = role === "pending";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back to Dashboard */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B6B73] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        {/* Left Column: Account & Role Overview */}
        <div className="md:col-span-5 space-y-6">
          <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-full border border-[#E5E5E7]">
                  <Image src={avatarUrl} alt={fullName} fill className="object-cover" />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#111111] text-lg font-bold text-[#FFFFFF]">
                  {(fullName || user.email || "EO").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-heading text-lg font-bold text-[#111111] truncate">
                  {fullName || "Judicial Officer"}
                </h2>
                <p className="text-xs text-[#6B6B73] truncate font-mono">{user.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E7] bg-[#F9F9FA] px-2.5 py-0.5 text-[10px] font-mono text-[#111111]">
                  <span className={`h-1.5 w-1.5 rounded-full ${isPending ? "bg-amber-500" : "bg-emerald-500"}`} />
                  <span>{roleLabel}</span>
                </div>
              </div>
            </div>

            {/* Role Security Notice */}
            <div className="mt-6 border-t border-[#F1F1F3] pt-4">
              <div className="flex items-start gap-2 text-xs">
                <Lock className="h-4 w-4 text-[#6B6B73] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-[#111111]">Cryptographic RBAC Enforced</p>
                  <p className="text-[11px] text-[#6B6B73] leading-relaxed">
                    User roles are locked at the database level by Row Level Security (RLS) triggers. Self-promotion is strictly blocked.
                  </p>
                </div>
              </div>
            </div>

            {isPending && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
                <BadgeAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Pending Authorization</p>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Your account has been registered and assigned the safe <code className="font-mono font-semibold">pending</code> status. Contact an administrator to receive Police Officer, Forensic Analyst, or Prosecutor credentials.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-[#F1F1F3] pt-4">
              <button
                type="button"
                onClick={signOut}
                className="w-full rounded-md border border-red-200 bg-red-50 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
              >
                Sign Out of Session
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Profile Details */}
        <div className="md:col-span-7">
          <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-8 shadow-editorial">
            <h3 className="font-heading text-lg font-bold text-[#111111]">
              Personal Information
            </h3>
            <p className="mt-1 text-xs text-[#6B6B73]">
              Update your contact details. This data is linked to your attested commits and custody receipts.
            </p>

            {saveSuccess && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Profile updated successfully.</span>
              </div>
            )}

            {errorMessage && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1.5 font-mono">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-2.5 h-4 w-4 text-[#8E8E93]" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Inspector Rajesh Sharma"
                    className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] pl-10 pr-3.5 py-2.5 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1.5 font-mono">
                  Authenticated Email (Immutable)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-[#8E8E93]" />
                  <input
                    type="email"
                    disabled
                    value={user.email || ""}
                    className="w-full rounded-md border border-[#E5E5E7] bg-[#F1F1F3] pl-10 pr-3.5 py-2.5 text-xs text-[#6B6B73] cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1.5 font-mono">
                  International Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-2.5 h-4 w-4 text-[#8E8E93]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError(null);
                    }}
                    placeholder="+91 98765 43210"
                    className={`w-full rounded-md border bg-[#F9F9FA] pl-10 pr-3.5 py-2.5 text-xs text-[#111111] focus:bg-[#FFFFFF] focus:outline-none ${
                      phoneError ? "border-red-400" : "border-[#E5E5E7] focus:border-[#111111]"
                    }`}
                  />
                </div>
                {phoneError && (
                  <p className="mt-1 text-[11px] text-red-600">{phoneError}</p>
                )}
                <p className="mt-1 text-[10px] text-[#6B6B73]">
                  Required for step-up verification and audit receipts.
                </p>
              </div>

              {/* Avatar URL */}
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1.5 font-mono">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3.5 py-2.5 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
                />
              </div>

              {/* Readonly Role Display */}
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1.5 font-mono">
                  Assigned Judicial Role
                </label>
                <input
                  type="text"
                  disabled
                  value={roleLabel}
                  className="w-full rounded-md border border-[#E5E5E7] bg-[#F1F1F3] px-3.5 py-2.5 text-xs text-[#6B6B73] cursor-not-allowed font-mono"
                />
                <p className="mt-1 text-[10px] text-[#8E8E93]">
                  Only an authorized platform administrator may assign or alter roles.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 rounded-md bg-[#111111] px-5 py-2.5 text-xs font-semibold text-[#FFFFFF] shadow-subtle hover:bg-[#262626] transition-all disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Profile</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
