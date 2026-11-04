import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  constantTimeCompare,
  validateAdminCredentials,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  ADMIN_EMAIL_LOCKED,
  MAX_ATTEMPTS,
} from '@/lib/security/auth-guard';

describe('Auth Guard & Fail-Closed Credentials', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.ADMIN_EMAIL = ADMIN_EMAIL_LOCKED;
    process.env.ADMIN_PASSWORD = 'super_secret_password_123';
    resetRateLimit('test-ip-1');
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('performs constant-time comparison accurately', () => {
    expect(constantTimeCompare('password123', 'password123')).toBe(true);
    expect(constantTimeCompare('password123', 'password124')).toBe(false);
    expect(constantTimeCompare('short', 'longer_string')).toBe(false);
  });

  it('authenticates valid admin credentials', () => {
    const result = validateAdminCredentials('ziauldin371@gmail.com', 'super_secret_password_123');
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects wrong password', () => {
    const result = validateAdminCredentials('ziauldin371@gmail.com', 'wrong_password');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email or password.');
  });

  it('rejects non-admin email', () => {
    const result = validateAdminCredentials('attacker@evil.com', 'super_secret_password_123');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email or password.');
  });

  it('fails closed when ADMIN_PASSWORD is not set in env', () => {
    delete process.env.ADMIN_PASSWORD;
    const result = validateAdminCredentials('ziauldin371@gmail.com', 'super_secret_password_123');
    expect(result.success).toBe(false);
    expect(result.error).toContain('System authentication is unconfigured');
  });

  it('fails closed when ADMIN_EMAIL is set to someone else', () => {
    process.env.ADMIN_EMAIL = 'someoneelse@gmail.com';
    const result = validateAdminCredentials('someoneelse@gmail.com', 'super_secret_password_123');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized operator configuration');
  });

  it('enforces lockout after 5 failed attempts', () => {
    const ip = 'test-ip-1';
    expect(checkRateLimit(ip).allowed).toBe(true);

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      const res = recordFailedAttempt(ip);
      if (i < MAX_ATTEMPTS) {
        expect(res.allowed).toBe(true);
        expect(res.remainingAttempts).toBe(MAX_ATTEMPTS - i);
      } else {
        expect(res.allowed).toBe(false);
        expect(res.remainingAttempts).toBe(0);
        expect(res.lockoutExpiresAt).toBeDefined();
      }
    }

    const lockedCheck = checkRateLimit(ip);
    expect(lockedCheck.allowed).toBe(false);
    expect(lockedCheck.remainingAttempts).toBe(0);
  });
});

