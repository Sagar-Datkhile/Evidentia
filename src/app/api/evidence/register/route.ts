/**
 * POST /api/evidence/register
 *
 * Multipart form-data endpoint for registering a new Genesis V1 evidence record.
 *
 * Fields:
 *   file          (File)   - raw evidence binary
 *   caseId        (string) - case ID to attach evidence to
 *   title         (string) - human-readable evidence label
 *   category      (string) - EvidenceCategory enum value
 *   commitMessage (string) - mandatory audit commit message
 *   note          (string, optional) - custody notes
 *
 * Server-side workflow:
 *   1. Authenticate caller via Supabase session cookie
 *   2. Fetch caller profile (via authenticated client, not admin client)
 *   3. Verify caller is assigned to the case via RLS
 *   4. Receive full file bytes server-side via formData()
 *   5. AES-256-GCM encrypt file bytes
 *   6. Upload ciphertext to Supabase private-evidence storage bucket
 *   7. Compute canonical commit hash + Ed25519 system signature
 *   8. Atomic DB insert: evidence + evidence_version + evidence_commit + custody_event
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registerEvidence } from "@/lib/supabase/evidence-service";
import { computeSha256 } from "@/lib/crypto/sha256";

const VALID_CATEGORIES = [
  "Document",
  "Digital Image",
  "Audio",
  "Video",
  "Forensic Dump",
  "Other",
] as const;

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate via Supabase session cookie
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Please sign in." }, { status: 401 });
    }

    // 2. Fetch caller profile using the authenticated session client.
    //    RLS policy "Profiles readable by authenticated users: USING(true)"
    //    ensures any authenticated user can read profiles. Their own row is always visible.
    //    We use maybeSingle() so a missing row returns null instead of throwing.
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "[POST /api/evidence/register] Profile lookup error:",
        profileError.message,
        "code:",
        profileError.code
      );
      return NextResponse.json(
        {
          error: `Profile lookup failed (DB code: ${profileError.code}). ${profileError.message}`,
        },
        { status: 500 }
      );
    }

    // 2b. If profile row is genuinely absent (e.g. trigger ran before schema was ready,
    //     or user predates the trigger), auto-provision a minimal profile.
    //     Never grant admin via this path — always default to 'user' role.
    let profile = profileData;
    if (!profile) {
      console.warn(
        `[POST /api/evidence/register] No profile row found for user ${user.id}. Provisioning from auth metadata.`
      );
      const metadata = user.user_metadata || {};
      const fullName =
        metadata.full_name ||
        metadata.name ||
        user.email?.split("@")[0] ||
        "Judicial Officer";

      // Admin client is needed for the INSERT because the anon+JWT client cannot
      // INSERT a profile for itself (only UPDATE is permitted via the profiles RLS).
      const adminClient = createAdminClient();
      const { data: provisioned, error: provisionError } = await adminClient
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: user.email || "",
            full_name: fullName,
            role: "user",
            is_active: true,
          },
          { onConflict: "id", ignoreDuplicates: false }
        )
        .select("id, full_name, role, is_active")
        .single();

      if (provisionError || !provisioned) {
        console.error(
          "[POST /api/evidence/register] Profile provisioning failed:",
          provisionError?.message
        );
        return NextResponse.json(
          {
            error:
              "Your user profile could not be found or provisioned. Please sign out and sign back in, or contact an administrator.",
          },
          { status: 403 }
        );
      }

      profile = provisioned;
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
      return NextResponse.json(
        { error: "Title must be at least 2 characters." },
        { status: 400 }
      );
    }
    if (!category || !VALID_CATEGORIES.includes(category as any)) {
      return NextResponse.json(
        {
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
        },
        { status: 400 }
      );
    }
    if (!commitMessage || commitMessage.length < 3) {
      return NextResponse.json(
        { error: "Commit message must be at least 3 characters." },
        { status: 400 }
      );
    }

    // 5. Case authorization guard — uses the authenticated session client so RLS
    //    enforces can_access_case() (must be admin or assigned to case)
    const { data: caseRow, error: caseCheckError } = await supabase
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .single();

    if (caseCheckError || !caseRow) {
      return NextResponse.json(
        {
          error:
            "Case not found or you are not authorized to add evidence to this case.",
        },
        { status: 403 }
      );
    }

    // 6. Read file bytes and compute server-side SHA-256
    const fileBuffer = await file.arrayBuffer();
    const serverSha256 = await computeSha256(fileBuffer);

    // 7. Extract text content for diff engine (text files only, < 5 MB)
    let textContent: string | undefined;
    const isTextFile =
      file.type.startsWith("text/") ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".log") ||
      file.name.endsWith(".json") ||
      file.name.endsWith(".csv") ||
      file.name.endsWith(".xml");

    if (isTextFile && file.size < 5 * 1024 * 1024) {
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
