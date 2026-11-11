import { NextRequest, NextResponse } from 'next/server';
import { validateCronRequest } from '@/lib/security/cron-guard';
import { getDataStore } from '@/lib/supabase/data-store';
import { executeDiscoveryRun } from '@/services/scheduler/orchestrator';
import { isPhysicalMailingAddressValid } from '@/services/email/auto-send-guard';
import { scanHackerNews, scanRemotive } from '@/services/platforms/sources-scanner';

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
    const sourceScanResults: Array<{ source: string; status: string; count?: number; freelancerCount?: number; error?: string }> = [];

    try {
      const hnResult = await scanHackerNews(50);
      sourceScanResults.push({
        source: 'Hacker News',
        status: 'completed',
        count: hnResult.leads.length,
        freelancerCount: hnResult.freelancerCount,
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
      sourceScanResults.push({
        source: 'Remotive',
        status: 'completed',
        count: remotiveResult.length,
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
