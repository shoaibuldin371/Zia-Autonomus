export type JobType = 'contract' | 'freelance' | 'part_time' | 'full_time' | 'unknown';

export interface ScoredClientRequest {
  id: string;
  source_platform: string;
  source_url?: string;
  post_url?: string;
  quote: string;
  need_summary: string;
  match_score: number;
  service_fit: string;
  status: string;
  found_at: string;
  person_name?: string | null;
  company_name?: string | null;
  platform_username?: string | null;
  platform_profile_url?: string | null;
  company_website?: string | null;
  budget?: string | null;
  channels: {
    email?: string;
    url?: string;
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  job_type: JobType;
  is_enterprise_full_time: boolean;
  is_weak_evidence: boolean;
  why_matched: string[];
  is_hidden: boolean;
  is_strong: boolean;
  company_size?: string;
}

const KNOWN_LARGE_ENTERPRISES = new Set([
  'nvidia', 'plug power', 'wellsky', 'general dynamics', 'google', 'microsoft',
  'amazon', 'meta', 'apple', 'ibm', 'oracle', 'salesforce', 'intel', 'cisco',
  'uber', 'netflix', 'adobe', 'walmart', 'target', 'boeing', 'raytheon',
  'lockheed', 'lockheed martin', 'jpmorgan', 'jpmorgan chase', 'goldman sachs',
  'morgan stanley', 'bank of america', 'citi', 'citigroup', 'wells fargo',
  'deloitte', 'pwc', 'ey', 'kpmg', 'accenture', 'cognizant', 'infosys',
  'wipro', 'tcs', 'tata consultancy', 'capgemini', 'sap', 'vmware', 'paypal',
  'square', 'block', 'stripe', 'snowflake', 'databricks', 'workday', 'servicenow',
  'twilio', 'atlassian', 'autodesk', 'intuit', 'ebay', 'shopify', 'spotify',
  'twitter', 'bytedance', 'tiktok', 'zoom', 'avaya', 'fluence international',
]);

export function classifyJobType(text: string): JobType {
  const lower = text.toLowerCase();
  if (/\b(contract to hire|c2h)\b/i.test(lower)) return 'contract';
  if (/\b(contract|contractor|1099|c2c|project-based|freelance|freelancer|consultant)\b/i.test(lower)) return 'contract';
  if (/\b(part-time|part time|fractional|[\d]+\s*hrs?\/(week|wk))\b/i.test(lower)) return 'part_time';
  if (/\b(full-time|full time|fte|permanent|direct hire|w2)\b/i.test(lower)) return 'full_time';
  return 'unknown';
}

export function detectCompanySize(text: string, companyName?: string | null): { isLarge: boolean; sizeLabel?: string } {
  const lower = text.toLowerCase();
  const cName = (companyName || '').toLowerCase().trim();

  // Check known enterprise name
  if (cName && Array.from(KNOWN_LARGE_ENTERPRISES).some(e => cName.includes(e))) {
    return { isLarge: true, sizeLabel: 'Enterprise (>500)' };
  }

  for (const enterprise of Array.from(KNOWN_LARGE_ENTERPRISES)) {
    if (new RegExp(`\\b${enterprise}\\b`, 'i').test(lower)) {
      return { isLarge: true, sizeLabel: 'Enterprise (>500)' };
    }
  }

  if (/\b(500\+|1,?000\+|5,?000\+|10,?000\+|fortune 500|publicly traded|enterprise)\b/i.test(lower)) {
    return { isLarge: true, sizeLabel: 'Enterprise (>500)' };
  }

  if (/\b(startup|early-stage|seed|series a|series b|small team|boutique|indie|solo founder)\b/i.test(lower)) {
    return { isLarge: false, sizeLabel: 'Small / Startup (<50)' };
  }

  if (/\b(10-50|50-200|mid-size|scale-up)\b/i.test(lower)) {
    return { isLarge: false, sizeLabel: 'Mid-size (50-500)' };
  }

  return { isLarge: false, sizeLabel: 'Small / Mid-size' };
}

export function extractNeedSentence(text: string): { sentence: string; isWeak: boolean } {
  // Clean text from HTML entities
  const clean = text
    .replace(/&#x2F;/g, '/')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  // Split into sentences
  const rawSentences = clean.split(/(?<=[.!?\n])\s+/);
  const needSentences = rawSentences.filter((s) => {
    const trimmed = s.trim();
    if (trimmed.length < 25) return false;
    // Disqualify generic headers like "Company | Location | Full-Time"
    if (/^[A-Z0-9\s|/\\–—-]{10,}$/.test(trimmed)) return false;
    return /\b(looking for|seeking|need|hire|we are building|help us|responsible for|role involves|task|project|integrate|develop|engineer|automate|create)\b/i.test(trimmed);
  });

  if (needSentences.length > 0) {
    return { sentence: needSentences[0].trim().slice(0, 280), isWeak: false };
  }

  // Fallback to first descriptive sentence if present
  const firstSubstantive = rawSentences.find(s => s.trim().length >= 35 && !s.includes('|'));
  if (firstSubstantive) {
    return { sentence: firstSubstantive.trim().slice(0, 240), isWeak: true };
  }

  return { sentence: clean.slice(0, 180), isWeak: true };
}

export function extractChannels(text: string, sourceUrl?: string | null): ScoredClientRequest['channels'] {
  const channels: ScoredClientRequest['channels'] = {};
  if (sourceUrl) channels.url = sourceUrl;

  // Extract public email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/);
  if (emailMatch) {
    channels.email = emailMatch[0];
  }

  // Extract public WhatsApp ONLY if explicitly listed
  const whatsappMatch = text.match(/\b(whatsapp|wa\.me)[\s:]*([+\d\s()-]{8,20})\b/i);
  if (whatsappMatch) {
    channels.whatsapp = whatsappMatch[2].trim();
  }

  // Extract public Instagram ONLY if explicitly listed
  const instaMatch = text.match(/\b(instagram\.com\/|ig:?\s*@?)([A-Za-z0-9_.-]+)\b/i);
  if (instaMatch) {
    channels.instagram = `@${instaMatch[2].trim()}`;
  }

  // Extract public Facebook ONLY if explicitly listed
  const fbMatch = text.match(/\b(facebook\.com\/)([A-Za-z0-9_.-]+)\b/i);
  if (fbMatch) {
    channels.facebook = fbMatch[2].trim();
  }

  // Extract Twitter / X handle if explicitly listed
  const twitterMatch = text.match(/\b(twitter\.com\/|x\.com\/|@)([A-Za-z0-9_]{3,20})\b/i);
  if (twitterMatch && !text.includes(`mailto:${twitterMatch[2]}`)) {
    channels.twitter = `@${twitterMatch[2]}`;
  }

  return channels;
}

export function calculateNuancedScore(params: {
  text: string;
  jobType: JobType;
  isLargeCompany: boolean;
  isWeakEvidence: boolean;
  budgetStated?: boolean;
}): { score: number; whyMatched: string[]; serviceFit: string } {
  const lower = params.text.toLowerCase();
  const whyMatched: string[] = [];
  let score = 50;

  // 1. Skill overlap with Zia's core profile
  let hasAiSkill = false;
  let hasAutomationSkill = false;
  let hasWebSkill = false;

  if (/\b(ai|llm|agent|rag|groq|gpt|langchain|llamaindex|vector|embedding|chatbot|prompt|machine learning|python|nlp|pytorch)\b/i.test(lower)) {
    hasAiSkill = true;
    score += 20;
    whyMatched.push('Direct match for AI, LLM & Python automation skills');
  }

  if (/\b(automation|workflow|n8n|make\.com|zapier|webhook|api integration|airtable|scraping|fastapi|backend)\b/i.test(lower)) {
    hasAutomationSkill = true;
    score += 18;
    whyMatched.push('Strong fit for workflow automation, webhooks & backend APIs');
  }

  if (/\b(next\.js|nextjs|react|typescript|tailwind|full-stack|fullstack|postgres|postgresql|supabase)\b/i.test(lower)) {
    hasWebSkill = true;
    score += 16;
    whyMatched.push('Exact stack match (Next.js, TypeScript, PostgreSQL)');
  }

  // 2. Job Type bonuses / penalties
  if (params.jobType === 'contract' || params.jobType === 'freelance') {
    score += 15;
    whyMatched.push('Contract / project-based engagement for solo builder');
  } else if (params.jobType === 'part_time') {
    score += 8;
    whyMatched.push('Part-time flexible project alignment');
  } else if (params.jobType === 'full_time') {
    score -= 10;
  }

  // 3. Company Size bonus / penalty
  if (params.isLargeCompany) {
    score -= 25;
  } else {
    score += 8;
  }

  // 4. Budget signal
  if (params.budgetStated || /\$[\d,]+|\b(hourly|fixed budget|usd|budget:)\b/i.test(lower)) {
    score += 8;
    whyMatched.push('Transparent budget / project terms stated');
  }

  // 5. Skill mismatch penalties
  if (/\b(\.net|c#|dotnet|asp\.net|wellsky)\b/i.test(lower)) {
    score -= 35;
  }
  if (/\b(java\b|spring boot|j2ee)\b/i.test(lower) && !hasWebSkill) {
    score -= 30;
  }
  if (/\b(embedded|hardware|firmware|fpga|asic|pcb)\b/i.test(lower)) {
    score -= 40;
  }
  if (/\b(sales manager|account executive|cold caller|recruiter|financial analyst)\b/i.test(lower)) {
    score -= 35;
  }
  if (/\b(staff engineer|director of engineering|vp of|vp,|general dynamics)\b/i.test(lower)) {
    score -= 20;
  }
  if (params.isWeakEvidence) {
    score -= 15;
  }

  // Clamp score between 20 and 96
  score = Math.max(20, Math.min(96, score));

  // Determine primary service fit
  let serviceFit = 'Full-Stack Web & Automation';
  if (hasAiSkill && hasAutomationSkill) {
    serviceFit = 'AI & LLM Integration (RAG / Automation)';
  } else if (hasAiSkill) {
    serviceFit = 'AI Engineering & LLM Chatbots';
  } else if (hasAutomationSkill) {
    serviceFit = 'Workflow & API Automation (n8n / Python)';
  } else if (hasWebSkill) {
    serviceFit = 'Next.js & TypeScript Application Development';
  }

  if (whyMatched.length === 0) {
    whyMatched.push('General technical alignment with engineering profile');
  }

  return {
    score,
    whyMatched: whyMatched.slice(0, 3),
    serviceFit,
  };
}

export function processClientRequestItem(raw: {
  id?: string;
  source_platform: string;
  source_url?: string;
  post_url?: string;
  quote?: string;
  title?: string;
  text?: string;
  company_name?: string | null;
  person_name?: string | null;
  platform_username?: string | null;
  platform_profile_url?: string | null;
  budget?: string | null;
  found_at?: string;
}): ScoredClientRequest {
  const fullText = `${raw.title || ''} ${raw.quote || ''} ${raw.text || ''}`.trim();
  const jobType = classifyJobType(fullText);
  const { isLarge: isLargeCompany, sizeLabel } = detectCompanySize(fullText, raw.company_name);
  const { sentence: needSentence, isWeak: isWeakEvidence } = extractNeedSentence(fullText);
  const channels = extractChannels(fullText, raw.source_url || raw.post_url);

  const isEnterpriseFullTime = jobType === 'full_time' && isLargeCompany;
  const { score, whyMatched, serviceFit } = calculateNuancedScore({
    text: fullText,
    jobType,
    isLargeCompany,
    isWeakEvidence,
    budgetStated: Boolean(raw.budget),
  });

  const isStrong = score >= 75 && !isWeakEvidence && !isEnterpriseFullTime;
  const isHidden = isEnterpriseFullTime || isWeakEvidence || score < 50;

  return {
    id: raw.id || `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    source_platform: raw.source_platform,
    source_url: raw.source_url,
    post_url: raw.post_url || raw.source_url,
    quote: needSentence,
    need_summary: `Client requires assistance with ${serviceFit.toLowerCase()} based on their public request.`,
    match_score: score,
    service_fit: serviceFit,
    status: isHidden ? 'hidden' : 'new',
    found_at: raw.found_at || new Date().toISOString(),
    person_name: raw.person_name || null,
    company_name: raw.company_name || null,
    platform_username: raw.platform_username || 'Not shown',
    platform_profile_url: raw.platform_profile_url || null,
    budget: raw.budget || null,
    channels,
    job_type: jobType,
    is_enterprise_full_time: isEnterpriseFullTime,
    is_weak_evidence: isWeakEvidence,
    why_matched: whyMatched,
    is_hidden: isHidden,
    is_strong: isStrong,
    company_size: sizeLabel,
  };
}
