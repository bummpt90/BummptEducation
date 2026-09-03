/**
 * BummptEducation — Token & Session Management Engine
 * 
 * Implements:
 * - JWT access token signing & cryptographic verification
 * - Secret key isolation & environment verification
 * - Session revocation & audit ledger in PostgreSQL
 * - Secure HTTP-only cookie configuration
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { Response } from 'express';
import { query } from '../db';
import { AuthTokenPayload, SafeUser } from './types';
import { getPermissionsForRole } from './permissions';

export const AUTH_COOKIE_NAME = 'bummpt_auth_token';
const DEFAULT_EXPIRY = '8h';

/**
 * Retrieves the cryptographic secret for JWT signing.
 * In production, strictly requires a high-entropy secret from the environment.
 */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 32) {
      throw new Error('FATAL: AUTH_SECRET must be configured and at least 32 characters in production.');
    }
    return secret;
  }
  // Development-only fallback with strong length
  return secret || 'bummpt_dev_jwt_auth_secret_do_not_use_in_production_key_32_chars';
}

/**
 * Computes a fast SHA-256 fingerprint of a token for session revocation checking
 */
export function hashTokenForSession(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Signs a new server-side authentication token
 */
export function signAuthToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>, expiresIn = DEFAULT_EXPIRY): string {
  const secret = getAuthSecret();
  return jwt.sign(payload, secret, {
    expiresIn,
    algorithm: 'HS256',
  } as jwt.SignOptions);
}

/**
 * Verifies and decodes a signed authentication token
 */
export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const secret = getAuthSecret();
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as AuthTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Registers an active session in the database ledger
 */
export async function createSessionRecord(
  userId: string,
  token: string,
  ipAddress?: string,
  userAgent?: string,
  hoursValid = 8
): Promise<string> {
  const tokenHash = hashTokenForSession(token);
  const sql = `
    INSERT INTO user_sessions (
      user_id, token_hash, ip_address, user_agent, expires_at
    ) VALUES ($1, $2, $3, $4, NOW() + ($5 || ' hours')::interval)
    RETURNING id;
  `;
  const res = await query<{ id: string }>(sql, [userId, tokenHash, ipAddress || null, userAgent || null, `${hoursValid}`]);
  return res.rows[0]?.id;
}

/**
 * Marks a session or token as revoked
 */
export async function revokeTokenSession(token: string): Promise<boolean> {
  const tokenHash = hashTokenForSession(token);
  const sql = `
    UPDATE user_sessions
    SET revoked_at = NOW(), updated_at = NOW()
    WHERE token_hash = $1 AND revoked_at IS NULL;
  `;
  const res = await query(sql, [tokenHash]);
  return (res.rowCount || 0) > 0;
}

/**
 * Checks if a session has been revoked in the database ledger
 */
export async function isTokenRevoked(token: string): Promise<boolean> {
  const tokenHash = hashTokenForSession(token);
  const sql = `
    SELECT id, revoked_at, expires_at
    FROM user_sessions
    WHERE token_hash = $1
    LIMIT 1;
  `;
  const res = await query<{ id: string; revoked_at: Date | null; expires_at: Date }>(sql, [tokenHash]);
  if (res.rows.length === 0) {
    return false; // If sessions table wasn't populated for this token (e.g. lightweight dev test token)
  }
  const session = res.rows[0];
  if (session.revoked_at !== null) return true;
  if (new Date(session.expires_at) < new Date()) return true;
  return false;
}

/**
 * Configures and sets the HTTP-only authentication cookie on an Express response
 */
export function setAuthCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'lax' : 'lax',
    maxAge: 8 * 3600 * 1000, // 8 hours
    path: '/',
  });
}

/**
 * Clears the authentication cookie on logout
 */
export function clearAuthCookie(res: Response): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'lax' : 'lax',
    path: '/',
  });
}

/**
 * Helper to build safe user payload from user entity
 */
export function buildSafeUser(user: {
  id: string;
  email: string;
  full_name: string;
  role: string;
  school_id: string | null;
  phone?: string | null;
}, schoolName?: string | null): SafeUser {
  const role = user.role as any;
  const isSuperAdmin = role === 'super_admin';
  const isStateOfficer = role === 'state_officer';
  const permissions = getPermissionsForRole(role);

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role,
    schoolId: user.school_id,
    schoolName: schoolName || null,
    phone: user.phone || null,
    isSuperAdmin,
    isStateOfficer,
    permissions,
  };
}
