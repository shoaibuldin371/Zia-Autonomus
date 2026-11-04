import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createSessionToken, verifySessionToken } from '@/lib/security/session';

describe('Session Security (HS256 JWT)', () => {
  const originalSecret = process.env.SESSION_SECRET;

  beforeEach(() => {
    process.env.SESSION_SECRET = 'a_very_secure_test_secret_that_is_at_least_32_characters_long!';
  });

  afterEach(() => {
    process.env.SESSION_SECRET = originalSecret;
  });

  it('creates and verifies a valid session token for Zia Ul Din', async () => {
    const email = 'ziauldin371@gmail.com';
    const token = await createSessionToken(email);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.email).toBe(email);
    expect(payload?.role).toBe('admin');
  });

  it('fails verification when token is tampered or forged', async () => {
    const validToken = await createSessionToken('ziauldin371@gmail.com');
    const tampered = validToken.slice(0, -6) + 'abcdef';

    const result = await verifySessionToken(tampered);
    expect(result).toBeNull();
  });

  it('fails verification when token is signed with a different secret', async () => {
    const validToken = await createSessionToken('ziauldin371@gmail.com');
    process.env.SESSION_SECRET = 'another_totally_different_secret_key_32_chars_long!';

    const result = await verifySessionToken(validToken);
    expect(result).toBeNull();
  });

  it('throws an error if SESSION_SECRET is missing or empty', async () => {
    process.env.SESSION_SECRET = '';
    await expect(createSessionToken('ziauldin371@gmail.com')).rejects.toThrow();
  });
});

