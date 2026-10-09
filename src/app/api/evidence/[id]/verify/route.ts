import { NextResponse, NextRequest } from "next/server";
import { evidenceStore } from "@/lib/data/store";
import { verifyAttestation } from "@/lib/crypto/ed25519";
import { generateInclusionProof, verifyInclusionProof } from "@/lib/crypto/merkle";
import { z } from "zod";
import { VerificationVerdict, CheckOutcome } from "@/lib/supabase/types";

const verifyPayloadSchema = z.object({
  targetVersionNumber: z.number().default(1),
  candidateSha256: z.string().length(64),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = verifyPayloadSchema.parse(body);

    const evidence = evidenceStore.getEvidenceById(id);
    if (!evidence) {
      return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
    }

    const version = evidenceStore.getVersion(id, validated.targetVersionNumber);
    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    const commit = evidenceStore.getCommitForVersion(version.id);
    if (!commit) {
      return NextResponse.json({ error: "Commit lineage not found" }, { status: 404 });
    }

    // 1. Content Hash Comparison
    const isHashMatch = validated.candidateSha256.toLowerCase() === version.fileSha256.toLowerCase();
    const hashCheck: CheckOutcome = isHashMatch ? "PASS" : "FAIL";

    // 2. Commit Signature Verification (Ed25519)
    const isSigValid = await verifyAttestation(commit.commitHash, commit.signature);
    const sigCheck: CheckOutcome = isSigValid ? "PASS" : "FAIL";

    // 3. Merkle Inclusion Proof Verification
    const checkpoint = evidenceStore.getCheckpoint();
    const targetIdx = checkpoint.leafHashes.indexOf(version.fileSha256);
    let merkleCheck: CheckOutcome = "PASS";
    if (targetIdx >= 0) {
      try {
        const proof = await generateInclusionProof(checkpoint.leafHashes, targetIdx);
        const isMerkleValid = await verifyInclusionProof(proof.leafHash, proof.proofSteps, proof.rootHash);
        merkleCheck = isMerkleValid ? "PASS" : "FAIL";
      } catch {
        merkleCheck = "FAIL";
      }
    } else {
      merkleCheck = "PENDING";
    }

    // 4. Commit Chain Integrity
    const chainCheck: CheckOutcome =
      version.versionNumber === 1
        ? commit.parentCommitHash === null
          ? "PASS"
          : "FAIL"
        : commit.parentCommitHash !== null
        ? "PASS"
        : "FAIL";

    // Deterministic Verdict
    let verdict: VerificationVerdict = "VERIFICATION_INCOMPLETE";
    if (!isHashMatch) {
      verdict = "CONTENT_MISMATCH";
    } else if (!isSigValid) {
      verdict = "SIGNATURE_INVALID";
    } else if (merkleCheck === "FAIL") {
      verdict = "MERKLE_PROOF_INVALID";
    } else if (chainCheck === "FAIL") {
      verdict = "COMMIT_CHAIN_BROKEN";
    } else {
      verdict = "INTEGRITY_VERIFIED";
    }

    return NextResponse.json({
      verdict,
      checks: {
        rawByteHashMatch: hashCheck,
        commitSignature: sigCheck,
        merkleInclusionProof: merkleCheck,
        parentCommitChain: chainCheck,
      },
      referenceHash: version.fileSha256,
      candidateHash: validated.candidateSha256,
      targetVersionNumber: validated.targetVersionNumber,
      evidenceId: id,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Verification failed" }, { status: 400 });
  }
}
