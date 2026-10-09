/**
 * EVIDENTIA Merkle Checkpoint Engine
 * Domain-separated Merkle Tree (RFC 6962 compliant) with inclusion proof generation and verification.
 */

import { computeSha256, hexToBytes, bufferToHex } from "./sha256";

export interface MerkleLeafInput {
  evidenceId: string;
  versionId: string;
  fileSha256: string;
  commitHash: string;
}

export interface MerkleProofStep {
  siblingHash: string;
  position: "left" | "right";
}

export interface MerkleInclusionProof {
  leafHash: string;
  leafIndex: number;
  rootHash: string;
  proofSteps: MerkleProofStep[];
}

const DOMAIN_LEAF_PREFIX = new Uint8Array([0x00]);
const DOMAIN_PARENT_PREFIX = new Uint8Array([0x01]);

/**
 * Compute domain-separated leaf hash: SHA-256(0x00 || canonical_bytes)
 */
export async function computeMerkleLeafHash(leaf: MerkleLeafInput): Promise<string> {
  const canonicalString = JSON.stringify({
    commitHash: leaf.commitHash.toLowerCase(),
    evidenceId: leaf.evidenceId,
    fileSha256: leaf.fileSha256.toLowerCase(),
    versionId: leaf.versionId,
  });

  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(canonicalString);

  const combined = new Uint8Array(DOMAIN_LEAF_PREFIX.length + dataBytes.length);
  combined.set(DOMAIN_LEAF_PREFIX, 0);
  combined.set(dataBytes, DOMAIN_LEAF_PREFIX.length);

  return await computeSha256(combined);
}

/**
 * Compute domain-separated parent hash: SHA-256(0x01 || left || right)
 */
export async function computeMerkleParentHash(leftHex: string, rightHex: string): Promise<string> {
  const leftBytes = hexToBytes(leftHex);
  const rightBytes = hexToBytes(rightHex);

  const combined = new Uint8Array(DOMAIN_PARENT_PREFIX.length + leftBytes.length + rightBytes.length);
  combined.set(DOMAIN_PARENT_PREFIX, 0);
  combined.set(leftBytes, DOMAIN_PARENT_PREFIX.length);
  combined.set(rightBytes, DOMAIN_PARENT_PREFIX.length + leftBytes.length);

  return await computeSha256(combined);
}

/**
 * Construct Merkle Tree and return root hash alongside full layer structure.
 */
export async function buildMerkleTree(leafHashes: string[]): Promise<{
  root: string;
  layers: string[][];
}> {
  if (leafHashes.length === 0) {
    throw new Error("Cannot build Merkle tree with empty leaves");
  }

  const layers: string[][] = [leafHashes.slice()];
  let currentLayer = leafHashes.slice();

  while (currentLayer.length > 1) {
    const nextLayer: string[] = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      const left = currentLayer[i];
      // If odd number of nodes at this layer, promote or duplicate last node
      const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left;
      const parent = await computeMerkleParentHash(left, right);
      nextLayer.push(parent);
    }
    layers.push(nextLayer);
    currentLayer = nextLayer;
  }

  return {
    root: currentLayer[0],
    layers,
  };
}

/**
 * Generate Merkle Inclusion Proof for a specific leaf index.
 */
export async function generateInclusionProof(
  leafHashes: string[],
  targetIndex: number
): Promise<MerkleInclusionProof> {
  if (targetIndex < 0 || targetIndex >= leafHashes.length) {
    throw new Error(`Target index ${targetIndex} out of bounds`);
  }

  const { root, layers } = await buildMerkleTree(leafHashes);
  const proofSteps: MerkleProofStep[] = [];
  let currentIndex = targetIndex;

  for (let l = 0; l < layers.length - 1; l++) {
    const currentLayer = layers[l];
    const isRightChild = currentIndex % 2 === 1;
    const siblingIndex = isRightChild ? currentIndex - 1 : currentIndex + 1;

    let siblingHash: string;
    if (siblingIndex < currentLayer.length) {
      siblingHash = currentLayer[siblingIndex];
    } else {
      // Duplicated self if odd length
      siblingHash = currentLayer[currentIndex];
    }

    proofSteps.push({
      siblingHash,
      position: isRightChild ? "left" : "right",
    });

    currentIndex = Math.floor(currentIndex / 2);
  }

  return {
    leafHash: leafHashes[targetIndex],
    leafIndex: targetIndex,
    rootHash: root,
    proofSteps,
  };
}

/**
 * Verify Merkle inclusion proof mathematically from leaf to root.
 */
export async function verifyInclusionProof(
  leafHash: string,
  proofSteps: MerkleProofStep[],
  expectedRootHash: string
): Promise<boolean> {
  let currentHash = leafHash;

  for (const step of proofSteps) {
    if (step.position === "left") {
      currentHash = await computeMerkleParentHash(step.siblingHash, currentHash);
    } else {
      currentHash = await computeMerkleParentHash(currentHash, step.siblingHash);
    }
  }

  return currentHash.toLowerCase() === expectedRootHash.toLowerCase();
}
