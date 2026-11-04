import { NextRequest, NextResponse } from 'next/server';
import { verifyUnsubscribeToken } from '@/lib/security/unsubscribe';

export const runtime = 'nodejs';

// Supports both GET (browser click) and POST (RFC 8058 List-Unsubscribe-Post)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const email = url.searchParams.get('email');
  const token = url.searchParams.get('token');

  if (!email || !token) {
    return new Response(
      `<html><body style="font-family:sans-serif;background:#051424;color:#d4e4fa;padding:40px;text-align:center;">
        <h2>Invalid Unsubscribe Request</h2>
        <p>The unsubscribe link is incomplete or missing required parameters.</p>
      </body></html>`,
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  const isValid = verifyUnsubscribeToken(email, token);
  if (!isValid) {
    return new Response(
      `<html><body style="font-family:sans-serif;background:#051424;color:#d4e4fa;padding:40px;text-align:center;">
        <h2>Verification Failed</h2>
        <p>The security token for this unsubscribe request is invalid or has expired.</p>
      </body></html>`,
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Record into suppression list (or in-memory mock until DB is attached)
  return new Response(
    `<html><body style="font-family:sans-serif;background:#051424;color:#d4e4fa;padding:40px;text-align:center;">
      <h2 style="color:#4ae176;">Unsubscribed Successfully</h2>
      <p><strong>${email}</strong> has been added to the global suppression list.</p>
      <p style="color:#908fa1;font-size:14px;">You will not receive any further communications from Zia Ul Din.</p>
    </body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const email = url.searchParams.get('email');
  const token = url.searchParams.get('token');

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return NextResponse.json({ error: 'Invalid or tampered unsubscribe token' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: `${email} has been unsubscribed and suppressed.`,
  });
}
