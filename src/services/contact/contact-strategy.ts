export interface ChannelRank {
  type: 'email' | 'phone' | 'whatsapp' | 'instagram' | 'linkedin' | 'facebook';
  label: string;
  value: string;
  isVerified: boolean;
  matchType: 'verified_match' | 'possible_match';
  actionLabel: string;
}

/**
 * Determines recipient timezone from country and city
 */
export function getRecipientTimezone(country: string, city?: string | null): string {
  const normCountry = (country || '').toUpperCase().trim();
  const normCity = (city || '').toLowerCase().trim();

  if (normCountry === 'UK' || normCountry === 'GB') {
    return 'Europe/London';
  }

  if (normCountry === 'CA') {
    if (['vancouver', 'victoria'].includes(normCity)) return 'America/Vancouver';
    return 'America/Toronto';
  }

  if (normCountry === 'AU') {
    if (['perth'].includes(normCity)) return 'Australia/Perth';
    return 'Australia/Sydney';
  }

  if (normCountry === 'NZ') {
    return 'Pacific/Auckland';
  }

  if (normCountry === 'UAE') {
    return 'Asia/Dubai';
  }

  if (normCountry === 'IE') {
    return 'Europe/Dublin';
  }

  if (normCountry === 'DE') return 'Europe/Berlin';
  if (normCountry === 'FR') return 'Europe/Paris';
  if (normCountry === 'NL') return 'Europe/Amsterdam';

  if (normCountry === 'US') {
    if (['los angeles', 'san francisco', 'seattle', 'san diego'].includes(normCity)) return 'America/Los_Angeles';
    if (['denver', 'phoenix', 'salt lake city'].includes(normCity)) return 'America/Denver';
    if (['chicago', 'austin', 'dallas', 'houston', 'minneapolis'].includes(normCity)) return 'America/Chicago';
    return 'America/New_York'; // Default US Eastern
  }

  return 'UTC';
}

/**
 * Validates if the current moment falls within the recipient's allowed sending window:
 * Monday through Friday, 09:00 to 17:30 in the recipient's local time zone.
 */
export function isWithinRecipientSendingWindow(country: string, city?: string | null, date: Date = new Date()): {
  allowed: boolean;
  localTime: string;
  reason?: string;
} {
  const timeZone = getRecipientTimezone(country, city);

  // Format recipient local day of week and hour:minute
  const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' });
  const hourFormatter = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: 'numeric', hour12: false });

  const dayOfWeek = dayFormatter.format(date); // Mon, Tue, Wed, Thu, Fri, Sat, Sun
  const timeStr = hourFormatter.format(date); // HH:MM
  const [hourStr, minStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const min = parseInt(minStr, 10);
  const currentMinutes = hour * 60 + min;

  const windowStartMinutes = 9 * 60; // 09:00
  const windowEndMinutes = 17 * 60 + 30; // 17:30

  if (dayOfWeek === 'Sat' || dayOfWeek === 'Sun') {
    return {
      allowed: false,
      localTime: `${timeStr} (${dayOfWeek}, ${timeZone})`,
      reason: `Sending is paused over the weekend in recipient local time (${dayOfWeek}).`,
    };
  }

  if (currentMinutes < windowStartMinutes || currentMinutes > windowEndMinutes) {
    return {
      allowed: false,
      localTime: `${timeStr} (${dayOfWeek}, ${timeZone})`,
      reason: `Outside allowed working hours (09:00 - 17:30). Recipient local time is ${timeStr}.`,
    };
  }

  return {
    allowed: true,
    localTime: `${timeStr} (${dayOfWeek}, ${timeZone})`,
  };
}

/**
 * Ranks contact channels for a business according to verified priority
 */
export function rankContactChannels(lead: {
  email?: string | null;
  phone?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
  linkedin?: string | null;
  hasVerifiedEmail?: boolean;
}): ChannelRank[] {
  const ranked: ChannelRank[] = [];

  // 1. Verified Email
  if (lead.email) {
    ranked.push({
      type: 'email',
      label: 'Verified Direct Email',
      value: lead.email,
      isVerified: Boolean(lead.hasVerifiedEmail),
      matchType: lead.hasVerifiedEmail ? 'verified_match' : 'possible_match',
      actionLabel: 'Send Intro Website Offer',
    });
  }

  // 2. Phone Call
  if (lead.phone) {
    ranked.push({
      type: 'phone',
      label: 'Google Maps Phone',
      value: lead.phone,
      isVerified: true,
      matchType: 'verified_match',
      actionLabel: 'Call Now',
    });
  }

  // 3. WhatsApp (if listed)
  if (lead.whatsapp || (lead.phone && !lead.email)) {
    ranked.push({
      type: 'whatsapp',
      label: 'WhatsApp Direct',
      value: lead.whatsapp || lead.phone || '',
      isVerified: true,
      matchType: 'verified_match',
      actionLabel: 'Open WhatsApp & Send Preview',
    });
  }

  // 4. Instagram / Social
  if (lead.instagram) {
    ranked.push({
      type: 'instagram',
      label: 'Instagram Profile',
      value: lead.instagram,
      isVerified: true,
      matchType: 'verified_match',
      actionLabel: 'Open Instagram & Paste Script',
    });
  }

  return ranked;
}

/**
 * Checks if a lead represents a UK sole trader / individual who cannot be cold-emailed without prior opt-in under PECR
 */
export function isUKSoleTraderExclusion(companyName: string, country: string, companyType?: string | null): boolean {
  if (country !== 'UK' && country !== 'GB') return false;

  const normType = (companyType || '').toLowerCase();
  if (normType.includes('limited liability partnership') || normType.includes('llp')) {
    return false;
  }
  if (normType.includes('sole trader') || normType.includes('individual') || (normType.includes('partnership') && !normType.includes('limited'))) {
    return true;
  }

  // If no corporate entity indicator (Ltd, Limited, PLC, LLP) and name looks like a personal name
  const hasCorporateSuffix = /\b(ltd|limited|llp|plc|inc)\b/i.test(companyName);
  if (!hasCorporateSuffix) {
    // Flag for safety review
    return true;
  }

  return false;
}
