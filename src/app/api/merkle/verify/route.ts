import { NextResponse, NextRequest } from "next/server";
import { verifyInclusionProof } from "@/lib/crypto/merkle";
import { z } from "zod";

const merkleVerifySchema = z.object({
  leafHash: z.string().length(64),
  proofSteps: z.array(
    z.object({
      siblingHash: z.string().length(64),
      position: z.enum(["left", "right"]),
    })
  ),
  rootHash: z.string().length(64),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = merkleVerifySchema.parse(body);

    const isValid = await verifyInclusionProof(
      validated.leafHash,
      validated.proofSteps,
      validated.rootHash
    );

    return NextResponse.json({
      valid: isValid,
      leafHash: validated.leafHash,
      rootHash: validated.rootHash,
      domainSeparation: "RFC 6962",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid Merkle proof payload" }, { status: 400 });
  }
}
