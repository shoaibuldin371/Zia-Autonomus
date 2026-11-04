export interface SearchPlanEntry {
  country: string;
  region?: string;
  city: string;
  industry: string;
}

export const SEED_INDUSTRIES = [
  'dentists',
  'clinics',
  'plumbers',
  'HVAC',
  'electricians',
  'roofers',
  'restaurants',
  'cafes',
  'bakeries',
  'salons',
  'barbers',
  'gyms',
  'lawyers',
  'accountants',
  'real estate',
  'auto repair',
  'commercial cleaners',
  'tailors',
];

export const SEED_CITIES: Array<{ country: string; region?: string; city: string }> = [
  // United Kingdom
  { country: 'UK', city: 'London' },
  { country: 'UK', city: 'Manchester' },
  { country: 'UK', city: 'Leeds' },
  { country: 'UK', city: 'Birmingham' },
  { country: 'UK', city: 'Glasgow' },

  // United States
  { country: 'US', region: 'TX', city: 'Austin' },
  { country: 'US', region: 'CA', city: 'San Francisco' },
  { country: 'US', region: 'NY', city: 'New York' },
  { country: 'US', region: 'FL', city: 'Miami' },
  { country: 'US', region: 'IL', city: 'Chicago' },

  // Canada
  { country: 'CA', city: 'Toronto' },
  { country: 'CA', city: 'Vancouver' },

  // Australia & New Zealand
  { country: 'AU', city: 'Sydney' },
  { country: 'AU', city: 'Melbourne' },
  { country: 'NZ', city: 'Auckland' },

  // United Arab Emirates
  { country: 'UAE', city: 'Dubai' },

  // Ireland & EU Capitals
  { country: 'IE', city: 'Dublin' },
  { country: 'DE', city: 'Berlin' },
  { country: 'FR', city: 'Paris' },
  { country: 'NL', city: 'Amsterdam' },
];

/**
 * Generates the full initial search plan matrix
 */
export function generateDefaultSearchPlan(): SearchPlanEntry[] {
  const plan: SearchPlanEntry[] = [];
  for (const loc of SEED_CITIES) {
    for (const ind of SEED_INDUSTRIES) {
      plan.push({
        country: loc.country,
        region: loc.region,
        city: loc.city,
        industry: ind,
      });
    }
  }
  return plan;
}

