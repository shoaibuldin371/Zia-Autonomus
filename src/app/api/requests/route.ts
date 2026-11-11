import { NextRequest, NextResponse } from 'next/server';
import { classifyClientRequest } from '@/services/platforms/client-request-classifier';
import { getDataStore } from '@/lib/supabase/data-store';
import { processClientRequestItem, ScoredClientRequest } from '@/services/platforms/client-requests-service';
import { scanSingleSource } from '@/services/platforms/sources-scanner';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all'; // 'all', 'contract', 'strong', 'show_fulltime'
    const source = searchParams.get('source') || undefined;

    const store = getDataStore();
    const rawRequests = await store.getClientRequests({ limit: 100 });

    // Process & rescore all items with nuanced rules
    const processed: ScoredClientRequest[] = rawRequests.map((r: any) => {
      const item = processClientRequestItem({
        id: r.id,
        source_platform: r.source_platform,
        source_url: r.source_url || r.post_url,
        post_url: r.post_url || r.source_url,
        quote: r.quote,
        company_name: r.company_name,
        person_name: r.person_name,
        platform_username: r.platform_username,
        platform_profile_url: r.platform_profile_url,
        budget: r.budget,
        found_at: r.found_at,
      });

      if (r.status === 'archived' || r.status === 'contacted') {
        item.status = r.status;
      }
      return item;
    });

    // Sort: contract/freelance first, then descending by match_score
    processed.sort((a, b) => {
      const aIsContract = a.job_type === 'contract' || a.job_type === 'freelance' ? 1 : 0;
      const bIsContract = b.job_type === 'contract' || b.job_type === 'freelance' ? 1 : 0;
      if (aIsContract !== bIsContract) return bIsContract - aIsContract;
      return b.match_score - a.match_score;
    });

    // Compute stats
    const totalCount = processed.length;
    const strongCount = processed.filter(r => r.is_strong).length;
    const contractCount = processed.filter(r => r.job_type === 'contract' || r.job_type === 'freelance').length;
    const enterpriseCount = processed.filter(r => r.is_enterprise_full_time).length;
    const weakEvidenceCount = processed.filter(r => r.is_weak_evidence).length;

    // Apply view filters
    let visible = processed;
    if (filter === 'contract') {
      visible = processed.filter(r => (r.job_type === 'contract' || r.job_type === 'freelance') && !r.is_weak_evidence);
    } else if (filter === 'strong') {
      visible = processed.filter(r => r.is_strong);
    } else if (filter !== 'show_fulltime') {
      // Default view: hide enterprise full-time and weak evidence by default
      visible = processed.filter(r => !r.is_enterprise_full_time && !r.is_weak_evidence);
    }

    if (source) {
      visible = visible.filter(r => r.source_platform.toLowerCase().includes(source.toLowerCase()));
    }

    // Source health list per Part 1
    const sourceHealth = [
      { name: 'Hacker News (Freelancer & Hiring)', type: 'Automatic', status: 'Active', frequency: 'Hourly scan' },
      { name: 'Remotive Remote Feeds', type: 'Automatic', status: 'Active', frequency: 'Hourly scan' },
      { name: 'We Work Remotely Feeds', type: 'Automatic', status: 'Active', frequency: '2x Daily' },
      { name: 'Wellfound', type: 'Manual capture', status: 'Ready for paste', frequency: 'On-demand' },
      { name: 'Contra', type: 'Manual capture', status: 'Ready for paste', frequency: 'On-demand' },
      { name: 'Catalant', type: 'Manual capture', status: 'Ready for paste', frequency: 'On-demand' },
      { name: 'Toptal', type: 'Manual capture', status: 'Ready for paste', frequency: 'On-demand' },
      { name: 'Braintrust', type: 'Manual capture', status: 'Ready for paste', frequency: 'On-demand' },
      { name: 'Arc & Turing', type: 'Manual capture', status: 'Ready for paste', frequency: 'On-demand' },
      { name: 'Malt & Freelancer', type: 'Manual capture', status: 'Ready for paste', frequency: 'On-demand' },
      { name: 'Upwork', type: 'Manual capture', status: 'Ready for paste', frequency: 'On-demand' },
    ];

    return NextResponse.json({
      requests: visible,
      stats: {
        total: totalCount,
        strongMatches: strongCount,
        contractFreelance: contractCount,
        enterpriseFullTime: enterpriseCount,
        weakEvidence: weakEvidenceCount,
      },
      sourceHealth,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch client requests';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Action: Scan specific source
    if (body.action === 'scan_source') {
      const sourceName = body.source || 'hacker_news';
      const scanResult = await scanSingleSource(sourceName);
      const store = getDataStore();

      let savedCount = 0;
      for (const item of scanResult.leads) {
        if (!item.is_weak_evidence && item.match_score >= 50) {
          try {
            await store.saveClientRequest({
              id: item.id,
              source_platform: item.source_platform,
              source_url: item.source_url,
              post_url: item.post_url,
              quote: item.quote,
              need_summary: item.need_summary,
              match_score: item.match_score,
              service_fit: item.service_fit,
              status: item.status,
              person_name: item.person_name,
              company_name: item.company_name,
              platform_username: item.platform_username,
              platform_profile_url: item.platform_profile_url,
              budget: item.budget,
              found_at: item.found_at,
              evidence: [{ why_matched: item.why_matched, job_type: item.job_type, channels: item.channels }],
            });
            savedCount++;
          } catch {
            // Ignore duplicate IDs
          }
        }
      }

      return NextResponse.json({
        success: true,
        source: sourceName,
        scanned: scanResult.leads.length,
        saved: savedCount,
        freelancerCount: scanResult.freelancerCount,
      });
    }

    // 2. Action: Analyze pasted post
    const { postContent, platformName, username } = body;
    if (!postContent || postContent.trim().length === 0) {
      return NextResponse.json({ error: 'postContent is required' }, { status: 400 });
    }

    const classification = classifyClientRequest(postContent);
    const item = processClientRequestItem({
      source_platform: platformName || 'Manual Capture',
      quote: postContent,
      platform_username: username || 'Not shown',
    });

    const proposal = `Hi there,\n\nI reviewed your request for ${item.service_fit} work. Based specifically on your requirements:\n\n1. Scope & Architecture: I specialize in production Next.js, TypeScript, and AI agent architectures with clean database persistence.\n2. Timeline & Delivery: I deliver concrete milestones with zero fluff. Low-risk initial phase can be ready in 3-4 days.\n3. Transparent Terms: All payments remain strictly on-platform in escrow with documented source code.\n\nWould you be open to a 5-minute technical alignment to review code samples?\n\nBest regards,\nZia Ul Din\nFull-Stack AI Developer & Automation Architect`;

    return NextResponse.json({
      success: true,
      classification,
      processedItem: item,
      generatedProposal: proposal,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to process request';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
