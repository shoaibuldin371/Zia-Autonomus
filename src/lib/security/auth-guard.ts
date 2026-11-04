import crypto from 'crypto';

export const ADMIN_EMAIL_LOCKED = 'ziauldin371@gmail.com';
export const MAX_ATTEMPTS = 5;
export const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export interface RateLimitStatus {
  allowed: boolean;
  remainingAttempts: number;
  lockoutExpiresAt?: Date;
}

// In-memory fallback tracking for testing or before DB tables initialize
const memoryAttempts = new Map<string, { count: number; firstAttemptAt: number }>();

export function checkRateLimit(key: string): RateLimitStatus {
  const now = Date.now();
  const record = memoryAttempts.get(key);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if window has expired
  if (now - record.firstAttemptAt > LOCKOUT_WINDOW_MS) {
    memoryAttempts.delete(key);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - record.count);
  if (remaining === 0) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutExpiresAt: new Date(record.firstAttemptAt + LOCKOUT_WINDOW_MS),
    };
  }

  return { allowed: true, remainingAttempts: remaining };
}

export function recordFailedAttempt(key: string): RateLimitStatus {
  const now = Date.now();
  const record = memoryAttempts.get(key);

  if (!record || now - record.firstAttemptAt > LOCKOUT_WINDOW_MS) {
    memoryAttempts.set(key, { count: 1, firstAttemptAt: now });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  record.count += 1;
  const remaining = Math.max(0, MAX_ATTEMPTS - record.count);

  return {
    allowed: remaining > 0,
    remainingAttempts: remaining,
    lockoutExpiresAt: remaining === 0 ? new Date(record.firstAttemptAt + LOCKOUT_WINDOW_MS) : undefined,
  };
}

export function resetRateLimit(key: string): void {
  memoryAttempts.delete(key);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    // Constant time dummy compare to prevent short-circuit timing
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Validates admin credentials against environment variables.
 * Fails closed if ADMIN_EMAIL or ADMIN_PASSWORD is unset or if the email is not ziauldin371@gmail.com.
 */
export function validateAdminCredentials(emailInput: string, passwordInput: string): {
  success: boolean;
  error?: string;
} {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return {
      success: false,
      error: 'System authentication is unconfigured. Set ADMIN_EMAIL and ADMIN_PASSWORD in environment variables.',
    };
  }

  // Only Zia Ul Din's email is allowed
  if (adminEmail.trim().toLowerCase() !== ADMIN_EMAIL_LOCKED) {
    return {
      success: false,
      error: 'Unauthorized operator configuration.',
    };
  }

  const normalizedInputEmail = emailInput.trim().toLowerCase();
  const emailMatches = constantTimeCompare(normalizedInputEmail, ADMIN_EMAIL_LOCKED);
  const passwordMatches = constantTimeCompare(passwordInput, adminPassword);

  if (!emailMatches || !passwordMatches) {
    return {
      success: false,
      error: 'Invalid email or password.',
    };
  }

  return { success: true };
}

