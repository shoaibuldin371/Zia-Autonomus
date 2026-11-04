import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/supabase/data-store';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, channel, action, outcome, notes } = body;

    if (!businessId || !channel) {
      return NextResponse.json({ error: 'businessId and channel are required' }, { status: 400 });
    }

    const store = getDataStore();

    // 1. Record touch in touch_log
    await store.recordTouch({
      business_id: businessId,
      channel,
      operator_email: 'ziauldin371@gmail.com',
      action: action || 'manual_outreach',
      notes,
      touched_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Outreach touch logged. 72-hour cross-channel protection active.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to log touch';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
