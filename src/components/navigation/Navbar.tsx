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
  LayoutDashboard,
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

  const displayName = profile?.fullName || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Authenticated User";
  const roleLabel = formatRoleLabel(profile?.role);
  const initials = getInitials(displayName, user?.email);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E5E7] bg-[#F9F9FA]/90 backdrop-blur-md transition-all">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center">
          <Link
            href="/dashboard"
            onClick={(e) => handleNavClick("/dashboard", e)}
            className="group flex items-center gap-2.5"
          >
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
        </div>

        {/* Desktop Navigation Links (Centered) */}
        <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex md:items-center md:gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href);
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

        {/* Right Section: Auth & Profile */}
        <div className="hidden sm:flex sm:items-center sm:gap-3">
          {!user ? (
            /* Unauthenticated State: Sign In Button Only */
            <Link
              href="/auth/sign-in"
              className="flex items-center gap-1.5 rounded-md bg-[#111111] px-4 py-2 text-xs font-semibold text-[#FFFFFF] shadow-subtle transition-all hover:bg-[#262626]"
            >
              Sign In
            </Link>
          ) : (
            /* Authenticated State: Profile Dropdown */
            <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-2.5 py-1.5 text-xs font-medium text-[#111111] shadow-subtle transition-all hover:border-[#111111]"
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                >
                  {/* Avatar or Initials */}
                  {profile?.avatarUrl ? (
                    <div className="relative h-6 w-6 overflow-hidden rounded-full border border-[#E5E5E7]">
                      <Image
                        src={profile.avatarUrl}
                        alt={displayName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#111111] text-[10px] font-semibold text-[#FFFFFF]">
                      {initials}
                    </div>
                  )}

                  <div className="flex flex-col text-left">
                    <span className="max-w-[130px] truncate font-semibold text-[11px] leading-tight text-[#111111]">
                      {displayName}
                    </span>
                    <span className="font-mono text-[9px] text-[#6B6B73]">
                      {roleLabel}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-[#6B6B73]" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-lg border border-[#E5E5E7] bg-[#FFFFFF] p-1.5 shadow-editorial z-50">
                    <div className="border-b border-[#F1F1F3] px-3 py-2.5 mb-1">
                      <p className="font-semibold text-xs text-[#111111] truncate">{displayName}</p>
                      <p className="text-[10px] text-[#6B6B73] truncate font-mono mt-0.5">{user.email}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E7] bg-[#F9F9FA] px-2 py-0.5 text-[10px] font-mono text-[#111111]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>{roleLabel}</span>
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-[#111111] hover:bg-[#F9F9FA] transition-colors"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-[#6B6B73]" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      href="/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-[#111111] hover:bg-[#F9F9FA] transition-colors"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5 text-[#6B6B73]" />
                      <span>Dashboard</span>
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

                    <div className="my-1 border-t border-[#F1F1F3]" />

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5 text-red-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
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

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-[#E5E5E7] bg-[#FFFFFF] px-4 py-4 md:hidden animate-in slide-in-from-top-2">
          {user ? (
            /* Authenticated User Summary on Mobile */
            <div className="mb-4 rounded-md border border-[#E5E5E7] bg-[#F9F9FA] p-3">
              <div className="flex items-center gap-3">
                {profile?.avatarUrl ? (
                  <div className="relative h-9 w-9 overflow-hidden rounded-full border border-[#E5E5E7]">
                    <Image
                      src={profile.avatarUrl}
                      alt={displayName}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111111] text-xs font-semibold text-[#FFFFFF]">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#111111] truncate">{displayName}</p>
                  <p className="text-[11px] text-[#6B6B73] font-mono truncate">{roleLabel}</p>
                  <p className="text-[10px] text-[#8E8E93] truncate">{user.email}</p>
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
            /* Unauthenticated Mobile CTA */
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

          {/* Navigation Links */}
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    handleNavClick(link.href, e);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#111111] text-[#FFFFFF]"
                      : "text-[#111111] hover:bg-[#F1F1F3]"
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
