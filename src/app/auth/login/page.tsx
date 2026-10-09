"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Lock,
  Mail,
  UserCheck,
  ArrowRight,
  KeyRound,
  AlertCircle,
} from "lucide-react";
import { DEMO_USERS } from "@/lib/data/store";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    // If matches any demo user email, switch to that user
    const matched = Object.entries(DEMO_USERS).find(([_, u]) => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      localStorage.setItem("evidentia_active_user", matched[0]);
      window.dispatchEvent(new CustomEvent("evidentia_user_changed", { detail: matched[1] }));
      router.push("/dashboard");
    } else {
      // Default to police officer for general emails
      localStorage.setItem("evidentia_active_user", "police");
      router.push("/dashboard");
    }
  };

  const handleQuickDemoLogin = (roleKey: string) => {
    const user = DEMO_USERS[roleKey];
    if (user) {
      localStorage.setItem("evidentia_active_user", roleKey);
      window.dispatchEvent(new CustomEvent("evidentia_user_changed", { detail: user }));
      router.push("/dashboard");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-8 shadow-editorial">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded bg-[#111111] text-white">
            <Shield className="h-5 w-5" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#111111]">
            EVIDENTIA Portal
          </h1>
          <p className="mt-1 text-xs text-[#6B6B73]">
            Zero-Trust Judicial & Forensic Authentication
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleStandardLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#111111] mb-1 font-mono">
              Judicial Officer Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#8E8E93]" />
              <input
                type="email"
                required
                placeholder="officer@police.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] pl-9 pr-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111111] mb-1 font-mono">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#8E8E93]" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] pl-9 pr-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#111111] py-2.5 text-xs font-semibold text-[#FFFFFF] shadow-subtle hover:bg-[#262626] transition-all"
          >
            Sign In to Authenticated Docket
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        {/* Quick Demo Switcher Section */}
        <div className="mt-8 pt-6 border-t border-[#F1F1F3]">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#6B6B73] block text-center mb-3">
            Quick Demo Persona Sign In
          </span>

          <div className="space-y-2">
            {Object.entries(DEMO_USERS).map(([key, u]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleQuickDemoLogin(key)}
                className="w-full flex items-center justify-between rounded-md border border-[#E5E5E7] bg-[#F9F9FA] p-2.5 text-xs hover:border-[#111111] hover:bg-[#FFFFFF] transition-all"
              >
                <div className="text-left">
                  <p className="font-semibold text-[#111111]">{u.fullName}</p>
                  <p className="text-[10px] text-[#6B6B73]">{u.role} &middot; {u.organizationName}</p>
                </div>
                <UserCheck className="h-4 w-4 text-[#6B6B73]" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
