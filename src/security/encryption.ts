/**
 * BummptEducation — Cryptographic Encryption Engine (Phase 8F-H)
 * 
 * Provides server-authoritative, authenticated symmetric encryption using AES-256-GCM.
 * 
 * Cryptographic Guarantees:
 * - Cipher: AES-256-GCM (Authenticated Encryption with Associated Data - AEAD)
 * - Key Length: Exactly 256 bits (32 bytes), decoded from Base64
 * - Dedicated Environment Secret: ENCRYPTION_SECRET (mandatory, strictly independent from AUTH_SECRET / JWT_SECRET)
 * - Zero Hardcoded Keys: No fallback keys or development secrets in source code
 * - Fail-Closed Semantics: Fails immediately if ENCRYPTION_SECRET is absent, invalid Base64, or not exactly 32 bytes
 * - Nonce / IV: Unique, cryptographically secure 96-bit (12-byte) IV generated per encryption operation via crypto.randomBytes
 * - Authentication Tag: 128-bit (16-byte) Galois/Counter Mode authentication tag
 * - Serialization Format: enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
 * - Tampering / Bit-Flipping Detection: Rejects modified IV, tag, or ciphertext with CryptographicIntegrityError
 */

import crypto from 'crypto';

export class CryptographicConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptographicConfigurationError';
  }
}

export class CryptographicIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptographicIntegrityError';
  }
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag
const PAYLOAD_PREFIX = 'enc:v1:';
const BASE64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

/**
 * Validates and retrieves the 32-byte (256-bit) encryption key from the environment.
 * 
 * Strict Cryptographic Rules:
 * 1. Reads process.env.ENCRYPTION_SECRET (or overrideSecret if explicitly provided).
 * 2. Never falls back to JWT_SECRET, AUTH_SECRET, or any other authentication secret.
 * 3. Never falls back to any hardcoded secret or random key generation at runtime.
 * 4. Fails closed with a generic, safe error message without leaking secret material.
 * 5. Requires valid Base64 encoding decoding to exactly 32 bytes.
 */
export function getEncryptionKey(overrideSecret?: string | Buffer): Buffer {
  if (Buffer.isBuffer(overrideSecret)) {
    if (overrideSecret.length !== 32) {
      throw new CryptographicConfigurationError('ENCRYPTION_SECRET must decode to exactly 32 bytes');
    }
    return overrideSecret;
  }

  const rawSecret = overrideSecret !== undefined ? overrideSecret : process.env.ENCRYPTION_SECRET;

  if (!rawSecret || (typeof rawSecret === 'string' && rawSecret.trim().length === 0)) {
    throw new CryptographicConfigurationError('ENCRYPTION_SECRET is required');
  }

  if (typeof rawSecret !== 'string') {
    throw new CryptographicConfigurationError('ENCRYPTION_SECRET must be a valid Base64-encoded string');
  }

  const trimmed = rawSecret.trim();

  // Validate Base64 formatting and padding
  if (!BASE64_REGEX.test(trimmed)) {
    throw new CryptographicConfigurationError('ENCRYPTION_SECRET must be a valid Base64-encoded string');
  }

  const decoded = Buffer.from(trimmed, 'base64');

  if (decoded.length !== 32) {
    throw new CryptographicConfigurationError('ENCRYPTION_SECRET must decode to exactly 32 bytes');
  }

  return decoded;
}

/**
 * Backward-compatible alias for getEncryptionKey
 */
export function getMasterKey(customSecret?: string | Buffer): Buffer {
  return getEncryptionKey(customSecret);
}

/**
 * Generates a fresh, cryptographically secure 32-byte key encoded as Base64.
 * Useful for one-time environment variable generation tooling.
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Generates a fresh 96-bit random IV per operation.
 * 
 * @returns An authenticated formatted string: enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
 */
export function encryptField(plainText: string, secretKey?: string | Buffer): string {
  if (plainText === null || plainText === undefined) {
    throw new Error('Plaintext cannot be null or undefined.');
  }

  const key = getEncryptionKey(secretKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(String(plainText), 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${PAYLOAD_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts an AES-256-GCM formatted payload.
 * Verifies version prefix, IV length, auth tag length, and cryptographic authentication tag.
 * Throws an error if tampered, corrupted, or key is invalid/mismatched.
 */
export function decryptField(payload: string, secretKey?: string | Buffer): string {
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

  const key = getEncryptionKey(secretKey);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(tag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch (err: any) {
    throw new CryptographicIntegrityError(`Decryption or integrity verification failed: ${err.message}`);
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

