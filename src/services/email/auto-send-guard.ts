import { IDataStore } from '@/lib/supabase/data-store';
import { isWithinRecipientSendingWindow, isUKSoleTraderExclusion } from '../contact/contact-strategy';
import { lintPitch } from '../pitch/pitch-linter';
import { verifyDraftClaims } from '../pitch/claim-checker';

export interface GuardEvaluation {
  allowed: boolean;
  reasons: string[];
  passedChecks: string[];
}

export interface GuardContext {
  businessId: string;
  businessName: string;
  recipientEmail: string;
  country: string;
  city?: string | null;
  companyType?: string | null;
  pitchSubject: string;
  pitchBody: string;
  hasVerifiedEmail: boolean;
}

export async function evaluateAutoSendGuard(
  ctx: GuardContext,
  store: IDataStore
): Promise<GuardEvaluation> {
  const reasons: string[] = [];
  const passedChecks: string[] = [];

  // 1. Emergency Stop Check
  const emergencyStop = await store.getSetting<boolean>('emergency_stop', false);
  if (emergencyStop) {
    reasons.push('Emergency Stop is currently active. All sending is suspended.');
  } else {
    passedChecks.push('Emergency Stop inactive');
  }

  // 2. Verified Email
  if (!ctx.recipientEmail || !ctx.recipientEmail.includes('@') || !ctx.hasVerifiedEmail) {
    reasons.push('Recipient email address is unverified.');
  } else {
    passedChecks.push('Verified email address confirmed');
  }

  // 3. Suppression List
  const suppressed = await store.isSuppressed(ctx.recipientEmail);
  if (suppressed) {
    reasons.push(`Recipient ${ctx.recipientEmail} is on the global suppression list.`);
  } else {
    passedChecks.push('Suppression check clean');
  }

  // 4. UK Sole Trader Exclusion (PECR / GDPR)
  const isSoleTrader = isUKSoleTraderExclusion(ctx.businessName, ctx.country, ctx.companyType);
  if (isSoleTrader) {
    reasons.push('UK Sole Trader / Individual exclusion policy (PECR/GDPR requires prior consent).');
  } else {
    passedChecks.push('Corporate entity PECR check passed');
  }

  // 5. Evidence Freshness (within 48 hours)
  const evidenceList = await store.getEvidence(ctx.businessId);
  if (evidenceList.length === 0) {
    reasons.push('No stored evidence found for business.');
  } else {
    const freshest = evidenceList.reduce((acc, curr) => {
      const t = new Date(curr.captured_at || 0).getTime();
      return t > acc ? t : acc;
    }, 0);
    const ageHours = (Date.now() - freshest) / (3600 * 1000);
    if (ageHours > 48) {
      reasons.push(`Stored evidence is ${Math.round(ageHours)} hours old (exceeds 48h freshness threshold).`);
    } else {
      passedChecks.push('Evidence fresh within 48 hours');
    }
  }

  // 6. Claim Check
  const claimResult = verifyDraftClaims(ctx.pitchBody, evidenceList);
  if (!claimResult.passed) {
    reasons.push(`Unverified claims detected in pitch: ${claimResult.unsupportedClaims.join('; ')}`);
  } else {
    passedChecks.push('Evidence claim verification passed');
  }

  // 7. Pitch Linter
  const lintResult = lintPitch(ctx.pitchBody, 'email');
  if (!lintResult.passed) {
    reasons.push(`Pitch linter failed: ${lintResult.errors.join('; ')}`);
  } else {
    passedChecks.push('Pitch linter passed');
  }

  // 8. Recipient Local Time Window (Mon-Fri 09:00 - 17:30)
  const windowCheck = isWithinRecipientSendingWindow(ctx.country, ctx.city);
  if (!windowCheck.allowed) {
    reasons.push(windowCheck.reason || 'Outside recipient local business hours.');
  } else {
    passedChecks.push(`Recipient window active (${windowCheck.localTime})`);
  }

  // 9. Daily Email Limit and Hard Ceiling
  const dailyLimit = await store.getSetting<number>('daily_email_limit', 25);
  const hardCeiling = parseInt(process.env.HARD_DAILY_CEILING || '50', 10);
  const effectiveCeiling = Math.min(dailyLimit, hardCeiling);

  const sendLogs = await store.getSendLogs(100);
  const todayDateStr = new Date().toISOString().split('T')[0];
  const sentTodayCount = sendLogs.filter((l) => l.sent_at?.startsWith(todayDateStr) && l.status === 'delivered').length;

  if (sentTodayCount >= effectiveCeiling) {
    reasons.push(`Daily send cap reached (${sentTodayCount}/${effectiveCeiling} emails sent today).`);
  } else {
    passedChecks.push(`Daily speed limit OK (${sentTodayCount}/${effectiveCeiling})`);
  }

  // 10. 72-Hour Cross-Channel Gap
  const hasTouch = await store.hasRecentTouch(ctx.businessId, 72);
  if (hasTouch) {
    reasons.push('Company was already contacted within the last 72 hours across channels.');
  } else {
    passedChecks.push('72-hour cross-channel gap verified');
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    passedChecks,
  };
}

