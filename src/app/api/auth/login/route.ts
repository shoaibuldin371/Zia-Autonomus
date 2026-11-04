import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  validateAdminCredentials,
} from '@/lib/security/auth-guard';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/security/session';

export const runtime = 'nodejs';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input format. Provide email and password.' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const rateLimitKey = `${ip}:${email.toLowerCase()}`;

    // Check rate limit before running credentials
    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      const minutesRemaining = rateCheck.lockoutExpiresAt
        ? Math.ceil((rateCheck.lockoutExpiresAt.getTime() - Date.now()) / 60000)
        : 15;
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Locked out for ${minutesRemaining} minute(s).`,
          locked: true,
          remainingAttempts: 0,
        },
        { status: 429 }
      );
    }

    // Verify admin credentials
    const authResult = validateAdminCredentials(email, password);
    if (!authResult.success) {
      const failedRate = recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        {
          error: authResult.error || 'Invalid credentials.',
          remainingAttempts: failedRate.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // Success - reset attempts and issue signed session
    resetRateLimit(rateLimitKey);
    const token = await createSessionToken(email.toLowerCase());

    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      success: true,
      email: email.toLowerCase(),
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal authentication error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
