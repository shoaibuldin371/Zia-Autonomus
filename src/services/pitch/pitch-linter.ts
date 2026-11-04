export interface LintResult {
  passed: boolean;
  errors: string[];
  wordCount: number;
  linkCount: number;
}

const FORBIDDEN_PHRASES = [
  'primary inbox',
  'spam safe',
  'opened 3x',
  'opened 2 times',
  'clicked portfolio link',
  'hot interest detected',
  'bypass aggressive spam traps',
  'mimics genuine typing',
  '100% perfect',
  'spam risk very low',
  '99% excellent',
  'zero double-contact guarantee',
  '100% white-hat',
  '3x reply rate',
  'losing £600+ weekly',
  'losing online pre-orders',
  'guaranteed results',
  'guarantee',
];

const URL_SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'buff.ly', 'is.gd'];

export function lintPitch(
  text: string,
  channel: 'email' | 'linkedin' | 'phone_script' | 'whatsapp' | 'instagram' = 'email'
): LintResult {
  const errors: string[] = [];
  const normalized = text.toLowerCase();

  // 1. Check for forbidden placeholder phrases
  for (const phrase of FORBIDDEN_PHRASES) {
    if (normalized.includes(phrase)) {
      errors.push(`Forbidden marketing claim detected: "${phrase}". Must use verifiable facts only.`);
    }
  }

  // 2. Count words
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (channel === 'email') {
    if (wordCount < 40) {
      errors.push(`Email is too brief (${wordCount} words). Recommended range: 60-110 words.`);
    } else if (wordCount > 130) {
      errors.push(`Email is too verbose (${wordCount} words). Keep under 110 words for high reply rates.`);
    }
  } else if (channel === 'linkedin') {
    if (text.length > 300) {
      errors.push(`LinkedIn note exceeds 300 character limit (Current: ${text.length} characters).`);
    }
  } else if (channel === 'phone_script') {
    const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length > 7) {
      errors.push(`Phone script has ${lines.length} lines. Keep to 5 concise lines for a 30-second call.`);
    }
  }

  // 3. Count links and check for URL shorteners
  const urlMatches = text.match(/https?:\/\/[^\s)]+/gi) || [];
  const linkCount = urlMatches.length;

  if (linkCount > 1) {
    errors.push(`Email contains ${linkCount} links. Strict limit is at most 1 link to protect sender reputation.`);
  }

  for (const url of urlMatches) {
    for (const shortener of URL_SHORTENERS) {
      if (url.toLowerCase().includes(shortener)) {
        errors.push(`Forbidden URL shortener detected (${shortener}). Use full transparent destination links.`);
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    wordCount,
    linkCount,
  };
}
