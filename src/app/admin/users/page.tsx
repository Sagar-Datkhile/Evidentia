"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, Users, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
};

export default function AdminUsersPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetch("/api/admin/roles")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load users");
        return res.json();
      })
      .then(data => {
        setUsers(data.users || []);
        setErrorMsg(null);
      })
      .catch(err => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, [authLoading, user, profile, router]);

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`Change role to ${newRole}?`)) return;

    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, targetRole: newRole })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update role");
      }

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#6B6B73]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center gap-2 text-xs font-mono text-[#6B6B73]">
        <Link href="/admin" className="hover:text-[#111111] transition-colors">
          Admin Console
        </Link>
        <span>/</span>
        <span className="font-bold text-[#111111]">User Management</span>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-4 w-4 text-[#111111]" />
          <span className="font-mono text-xs uppercase tracking-wider text-[#6B6B73]">
            Directory
          </span>
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
          User Management
        </h1>
        <p className="mt-1 text-xs text-[#6B6B73]">
          Manage system access and global administrator privileges.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          {errorMsg}
        </div>
      )}

      <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5E7] bg-[#F9F9FA] text-[11px] font-mono uppercase text-[#6B6B73]">
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Global Role</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1F3] text-xs">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#F9F9FA] transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-[#111111]">{u.fullName || "—"}</div>
                    <div className="text-[11px] text-[#6B6B73] font-mono mt-0.5">{u.email}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {u.isActive ? (
                      <span className="rounded-sm bg-emerald-50 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-sm bg-red-50 px-2 py-0.5 text-[10px] font-mono font-medium text-red-700 border border-red-200">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`rounded-sm px-2 py-0.5 text-[10px] font-mono font-medium border ${
                      u.role === "admin" 
                        ? "bg-purple-50 text-purple-700 border-purple-200" 
                        : "bg-[#F1F1F3] text-[#6B6B73] border-[#E5E5E7]"
                    }`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleRoleChange(u.id, u.role)}
                      disabled={u.id === user?.id}
                      className="rounded border border-[#E5E5E7] bg-[#FFFFFF] px-3 py-1.5 text-xs font-semibold text-[#111111] hover:border-[#111111] shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {u.role === "admin" ? "Demote to User" : "Promote to Admin"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
