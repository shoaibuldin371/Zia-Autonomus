import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateUnsubscribeToken, verifyUnsubscribeToken, buildUnsubscribeUrl } from '@/lib/security/unsubscribe';

describe('Unsubscribe Security (HMAC-SHA256)', () => {
  const originalSecret = process.env.UNSUBSCRIBE_SECRET;

  beforeEach(() => {
    process.env.UNSUBSCRIBE_SECRET = 'unsubscribe_test_secret_key_998877';
  });

  afterEach(() => {
    process.env.UNSUBSCRIBE_SECRET = originalSecret;
  });

  it('generates and verifies valid tokens for an email', () => {
    const email = 'client@business.co.uk';
    const token = generateUnsubscribeToken(email);

    expect(typeof token).toBe('string');
    expect(verifyUnsubscribeToken(email, token)).toBe(true);
    // Case insensitivity
    expect(verifyUnsubscribeToken('CLIENT@BUSINESS.CO.UK', token)).toBe(true);
  });

  it('rejects tampered tokens or wrong emails', () => {
    const email = 'client@business.co.uk';
    const token = generateUnsubscribeToken(email);

    expect(verifyUnsubscribeToken('other@business.co.uk', token)).toBe(false);
    expect(verifyUnsubscribeToken(email, token + 'tampered')).toBe(false);
  });

  it('builds a valid signed unsubscribe URL', () => {
    const url = buildUnsubscribeUrl('https://growth.zia.dev', 'client@business.co.uk');
    expect(url).toContain('https://growth.zia.dev/api/compliance/unsubscribe');
    expect(url).toContain('email=client%40business.co.uk');
    expect(url).toContain('token=');
  });
});
