import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/supabase/data-store';

export const runtime = 'nodejs';

export async function GET() {
  const store = getDataStore();
  const dailyLimit = await store.getSetting<number>('daily_email_limit', 25);
  const spacingMinutes = await store.getSetting<number>('spacing_profile_minutes', 6);
  const envAutoSend = process.env.AUTO_SEND_ENABLED === 'true' || process.env.DEFAULT_SEND_MODE === 'auto';
  const autoSendEnabled = await store.getSetting<boolean>('auto_send_enabled', envAutoSend);
  const testConfirmed = await store.getSetting<boolean>('test_email_confirmed', true);

  return NextResponse.json({
    dailyLimit,
    spacingMinutes,
    autoSendEnabled,
    testConfirmed,
    hardCeiling: parseInt(process.env.HARD_DAILY_CEILING || '50', 10),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getDataStore();
    const hardCeiling = parseInt(process.env.HARD_DAILY_CEILING || '50', 10);

    if (typeof body.dailyLimit === 'number') {
      const clamped = Math.max(5, Math.min(body.dailyLimit, hardCeiling));
      await store.updateSetting('daily_email_limit', clamped);
    }

    if (typeof body.spacingMinutes === 'number') {
      const allowed = [4, 6, 10];
      const spacing = allowed.includes(body.spacingMinutes) ? body.spacingMinutes : 6;
      await store.updateSetting('spacing_profile_minutes', spacing);
    }

    if (typeof body.autoSendEnabled === 'boolean') {
      const testConfirmed = await store.getSetting<boolean>('test_email_confirmed', false);
      if (body.autoSendEnabled && !testConfirmed) {
        return NextResponse.json(
          { error: 'Cannot enable auto-send until a live test email to ziauldin371@gmail.com has been confirmed.' },
          { status: 400 }
        );
      }
      await store.updateSetting('auto_send_enabled', body.autoSendEnabled);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update safety limits';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

