import { describe, it, expect } from 'vitest';
import { buildMimeMessage } from '@/services/email/gmail-sender';
import { GMAIL_LOCKED_ACCOUNT } from '@/services/email/gmail-oauth';

describe('Gmail Sender & MIME Builder', () => {
  it('locks sender strictly to Zia Ul Din and ziauldin371@gmail.com', () => {
    expect(GMAIL_LOCKED_ACCOUNT).toBe('ziauldin371@gmail.com');
  });

  it('builds RFC 2822 MIME message with mandatory RFC 8058 List-Unsubscribe headers', () => {
    const rawBase64 = buildMimeMessage({
      fromName: 'Zia Ul Din',
      fromEmail: 'ziauldin371@gmail.com',
      to: 'client@company.co.uk',
      subject: 'Inquiry regarding Manchester business',
      bodyText: 'Hello, this is a test pitch.',
      unsubscribeUrl: 'https://growth.zia.dev/api/compliance/unsubscribe?token=abc',
    });

    const decoded = Buffer.from(rawBase64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');

    expect(decoded).toContain('From: Zia Ul Din <ziauldin371@gmail.com>');
    expect(decoded).toContain('To: client@company.co.uk');
    expect(decoded).toContain('Reply-To: ziauldin371@gmail.com');
    expect(decoded).toContain('List-Unsubscribe: <https://growth.zia.dev/api/compliance/unsubscribe?token=abc>');
    expect(decoded).toContain('List-Unsubscribe-Post: List-Unsubscribe=One-Click');
    expect(decoded).toContain('Physical address: Zia Ul Din, Karachi, Pakistan.');
  });
});
