import { NextResponse } from 'next/server';
import { checkGmailHealth } from '@/services/email/gmail-oauth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const health = await checkGmailHealth();
    const mailingAddress = process.env.PHYSICAL_MAILING_ADDRESS;
    const hasMailingAddress = Boolean(mailingAddress && mailingAddress.trim().length > 5 && !mailingAddress.includes('123 Innovation'));

    return NextResponse.json({
      ...health,
      hasMailingAddress,
      mailingAddress: hasMailingAddress ? mailingAddress : null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to check email status';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
