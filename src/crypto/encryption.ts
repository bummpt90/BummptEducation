/**
 * BummptEducation — Cryptographic Encryption Engine (Phase 8F)
 * 
 * Provides server-authoritative, authenticated symmetric encryption using AES-256-GCM.
 * 
 * Architectural Guarantees:
 * - Cipher: AES-256-GCM (Authenticated Encryption with Associated Data - AEAD)
 * - Key Length: 256 bits (32 bytes)
 * - Nonce/IV: 96 bits (12 bytes) cryptographically random per operation (never reused)
 * - Authentication Tag: 128 bits (16 bytes)
 * - Serialized Format: `v1:<iv_base64>:<tag_base64>:<ciphertext_base64>`
 * - Fail-Closed Semantics: Throws CryptographicIntegrityError or CryptographicKeyError
 * - Key Rotation: Supports primary key (APP_ENCRYPTION_KEY) and previous key (APP_ENCRYPTION_KEY_PREVIOUS)
 */

import crypto from 'crypto';

export class CryptographicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptographicError';
  }
}

export class CryptographicKeyError extends CryptographicError {
  constructor(message: string) {
    super(message);
    this.name = 'CryptographicKeyError';
  }
}

export class CryptographicIntegrityError extends CryptographicError {
  constructor(message: string) {
    super(message);
    this.name = 'CryptographicIntegrityError';
  }
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // 96 bits recommended for GCM
const TAG_LENGTH_BYTES = 16; // 128 bits auth tag
const CURRENT_VERSION_PREFIX = 'v1';

/**
 * Derives or parses a 32-byte (256-bit) buffer key from a string or env var
 */
export function resolveEncryptionKey(rawKey?: string): Buffer {
  const keyStr = rawKey || process.env.APP_ENCRYPTION_KEY || process.env.AUTH_SECRET;
  
  if (!keyStr) {
    if (process.env.NODE_ENV === 'production') {
      throw new CryptographicKeyError('FATAL: APP_ENCRYPTION_KEY must be configured in production environment.');
    }
    // Safe deterministic development fallback for preview environments
    return crypto.createHash('sha256').update('bummpt_dev_app_encryption_master_key_2026_preview').digest();
  }

  // If 64 hex characters, parse directly
  if (/^[0-9a-fA-F]{64}$/.test(keyStr)) {
    return Buffer.from(keyStr, 'hex');
  }

  // If 32 raw bytes (ASCII/UTF8)
  if (Buffer.byteLength(keyStr, 'utf8') === 32) {
    return Buffer.from(keyStr, 'utf8');
  }

  // Otherwise derive a 256-bit key via SHA-256 digest
  return crypto.createHash('sha256').update(keyStr, 'utf8').digest();
}

/**
 * Encrypts plaintext using AES-256-GCM with a unique 96-bit random IV
 * 
 * Returns serialized format: `v1:<iv_base64>:<tag_base64>:<ciphertext_base64>`
 */
export function encryptField(plaintext: string, overrideKey?: string): string {
  if (plaintext === null || plaintext === undefined) {
    throw new CryptographicError('Cannot encrypt null or undefined input');
  }

  const keyBuffer = resolveEncryptionKey(overrideKey);
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);

  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv, {
    authTagLength: TAG_LENGTH_BYTES,
  });

  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(String(plaintext), 'utf8')),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    CURRENT_VERSION_PREFIX,
    iv.toString('base64'),
    authTag.toString('base64'),
    ciphertext.toString('base64'),
  ].join(':');
}

/**
 * Decrypts an AES-256-GCM formatted ciphertext string.
 * Supports transparent fallback to APP_ENCRYPTION_KEY_PREVIOUS for seamless key rotation.
 */
export function decryptField(encryptedPayload: string, overrideKey?: string): string {
  if (!encryptedPayload || typeof encryptedPayload !== 'string') {
    throw new CryptographicError('Encrypted payload must be a non-empty string');
  }

  const parts = encryptedPayload.split(':');
  if (parts.length !== 4) {
    throw new CryptographicIntegrityError(
      'Invalid encrypted payload format. Expected version:iv:tag:ciphertext'
    );
  }

  const [version, ivB64, tagB64, ciphertextB64] = parts;

  if (version !== 'v1') {
    throw new CryptographicIntegrityError(`Unsupported encryption version: ${version}`);
  }

  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');

  if (iv.length !== IV_LENGTH_BYTES) {
    throw new CryptographicIntegrityError(`Corrupted IV length: expected ${IV_LENGTH_BYTES} bytes, got ${iv.length}`);
  }

  if (authTag.length !== TAG_LENGTH_BYTES) {
    throw new CryptographicIntegrityError(`Corrupted tag length: expected ${TAG_LENGTH_BYTES} bytes, got ${authTag.length}`);
  }

  // Attempt decryption with primary key
  const primaryKey = resolveEncryptionKey(overrideKey);
  try {
    return attemptGcmDecryption(primaryKey, iv, authTag, ciphertext);
  } catch (primaryErr: any) {
    // If override key was specifically passed, do not attempt rotation fallback
    if (overrideKey) {
      throw new CryptographicIntegrityError('Decryption failed: Authentication tag mismatch or ciphertext corrupted.');
    }

    // Check if secondary key rotation is configured
    const previousKeyRaw = process.env.APP_ENCRYPTION_KEY_PREVIOUS;
    if (previousKeyRaw) {
      try {
        const previousKey = resolveEncryptionKey(previousKeyRaw);
        return attemptGcmDecryption(previousKey, iv, authTag, ciphertext);
      } catch (rotationErr) {
        // Fall through to integrity error
      }
    }

    throw new CryptographicIntegrityError('Decryption failed: Authentication tag mismatch or ciphertext corrupted.');
  }
}

function attemptGcmDecryption(keyBuffer: Buffer, iv: Buffer, authTag: Buffer, ciphertext: Buffer): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv, {
    authTagLength: TAG_LENGTH_BYTES,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Helper to inspect whether a string appears to be an AES-256-GCM ciphertext
 */
export function isEncryptedPayload(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return value.startsWith('v1:') && value.split(':').length === 4;
}
