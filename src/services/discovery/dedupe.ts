import { BusinessEntity } from '@/lib/supabase/data-store';

/**
 * Normalizes text for deduplication matching (removes punctuation, lowercases, collapses whitespace)
 */
export function normalizeString(str?: string | null): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes phone numbers to bare digits
 */
export function normalizePhone(phone?: string | null): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Normalizes domain by removing protocol, www, and trailing slashes
 */
export function normalizeDomain(urlOrDomain?: string | null): string {
  if (!urlOrDomain) return '';
  try {
    const raw = urlOrDomain.startsWith('http') ? urlOrDomain : `https://${urlOrDomain}`;
    const parsed = new URL(raw);
    return parsed.hostname.toLowerCase().replace(/^www\./, '').trim();
  } catch {
    return urlOrDomain.toLowerCase().replace(/^www\./, '').split('/')[0].trim();
  }
}

/**
 * Checks if a candidate business matches any existing businesses in the database
 */
export function findDuplicateBusiness(
  candidate: {
    sourceIdentifier?: string | null;
    name: string;
    phone?: string | null;
    address?: string | null;
    domain?: string | null;
  },
  existingList: BusinessEntity[]
): { isDuplicate: boolean; matchReason?: string; existingId?: string } {
  const normName = normalizeString(candidate.name);
  const normPhone = normalizePhone(candidate.phone);
  const normDomain = normalizeDomain(candidate.domain);

  for (const existing of existingList) {
    // 1. Google Place ID match
    if (
      candidate.sourceIdentifier &&
      existing.source_identifier &&
      candidate.sourceIdentifier === existing.source_identifier
    ) {
      return { isDuplicate: true, matchReason: 'Google Place ID match', existingId: existing.id };
    }

    // 2. Domain match (when domain exists and is not a generic social host)
    if (
      normDomain &&
      existing.domain &&
      normDomain === normalizeDomain(existing.domain) &&
      !['facebook.com', 'instagram.com', 'yelp.com'].includes(normDomain)
    ) {
      return { isDuplicate: true, matchReason: 'Domain match', existingId: existing.id };
    }

    // 3. Name + Phone match
    if (normPhone && existing.phone && normPhone === normalizePhone(existing.phone)) {
      if (normName === normalizeString(existing.name)) {
        return { isDuplicate: true, matchReason: 'Name and Phone match', existingId: existing.id };
      }
    }
  }

  return { isDuplicate: false };
}
