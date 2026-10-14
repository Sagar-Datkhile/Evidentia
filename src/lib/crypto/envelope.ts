/**
 * EVIDENTIA Envelope Encryption (AES-256-GCM)
 * Encrypts evidence payloads before persisting to private Supabase storage.
 */

import { bufferToHex, hexToBytes, computeSha256 } from "./sha256";

export interface EncryptedEnvelope {
  ciphertextBase64: string;
  ivHex: string;
  ciphertextSha256: string;
}

const DEFAULT_KEY_SECRET = "evidentia_super_secret_master_key_32bytes!!";

/**
 * Generate a cryptographically secure 256-bit AES key from secret string.
 */
async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const rawKeyMaterial = encoder.encode(secret);
  const keyHash = await crypto.subtle.digest("SHA-256", rawKeyMaterial);

  return await crypto.subtle.importKey(
    "raw",
    keyHash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt plaintext buffer with AES-256-GCM and unique 12-byte nonce.
 */
export async function encryptPayload(
  plaintext: ArrayBuffer | Uint8Array | string,
  secret: string = process.env.EVIDENTIA_MASTER_KEY || DEFAULT_KEY_SECRET
): Promise<EncryptedEnvelope> {
  const key = await deriveAesKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  let dataBuffer: ArrayBuffer;
  if (typeof plaintext === "string") {
    dataBuffer = new TextEncoder().encode(plaintext).buffer;
  } else if (plaintext instanceof Uint8Array) {
    dataBuffer = plaintext.buffer.slice(plaintext.byteOffset, plaintext.byteOffset + plaintext.byteLength) as ArrayBuffer;
  } else {
    dataBuffer = plaintext;
  }

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as Uint8Array<ArrayBuffer> },
    key,
    dataBuffer
  );

  const ciphertextSha256 = await computeSha256(ciphertextBuffer);

  // Convert ciphertext to base64
  const bytes = new Uint8Array(ciphertextBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const ciphertextBase64 = btoa(binary);

  return {
    ciphertextBase64,
    ivHex: bufferToHex(iv.buffer),
    ciphertextSha256,
  };
}

/**
 * Decrypt AES-256-GCM ciphertext using IV and master secret.
 */
export async function decryptPayload(
  envelope: EncryptedEnvelope,
  secret: string = process.env.EVIDENTIA_MASTER_KEY || DEFAULT_KEY_SECRET
): Promise<ArrayBuffer> {
  const key = await deriveAesKey(secret);
  const iv = hexToBytes(envelope.ivHex);

  const binary = atob(envelope.ciphertextBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as unknown as Uint8Array<ArrayBuffer> },
    key,
    bytes.buffer as ArrayBuffer
  );
}
