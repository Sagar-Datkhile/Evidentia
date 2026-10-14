import React from "react";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#E5E5E7] bg-[#FFFFFF]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-1.5 text-[#8E8E93]">
            <Shield className="h-3.5 w-3.5 text-[#111111]" />
            <span className="font-heading text-xs font-semibold tracking-tight text-[#111111]">
              EVIDENTIA
            </span>
            <span className="text-[11px]">
              &copy; {new Date().getFullYear()}
            </span>
          </div>

          {/* Tech badges */}
          <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] text-[#8E8E93]">
            <span>SHA-256 Sealed</span>
            <span className="h-0.5 w-0.5 rounded-full bg-[#C7C7CC]" />
            <span>Append-Only</span>
            <span className="h-0.5 w-0.5 rounded-full bg-[#C7C7CC]" />
            <span>Zero-Trust DEMS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
