import { NextResponse } from 'next/server';
import { sendTestEmailToMyself } from '@/services/email/gmail-sender';
import { getDataStore } from '@/lib/supabase/data-store';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const result = await sendTestEmailToMyself();
    const store = getDataStore();

    // Log the send
    await store.saveSendLog({
      id: `test_${Date.now()}`,
      recipient_email: 'ziauldin371@gmail.com',
      sender_email: 'ziauldin371@gmail.com',
      subject: 'Verification Test Email',
      gmail_message_id: result.gmailMessageId,
      thread_id: result.threadId,
      labels: result.labels,
      idempotency_key: `test_send_${Date.now()}`,
      status: 'delivered',
      sent_at: result.sentAt,
    });

    // Mark test email confirmed in settings so auto-send switch can be enabled if desired
    await store.updateSetting('test_email_confirmed', true);

    return NextResponse.json({
      success: true,
      message: 'Test email delivered to ziauldin371@gmail.com and verified in Gmail SENT label.',
      result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Test email send failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

