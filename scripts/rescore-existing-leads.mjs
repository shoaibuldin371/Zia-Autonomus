import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

function classifyJobType(text) {
  const lower = text.toLowerCase();
  if (/\b(contract to hire|c2h)\b/i.test(lower)) return 'contract';
  if (/\b(contract|contractor|1099|c2c|project-based|freelance|freelancer|consultant)\b/i.test(lower)) return 'contract';
  if (/\b(part-time|part time|fractional|[\d]+\s*hrs?\/(week|wk))\b/i.test(lower)) return 'part_time';
  if (/\b(full-time|full time|fte|permanent|direct hire|w2)\b/i.test(lower)) return 'full_time';
  return 'unknown';
}

function detectCompanySize(text, companyName) {
  const lower = text.toLowerCase();
  const cName = (companyName || '').toLowerCase().trim();

  if (cName && Array.from(KNOWN_LARGE_ENTERPRISES).some(e => cName.includes(e))) {
    return { isLarge: true, sizeLabel: 'Enterprise (>500)' };
  }

  for (const enterprise of KNOWN_LARGE_ENTERPRISES) {
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

function extractNeedSentence(text) {
  const clean = text
    .replace(/&#x2F;/g, '/')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  const rawSentences = clean.split(/(?<=[.!?\n])\s+/);
  const needSentences = rawSentences.filter((s) => {
    const trimmed = s.trim();
    if (trimmed.length < 25) return false;
    if (/^[A-Z0-9\s|/\\–—-]{10,}$/.test(trimmed)) return false;
    return /\b(looking for|seeking|need|hire|we are building|help us|responsible for|role involves|task|project|integrate|develop|engineer|automate|create)\b/i.test(trimmed);
  });

  if (needSentences.length > 0) {
    return { sentence: needSentences[0].trim().slice(0, 280), isWeak: false };
  }

  const firstSubstantive = rawSentences.find(s => s.trim().length >= 35 && !s.includes('|'));
  if (firstSubstantive) {
    return { sentence: firstSubstantive.trim().slice(0, 240), isWeak: true };
  }

  return { sentence: clean.slice(0, 180), isWeak: true };
}

function extractChannels(text, sourceUrl) {
  const channels = {};
  if (sourceUrl) channels.url = sourceUrl;

  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/);
  if (emailMatch) channels.email = emailMatch[0];

  const whatsappMatch = text.match(/\b(whatsapp|wa\.me)[\s:]*([+\d\s()-]{8,20})\b/i);
  if (whatsappMatch) channels.whatsapp = whatsappMatch[2].trim();

  const instaMatch = text.match(/\b(instagram\.com\/|ig:?\s*@?)([A-Za-z0-9_.-]+)\b/i);
  if (instaMatch) channels.instagram = `@${instaMatch[2].trim()}`;

  const fbMatch = text.match(/\b(facebook\.com\/)([A-Za-z0-9_.-]+)\b/i);
  if (fbMatch) channels.facebook = fbMatch[2].trim();

  const twitterMatch = text.match(/\b(twitter\.com\/|x\.com\/|@)([A-Za-z0-9_]{3,20})\b/i);
  if (twitterMatch && !text.includes(`mailto:${twitterMatch[2]}`)) {
    channels.twitter = `@${twitterMatch[2]}`;
  }

  return channels;
}

function calculateNuancedScore({ text, jobType, isLargeCompany, isWeakEvidence, budgetStated }) {
  const lower = text.toLowerCase();
  const whyMatched = [];
  let score = 50;

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

  if (jobType === 'contract' || jobType === 'freelance') {
    score += 15;
    whyMatched.push('Contract / project-based engagement for solo builder');
  } else if (jobType === 'part_time') {
    score += 8;
    whyMatched.push('Part-time flexible project alignment');
  } else if (jobType === 'full_time') {
    score -= 10;
  }

  if (isLargeCompany) {
    score -= 25;
  } else {
    score += 8;
  }

  if (budgetStated || /\$[\d,]+|\b(hourly|fixed budget|usd|budget:)\b/i.test(lower)) {
    score += 8;
    whyMatched.push('Transparent budget / project terms stated');
  }

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
  if (isWeakEvidence) {
    score -= 15;
  }

  score = Math.max(20, Math.min(96, score));

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

async function rescoreAll() {
  const { data: rows, error } = await supabase.from('client_requests').select('*');
  if (error) {
    console.error('Fetch error:', error);
    process.exit(1);
  }

  console.log(`Loaded ${rows.length} existing client requests.`);

  let beforeStrongCount = 0;
  let afterStrongCount = 0;
  let enterpriseCount = 0;
  let weakEvidenceCount = 0;
  const jobTypeCounts = { contract: 0, freelance: 0, part_time: 0, full_time: 0, unknown: 0 };

  const updates = [];

  for (const row of rows) {
    if (row.match_score >= 75) beforeStrongCount++;

    const fullText = `${row.quote || ''} ${row.need_summary || ''}`.trim();
    const jobType = classifyJobType(fullText);
    jobTypeCounts[jobType] = (jobTypeCounts[jobType] || 0) + 1;

    const { isLarge: isLargeCompany, sizeLabel } = detectCompanySize(fullText, row.company_name);
    const { sentence: needSentence, isWeak: isWeakEvidence } = extractNeedSentence(fullText);
    const channels = extractChannels(fullText, row.source_url);

    const isEnterpriseFullTime = jobType === 'full_time' && isLargeCompany;
    if (isEnterpriseFullTime) enterpriseCount++;
    if (isWeakEvidence) weakEvidenceCount++;

    const { score, whyMatched, serviceFit } = calculateNuancedScore({
      text: fullText,
      jobType,
      isLargeCompany,
      isWeakEvidence,
      budgetStated: Boolean(row.budget),
    });

    const isStrong = score >= 75 && !isWeakEvidence && !isEnterpriseFullTime;
    if (isStrong) afterStrongCount++;

    const isHidden = isEnterpriseFullTime || isWeakEvidence || score < 50;

    const evidenceObj = {
      why_matched: whyMatched,
      job_type: jobType,
      channels,
      is_enterprise_full_time: isEnterpriseFullTime,
      is_weak_evidence: isWeakEvidence,
      company_size: sizeLabel,
      is_strong: isStrong,
      original_quote: row.quote,
    };

    updates.push({
      id: row.id,
      match_score: score,
      quote: needSentence,
      service_fit: serviceFit,
      status: isHidden ? 'hidden' : 'new',
      evidence: evidenceObj,
    });
  }

  // Update rows in batches
  for (const u of updates) {
    const { error: updateErr } = await supabase
      .from('client_requests')
      .update({
        match_score: u.match_score,
        quote: u.quote,
        service_fit: u.service_fit,
        status: u.status,
        evidence: u.evidence,
      })
      .eq('id', u.id);

    if (updateErr) {
      console.warn(`Failed to update ${u.id}:`, updateErr.message);
    }
  }

  console.log('\n=== RESCORING COMPLETE ===');
  console.log(`Total Leads: ${rows.length}`);
  console.log(`Before Strong Matches (score >= 75): ${beforeStrongCount}`);
  console.log(`After Strong Matches (score >= 75, real need, not enterprise): ${afterStrongCount}`);
  console.log(`Enterprise Full-Time Hidden: ${enterpriseCount}`);
  console.log(`Weak Evidence Hidden: ${weakEvidenceCount}`);
  console.log('Job Type Distribution:', jobTypeCounts);

  // Print top 10 rescored leads
  const { data: top10 } = await supabase
    .from('client_requests')
    .select('*')
    .order('match_score', { ascending: false })
    .limit(10);

  console.log('\nTop 10 Rescored Leads:');
  top10?.forEach((lead, i) => {
    const ev = lead.evidence || {};
    console.log(
      `${i + 1}. [${lead.source_platform}] Score: ${lead.match_score} | ${ev.job_type || 'unknown'} | ${ev.company_size || 'N/A'} | Status: ${lead.status}`
    );
    console.log(`   Quote: ${(lead.quote || '').slice(0, 110)}`);
    console.log(`   Why: ${(ev.why_matched || []).join('; ')}`);
  });
}

rescoreAll();
