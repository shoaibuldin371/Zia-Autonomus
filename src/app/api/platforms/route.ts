import { NextResponse } from 'next/server';
import { PLATFORMS_SEED } from '@/data/platforms-seed';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    total: PLATFORMS_SEED.length,
    platforms: PLATFORMS_SEED,
  });
}
