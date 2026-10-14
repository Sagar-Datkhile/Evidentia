"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/auth/GoogleIcon";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(urlError);

  const supabase = createClient();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        router.push(next);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during sign in.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        // Helpful diagnostic message if provider is not yet enabled in Supabase dashboard
        if (error.message.toLowerCase().includes("provider") || error.message.toLowerCase().includes("not enabled")) {
          setErrorMessage(
            "Google OAuth is not yet enabled in this Supabase project. Please configure Google provider in your Supabase dashboard or sign in with email and password."
          );
        } else {
          setErrorMessage(error.message);
        }
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initiate Google sign-in.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-8 shadow-editorial sm:p-10">
          {/* Header & Branding */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
              <span className="font-heading text-lg font-bold text-[#111111]">EVIDENTIA</span>
            </Link>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
              Welcome Back
            </h1>
            <p className="mt-2 text-xs text-[#6B6B73]">
              Sign in to your EVIDENTIA account.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#111111] mb-1.5 font-mono"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3.5 py-2.5 text-xs text-[#111111] transition-colors placeholder:text-[#8E8E93] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[#111111] font-mono"
                >
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[11px] font-medium text-[#6B6B73] hover:text-[#111111] transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] px-3.5 py-2.5 pr-10 text-xs text-[#111111] transition-colors placeholder:text-[#8E8E93] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#8E8E93] hover:text-[#111111] focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-[#111111] py-2.5 text-xs font-semibold text-[#FFFFFF] shadow-subtle transition-all hover:bg-[#262626] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E5E7]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
              <span className="bg-[#FFFFFF] px-2 text-[#6B6B73]">Or</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            className="flex w-full items-center justify-center gap-2.5 rounded-md border border-[#E5E5E7] bg-[#FFFFFF] py-2.5 text-xs font-medium text-[#111111] shadow-subtle transition-all hover:border-[#111111] hover:bg-[#F9F9FA] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#111111]" />
            ) : (
              <GoogleIcon className="h-4 w-4" />
            )}
            <span>Continue with Google</span>
          </button>

          {/* Footer Link to Sign Up */}
          <div className="mt-8 text-center border-t border-[#F1F1F3] pt-6">
            <p className="text-xs text-[#6B6B73]">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="font-semibold text-[#111111] underline underline-offset-2 hover:text-[#262626] transition-colors"
              >
                Create an Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#111111]" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
