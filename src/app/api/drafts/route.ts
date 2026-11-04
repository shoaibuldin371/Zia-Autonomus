import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/supabase/data-store';
import { sendGmailMessage } from '@/services/email/gmail-sender';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || undefined;
    const store = getDataStore();
    const drafts = await store.getDrafts(status);

    return NextResponse.json({ drafts });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch drafts';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, draftId } = await req.json();
    const store = getDataStore();

    if (!draftId) {
      return NextResponse.json({ error: 'draftId is required' }, { status: 400 });
    }

    const draft = await store.getDraftById(draftId);
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    if (action === 'approve_and_send') {
      // Send directly via Gmail
      const result = await sendGmailMessage({
        to: draft.recipient_email,
        subject: draft.subject,
        bodyText: draft.body_text,
        idempotencyKey: `send_${draft.id}_${Date.now()}`,
      });

      await store.updateDraftStatus(draft.id, 'sent');
      await store.saveSendLog({
        id: `send_${Date.now()}`,
        business_id: draft.business_id,
        draft_id: draft.id,
        recipient_email: draft.recipient_email,
        sender_email: 'ziauldin371@gmail.com',
        subject: draft.subject,
        gmail_message_id: result.gmailMessageId,
        thread_id: result.threadId,
        labels: result.labels,
        idempotency_key: `send_${draft.id}`,
        status: 'delivered',
        sent_at: result.sentAt,
      });

      // Record touch in touch_log for 72h protection
      await store.recordTouch({
        business_id: draft.business_id,
        channel: 'email',
        operator_email: 'ziauldin371@gmail.com',
        action: 'sent_approved_email',
        touched_at: result.sentAt,
      });

      return NextResponse.json({ success: true, message: 'Email sent and logged successfully.' });
    }

    if (action === 'reject') {
      await store.updateDraftStatus(draft.id, 'rejected');
      return NextResponse.json({ success: true, message: 'Draft rejected.' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Draft action failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

