import { NextRequest, NextResponse } from 'next/server';
import { handleGoogleOAuthCallback } from '@/services/email/gmail-oauth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    const origin = req.nextUrl.origin || process.env.APP_BASE_URL || 'https://zia-autonomus.vercel.app';

    if (error) {
      return NextResponse.redirect(`${origin}/setup?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return NextResponse.redirect(`${origin}/setup?error=missing_auth_code`);
    }

    await handleGoogleOAuthCallback(code, origin);

    return NextResponse.redirect(`${origin}/setup?gmail=connected`);
  } catch (err: unknown) {
    const origin = req.nextUrl.origin || process.env.APP_BASE_URL || 'https://zia-autonomus.vercel.app';
    const msg = err instanceof Error ? err.message : 'Google OAuth authorization failed';
    return NextResponse.redirect(`${origin}/setup?error=${encodeURIComponent(msg)}`);
  }
}
