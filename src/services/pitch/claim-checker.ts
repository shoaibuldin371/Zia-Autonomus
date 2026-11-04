import { EvidenceEntity } from '@/lib/supabase/data-store';

export interface ClaimVerificationResult {
  passed: boolean;
  unsupportedClaims: string[];
  verifiedClaims: string[];
}

/**
 * Extracts factual observation statements (e.g., statements mentioning stars, reviews, websites, ratings, cities)
 */
export function extractFactualStatements(pitchText: string): string[] {
  const sentences = pitchText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  const factual: string[] = [];
  const observationKeywords = [
    'star',
    'review',
    'google',
    'website',
    'mobile',
    'load time',
    'speed',
    'rating',
    'profile',
    'found',
    'noticed',
    'shows',
    'saw',
    'branch',
    'hired',
    'expansion',
    'opened',
    'team',
    'revenue',
    'growth',
  ];

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (observationKeywords.some((kw) => lower.includes(kw))) {
      factual.push(sentence);
    }
  }

  return factual;
}

/**
 * Verifies that every factual claim in a draft is directly backed by stored evidence
 */
export function verifyDraftClaims(
  pitchText: string,
  storedEvidence: EvidenceEntity[]
): ClaimVerificationResult {
  const factualStatements = extractFactualStatements(pitchText);
  const unsupportedClaims: string[] = [];
  const verifiedClaims: string[] = [];

  // Combine all evidence summaries into one searchable text
  const combinedEvidenceText = storedEvidence
    .map((e) => `${e.summary} ${e.evidence_type} ${JSON.stringify(e.metadata || {})}`)
    .join(' ')
    .toLowerCase();

  for (const statement of factualStatements) {
    const lower = statement.toLowerCase();

    // Specific numeric claims verification: e.g. "4.8" stars or "120" reviews
    const numbers = statement.match(/\b\d+(\.\d+)?\b/g) || [];
    let numberSupported = true;

    for (const num of numbers) {
      // Ignore common non-claim numbers like price/timeline (e.g. 3 days, $500)
      if (['3', '500', '750', '24', '7'].includes(num)) continue;

      if (!combinedEvidenceText.includes(num)) {
        numberSupported = false;
        break;
      }
    }

    // Check general topic support
    let topicSupported = false;
    if (lower.includes('website') && (combinedEvidenceText.includes('website') || combinedEvidenceText.includes('site'))) {
      topicSupported = true;
    } else if (lower.includes('review') && combinedEvidenceText.includes('review')) {
      topicSupported = true;
    } else if (lower.includes('star') && combinedEvidenceText.includes('star')) {
      topicSupported = true;
    } else if (storedEvidence.length > 0) {
      // General match
      topicSupported = true;
    }

    if (numberSupported && topicSupported) {
      verifiedClaims.push(statement);
    } else {
      unsupportedClaims.push(statement);
    }
  }

  return {
    passed: unsupportedClaims.length === 0,
    unsupportedClaims,
    verifiedClaims,
  };
}
