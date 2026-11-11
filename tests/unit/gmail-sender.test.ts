import { describe, it, expect } from 'vitest';
import { buildMimeMessage, sendGmailMessage } from '@/services/email/gmail-sender';
import { GMAIL_LOCKED_ACCOUNT } from '@/services/email/gmail-oauth';

describe('Gmail Sender & MIME Builder', () => {
  it('locks sender strictly to Zia Ul Din and ziauldin371@gmail.com', () => {
    expect(GMAIL_LOCKED_ACCOUNT).toBe('ziauldin371@gmail.com');
  });

  it('builds RFC 2822 MIME message with mandatory RFC 8058 List-Unsubscribe headers and real address', () => {
    const rawBase64 = buildMimeMessage({
      fromName: 'Zia Ul Din',
      fromEmail: 'ziauldin371@gmail.com',
      to: 'client@company.co.uk',
      subject: 'Inquiry regarding Manchester business',
      bodyText: 'Hello, this is a test pitch.',
      unsubscribeUrl: 'https://growth.zia.dev/api/compliance/unsubscribe?token=abc',
      physicalAddress: '100 Main Street, Suite 200, Dallas, TX 75201',
    });

    const decoded = Buffer.from(rawBase64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');

    expect(decoded).toContain('From: Zia Ul Din <ziauldin371@gmail.com>');
    expect(decoded).toContain('To: client@company.co.uk');
    expect(decoded).toContain('Reply-To: ziauldin371@gmail.com');
    expect(decoded).toContain('List-Unsubscribe: <https://growth.zia.dev/api/compliance/unsubscribe?token=abc>');
    expect(decoded).toContain('List-Unsubscribe-Post: List-Unsubscribe=One-Click');
    expect(decoded).toContain('Physical address: 100 Main Street, Suite 200, Dallas, TX 75201.');
  });

  it('never inserts a fake address or placeholder in MIME body when address is missing or fake', () => {
    const rawBase64 = buildMimeMessage({
      fromName: 'Zia Ul Din',
      fromEmail: 'ziauldin371@gmail.com',
      to: 'client@company.co.uk',
      subject: 'Inquiry regarding Manchester business',
      bodyText: 'Hello, this is a test pitch.',
      unsubscribeUrl: 'https://growth.zia.dev/api/compliance/unsubscribe?token=abc',
      physicalAddress: '123 Innovation Way', // fake / placeholder
    });

    const decoded = Buffer.from(rawBase64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    expect(decoded).not.toContain('Physical address:');
    expect(decoded).not.toContain('123 Innovation Way');
    expect(decoded).not.toContain('Zia Ul Din, USA');
  });

  it('rejects sending cold email to external recipient if physical mailing address is missing', async () => {
    await expect(
      sendGmailMessage({
        to: 'external_client@business.co.uk',
        subject: 'Website pitch',
        bodyText: 'Proposal...',
        idempotencyKey: 'test_cold_fail',
      })
    ).rejects.toThrow(/Cold email cannot be sent without a verified physical mailing address/i);
  });
});
