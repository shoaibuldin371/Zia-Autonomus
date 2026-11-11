import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateAutoSendGuard, isPhysicalMailingAddressValid } from '@/services/email/auto-send-guard';
import { InMemoryDataStore } from '@/lib/supabase/data-store';
import { isWithinRecipientSendingWindow, isUKSoleTraderExclusion } from '@/services/contact/contact-strategy';

describe('Auto-Send 10-Point Guard & Recipient Timezone Window', () => {
  let store: InMemoryDataStore;

  beforeEach(() => {
    store = new InMemoryDataStore();
    delete process.env.PHYSICAL_MAILING_ADDRESS;
  });

  it('calculates recipient sending window accurately (Mon-Fri 09:00 - 17:30)', () => {
    // Wednesday 14:00 UK time (14:00 UTC during winter GMT)
    const validTime = new Date('2026-11-04T14:00:00Z');
    const ukCheck = isWithinRecipientSendingWindow('UK', 'London', validTime);
    expect(ukCheck.allowed).toBe(true);

    // Wednesday 03:00 UK time (night)
    const nightTime = new Date('2026-11-04T03:00:00Z');
    const nightCheck = isWithinRecipientSendingWindow('UK', 'London', nightTime);
    expect(nightCheck.allowed).toBe(false);
    expect(nightCheck.reason).toContain('Outside allowed working hours');

    // Sunday (weekend)
    const weekendTime = new Date('2026-11-08T12:00:00Z');
    const weekendCheck = isWithinRecipientSendingWindow('UK', 'London', weekendTime);
    expect(weekendCheck.allowed).toBe(false);
    expect(weekendCheck.reason).toContain('weekend');
  });

  it('excludes UK sole traders under PECR/GDPR regulations', () => {
    // Corporate entity - Allowed
    expect(isUKSoleTraderExclusion('Manchester Dental Care Ltd', 'UK', 'Private Limited Company')).toBe(false);
    expect(isUKSoleTraderExclusion('Apex Building Solutions LLP', 'UK', 'Limited Liability Partnership')).toBe(false);

    // Sole trader or personal trade - Excluded
    expect(isUKSoleTraderExclusion('John Smith Plumbing', 'UK', 'Sole Trader')).toBe(true);
    expect(isUKSoleTraderExclusion('Dave Plumber', 'UK', null)).toBe(true);
  });

  it('blocks sending when Emergency Stop is enabled', async () => {
    await store.updateSetting('emergency_stop', true);
    await store.updateSetting('physical_mailing_address', '123 Valid Commercial St, Austin, TX 78701');

    const biz = await store.saveBusiness({ name: 'Alpha Care Ltd', country: 'UK' });
    const evalResult = await evaluateAutoSendGuard(
      {
        businessId: biz.id,
        businessName: 'Alpha Care Ltd',
        recipientEmail: 'info@alphacare.co.uk',
        country: 'UK',
        pitchSubject: 'Website Inquiry',
        pitchBody: 'Valid pitch text...',
        hasVerifiedEmail: true,
      },
      store
    );

    expect(evalResult.allowed).toBe(false);
    expect(evalResult.reasons.some((r) => r.includes('Emergency Stop'))).toBe(true);
  });

  it('validates physical mailing address formats correctly', () => {
    expect(isPhysicalMailingAddressValid(undefined)).toBe(false);
    expect(isPhysicalMailingAddressValid('')).toBe(false);
    expect(isPhysicalMailingAddressValid('123 Innovation Way')).toBe(false);
    expect(isPhysicalMailingAddressValid('Zia Ul Din, USA')).toBe(false);
    expect(isPhysicalMailingAddressValid('placeholder')).toBe(false);
    expect(isPhysicalMailingAddressValid('100 Main Street, Suite 200, Dallas, TX 75201')).toBe(true);
  });

  it('blocks cold email auto-send when physical mailing address is missing with the exact required reason', async () => {
    const biz = await store.saveBusiness({ name: 'Alpha Care Ltd', country: 'UK' });
    const evalResult = await evaluateAutoSendGuard(
      {
        businessId: biz.id,
        businessName: 'Alpha Care Ltd',
        recipientEmail: 'info@alphacare.co.uk',
        country: 'UK',
        pitchSubject: 'Website Inquiry',
        pitchBody: 'Valid pitch text...',
        hasVerifiedEmail: true,
      },
      store
    );

    expect(evalResult.allowed).toBe(false);
    expect(evalResult.reasons).toContain(
      'Cold email is off until a mailing address is added (legal requirement). Platform messages, manual outreach and Client Requests work without it.'
    );
  });
});
