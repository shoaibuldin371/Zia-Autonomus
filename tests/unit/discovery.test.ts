import { describe, it, expect } from 'vitest';
import { calculateOpportunity } from '@/services/discovery/scoring';
import { isSocialUrl } from '@/services/discovery/website-verifier';
import { normalizeString, normalizePhone, normalizeDomain, findDuplicateBusiness } from '@/services/discovery/dedupe';
import { BusinessEntity } from '@/lib/supabase/data-store';

describe('Discovery & Opportunity Scoring', () => {
  it('correctly identifies social URLs', () => {
    expect(isSocialUrl('https://www.facebook.com/mybusiness').isSocial).toBe(true);
    expect(isSocialUrl('https://instagram.com/cafe_london').isSocial).toBe(true);
    expect(isSocialUrl('https://linktr.ee/dentistpro').isSocial).toBe(true);
    expect(isSocialUrl('https://mybusinesssite.co.uk').isSocial).toBe(false);
  });

  it('assigns Excellent score and Website Opportunities pipeline for businesses with no website', () => {
    const opp = calculateOpportunity('biz-123', {
      name: 'Eagle Bakery',
      websiteStatus: 'no_website',
      websiteDetails: 'No website in profile',
      rating: 4.8,
      reviewCount: 120,
      hasPhone: true,
      hasHours: false,
      photoCount: 2,
    });

    expect(opp.score.total_score).toBeGreaterThanOrEqual(75);
    expect(opp.score.score_label).toBe('Excellent');
    expect(opp.pipelineType).toBe('website_opportunities');
    expect(opp.issueBadge).toBe('No Website Found');
    expect(opp.opportunityText).toContain('120 reviews (4.8★)');
  });

  it('assigns AI Software pipeline for businesses with healthy websites', () => {
    const opp = calculateOpportunity('biz-456', {
      name: 'Premier Dental Clinic',
      websiteStatus: 'healthy',
      websiteDetails: 'Fast responsive site',
      rating: 4.9,
      reviewCount: 300,
      hasPhone: true,
      hasHours: true,
      photoCount: 15,
    });

    expect(opp.pipelineType).toBe('ai_software_opportunities');
    expect(opp.issueBadge).toBe('Needs AI Assistant');
  });

  it('deduplicates businesses across Place IDs, domains, and phone numbers', () => {
    const existing: BusinessEntity[] = [
      {
        id: '1',
        name: 'The Artisan Bakery',
        normalized_name: 'the artisan bakery',
        domain: 'https://theartisanbakery.co.uk',
        phone: '+44 161 999 1234',
        source_identifier: 'places_abc_123',
        country: 'UK',
        pipeline_type: 'website_opportunities',
        qualification_status: 'unreviewed',
        source_provider: 'google_places',
      },
    ];

    // Same place ID
    const dup1 = findDuplicateBusiness(
      { name: 'Artisan Bakery', sourceIdentifier: 'places_abc_123' },
      existing
    );
    expect(dup1.isDuplicate).toBe(true);
    expect(dup1.matchReason).toContain('Google Place ID');

    // Same domain
    const dup2 = findDuplicateBusiness(
      { name: 'Different Name Bakery', domain: 'theartisanbakery.co.uk' },
      existing
    );
    expect(dup2.isDuplicate).toBe(true);
    expect(dup2.matchReason).toContain('Domain');

    // Completely new business
    const clean = findDuplicateBusiness(
      { name: 'New Manchester Plumber', domain: 'manchesterplumbing.co.uk', phone: '+44 161 111 2222' },
      existing
    );
    expect(clean.isDuplicate).toBe(false);
  });
});
