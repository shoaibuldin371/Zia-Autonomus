import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDataStore } from '@/lib/supabase/data-store';
import { executeDiscoveryRun } from '@/services/scheduler/orchestrator';

export const runtime = 'nodejs';
export const maxDuration = 60;

const RunNowSchema = z.object({
  city: z.string().min(1),
  country: z.string().min(1),
  industry: z.string().min(1),
  maxLeads: z.number().min(1).max(20).default(5),
  mode: z.enum(['find_only', 'find_and_draft']).default('find_and_draft'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RunNowSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input parameters' }, { status: 400 });
    }

    const store = getDataStore();
    const { city, country, industry, maxLeads, mode } = parsed.data;

    // Create background job record
    const job = await store.createJob('discovery_run', { city, country, industry, maxLeads, mode });

    // Execute run synchronously or backgrounded
    const summary = await executeDiscoveryRun(
      { city, country, industry, maxLeads, mode },
      store,
      job.id
    );

    await store.updateJob(job.id, {
      status: summary.status === 'failed' ? 'failed' : 'completed',
      progress_percentage: 100,
      summary_message: summary.message,
    });

    return NextResponse.json({
      success: summary.status !== 'failed',
      jobId: job.id,
      summary,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Discovery run execution failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
