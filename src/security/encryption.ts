/**
 * BummptEducation — Phase 8F Cryptographic Hardening Engine
 * 
 * Implements authenticated application-level encryption using AES-256-GCM.
 * Supports:
 * - 256-bit symmetric key derived from process.env.ENCRYPTION_SECRET / JWT_SECRET via SHA-256
 * - Unique, cryptographically secure 96-bit (12-byte) initialization vectors (IV) per encryption
 * - 128-bit (16-byte) Galois/Counter Mode authentication tags to verify ciphertext integrity
 * - Format: enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
 * - Tampering and bit-flipping detection with immediate rejection
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag
const PAYLOAD_PREFIX = 'enc:v1:';

/**
 * Derives a 32-byte (256-bit) encryption key from the environment secret
 */
export function getMasterKey(customSecret?: string): Buffer {
  const secret = customSecret || process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || 'bummpt-secure-encryption-secret-key-2026-phase8f';
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 * @returns An authenticated formatted string: enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
 */
export function encryptField(plainText: string, secretKey?: string): string {
  if (plainText === null || plainText === undefined) {
    throw new Error('Plaintext cannot be null or undefined.');
  }

  const key = getMasterKey(secretKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(String(plainText), 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return `${PAYLOAD_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts an AES-256-GCM formatted payload
 * Throws an error if tampered, corrupted, or invalid key
 */
export function decryptField(payload: string, secretKey?: string): string {
  if (!payload || typeof payload !== 'string') {
    throw new Error('Invalid payload for decryption.');
  }

  if (!payload.startsWith(PAYLOAD_PREFIX)) {
    throw new Error('Payload is not encrypted with the supported format.');
  }

  const body = payload.slice(PAYLOAD_PREFIX.length);
  const parts = body.split(':');

  if (parts.length !== 3) {
    throw new Error('Malformed encrypted payload structure.');
  }

  const [ivHex, tagHex, cipherHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const ciphertext = Buffer.from(cipherHex, 'hex');

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected ${IV_LENGTH} bytes.`);
  }

  if (tag.length !== AUTH_TAG_LENGTH) {
    throw new Error(`Invalid auth tag length: expected ${AUTH_TAG_LENGTH} bytes.`);
  }

  const key = getMasterKey(secretKey);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]);
    return decrypted.toString('utf8');
  } catch (err: any) {
    throw new Error(`Decryption or integrity verification failed: ${err.message}`);
  }
}

/**
 * Determines whether a string is encrypted using the authenticated format
 */
export function isEncrypted(value: string): boolean {
  if (typeof value !== 'string') return false;
  const parts = value.split(':');
  return parts.length === 5 && parts[0] === 'enc' && parts[1] === 'v1';
}

/**
 * Generates a cryptographically secure random token (e.g. for CSRF, sessions)
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}
