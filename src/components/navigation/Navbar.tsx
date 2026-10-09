"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  FileCheck,
  FolderGit2,
  GitBranch,
  ArrowRightLeft,
  FileText,
  UserCheck,
  Menu,
  X,
  ChevronDown,
  Lock,
} from "lucide-react";
import { DEMO_USERS } from "@/lib/data/store";
import { UserProfile, UserRole } from "@/lib/supabase/types";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_USERS.police);

  useEffect(() => {
    // Check if user is stored in local session
    const saved = localStorage.getItem("evidentia_active_user");
    if (saved && DEMO_USERS[saved]) {
      setCurrentUser(DEMO_USERS[saved]);
    }
  }, []);

  const switchUser = (roleKey: string) => {
    const user = DEMO_USERS[roleKey];
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("evidentia_active_user", roleKey);
      setRoleDropdownOpen(false);
      window.dispatchEvent(new CustomEvent("evidentia_user_changed", { detail: user }));
    }
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Shield },
    { href: "/cases", label: "Cases", icon: FolderGit2 },
    { href: "/evidence", label: "Evidence", icon: FileCheck },
    { href: "/custody", label: "Custody", icon: ArrowRightLeft },
    { href: "/reports", label: "Reports & Audit", icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E5E7] bg-[#F9F9FA]/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center gap-6">
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

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex md:items-center md:gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
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
        </div>

        {/* Right Action: Active Role Switcher & Auth */}
        <div className="hidden sm:flex sm:items-center sm:gap-3">
          {/* Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 rounded-md border border-[#E5E5E7] bg-[#FFFFFF] px-2.5 py-1.5 text-xs font-medium text-[#111111] shadow-subtle transition-all hover:border-[#111111]"
              title="Switch demo persona to test role-scoped permissions"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="flex flex-col text-left">
                <span className="font-semibold text-[11px] leading-tight text-[#111111]">
                  {currentUser.fullName}
                </span>
                <span className="font-mono text-[9px] text-[#6B6B73]">
                  {currentUser.role}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-[#6B6B73]" />
            </button>

            {/* Dropdown Menu */}
            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg border border-[#E5E5E7] bg-[#FFFFFF] p-1.5 shadow-editorial">
                <div className="px-2.5 py-1.5 border-b border-[#F1F1F3] mb-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#6B6B73]">
                    Switch Judicial Persona
                  </p>
                </div>
                {Object.entries(DEMO_USERS).map(([key, u]) => (
                  <button
                    key={key}
                    onClick={() => switchUser(key)}
                    className={`w-full flex items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                      currentUser.id === u.id
                        ? "bg-[#F1F1F3] text-[#111111] font-medium"
                        : "text-[#6B6B73] hover:bg-[#F9F9FA] hover:text-[#111111]"
                    }`}
                  >
                    <UserCheck className={`h-3.5 w-3.5 mt-0.5 ${currentUser.id === u.id ? "text-[#111111]" : "text-[#AEAEB2]"}`} />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-[#111111]">{u.fullName}</span>
                      <span className="text-[10px] text-[#6B6B73]">{u.role}</span>
                      <span className="text-[9px] font-mono text-[#8E8E93]">{u.organizationName}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action: Register Evidence */}
          <Link
            href="/evidence/new"
            className="flex items-center gap-1.5 rounded-md bg-[#111111] px-3 py-1.5 text-xs font-semibold text-[#FFFFFF] shadow-subtle transition-all hover:bg-[#262626]"
          >
            + Register Evidence
          </Link>
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
          {/* Active User Card on Mobile */}
          <div className="mb-4 rounded-md border border-[#E5E5E7] bg-[#F9F9FA] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase text-[#6B6B73]">Current Role</span>
              <span className="text-[10px] font-mono text-emerald-600 font-semibold">Active Session</span>
            </div>
            <p className="text-xs font-bold text-[#111111]">{currentUser.fullName}</p>
            <p className="text-[11px] text-[#6B6B73]">{currentUser.role} &middot; {currentUser.organizationName}</p>
            <div className="mt-2.5 grid grid-cols-2 gap-1.5">
              {Object.entries(DEMO_USERS).map(([key, u]) => (
                <button
                  key={key}
                  onClick={() => {
                    switchUser(key);
                    setMobileMenuOpen(false);
                  }}
                  className={`rounded px-2 py-1 text-[10px] font-mono text-left border ${
                    currentUser.id === u.id
                      ? "border-[#111111] bg-[#111111] text-[#FFFFFF]"
                      : "border-[#E5E5E7] bg-[#FFFFFF] text-[#6B6B73]"
                  }`}
                >
                  {u.role.replace(" Officer", "").replace(" Analyst", "")}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
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
            <Link
              href="/evidence/new"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-[#111111] py-2.5 text-xs font-semibold text-[#FFFFFF]"
            >
              + Register New Evidence
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
