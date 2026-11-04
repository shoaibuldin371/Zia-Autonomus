export interface ClassificationResult {
  category: 'AI/ML' | 'Automation' | 'Web Development' | 'Other';
  fitScore: number;
  fitLabel: 'High Fit' | 'Medium Fit' | 'Low Fit';
  budgetSignal?: string;
  urgencySignal?: string;
  scamRedFlags: string[];
  isSafeToPitch: boolean;
  breakdown: Record<string, number | string>;
}

const SCAM_PATTERNS = [
  { pattern: /\b(telegram|t\.me|whatsapp me directly|contact me on whatsapp)\b/i, flag: 'Asks for off-platform communication' },
  { pattern: /\b(pay outside|direct wire before escrow|bypass platform fee|crypto only payment)\b/i, flag: 'Requests off-platform payment' },
  { pattern: /\b(send security deposit|pay for software license first|reimbursement check)\b/i, flag: 'Demands upfront payment or deposit' },
  { pattern: /\b(urgently need 1000 tasks done today for \$5|unlimited revisions for \$10)\b/i, flag: 'Extremely unrealistic scope/budget ratio' },
];

export function classifyClientRequest(postContent: string): ClassificationResult {
  const content = postContent || '';
  const lower = content.toLowerCase();
  const redFlags: string[] = [];

  // Check for scam red flags
  for (const { pattern, flag } of SCAM_PATTERNS) {
    if (pattern.test(content)) {
      redFlags.push(flag);
    }
  }

  // Determine category
  let category: ClassificationResult['category'] = 'Other';
  let categoryScore = 20;

  if (/\b(ai|llm|gpt|claude|gemini|rag|vector database|fine-tuning|agent|langchain|llamaindex|langgraph|machine learning)\b/i.test(lower)) {
    category = 'AI/ML';
    categoryScore = 40;
  } else if (/\b(automation|zapier|make\.com|n8n|webhook|workflow|scraping|sync|airtable)\b/i.test(lower)) {
    category = 'Automation';
    categoryScore = 35;
  } else if (/\b(next\.js|react|typescript|tailwind|full-stack|api|landing page|website)\b/i.test(lower)) {
    category = 'Web Development';
    categoryScore = 30;
  }

  // Detect budget signals
  let budgetSignal = 'Standard / Not Specified';
  let budgetScore = 15;
  const budgetMatch = content.match(/\$[\d,]+(\s*-\s*\$[\d,]+)?|\b(hourly|fixed price)\b/i);
  if (budgetMatch) {
    budgetSignal = budgetMatch[0];
    budgetScore = 25;
  }

  // Detect urgency
  let urgencySignal = 'Normal';
  if (/\b(asap|urgent|immediately|start this week|within 24 hours)\b/i.test(lower)) {
    urgencySignal = 'High Urgency (Immediate Start)';
  }

  let totalScore = categoryScore + budgetScore + (redFlags.length === 0 ? 30 : -40);
  totalScore = Math.max(0, Math.min(100, totalScore));

  let fitLabel: ClassificationResult['fitLabel'] = 'Low Fit';
  if (totalScore >= 75) fitLabel = 'High Fit';
  else if (totalScore >= 45) fitLabel = 'Medium Fit';

  return {
    category,
    fitScore: totalScore,
    fitLabel,
    budgetSignal,
    urgencySignal,
    scamRedFlags: redFlags,
    isSafeToPitch: redFlags.length === 0,
    breakdown: {
      categoryScore,
      budgetScore,
      securityCheck: redFlags.length === 0 ? 'Passed Clean' : 'Failed Flag',
    },
  };
}
