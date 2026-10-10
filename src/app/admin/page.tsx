"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, Users, FolderGit2, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (isLoading) return;
    if (!user || profile?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, profile, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#6B6B73]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-4 w-4 text-[#111111]" />
          <span className="font-mono text-xs uppercase tracking-wider text-[#6B6B73]">
            Administration
          </span>
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
          Admin Console
        </h1>
        <p className="mt-1 text-xs text-[#6B6B73]">
          System administration and organizational management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/cases" className="group rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle hover:border-[#111111] transition-all">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#F9F9FA] text-[#111111] group-hover:bg-[#111111] group-hover:text-white transition-colors">
            <FolderGit2 className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-lg font-bold text-[#111111] mb-2">Case Management</h2>
          <p className="text-xs text-[#6B6B73]">
            Create and manage evidence dockets. Assign users to cases with specific investigative roles (Police, Analyst, etc.).
          </p>
        </Link>

        <Link href="/admin/users" className="group rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle hover:border-[#111111] transition-all">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#F9F9FA] text-[#111111] group-hover:bg-[#111111] group-hover:text-white transition-colors">
            <Users className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-lg font-bold text-[#111111] mb-2">User Management</h2>
          <p className="text-xs text-[#6B6B73]">
            Manage system access. Promote or demote user roles (User vs Admin).
          </p>
        </Link>
      </div>
    </div>
  );
}
