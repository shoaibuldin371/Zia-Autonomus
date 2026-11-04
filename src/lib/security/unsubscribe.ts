import crypto from 'crypto';

function getUnsubscribeSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error('UNSUBSCRIBE_SECRET must be configured in environment variables.');
  }
  return secret.trim();
}

/**
 * Generates an HMAC-SHA256 signature for an email address to construct tamper-proof unsubscribe links.
 */
export function generateUnsubscribeToken(email: string): string {
  const secret = getUnsubscribeSecret();
  const normalized = email.trim().toLowerCase();
  return crypto.createHmac('sha256', secret).update(normalized).digest('hex');
}

/**
 * Validates the HMAC signature for an unsubscribing email address.
 */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token) return false;
  try {
    const expected = generateUnsubscribeToken(email);
    const bufA = Buffer.from(token, 'utf8');
    const bufB = Buffer.from(expected, 'utf8');

    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Builds the unsubscribe link for cold emails
 */
export function buildUnsubscribeUrl(baseUrl: string, email: string): string {
  const token = generateUnsubscribeToken(email);
  const encodedEmail = encodeURIComponent(email.trim().toLowerCase());
  return `${baseUrl.replace(/\/$/, '')}/api/compliance/unsubscribe?email=${encodedEmail}&token=${token}`;
}
