import { NextRequest, NextResponse } from 'next/server';
import { validateCronRequest } from '@/lib/security/cron-guard';
import { getDataStore } from '@/lib/supabase/data-store';
import { executeDiscoveryRun } from '@/services/scheduler/orchestrator';

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

    // 4. Execute Discovery
    const result = await executeDiscoveryRun(
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
        leads_found: (nextTarget.leads_found || 0) + result.leadsCreated,
        status: 'completed',
      });
    }

    return NextResponse.json({
      success: true,
      executionTime: new Date().toISOString(),
      result,
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
