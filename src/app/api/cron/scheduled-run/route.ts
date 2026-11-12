import { NextRequest, NextResponse } from 'next/server';
import { validateCronRequest } from '@/lib/security/cron-guard';
import { getDataStore, IDataStore } from '@/lib/supabase/data-store';
import { executeDiscoveryRun } from '@/services/scheduler/orchestrator';
import { isPhysicalMailingAddressValid } from '@/services/email/auto-send-guard';
import { scanHackerNews, scanRemotive } from '@/services/platforms/sources-scanner';
import { ScoredClientRequest } from '@/services/platforms/client-requests-service';
import { sendGmailMessage } from '@/services/email/gmail-sender';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds maxDuration for Vercel functions

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  // 1. Strict Fail-Closed Cron Authentication
  const validation = validateCronRequest(req);
  if (!validation.authorized) {
    return validation.response!;
  }

  const store = getDataStore();

  // 2. Distributed lock to prevent overlapping runs
  const lockAcquired = await store.acquireLock('scheduled_cron_run', 120);
  if (!lockAcquired) {
    return NextResponse.json(
      { status: 'skipped', reason: 'Another scheduler job is currently running (distributed lock active).' },
      { status: 409 }
    );
  }

  try {
    // 3. Take NEXT unsearched row from the database search_plan (NEVER hardcoded!)
    const nextTarget = await store.getNextSearchPlanRow();

    const city = nextTarget?.city || 'Manchester';
    const country = nextTarget?.country || 'UK';
    const industry = nextTarget?.industry || 'dentists';

    // 4. Execute Discovery (Local Business Contacts)
    const discoveryResult = await executeDiscoveryRun(
      {
        city,
        country,
        industry,
        maxLeads: 5,
        mode: 'find_and_draft',
      },
      store
    );

    // Update search plan record
    if (nextTarget) {
      await store.updateSearchPlanRow(nextTarget.id, {
        last_run_at: new Date().toISOString(),
        leads_found: (nextTarget.leads_found || 0) + discoveryResult.leadsCreated,
        status: 'completed',
      });
    }

    // 5. Evaluate Cold Email Status
    const dbAddress = await store.getSetting<string>('physical_mailing_address', '');
    const hasValidAddress = isPhysicalMailingAddressValid(dbAddress || process.env.PHYSICAL_MAILING_ADDRESS);

    const emailStatus = hasValidAddress
      ? { status: 'enabled', message: 'Cold email auto-send active with verified address.' }
      : {
          status: 'skipped',
          reason: 'Cold email is off until a mailing address is added (legal requirement). Platform messages, manual outreach and Client Requests work without it.',
        };

    // 6. Split Client Requests Source Scan (Isolated try/catch per source so a failure never fails the run)
    const sourceScanResults: Array<{
      source: string;
      status: string;
      count?: number;
      freelancerCount?: number;
      saved?: number;
      alerted?: number;
      error?: string;
    }> = [];

    try {
      const hnResult = await scanHackerNews(50);
      const { saved, alerted } = await processAndAlertClientRequests(hnResult.leads, store);
      sourceScanResults.push({
        source: 'Hacker News',
        status: 'completed',
        count: hnResult.leads.length,
        freelancerCount: hnResult.freelancerCount,
        saved,
        alerted,
      });
    } catch (hnErr) {
      console.warn('[Cron] Hacker News scan warning:', hnErr);
      sourceScanResults.push({
        source: 'Hacker News',
        status: 'skipped_or_failed',
        error: hnErr instanceof Error ? hnErr.message : String(hnErr),
      });
    }

    try {
      const remotiveResult = await scanRemotive(50);
      const { saved, alerted } = await processAndAlertClientRequests(remotiveResult, store);
      sourceScanResults.push({
        source: 'Remotive',
        status: 'completed',
        count: remotiveResult.length,
        saved,
        alerted,
      });
    } catch (remotiveErr) {
      console.warn('[Cron] Remotive scan warning:', remotiveErr);
      sourceScanResults.push({
        source: 'Remotive',
        status: 'skipped_or_failed',
        error: remotiveErr instanceof Error ? remotiveErr.message : String(remotiveErr),
      });
    }

    return NextResponse.json({
      success: true,
      executionTime: new Date().toISOString(),
      discovery: discoveryResult,
      emailStatus,
      clientRequestsScan: sourceScanResults,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  } finally {
    await store.releaseLock('scheduled_cron_run');
  }
}

/**
 * Checks newly discovered platform client requests, stores new ones,
 * and sends an immediate alert email to Zia Ul Din (ziauldin371@gmail.com).
 */
async function processAndAlertClientRequests(
  leads: ScoredClientRequest[],
  store: IDataStore
): Promise<{ saved: number; alerted: number }> {
  let saved = 0;
  let alerted = 0;

  for (const item of leads) {
    if (item.is_weak_evidence || item.match_score < 50) continue;

    try {
      // Check if lead already exists in DB
      const existing = await store.getClientRequestById(item.id);
      if (existing) continue;

      // Save newly found client request
      await store.saveClientRequest({
        id: item.id,
        source_platform: item.source_platform,
        source_url: item.source_url,
        post_url: item.post_url,
        quote: item.quote,
        need_summary: item.need_summary,
        match_score: item.match_score,
        service_fit: item.service_fit,
        status: item.status || 'new',
        person_name: item.person_name,
        company_name: item.company_name,
        platform_username: item.platform_username,
        platform_profile_url: item.platform_profile_url,
        budget: item.budget,
        found_at: item.found_at,
        evidence: [{ why_matched: item.why_matched, job_type: item.job_type, channels: item.channels }],
      });
      saved++;

      // Draft proposal snippet
      const proposal = `Hi there,\n\nI reviewed your request for ${item.service_fit}. I specialize in production AI systems, data pipelines, scrapers, and Next.js/TypeScript applications.\n\n- Scope: Concrete milestone delivery with clean modular code.\n- Timeline: Initial working milestone ready in 3-4 days.\n- Security: Strictly verified logic and fail-closed architecture.\n\nOpen to discussing specifics?\n\nBest regards,\nZia Ul Din\nData Science & AI Automation Specialist`;

      const alertBody = [
        `Assalam-o-Alaikum Zia,`,
        ``,
        `Growth System found a new project matching your skills:`,
        ``,
        `• Platform: ${item.source_platform}`,
        `• Client / Poster: ${item.company_name || item.person_name || item.platform_username || 'Public Client'}`,
        `• Match Score: ${item.match_score}/100 [${item.job_type.toUpperCase()}]`,
        `• Direct URL: ${item.post_url || item.source_url || 'N/A'}`,
        ``,
        `--- Client Need ---`,
        `${item.quote.slice(0, 400)}${item.quote.length > 400 ? '...' : ''}`,
        ``,
        `--- Why It Matches ---`,
        `${item.why_matched.join(', ')}`,
        ``,
        `--- Ready Proposal to Submit ---`,
        proposal,
        ``,
        `Review and manage all client requests:`,
        `https://zia-autonomus.vercel.app/requests`,
        ``,
        `— Growth System 24/7 Cloud Engine`,
      ].join('\n');

      try {
        await sendGmailMessage({
          to: 'ziauldin371@gmail.com',
          subject: `[Project Alert] ${item.source_platform}: ${item.company_name || item.service_fit} (${item.match_score}/100)`,
          bodyText: alertBody,
          idempotencyKey: `alert_${item.id}_${Date.now()}`,
        });
        alerted++;
      } catch (emailErr) {
        // If Gmail token needs reconnect or network error, don't crash cron
        console.warn(`[Cron Alert] Could not send email alert for ${item.id}:`, emailErr instanceof Error ? emailErr.message : emailErr);
      }
    } catch (saveErr) {
      console.warn(`[Cron] Error saving client request ${item.id}:`, saveErr);
    }
  }

  return { saved, alerted };
}
