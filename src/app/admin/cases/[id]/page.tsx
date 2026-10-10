"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Plus, Shield, Loader2, AlertCircle, Trash2, User as UserIcon } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

type Profile = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
};

type Assignment = {
  id: string;
  case_id: string;
  user_id: string;
  assigned_role: string;
  created_at: string;
  profiles: Profile;
};

export default function AdminCaseManagePage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;
  const { user, profile, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  
  const [selectedUserId, setSelectedUserId] = useState("");
  const [assignedRole, setAssignedRole] = useState("Investigator");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    
    Promise.all([
      fetch(`/api/admin/cases/${encodeURIComponent(caseId)}/assignments`).then(res => {
        if (!res.ok) throw new Error("Failed to load assignments");
        return res.json();
      }),
      fetch(`/api/admin/roles`).then(res => {
        if (!res.ok) throw new Error("Failed to load users");
        return res.json();
      })
    ])
    .then(([assignmentsData, usersData]) => {
      setAssignments(assignmentsData.assignments || []);
      setAvailableUsers(usersData.users || []);
    })
    .catch(err => setErrorMsg(err.message))
    .finally(() => setLoading(false));
  }, [authLoading, user, profile, router, caseId]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    
    setAssigning(true);
    setErrorMsg(null);
    
    try {
      const res = await fetch(`/api/admin/cases/${encodeURIComponent(caseId)}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, assignedRole }),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to assign user");
      }
      
      const data = await res.json();
      setAssignments([...assignments, data.assignment]);
      setSelectedUserId(""); // reset
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!window.confirm("Remove this user from the case?")) return;
    
    try {
      const res = await fetch(`/api/admin/cases/${encodeURIComponent(caseId)}/assignments?userId=${userId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) throw new Error("Failed to remove user");
      
      setAssignments(assignments.filter(a => a.user_id !== userId));
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

  // Filter out users who are already assigned
  const unassignedUsers = availableUsers.filter(
    (u) => !assignments.some((a) => a.user_id === u.id)
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center gap-2 text-xs font-mono text-[#6B6B73]">
        <Link href="/admin/cases" className="hover:text-[#111111] transition-colors">
          Admin Console
        </Link>
        <span>/</span>
        <span className="font-bold text-[#111111]">Manage Assignments: {caseId}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Assignment Form */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-6 shadow-subtle">
            <h2 className="font-heading text-lg font-bold text-[#111111] mb-4">Assign Personnel</h2>
            
            {errorMsg && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1 font-mono">
                  Select User
                </label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
                >
                  <option value="" disabled>-- Select a user --</option>
                  {unassignedUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || u.email} ({u.email})
                    </option>
                  ))}
                </select>
                {unassignedUsers.length === 0 && (
                  <p className="mt-1 text-[10px] text-[#6B6B73]">All users are already assigned.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1 font-mono">
                  Case Role / Responsibility
                </label>
                <select
                  value={assignedRole}
                  onChange={(e) => setAssignedRole(e.target.value)}
                  className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
                >
                  <option value="Investigator">Investigator</option>
                  <option value="Police Officer">Police Officer</option>
                  <option value="Forensic Analyst">Forensic Analyst</option>
                  <option value="Prosecutor">Prosecutor</option>
                  <option value="Case Manager">Case Manager</option>
                  <option value="Observer">Observer</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={assigning || !selectedUserId}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-[#111111] px-4 py-2 text-xs font-semibold text-[#FFFFFF] shadow-subtle hover:bg-[#262626] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Add Assignment
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Active Assignments */}
        <div className="md:col-span-2">
          <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] shadow-subtle overflow-hidden">
            <div className="border-b border-[#F1F1F3] bg-[#F9F9FA] px-6 py-4">
              <h2 className="font-heading text-lg font-bold text-[#111111]">Active Assignments</h2>
              <p className="text-xs text-[#6B6B73]">Users granted access to this docket.</p>
            </div>
            
            {assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <UserIcon className="h-8 w-8 text-[#E5E5E7] mb-2" />
                <p className="text-sm font-semibold text-[#111111]">No personnel assigned</p>
                <p className="text-xs text-[#6B6B73]">Use the form to assign users to this case.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F1F1F3]">
                {assignments.map(a => (
                  <div key={a.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#F9F9FA] transition-colors">
                    <div>
                      <p className="font-semibold text-sm text-[#111111]">
                        {a.profiles.fullName || "Unknown Name"}
                      </p>
                      <p className="text-xs text-[#6B6B73] font-mono mt-0.5">
                        {a.profiles.email}
                      </p>
                      <div className="mt-1 inline-flex items-center rounded-sm bg-[#F1F1F3] px-2 py-0.5 text-[10px] font-mono font-medium text-[#111111]">
                        {a.assigned_role}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRemove(a.user_id)}
                      className="rounded-md p-1.5 text-[#8E8E93] hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Remove access"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
