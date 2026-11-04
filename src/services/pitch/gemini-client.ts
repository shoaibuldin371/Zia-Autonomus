import { EvidenceEntity } from '@/lib/supabase/data-store';

export interface PitchGenerationParams {
  businessName: string;
  industry: string;
  city?: string;
  evidence: EvidenceEntity[];
  offerName: string;
  offerPriceUsd: number;
  offerTimelineDays: number;
  channel: 'email' | 'linkedin' | 'phone_script' | 'whatsapp' | 'instagram';
}

export interface GeneratedPitch {
  subject?: string;
  body: string;
  provider: 'gemini' | 'deterministic_template';
  modelUsed?: string;
}

/**
 * Deterministic evidence-backed pitch generator (active when GEMINI_API_KEY is not set)
 */
export function generateDeterministicPitch(params: PitchGenerationParams): GeneratedPitch {
  const primaryEvidence = params.evidence[0]?.summary || `Verified business profile in ${params.city || 'your area'}`;

  if (params.channel === 'email') {
    const subject = `Question regarding ${params.businessName} website & bookings`;
    const body = `Hi there,\n\nI was reviewing local ${params.industry || 'businesses'} in ${params.city || 'your area'} and saw ${params.businessName}. Specifically, ${primaryEvidence}.\n\nWhen local customers search on mobile, having a dedicated fast-loading page with direct booking makes an immediate difference. I build custom, lightning-fast Next.js booking sites for \$${params.offerPriceUsd} in ${params.offerTimelineDays} days.\n\nWould you be open to seeing a 2-minute preview of how this would look for ${params.businessName}?\n\nBest regards,\nZia Ul Din\nFull-Stack AI Developer & Automation Architect`;
    return { subject, body, provider: 'deterministic_template' };
  }

  if (params.channel === 'phone_script') {
    const body = `1. Hi, is this the owner or manager at ${params.businessName}?\n2. My name is Zia Ul Din, I'm an automation and web developer.\n3. I noticed on Google Maps: ${primaryEvidence}.\n4. I build clean, fast booking pages for \$${params.offerPriceUsd} delivered in ${params.offerTimelineDays} days.\n5. Would it be alright if I sent a 2-minute preview link to your WhatsApp or email to take a look?`;
    return { body, provider: 'deterministic_template' };
  }

  if (params.channel === 'linkedin') {
    const body = `Hi! Noticed ${params.businessName} on Google Maps (${primaryEvidence}). I build high-speed Next.js booking systems (\$${params.offerPriceUsd}, ${params.offerTimelineDays}d). Would love to share a quick preview if relevant.`;
    return { body, provider: 'deterministic_template' };
  }

  if (params.channel === 'whatsapp' || params.channel === 'instagram') {
    const body = `Hello! Reaching out regarding ${params.businessName}. I noticed on Google: ${primaryEvidence}. I build fast modern mobile booking systems for local businesses (\$${params.offerPriceUsd}, ready in ${params.offerTimelineDays} days). Would you like me to send a quick preview?`;
    return { body, provider: 'deterministic_template' };
  }

  return {
    body: `Inquiry regarding ${params.businessName}: ${primaryEvidence}.`,
    provider: 'deterministic_template',
  };
}

/**
 * Generates an evidence-backed pitch using Gemini via the x-goog-api-key header
 */
export async function generatePitchWithGemini(params: PitchGenerationParams): Promise<GeneratedPitch> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const timeoutMs = parseInt(process.env.LLM_TIMEOUT_MS || '15000', 10);

  if (!apiKey || apiKey.trim().length === 0) {
    // Graceful fallback to deterministic template when key is unconfigured
    return generateDeterministicPitch(params);
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const systemInstruction = `
You are Zia Ul Din, an expert full-stack AI developer and automation architect from Pakistan writing a concise, respectful, evidence-only business outreach message.
Strict Rules:
1. Ground every claim ONLY on the provided verified evidence. Never invent revenue loss, customer numbers, expansion, or hiring.
2. Structure: (a) One verified factual observation, (b) why it matters, (c) concrete offer ($${params.offerPriceUsd}, ${params.offerTimelineDays} days), (d) soft low-friction question.
3. For cold email: length must be 60-100 words. At most 1 transparent URL. No spam words, no fake urgency, no guarantees.
4. Channel: ${params.channel}.
`;

  const prompt = `
Business: ${params.businessName}
Industry: ${params.industry}
City: ${params.city || 'Local area'}
Verified Evidence:
${params.evidence.map((e) => `- ${e.summary}`).join('\n')}
Offer: ${params.offerName} ($${params.offerPriceUsd}, ${params.offerTimelineDays} days)

Generate a pitch. If email, format as:
Subject: <subject line>
Body:
<email body>
`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim(),
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\n${prompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      // Fallback to deterministic template on API failure
      return generateDeterministicPitch(params);
    }

    const data = await res.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!textOutput) {
      return generateDeterministicPitch(params);
    }

    if (params.channel === 'email') {
      const subjectMatch = textOutput.match(/Subject:\s*(.+)/i);
      const subject = subjectMatch ? subjectMatch[1].trim() : `Question regarding ${params.businessName}`;
      const body = textOutput.replace(/Subject:\s*.+\n+/i, '').replace(/Body:\s*/i, '').trim();
      return { subject, body, provider: 'gemini', modelUsed: model };
    }

    return { body: textOutput.trim(), provider: 'gemini', modelUsed: model };
  } catch {
    return generateDeterministicPitch(params);
  } finally {
    clearTimeout(timer);
  }
}
