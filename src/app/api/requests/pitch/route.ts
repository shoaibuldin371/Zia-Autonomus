import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/supabase/data-store';
import { generatePitchWithGemini } from '@/services/pitch/gemini-client';
import { processClientRequestItem } from '@/services/platforms/client-requests-service';

export const runtime = 'nodejs';

// In-memory cache for fast popup retrieval
const pitchCache = new Map<string, string>();

export async function POST(req: NextRequest) {
  try {
    const { requestId, quote, jobType, serviceFit, platform, regenerate } = await req.json();

    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    // Check cache first if not explicitly regenerating
    if (!regenerate && pitchCache.has(requestId)) {
      return NextResponse.json({
        success: true,
        pitch: pitchCache.get(requestId),
        cached: true,
      });
    }

    // Check database
    const store = getDataStore();
    const existing = await store.getClientRequestById(requestId);
    if (existing) {
      const item = processClientRequestItem({
        id: existing.id,
        source_platform: existing.source_platform,
        quote: existing.quote || undefined,
        company_name: existing.company_name,
        budget: existing.budget,
      });

      // Guard: No Gemini calls for hidden or below-threshold leads
      if (item.is_hidden || item.match_score < 50) {
        return NextResponse.json({
          success: false,
          notFit: true,
          message: 'Not a good fit for a pitch (below quality threshold or enterprise full-time).',
        });
      }

      // If full-time posting, pitch must state contract basis or not a fit
      if (item.job_type === 'full_time') {
        const contractPitch = `Hi there,\n\nI reviewed your post regarding ${item.company_name || 'your team'}'s engineering needs. While this is listed as full-time, I am an experienced full-stack and AI developer who can support your team immediately on an interim contract or milestone basis to build out your core requirements without the delay of a long hiring cycle.\n\nMy verified production track record:\n- Built the frontend and risk evidence engine for WellPredict (UK workforce risk SaaS) in Next.js & TypeScript.\n- Engineered real-time messaging, LiveKit audio/video, and Redis architecture for PI Chat.\n- Deployed production AI agents & n8n/FastAPI pipelines with 30%+ efficiency gains.\n\nIf you have immediate deliverables that need high-velocity execution, I'd be glad to review the technical scope.\n\nBest regards,\nZia Ul Din`;
        pitchCache.set(requestId, contractPitch);
        return NextResponse.json({ success: true, pitch: contractPitch, cached: false });
      }

      // Generate bespoke project proposal
      const pitchResult = await generatePitchWithGemini({
        businessName: existing.company_name || existing.platform_username || 'Client',
        industry: item.service_fit,
        city: 'Remote',
        evidence: [
          {
            business_id: existing.id,
            source_name: existing.source_platform,
            summary: item.quote,
            evidence_type: 'client_request',
            is_factual: true,
          },
        ],
        offerName: item.service_fit,
        offerPriceUsd: 1500,
        offerTimelineDays: 5,
        channel: 'email',
      });

      const finalPitch = pitchResult.body;
      pitchCache.set(requestId, finalPitch);

      return NextResponse.json({
        success: true,
        pitch: finalPitch,
        cached: false,
      });
    }

    // Fallback for pasted/dynamic post
    const defaultPitch = `Hi there,\n\nI noticed your post regarding ${serviceFit || 'software development'} on ${platform || 'platform'}.\n\nI am a Lead Full-Stack & AI developer (Next.js, TypeScript, FastAPI, PostgreSQL, and workflow automations). Recent verified deliverables:\n- Rebuilt UK SaaS WellPredict in Next.js, TypeScript, and Tailwind CSS.\n- Built real-time collaboration platform PI Chat with Redis and LiveKit voice/video.\n- Engineered n8n & Python pipelines that automated complex workflows by 80%.\n\nAvailable immediately for milestone-based delivery with documented code and escrow safety.\n\nBest regards,\nZia Ul Din`;
    pitchCache.set(requestId, defaultPitch);

    return NextResponse.json({ success: true, pitch: defaultPitch, cached: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate pitch';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
