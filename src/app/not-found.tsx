import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E5E5E7] bg-white shadow-subtle">
        <ShieldAlert className="h-7 w-7 text-[#111111]" />
      </div>
      <span className="font-mono text-xs uppercase tracking-widest text-[#6B6B73]">
        404 — Record Not Found
      </span>
      <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
        Page Not Found
      </h1>
      <p className="mt-2 max-w-md text-xs text-[#6B6B73] leading-relaxed">
        The requested digital evidence record, case docket, or page does not exist or has been moved.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-md bg-[#111111] px-4 py-2 text-xs font-semibold text-white shadow-subtle transition-all hover:bg-[#262626]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
