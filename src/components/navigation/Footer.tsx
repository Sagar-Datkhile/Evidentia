import React from "react";
import Link from "next/link";
import { Shield, Lock, FileCheck, CheckCircle2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#E5E5E7] bg-[#FFFFFF] py-12 text-[#6B6B73]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[#111111] text-[#FFFFFF]">
                <Shield className="h-3.5 w-3.5" />
              </div>
              <span className="font-heading text-base font-bold tracking-tight text-[#111111]">
                EVIDENTIA
              </span>
            </div>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-[#6B6B73]">
              Every Record. Every Handoff. Verifiable. Zero-trust, tamper-evident digital evidence management engineered for forensic and judicial rigor without overwriting originals.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-mono font-medium text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Ed25519 System Attestation Active
              </span>
            </div>
          </div>

          {/* Cryptographic Standards */}
          <div>
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#111111]">
              Standards
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>RFC 6962 Domain Merkle</li>
              <li>FIDO2 / WebAuthn Step-Up</li>
              <li>AES-256-GCM Envelope</li>
              <li>Cr.P.C. 65B Electronic Proof</li>
              <li>ISO/IEC 27037 Digital Forensics</li>
            </ul>
          </div>

          {/* Core Modules */}
          <div>
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#111111]">
              Platform
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/dashboard" className="transition-colors hover:text-[#111111]">
                  Role Dashboards
                </Link>
              </li>
              <li>
                <Link href="/cases" className="transition-colors hover:text-[#111111]">
                  Case Dockets
                </Link>
              </li>
              <li>
                <Link href="/evidence" className="transition-colors hover:text-[#111111]">
                  Evidence Registry
                </Link>
              </li>
              <li>
                <Link href="/custody" className="transition-colors hover:text-[#111111]">
                  Custody Chain
                </Link>
              </li>
              <li>
                <Link href="/reports" className="transition-colors hover:text-[#111111]">
                  Audit & Verification
                </Link>
              </li>
            </ul>
          </div>

          {/* Judicial Roles */}
          <div>
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#111111]">
              Supported Roles
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>Police Investigating Officers</li>
              <li>CFSL Forensic Examiners</li>
              <li>Public Prosecutors</li>
              <li>Judicial Evidence Clerks</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#F1F1F3] pt-6 sm:flex-row text-xs text-[#8E8E93]">
          <p>&copy; {new Date().getFullYear()} EVIDENTIA. Zero-Trust Digital Evidence Management System.</p>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>SHA-256 Byte Sealing</span>
            <span>&middot;</span>
            <span>Append-Only Versioning</span>
            <span>&middot;</span>
            <span>Non-Destructive V1</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
