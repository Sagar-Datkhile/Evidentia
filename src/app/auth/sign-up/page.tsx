"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  User as UserIcon,
  Phone,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/auth/GoogleIcon";

// International phone number validator (E.164 format or leading + with 7 to 15 digits)
function validateInternationalPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  const e164Regex = /^\+?[1-9]\d{6,14}$/;
  return e164Regex.test(cleaned);
}

function SignUpContent() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [successConfirmation, setSuccessConfirmation] = useState(false);

  const handlePhoneBlur = () => {
    if (phone && !validateInternationalPhone(phone)) {
      setPhoneError("Please enter a valid international phone number (e.g., +1 234 567 8900 or +91 98765 43210).");
    } else {
      setPhoneError(null);
    }
  };

  const validatePassword = (pass: string): boolean => {
    if (pass.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate international phone
    if (!validateInternationalPhone(phone)) {
      setPhoneError("Please enter a valid international phone number (e.g., +1 234 567 8900 or +91 98765 43210).");
      return;
    }

    // Validate password policy
    if (!validatePassword(password)) {
      return;
    }

    setIsLoading(true);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const emailRedirectTo = `${origin}/auth/callback?next=/dashboard`;

      // Supabase signup with default role 'user' and profile metadata
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo,
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            role: "user", // Default standard user role
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      // Check if email confirmation is required by Supabase
      if (data.user && !data.session) {
        setSuccessConfirmation(true);
        setIsLoading(false);
      } else if (data.session) {
        // Auto-confirmed or verification disabled: navigate to dashboard
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create account.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/auth/callback?next=/dashboard`;

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
        if (error.message.toLowerCase().includes("provider") || error.message.toLowerCase().includes("not enabled")) {
          setErrorMessage(
            "Google OAuth is not yet enabled in this Supabase project. Please configure Google provider in your Supabase dashboard or register with email and password."
          );
        } else {
          setErrorMessage(error.message);
        }
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initiate Google registration.");
      setIsGoogleLoading(false);
    }
  };

  if (successConfirmation) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-xl border border-[#E5E5E7] bg-[#FFFFFF] p-8 text-center shadow-editorial sm:p-10">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-[#111111]">
            Verify Your Email
          </h2>
          <p className="mt-3 text-xs text-[#6B6B73] leading-relaxed">
            We have sent a verification link to <span className="font-semibold text-[#111111]">{email}</span>. Please click the link in your email to confirm your account and sign in to EVIDENTIA.
          </p>
          <div className="mt-8">
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center justify-center rounded-md bg-[#111111] px-5 py-2.5 text-xs font-semibold text-[#FFFFFF] hover:bg-[#262626] transition-colors"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              Create Your Account
            </h1>
            <p className="mt-2 text-xs text-[#6B6B73]">
              Get started with EVIDENTIA.
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
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="full_name"
                className="block text-xs font-semibold text-[#111111] mb-1.5 font-mono"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-2.5 h-4 w-4 text-[#8E8E93]" />
                <input
                  id="full_name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="e.g. Inspector Rajesh Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] pl-10 pr-3.5 py-2.5 text-xs text-[#111111] transition-colors placeholder:text-[#8E8E93] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#111111] mb-1.5 font-mono"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-[#8E8E93]" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="officer@police.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-[#E5E5E7] bg-[#F9F9FA] pl-10 pr-3.5 py-2.5 text-xs text-[#111111] transition-colors placeholder:text-[#8E8E93] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-semibold text-[#111111] mb-1.5 font-mono"
              >
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-2.5 h-4 w-4 text-[#8E8E93]" />
                <input
                  id="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="+91 98765 43210 or +1 234 567 8900"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  onBlur={handlePhoneBlur}
                  className={`w-full rounded-md border bg-[#F9F9FA] pl-10 pr-3.5 py-2.5 text-xs text-[#111111] transition-colors placeholder:text-[#8E8E93] focus:bg-[#FFFFFF] focus:outline-none ${
                    phoneError ? "border-red-400 focus:border-red-500" : "border-[#E5E5E7] focus:border-[#111111]"
                  }`}
                />
              </div>
              {phoneError && (
                <p className="mt-1 text-[11px] text-red-600">{phoneError}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-[#111111] mb-1.5 font-mono"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-[#8E8E93]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) validatePassword(e.target.value);
                  }}
                  className={`w-full rounded-md border bg-[#F9F9FA] pl-10 pr-10 py-2.5 text-xs text-[#111111] transition-colors placeholder:text-[#8E8E93] focus:bg-[#FFFFFF] focus:outline-none ${
                    passwordError ? "border-red-400 focus:border-red-500" : "border-[#E5E5E7] focus:border-[#111111]"
                  }`}
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
              {passwordError ? (
                <p className="mt-1 text-[11px] text-red-600">{passwordError}</p>
              ) : (
                <p className="mt-1 text-[10px] text-[#6B6B73]">
                  Enforce strong password policy (minimum 8 characters).
                </p>
              )}
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
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
            onClick={handleGoogleSignUp}
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

          {/* Footer Link to Sign In */}
          <div className="mt-8 text-center border-t border-[#F1F1F3] pt-6">
            <p className="text-xs text-[#6B6B73]">
              Already have an account?{" "}
              <Link
                href="/auth/sign-in"
                className="font-semibold text-[#111111] underline underline-offset-2 hover:text-[#262626] transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#111111]" />
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
