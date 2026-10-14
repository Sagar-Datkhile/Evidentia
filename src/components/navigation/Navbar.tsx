"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Shield,
  FileCheck,
  FolderGit2,
  ArrowRightLeft,
  FileText,
  Menu,
  X,
  ChevronDown,
  User as UserIcon,
  LogOut,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatRoleLabel } from "@/lib/supabase/types";

function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (email && email.trim().length > 0) {
    return email.slice(0, 2).toUpperCase();
  }
  return "EO";
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isLoading, isPending, signOut } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dashboard removed from top nav — still accessible via profile dropdown
  const navLinks = [
    { href: "/cases", label: "Cases", icon: FolderGit2 },
    { href: "/evidence", label: "Evidence", icon: FileCheck },
    { href: "/custody", label: "Custody", icon: ArrowRightLeft },
    { href: "/reports", label: "Reports & Audit", icon: FileText },
  ];

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push(`/auth/sign-in?next=${encodeURIComponent(href)}`);
    }
  };

  const displayName =
    profile?.fullName ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Authenticated User";
  const roleLabel = formatRoleLabel(profile?.role);
  const initials = getInitials(displayName, user?.email);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E5E7] bg-[#F9F9FA]/90 backdrop-blur-md transition-all">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Brand & Logo (left) ─────────────────────────────── */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded border border-[#111111] bg-[#111111] text-[#FFFFFF] shadow-sm transition-transform group-hover:scale-105">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg font-bold tracking-tight text-[#111111]">
              EVIDENTIA
            </span>
            <span className="font-mono text-[9px] font-medium tracking-wider text-[#6B6B73]">
              TAMPER-EVIDENT DEMS
            </span>
          </div>
        </Link>

        {/* ── Desktop Nav — absolutely centered ───────────────── */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 md:flex md:items-center md:gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(link.href, e)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-[#111111] text-[#FFFFFF]"
                    : "text-[#6B6B73] hover:bg-[#F1F1F3] hover:text-[#111111]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* ── Right: Auth / Profile ────────────────────────────── */}
        <div className="hidden sm:flex sm:items-center sm:gap-3">
          {!user ? (
            <Link
              href="/auth/sign-in"
              className="flex items-center gap-1.5 rounded-md bg-[#111111] px-4 py-2 text-xs font-semibold text-[#FFFFFF] shadow-subtle transition-all hover:bg-[#262626]"
            >
              Sign In
            </Link>
          ) : (
            <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 rounded-xl border border-[#E5E5E7] bg-white px-3 py-2 text-xs font-medium text-[#111111] shadow-subtle transition-all hover:border-[#111111] hover:shadow-editorial"
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                >
                  {/* Avatar */}
                  {profile?.avatarUrl ? (
                    <div className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-[#E5E5E7] ring-2 ring-white">
                      <Image src={profile.avatarUrl} alt={displayName} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#111111] to-[#3A3A3C] text-[11px] font-bold text-white shadow-inner">
                      {initials}
                    </div>
                  )}

                  {/* Name + Role */}
                  <div className="flex flex-col text-left">
                    <span className="max-w-[140px] truncate text-[12px] font-semibold leading-tight text-[#111111]">
                      {displayName}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[9px] leading-tight ${
                        isPending ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isPending ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                        }`}
                      />
                      {roleLabel}
                    </span>
                  </div>

                  <ChevronDown
                    className={`h-3.5 w-3.5 text-[#8E8E93] transition-transform duration-200 ${
                      profileDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-72 rounded-2xl border border-[#E5E5E7] bg-white p-2 shadow-editorial z-50 animate-in fade-in slide-in-from-top-1 duration-150">

                    {/* Identity card */}
                    <div className="flex items-center gap-3 rounded-xl bg-[#F9F9FA] border border-[#F1F1F3] px-3 py-3 mb-2">
                      {profile?.avatarUrl ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm">
                          <Image src={profile.avatarUrl} alt={displayName} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#111111] to-[#3A3A3C] text-sm font-bold text-white shadow-sm">
                          {initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[13px] text-[#111111] truncate">{displayName}</p>
                        <p className="text-[10px] text-[#6B6B73] truncate font-mono mt-0.5">{user.email}</p>
                        <div
                          className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold ${
                            isPending
                              ? "bg-amber-50 border border-amber-200 text-amber-700"
                              : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isPending ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                            }`}
                          />
                          {roleLabel}
                        </div>
                      </div>
                    </div>

                    {isPending && (
                      <div className="mb-2 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-700 leading-relaxed">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
                        <span>Awaiting administrative verification for evidence operations.</span>
                      </div>
                    )}

                    <Link
                      href="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-[#111111] hover:bg-[#F9F9FA] transition-colors"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-[#6B6B73]" />
                      <span>My Profile</span>
                    </Link>



                    {profile?.role === "admin" && (
                      <Link
                        href="/admin/cases"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-[#111111] hover:bg-[#F9F9FA] transition-colors"
                      >
                        <Shield className="h-3.5 w-3.5 text-[#6B6B73]" />
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <div className="my-1.5 border-t border-[#F1F1F3]" />

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
          )}
        </div>

        {/* ── Mobile Hamburger ─────────────────────────────────── */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-[#E5E5E7] bg-[#FFFFFF] text-[#111111]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="border-b border-[#E5E5E7] bg-[#FFFFFF] px-4 py-4 md:hidden animate-in slide-in-from-top-2">
          {user ? (
            <div className="mb-4 rounded-xl border border-[#E5E5E7] bg-[#F9F9FA] p-3">
              <div className="flex items-center gap-3">
                {profile?.avatarUrl ? (
                  <div className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-white shadow-sm">
                    <Image src={profile.avatarUrl} alt={displayName} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#111111] to-[#3A3A3C] text-xs font-bold text-white shadow-sm">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#111111] truncate">{displayName}</p>
                  <p className="text-[10px] text-[#6B6B73] font-mono truncate mt-0.5">{user.email}</p>
                  <div
                    className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold ${
                      isPending
                        ? "bg-amber-50 border border-amber-200 text-amber-700"
                        : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isPending ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                      }`}
                    />
                    {roleLabel}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 rounded border border-[#E5E5E7] bg-[#FFFFFF] py-1.5 text-center text-xs font-medium text-[#111111]"
                >
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="flex-1 rounded border border-red-200 bg-red-50 py-1.5 text-center text-xs font-medium text-red-700"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <Link
                href="/auth/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-md bg-[#111111] py-2.5 text-xs font-semibold text-[#FFFFFF] shadow-subtle"
              >
                Sign In
              </Link>
            </div>
          )}

          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    handleNavClick(link.href, e);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    isActive ? "bg-[#111111] text-[#FFFFFF]" : "text-[#111111] hover:bg-[#F1F1F3]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
