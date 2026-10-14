"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  User as UserIcon,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Users,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatRoleLabel } from "@/lib/supabase/types";

function validateInternationalPhone(phone: string): boolean {
  if (!phone) return true; // Optional if already present
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  const e164Regex = /^\+?[1-9]\d{6,14}$/;
  return e164Regex.test(cleaned);
}

interface AdminUserRecord {
  id: string;
  email: string | null;
  fullName: string | null;
  role: "user" | "admin";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, isAdmin, isLoading: authLoading, updateProfile, signOut } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [designation, setDesignation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Admin Role Management state
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/sign-in?next=/profile");
    }
    if (profile) {
      setFullName(profile.fullName || "");
      setPhone(profile.phone || "");
      setAvatarUrl(profile.avatarUrl || "");
      setDesignation(profile.designation || "");
    }
  }, [user, profile, authLoading, router]);

  const fetchAdminUsers = useCallback(async () => {
    if (!isAdmin) return;
    setAdminLoading(true);
    setAdminError(null);
    try {
      const res = await fetch("/api/admin/roles");
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setAdminUsers(data.users || []);
    } catch (err: any) {
      setAdminError(err.message || "Failed to load user accounts.");
    } finally {
      setAdminLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminUsers();
    }
  }, [isAdmin, fetchAdminUsers]);

  const handleRoleChange = async (targetUserId: string, newRole: "user" | "admin") => {
    setUpdatingUserId(targetUserId);
    setAdminError(null);
    setAdminSuccess(null);

    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          targetRole: newRole,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to update user role.");
      }

      setAdminSuccess(data.message || `Successfully assigned role ${formatRoleLabel(newRole)}.`);
      setTimeout(() => setAdminSuccess(null), 5000);
      await fetchAdminUsers();
    } catch (err: any) {
      setAdminError(err.message || "Error updating role.");
    } finally {
      setUpdatingUserId(null);
    }
  };

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
      designation: designation || undefined,
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back */}
      <div className="mb-6">
        <Link
          href="/cases"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B6B73] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Cases</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div className="md:col-span-4 space-y-4">
          <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-5 shadow-subtle">
            {/* Avatar + identity */}
            <div className="flex items-center gap-3.5">
              {avatarUrl ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-[#E5E5E7]">
                  <Image src={avatarUrl} alt={fullName || "Avatar"} fill className="object-cover" />
                </div>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#111111] to-[#3A3A3C] text-base font-bold text-[#FFFFFF]">
                  {(fullName || user.email || "EO").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-heading text-sm font-bold text-[#111111] truncate">
                  {fullName || "Judicial Officer"}
                </h2>
                <p className="mt-0.5 text-[10px] text-[#6B6B73] truncate font-mono">{user.email}</p>
                <div
                  className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-mono font-semibold border ${
                    isAdmin
                      ? "bg-purple-50 border-purple-200 text-purple-700"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isAdmin ? "bg-purple-500" : "bg-emerald-500"}`} />
                  {roleLabel}
                </div>
              </div>
            </div>

            {/* Sign Out */}
            <div className="mt-5 border-t border-[#F1F1F3] pt-4">
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
        <div className="md:col-span-8">
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

              {/* Designation Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1.5 font-mono">
                  Professional Designation
                </label>
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3.5 py-2.5 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
                >
                  <option value="" disabled>Select your designation</option>
                  <option value="Police Officer">Police Officer</option>
                  <option value="Forensic Analyst">Forensic Analyst</option>
                  <option value="Public Prosecutor">Public Prosecutor</option>
                  <option value="Case Observer">Case Observer</option>
                </select>
                <p className="mt-1 text-[10px] text-[#6B6B73]">
                  Your professional designation is displayed on your profile. It does not grant additional case permissions.
                </p>
              </div>

              {/* Readonly Role Display */}
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1.5 font-mono">
                  Assigned Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-2.5 h-4 w-4 text-[#8E8E93]" />
                  <input
                    type="text"
                    disabled
                    value={roleLabel}
                    className="w-full rounded-md border border-[#E5E5E7] bg-[#F1F1F3] pl-10 pr-3.5 py-2.5 text-xs text-[#6B6B73] cursor-not-allowed font-mono font-medium"
                  />
                </div>
                <p className="mt-1 text-[10px] text-[#8E8E93]">
                  {isAdmin
                    ? "You have Administrator privileges. You may manage user roles below."
                    : "Read-only. Only authorized platform administrators may alter assigned roles."}
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

      {/* ------------------------------------------------------------------- */}
      {/* ADMIN-ONLY ROLE MANAGEMENT CONSOLE */}
      {/* ------------------------------------------------------------------- */}
      {isAdmin && (
        <div className="mt-12 rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-8 shadow-editorial">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#F1F1F3]">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#111111]">
                <Users className="h-4 w-4" />
                <span>ADMINISTRATOR CONSOLE</span>
              </div>
              <h3 className="mt-1 font-heading text-xl font-bold text-[#111111]">
                User & Role Management
              </h3>
              <p className="mt-1 text-xs text-[#6B6B73]">
                Manage role assignments for registered judicial personnel. All role changes are executed via protected service APIs and logged to immutable audit records.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchAdminUsers}
              disabled={adminLoading}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#111111] hover:border-[#111111] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${adminLoading ? "animate-spin" : ""}`} />
              <span>Refresh Accounts</span>
            </button>
          </div>

          {/* Admin Feedback Alerts */}
          {adminSuccess && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{adminSuccess}</span>
            </div>
          )}

          {adminError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{adminError}</span>
            </div>
          )}

          {/* User List Table */}
          <div className="mt-6 overflow-x-auto">
            {adminLoading && adminUsers.length === 0 ? (
              <div className="flex h-36 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-[#111111]" />
              </div>
            ) : adminUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B6B73]">
                No user profiles found in the system.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E5E7] text-[11px] font-mono text-[#6B6B73]">
                    <th className="py-2.5 px-3 font-semibold">User</th>
                    <th className="py-2.5 px-3 font-semibold">Assigned Role</th>
                    <th className="py-2.5 px-3 font-semibold hidden sm:table-cell">Account ID</th>
                    <th className="py-2.5 px-3 font-semibold hidden md:table-cell">Registered</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F1F3] text-xs">
                  {adminUsers.map((u) => {
                    const isSelf = u.id === user.id;
                    const isTargetAdmin = u.role === "admin";
                    const isUpdating = updatingUserId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-[#F9F9FA]/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#111111]">{u.fullName || "Unnamed User"}</div>
                          <div className="text-[11px] font-mono text-[#6B6B73]">{u.email}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium border ${
                              isTargetAdmin
                                ? "border-purple-200 bg-purple-50 text-purple-700"
                                : "border-[#E5E5E7] bg-[#F9F9FA] text-[#111111]"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isTargetAdmin ? "bg-purple-600" : "bg-emerald-500"
                              }`}
                            />
                            {formatRoleLabel(u.role)}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[10px] text-[#8E8E93] hidden sm:table-cell">
                          {u.id.slice(0, 8)}...{u.id.slice(-4)}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[#6B6B73] hidden md:table-cell">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isSelf ? (
                            <span className="text-[11px] font-mono text-[#8E8E93] italic">
                              Current Session (Protected)
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              {isTargetAdmin ? (
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleRoleChange(u.id, "user")}
                                  className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-50"
                                >
                                  {isUpdating ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <ShieldAlert className="h-3 w-3" />
                                  )}
                                  <span>Demote to User</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleRoleChange(u.id, "admin")}
                                  className="inline-flex items-center gap-1 rounded border border-[#111111] bg-[#111111] px-2.5 py-1 text-[11px] font-medium text-[#FFFFFF] hover:bg-[#262626] transition-colors disabled:opacity-50"
                                >
                                  {isUpdating ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <ShieldCheck className="h-3 w-3" />
                                  )}
                                  <span>Promote to Admin</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
