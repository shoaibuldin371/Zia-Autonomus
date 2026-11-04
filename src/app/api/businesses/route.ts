import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/supabase/data-store';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const filter = url.searchParams.get('filter') || 'all';
    const city = url.searchParams.get('city') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    const store = getDataStore();
    const businesses = await store.getBusinesses({ filter, city, limit });

    return NextResponse.json({ businesses });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch businesses';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
