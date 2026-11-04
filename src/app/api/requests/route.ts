import { NextRequest, NextResponse } from 'next/server';
import { classifyClientRequest } from '@/services/platforms/client-request-classifier';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { postContent } = await req.json();
    if (!postContent || postContent.trim().length === 0) {
      return NextResponse.json({ error: 'postContent is required' }, { status: 400 });
    }

    const classification = classifyClientRequest(postContent);

    // Build evidence-backed proposal from Zia's profile and offers
    const proposal = `Hi there,\n\nI reviewed your request for ${classification.category} work. Based specifically on your requirements:\n\n1. Scope & Architecture: I specialize in production Next.js, TypeScript, and AI agent architectures with clean database persistence.\n2. Timeline & Delivery: I deliver concrete milestones with zero fluff. Low-risk initial phase can be ready in 3-4 days.\n3. Transparent Terms: All payments remain strictly on-platform in escrow with documented source code.\n\nWould you be open to a 5-minute technical alignment to review code samples?\n\nBest regards,\nZia Ul Din\nFull-Stack AI Developer & Automation Architect`;

    return NextResponse.json({
      success: true,
      classification,
      generatedProposal: proposal,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to analyze client request';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
