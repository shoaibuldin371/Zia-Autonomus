import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/supabase/data-store';

export const runtime = 'nodejs';

export async function GET() {
  const store = getDataStore();
  const active = await store.getSetting<boolean>('emergency_stop', false);
  return NextResponse.json({ active });
}

export async function POST(req: NextRequest) {
  try {
    const { active } = await req.json();
    const store = getDataStore();
    await store.updateSetting('emergency_stop', Boolean(active));
    return NextResponse.json({ success: true, active: Boolean(active) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update emergency stop';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
