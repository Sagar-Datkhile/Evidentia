/**
 * POST /api/evidence/register
 *
 * Multipart form-data endpoint for registering a new Genesis V1 evidence record.
 * 
 * Fields:
 *   file       (File)   – raw evidence binary
 *   caseId     (string) – case ID to attach evidence to
 *   title      (string) – human-readable evidence label
 *   category   (string) – EvidenceCategory enum value
 *   commitMessage (string) – mandatory audit commit message
 *   note       (string, optional) – custody notes
 *
 * Server-side workflow:
 *   1. Authenticate caller via Supabase session cookie
 *   2. Verify caller is assigned to the case (can_access_case guard)
 *   3. Receive full file bytes server-side via formData()
 *   4. AES-256-GCM encrypt file bytes
 *   5. Upload ciphertext to Supabase private-evidence storage bucket
 *   6. Compute canonical commit hash → Ed25519 system signature
 *   7. Atomic DB insert: evidence + evidence_version + evidence_commit + custody_event
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registerEvidence } from "@/lib/supabase/evidence-service";
import { computeSha256 } from "@/lib/crypto/sha256";

const VALID_CATEGORIES = ["Document", "Digital Image", "Audio", "Video", "Forensic Dump", "Other"] as const;

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Please sign in." }, { status: 401 });
    }

    // 2. Fetch caller profile
    const adminClient = createAdminClient();
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, full_name, role, is_active")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 403 });
    }

    if (!profile.is_active) {
      return NextResponse.json({ error: "Account is inactive." }, { status: 403 });
    }

    // 3. Parse multipart form
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const caseId = (formData.get("caseId") as string | null)?.trim();
    const title = (formData.get("title") as string | null)?.trim();
    const category = (formData.get("category") as string | null)?.trim();
    const commitMessage = (formData.get("commitMessage") as string | null)?.trim();
    const note = (formData.get("note") as string | null)?.trim() || undefined;

    // 4. Validate inputs
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Evidence file is required." }, { status: 400 });
    }
    if (!caseId) {
      return NextResponse.json({ error: "caseId is required." }, { status: 400 });
    }
    if (!title || title.length < 2) {
      return NextResponse.json({ error: "Title must be at least 2 characters." }, { status: 400 });
    }
    if (!category || !VALID_CATEGORIES.includes(category as any)) {
      return NextResponse.json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` }, { status: 400 });
    }
    if (!commitMessage || commitMessage.length < 3) {
      return NextResponse.json({ error: "Commit message must be at least 3 characters." }, { status: 400 });
    }

    // 5. Case assignment guard (use user's session client for RLS)
    const { data: caseRow, error: caseCheckError } = await supabase
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .single();

    if (caseCheckError || !caseRow) {
      return NextResponse.json(
        { error: "Case not found or you are not authorized to add evidence to this case." },
        { status: 403 }
      );
    }

    // 6. Read file bytes and compute server-side SHA-256
    const fileBuffer = await file.arrayBuffer();
    const serverSha256 = await computeSha256(fileBuffer);

    // 7. Read text content for diffing (text files only)
    let textContent: string | undefined;
    const isTextFile =
      file.type.startsWith("text/") ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".log") ||
      file.name.endsWith(".json") ||
      file.name.endsWith(".csv") ||
      file.name.endsWith(".xml");

    if (isTextFile && file.size < 5 * 1024 * 1024) {
      // Only extract text content for files < 5MB
      textContent = new TextDecoder("utf-8", { fatal: false }).decode(fileBuffer);
    }

    // 8. Register via service layer (encrypt, upload, DB insert)
    const result = await registerEvidence({
      caseId,
      title,
      category: category as any,
      fileBuffer,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type || "application/octet-stream",
      fileSha256: serverSha256,
      textContent,
      commitMessage,
      note,
      actorId: profile.id,
      actorName: profile.full_name,
      actorRole: profile.role,
    });

    return NextResponse.json(
      {
        evidenceId: result.evidence.id,
        commitHash: result.commit.commitHash,
        sha256: serverSha256,
        storagePath: result.storagePath,
        evidence: result.evidence,
        version: result.version,
        commit: result.commit,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/evidence/register]", err);
    return NextResponse.json(
      { error: err.message ?? "Evidence registration failed." },
      { status: 500 }
    );
  }
}
