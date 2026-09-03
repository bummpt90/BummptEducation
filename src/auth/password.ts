/**
 * BummptEducation — Password Security Engine
 * 
 * Implements cryptographically secure one-way password hashing using Argon2id.
 * Protects against GPU cracking, rainbow table attacks, and side-channel timing attacks.
 */

import argon2 from 'argon2';

/**
 * Production Argon2id parameters aligned with OWASP recommendations:
 * - type: Argon2id (hybrid memory-hard algorithm)
 * - memoryCost: 19456 KiB (19 MiB)
 * - timeCost: 2 iterations
 * - parallelism: 1 thread
 */
const ARGON2_OPTIONS: argon2.HashOptions & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  raw: false,
};

/**
 * Hashes a plaintext password using Argon2id
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Password must be a non-empty string.');
  }
  return await argon2.hash(plainPassword, ARGON2_OPTIONS);
}

/**
 * Verifies a plaintext password against a stored Argon2id hash
 */
export async function verifyPassword(storedHash: string, plainPassword: string): Promise<boolean> {
  if (!storedHash || !plainPassword) {
    return false;
  }
  try {
    return await argon2.verify(storedHash, plainPassword);
  } catch (error) {
    // Return false on malformed hashes or verification errors (prevents oracle timing)
    return false;
  }
}

/**
 * Validates password strength policy
 */
export function validatePasswordPolicy(password: string): { valid: boolean; reason?: string } {
  if (!password || password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters long.' };
  }
  if (password.length > 128) {
    return { valid: false, reason: 'Password must not exceed 128 characters.' };
  }
  return { valid: true };
}
