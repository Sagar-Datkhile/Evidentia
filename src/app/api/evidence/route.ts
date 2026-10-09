import { NextResponse, NextRequest } from "next/server";
import { evidenceStore, DEMO_USERS } from "@/lib/data/store";
import { z } from "zod";

const registerEvidenceSchema = z.object({
  caseId: z.string(),
  title: z.string().min(2),
  category: z.enum(["Document", "Digital Image", "Audio", "Video", "Forensic Dump", "Other"]),
  fileName: z.string(),
  fileSizeBytes: z.number(),
  mimeType: z.string(),
  fileSha256: z.string().length(64),
  commitMessage: z.string().min(3),
  note: z.string().optional(),
  textContent: z.string().optional(),
});

export async function GET() {
  const evidence = evidenceStore.getAllEvidence();
  return NextResponse.json({ evidence });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerEvidenceSchema.parse(body);

    const result = await evidenceStore.registerEvidence({
      ...validated,
      actor: DEMO_USERS.police,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to register evidence" }, { status: 400 });
  }
}
