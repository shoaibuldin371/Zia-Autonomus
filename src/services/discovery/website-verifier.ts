import { safeFetch } from '@/lib/security/ssrf-guard';

export interface WebsiteVerificationResult {
  status: 'no_website' | 'social_only' | 'has_problems' | 'healthy' | 'unknown';
  details: string;
  loadTimeMs?: number;
  httpStatus?: number;
  isSocialPage?: boolean;
  socialPlatform?: string;
}

const SOCIAL_DOMAINS = [
  'facebook.com',
  'instagram.com',
  'linktr.ee',
  'yelp.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'youtube.com',
];

export function isSocialUrl(urlStr: string): { isSocial: boolean; platform?: string } {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    for (const d of SOCIAL_DOMAINS) {
      if (host === d || host.endsWith('.' + d)) {
        return { isSocial: true, platform: d.split('.')[0] };
      }
    }
    return { isSocial: false };
  } catch {
    return { isSocial: false };
  }
}

/**
 * Verifies a business website safely using SSRF guards and measuring real response times.
 */
export async function verifyBusinessWebsite(rawUrl?: string | null): Promise<WebsiteVerificationResult> {
  if (!rawUrl || rawUrl.trim().length === 0) {
    return {
      status: 'no_website',
      details: 'No website URI provided in Google Places profile',
    };
  }

  const trimmed = rawUrl.trim();
  const socialCheck = isSocialUrl(trimmed);
  if (socialCheck.isSocial) {
    return {
      status: 'social_only',
      details: `Profile links directly to ${socialCheck.platform} rather than an owned business domain`,
      isSocialPage: true,
      socialPlatform: socialCheck.platform,
    };
  }

  const start = Date.now();
  try {
    const res = await safeFetch(trimmed, { timeoutMs: 7000 });
    const loadTimeMs = Date.now() - start;

    if (res.status >= 400) {
      return {
        status: 'has_problems',
        details: `Server returned HTTP ${res.status} error`,
        httpStatus: res.status,
        loadTimeMs,
      };
    }

    // Measure slow load time (> 3500ms is considered sluggish on mobile)
    if (loadTimeMs > 3500) {
      return {
        status: 'has_problems',
        details: `Slow load time measured: ${(loadTimeMs / 1000).toFixed(1)}s (exceeds 3.5s mobile threshold)`,
        httpStatus: res.status,
        loadTimeMs,
      };
    }

    return {
      status: 'healthy',
      details: `Responsive website (HTTP ${res.status}, ${(loadTimeMs / 1000).toFixed(2)}s load time)`,
      httpStatus: res.status,
      loadTimeMs,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('SSRF Guard') || message.includes('Forbidden')) {
      return {
        status: 'unknown',
        details: `Verification blocked by security policy: ${message}`,
      };
    }

    return {
      status: 'has_problems',
      details: `Failed to connect to website: ${message}`,
    };
  }
}

