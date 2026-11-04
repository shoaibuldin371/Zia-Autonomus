import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDataStore } from '@/lib/supabase/data-store';

describe('Data Store Interface & InMemory implementation', () => {
  let store: InMemoryDataStore;

  beforeEach(() => {
    store = new InMemoryDataStore();
  });

  it('saves and retrieves businesses without hardcoded IDs', async () => {
    const biz = await store.saveBusiness({
      name: 'Eagle Building Services',
      country: 'UK',
      city: 'Manchester',
      pipeline_type: 'website_opportunities',
    });

    expect(biz.id).toBeDefined();
    expect(biz.name).toBe('Eagle Building Services');
    expect(biz.normalized_name).toBe('eagle building services');

    const fetched = await store.getBusinessById(biz.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.city).toBe('Manchester');
  });

  it('stores and retrieves evidence tied to a business', async () => {
    const biz = await store.saveBusiness({ name: 'Apex Dental', country: 'US' });
    await store.saveEvidence({
      business_id: biz.id,
      source_name: 'google_places',
      summary: 'Google rating shows 4.8 stars from 140 reviews but no website listed',
      evidence_type: 'no_website_signal',
      is_factual: true,
    });

    const evidenceList = await store.getEvidence(biz.id);
    expect(evidenceList.length).toBe(1);
    expect(evidenceList[0].is_factual).toBe(true);
    expect(evidenceList[0].source_name).toBe('google_places');
  });

  it('enforces 72-hour cross-channel touch protection', async () => {
    const biz = await store.saveBusiness({ name: 'Target HVAC', country: 'CA' });

    expect(await store.hasRecentTouch(biz.id, 72)).toBe(false);

    await store.recordTouch({
      business_id: biz.id,
      channel: 'email',
      operator_email: 'ziauldin371@gmail.com',
      action: 'sent_intro_pitch',
      touched_at: new Date().toISOString(),
    });

    expect(await store.hasRecentTouch(biz.id, 72)).toBe(true);
  });

  it('manages suppression list accurately', async () => {
    const email = 'optout@company.com';
    expect(await store.isSuppressed(email)).toBe(false);

    await store.addToSuppressionList(email, 'user_requested_unsubscribe');
    expect(await store.isSuppressed(email)).toBe(true);
    expect(await store.isSuppressed('OPTOUT@COMPANY.COM')).toBe(true);
  });

  it('acquires and releases distributed locks with TTL', async () => {
    const lockKey = 'cron_scheduler_lock';
    const acquiredFirst = await store.acquireLock(lockKey, 30);
    expect(acquiredFirst).toBe(true);

    // Second immediate acquire should fail
    const acquiredSecond = await store.acquireLock(lockKey, 30);
    expect(acquiredSecond).toBe(false);

    // Release lock
    await store.releaseLock(lockKey);
    const acquiredThird = await store.acquireLock(lockKey, 30);
    expect(acquiredThird).toBe(true);
  });
});
