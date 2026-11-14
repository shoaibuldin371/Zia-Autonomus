import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuthUrl } from '@/services/email/gmail-oauth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const origin = req.nextUrl.origin || process.env.APP_BASE_URL || 'https://zia-autonomus.vercel.app';
    const authUrl = getGoogleOAuthUrl(origin);
    return NextResponse.redirect(authUrl);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate Google OAuth URL';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
