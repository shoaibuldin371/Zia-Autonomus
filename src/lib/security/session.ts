import { SignJWT, jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'growth_session';
const SESSION_EXPIRATION = '7d';

export interface SessionPayload {
  email: string;
  role: 'admin';
  iat?: number;
  exp?: number;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.trim().length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET is missing or too short (minimum 32 characters required).');
    }
    // Fail-closed even in development if unset
    throw new Error('SESSION_SECRET is required. Set it in .env.local');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Creates a signed HS256 JWT session token
 */
export async function createSessionToken(email: string): Promise<string> {
  const secret = getSecretKey();
  return new SignJWT({ email, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRATION)
    .sign(secret);
}

/**
 * Verifies and decodes a signed session token. Returns null if invalid or expired.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    if (typeof payload.email !== 'string' || payload.role !== 'admin') {
      return null;
    }

    return {
      email: payload.email,
      role: 'admin',
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME };
