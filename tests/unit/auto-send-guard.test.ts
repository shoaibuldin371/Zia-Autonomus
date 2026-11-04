import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateAutoSendGuard } from '@/services/email/auto-send-guard';
import { InMemoryDataStore } from '@/lib/supabase/data-store';
import { isWithinRecipientSendingWindow, isUKSoleTraderExclusion } from '@/services/contact/contact-strategy';

describe('Auto-Send 10-Point Guard & Recipient Timezone Window', () => {
  let store: InMemoryDataStore;

  beforeEach(() => {
    store = new InMemoryDataStore();
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
});

