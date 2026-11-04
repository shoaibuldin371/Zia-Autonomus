import { NextRequest, NextResponse } from 'next/server';
import { constantTimeCompare } from './auth-guard';

export interface CronValidationResult {
  authorized: boolean;
  response?: NextResponse;
}

/**
 * Validates incoming Vercel Cron requests.
 * - Fails with 503 if CRON_SECRET is not set in environment.
 * - Fails with 400 if secret is sent in URL query parameters.
 * - Fails with 401 if Authorization header is missing, malformed, or doesn't match CRON_SECRET.
 * - Uses constant-time compare. Never logs the secret value.
 */
export function validateCronRequest(req: NextRequest): CronValidationResult {
  // Reject query string secrets immediately
  const url = new URL(req.url);
  if (url.searchParams.has('secret') || url.searchParams.has('cron_secret') || url.searchParams.has('key')) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Query parameter authentication is forbidden. Use Bearer authorization header.' },
        { status: 400 }
      ),
    };
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.trim().length === 0) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'CRON_SECRET environment variable is not configured.' },
        { status: 503 }
      ),
    };
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Missing or invalid Authorization header. Expected Bearer token.' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.slice(7).trim();
  const isValid = constantTimeCompare(token, cronSecret.trim());

  if (!isValid) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Invalid cron authorization token.' },
        { status: 401 }
      ),
    };
  }

  return { authorized: true };
}

