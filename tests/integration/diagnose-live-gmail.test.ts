import fs from 'fs';

// Load .env.local into process.env for live diagnosis
if (fs.existsSync('.env.local')) {
  const envFile = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq !== -1) {
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[trimmed.slice(0, eq).trim()] = val;
    }
  }
}

import { describe, it, expect } from 'vitest';
import { getValidGmailAccessToken } from '@/services/email/gmail-oauth';
import { sendGmailMessage } from '@/services/email/gmail-sender';

describe('Live Gmail Dispatch Diagnosis', () => {
  it('attempts to refresh access token with real Google credentials', async () => {
    try {
      const token = await getValidGmailAccessToken();
      console.log('LIVE GMAIL TOKEN OBTAINED, length:', token.length);
      expect(token).toBeDefined();
    } catch (err: any) {
      console.log('LIVE GMAIL TOKEN REFRESH ERROR:', err.message);
      expect(err.message).toBeDefined();
    }
  }, 15000);

  it('attempts live test email dispatch via sendGmailMessage', async () => {
    try {
      const result = await sendGmailMessage({
        to: 'ziauldin371@gmail.com',
        subject: '[LIVE DIAGNOSIS] Growth System Verification',
        bodyText: 'This is a live diagnostic verification email from Zia Growth System to ziauldin371@gmail.com.',
        isAlertOrTest: true,
        idempotencyKey: `diag_test_${Date.now()}`,
      });
      console.log('LIVE TEST EMAIL DISPATCH SUCCESS:', result);
      expect(result.success).toBe(true);
    } catch (err: any) {
      console.log('LIVE TEST EMAIL DISPATCH ERROR:', err.message);
      expect(err.message).toBeDefined();
    }
  }, 15000);
});
