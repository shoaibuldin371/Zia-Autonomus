import { describe, it, expect } from 'vitest';
import { lintPitch } from '@/services/pitch/pitch-linter';
import { extractFactualStatements, verifyDraftClaims } from '@/services/pitch/claim-checker';
import { classifyClientRequest } from '@/services/platforms/client-request-classifier';

describe('Pitch Linter, Claim Checker & Client Request Classifier', () => {
  it('detects forbidden placeholder phrases in pitches', () => {
    const badPitch = 'We guarantee you will get into the Primary Inbox with 100% Perfect reputation and 3x reply rate!';
    const result = lintPitch(badPitch, 'email');

    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('guarantee'))).toBe(true);
    expect(result.errors.some((e) => e.includes('primary inbox'))).toBe(true);
    expect(result.errors.some((e) => e.includes('100% perfect'))).toBe(true);
    expect(result.errors.some((e) => e.includes('3x reply rate'))).toBe(true);
  });

  it('detects URL shorteners and bounds link count', () => {
    const shortenerPitch = 'Check this out at https://bit.ly/mydeal and https://tinyurl.com/another one.';
    const result = lintPitch(shortenerPitch, 'email');

    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('URL shortener'))).toBe(true);
    expect(result.errors.some((e) => e.includes('limit is at most 1 link'))).toBe(true);
  });

  it('passes honest, evidence-only pitches with proper length', () => {
    const goodPitch = `Hi there,

I was reviewing local clinics in Manchester and saw Premier Dental. Specifically, your Google Maps profile shows 4.8 stars from 180 reviews with no website link.

When local patients search on mobile, having a dedicated fast-loading page makes an immediate difference. I build custom Next.js booking sites for $500 in 3 days.

Would you be open to seeing a 2-minute preview of how this would look for Premier Dental?

Best regards,
Zia Ul Din
Full-Stack AI Developer & Automation Architect`;

    const result = lintPitch(goodPitch, 'email');
    expect(result.passed).toBe(true);
    expect(result.wordCount).toBeGreaterThanOrEqual(50);
    expect(result.wordCount).toBeLessThanOrEqual(110);
  });

  it('verifies claims against stored evidence', () => {
    const storedEvidence = [
      {
        business_id: 'b1',
        source_name: 'google_places',
        summary: 'Google rating shows 4.8 stars from 180 reviews but no website link.',
        evidence_type: 'google_places',
        is_factual: true,
      },
    ];

    const pitch = 'Your Google profile shows 4.8 stars from 180 reviews with no website link.';
    const check = verifyDraftClaims(pitch, storedEvidence);
    expect(check.passed).toBe(true);
    expect(check.unsupportedClaims.length).toBe(0);

    const inventedPitch = 'I saw you just opened a new branch in Leeds and hired 15 new dentists!';
    const failedCheck = verifyDraftClaims(inventedPitch, storedEvidence);
    expect(failedCheck.passed).toBe(false);
    expect(failedCheck.unsupportedClaims.length).toBeGreaterThan(0);
  });

  it('flags scam attempts and detects technical fit in client requests', () => {
    const scamPost = 'Urgently need developer! Contact me on telegram @scammer123 and pay $50 deposit.';
    const scamResult = classifyClientRequest(scamPost);
    expect(scamResult.isSafeToPitch).toBe(false);
    expect(scamResult.scamRedFlags.length).toBeGreaterThan(0);

    const goodAiPost = 'Looking for full-stack AI engineer to build a LangChain RAG pipeline with Next.js and Supabase.';
    const aiResult = classifyClientRequest(goodAiPost);
    expect(aiResult.category).toBe('AI/ML');
    expect(aiResult.isSafeToPitch).toBe(true);
    expect(aiResult.fitScore).toBeGreaterThanOrEqual(70);
  });
});

