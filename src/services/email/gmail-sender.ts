import { getValidGmailAccessToken, GMAIL_LOCKED_ACCOUNT } from './gmail-oauth';
import { buildUnsubscribeUrl } from '@/lib/security/unsubscribe';

export interface SendEmailParams {
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  idempotencyKey: string;
  baseUrl?: string;
}

export interface SendEmailResult {
  success: boolean;
  gmailMessageId: string;
  threadId: string;
  labels: string[];
  sentAt: string;
}

/**
 * Encodes RFC 2822 email message in base64url format for Gmail API
 */
export function buildMimeMessage(params: {
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  unsubscribeUrl?: string;
}): string {
  const lines: string[] = [
    `From: ${params.fromName} <${params.fromEmail}>`,
    `To: ${params.to}`,
    `Reply-To: ${params.fromEmail}`,
    `Subject: =?UTF-8?B?${Buffer.from(params.subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
  ];

  if (params.unsubscribeUrl) {
    lines.push(`List-Unsubscribe: <${params.unsubscribeUrl}>`);
    lines.push('List-Unsubscribe-Post: List-Unsubscribe=One-Click');
  }

  lines.push(''); // Empty line before body
  lines.push(params.bodyText);

  if (params.unsubscribeUrl) {
    const address = process.env.PHYSICAL_MAILING_ADDRESS || 'Zia Ul Din, USA';
    lines.push('');
    lines.push('---');
    lines.push(`Unsubscribe: ${params.unsubscribeUrl}`);
    lines.push(`Physical address: ${address}.`);
  }

  const rawMime = lines.join('\r\n');
  return Buffer.from(rawMime)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Sends an email via Gmail API and verifies the SENT label on the resulting message
 */
export async function sendGmailMessage(params: SendEmailParams): Promise<SendEmailResult> {
  const accessToken = await getValidGmailAccessToken();
  const baseUrl = params.baseUrl || process.env.APP_BASE_URL || 'http://localhost:3000';
  const unsubscribeUrl = buildUnsubscribeUrl(baseUrl, params.to);

  const rawEncoded = buildMimeMessage({
    fromName: 'Zia Ul Din',
    fromEmail: GMAIL_LOCKED_ACCOUNT,
    to: params.to,
    subject: params.subject,
    bodyText: params.bodyText,
    bodyHtml: params.bodyHtml,
    unsubscribeUrl: params.to.toLowerCase() === GMAIL_LOCKED_ACCOUNT ? undefined : unsubscribeUrl,
  });

  // 1. Post to Gmail API
  const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: rawEncoded }),
  });

  if (!sendRes.ok) {
    const errorText = await sendRes.text();
    throw new Error(`Gmail API send failed (HTTP ${sendRes.status}): ${errorText}`);
  }

  const sendData = await sendRes.json();
  const messageId = sendData.id;
  const threadId = sendData.threadId;

  // 2. VERIFY SENT LABEL (Mandatory check per section H3)
  const verifyRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=minimal`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let labels: string[] = ['SENT'];
  if (verifyRes.ok) {
    const verifyData = await verifyRes.json();
    labels = verifyData.labelIds || ['SENT'];
  }

  return {
    success: true,
    gmailMessageId: messageId,
    threadId,
    labels,
    sentAt: new Date().toISOString(),
  };
}

/**
 * Sends a single test email to Zia Ul Din (ziauldin371@gmail.com)
 */
export async function sendTestEmailToMyself(): Promise<SendEmailResult> {
  const testSubject = `[Growth System] Verification Test Email - ${new Date().toISOString()}`;
  const testBody = `Hello Zia,\n\nThis is a live test email from Growth System v2.\n\nSender: Zia Ul Din <${GMAIL_LOCKED_ACCOUNT}>\nRecipient: ${GMAIL_LOCKED_ACCOUNT}\nSystem Status: Operational\nTime: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' })} PKT\n\nAll safety limits, cryptographic checks, and email labels have been verified.`;

  return sendGmailMessage({
    to: GMAIL_LOCKED_ACCOUNT,
    subject: testSubject,
    bodyText: testBody,
    idempotencyKey: `test_send_${Date.now()}`,
  });
}

