import { NextResponse, NextRequest } from "next/server";
import { evidenceStore, DEMO_USERS } from "@/lib/data/store";
import { z } from "zod";

const createCaseSchema = z.object({
  caseNumber: z.string().min(3),
  title: z.string().min(3),
  jurisdiction: z.string().min(3),
  description: z.string().optional(),
});

export async function GET() {
  const cases = evidenceStore.getCases();
  return NextResponse.json({ cases });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createCaseSchema.parse(body);

    const created = evidenceStore.createCase({
      id: validated.caseNumber,
      caseNumber: validated.caseNumber,
      title: validated.title,
      jurisdiction: validated.jurisdiction,
      status: "Active",
      incidentDate: new Date().toISOString(),
      description: validated.description || "Official judicial investigation docket.",
      createdBy: DEMO_USERS.police.id,
    });

    return NextResponse.json({ case: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid case payload" }, { status: 400 });
  }
}
