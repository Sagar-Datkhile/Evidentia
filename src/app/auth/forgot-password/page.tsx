"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Shield, ArrowRight, ArrowLeft, Mail, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/auth/callback?next=/profile`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      setIsSent(true);
      setIsLoading(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send password recovery link.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-8 shadow-editorial sm:p-10">
          {/* Header & Branding */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
              <div className="flex h-10 w-10 items-center justify-center rounded border border-[#111111] bg-[#111111] text-[#FFFFFF] shadow-sm transition-transform group-hover:scale-105">
                <Shield className="h-5 w-5" />
              </div>
            </Link>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
              Reset Password
            </h1>
            <p className="mt-2 text-xs text-[#6B6B73]">
              Enter your email to receive a password recovery link.
            </p>
          </div>

          {isSent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-sm font-bold text-[#111111]">Recovery Link Dispatched</h2>
              <p className="mt-2 text-xs text-[#6B6B73] leading-relaxed">
                If an account exists for <span className="font-semibold text-[#111111]">{email}</span>, a secure password recovery link has been sent. Please check your inbox.
              </p>
              <div className="mt-8">
                <Link
                  href="/auth/sign-in"
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#111111] px-5 py-2.5 text-xs font-semibold text-[#FFFFFF] hover:bg-[#262626] transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-[#111111] mb-1.5 font-mono"
                  >
                    Judicial Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-[#8E8E93]" />
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="officer@police.gov.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] pl-10 pr-3.5 py-2.5 text-xs text-[#111111] transition-colors placeholder:text-[#8E8E93] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-[#111111] py-2.5 text-xs font-semibold text-[#FFFFFF] shadow-subtle transition-all hover:bg-[#262626] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Sending link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Link</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center border-t border-[#F1F1F3] pt-6">
                <Link
                  href="/auth/sign-in"
                  className="inline-flex items-center gap-1.5 text-xs text-[#6B6B73] hover:text-[#111111] transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
