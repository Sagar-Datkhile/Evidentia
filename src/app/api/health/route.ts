import { NextResponse } from "next/server";
import { SYSTEM_SIGNING_KEY_ID } from "@/lib/crypto/ed25519";
import { evidenceStore } from "@/lib/data/store";

export async function GET() {
  const checkpoint = evidenceStore.getCheckpoint();

  return NextResponse.json({
    status: "healthy",
    service: "EVIDENTIA Zero-Trust DEMS",
    version: "1.0.0",
    cryptography: {
      hashAlgorithm: "SHA-256",
      signatureAlgorithm: "Ed25519",
      activeSigningKeyId: SYSTEM_SIGNING_KEY_ID,
      merkleDomainSeparation: "RFC 6962 (0x00 leaf, 0x01 parent)",
      envelopeEncryption: "AES-256-GCM",
    },
    merkleBatches: {
      activeBatch: checkpoint.batchNumber,
      leafCount: checkpoint.leafCount,
      rootAttested: true,
    },
    timestamp: new Date().toISOString(),
  });
}
