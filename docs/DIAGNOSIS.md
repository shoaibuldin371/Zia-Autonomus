# Comprehensive Email Sending Diagnosis (Stage R0)

**Project:** Growth System (Zia Ul Din - `ziauldin371@gmail.com`)  
**Date:** 2026-11-15  
**Diagnosis Mode:** LIVE Inspection & Integration Testing against Real Supabase & Google OAuth Services

---

## 1. Summary of Baseline Results

| Check | Tool / Command | Result | Details |
|---|---|---|---|
| Secrets Scan | `npm run secret-scan` | **PASS** | 0 secrets found in tracked code |
| Lint | `npm run lint` | **PASS** | 0 errors, 3 layout/react warnings |
| TypeScript | `npm run typecheck` | **PASS** | 0 errors (`tsc --noEmit`) |
| Unit Tests | `npm run test` | **PASS** | 13 test files, 61/61 tests passed |
| Production Build | `npm run build` | **PASS** | 35 static/dynamic pages compiled |

---

## 2. End-to-End Sending Chain Trace (Links a through k)

### a) Lead has a verified email?
- **Total businesses in DB:** 27 businesses.
- **Total contacts in DB:** 0 contacts.
- **Leads with verified email:** 0.
- **Status:** **BLOCKED** — Currently no businesses in the database have verified email contacts because previous dummy records (`inquiry@facebook.com`) were purged.

### b) Draft created & content linter?
- **Total drafts in DB:** 0 drafts.
- **Reason:** Purged all 27 invalid dummy drafts. New discovery run has not yet generated drafts with genuine verified domain emails.
- **Status:** **EMPTY STATE**

### c) Send guard: which rule blocks drafts?
- **Physical Mailing Address:** Fails closed. The DB setting is `"Zia Ul Din, USA"` and `.env.local` contains `"123 Innovation Way..."`, both of which are rejected by `isPhysicalMailingAddressValid`.
- **Verified Email check:** Fails closed (0 verified email leads in queue).
- **Status:** **BLOCKED**

### d) Business-hours window and timezone logic
- **Current Day/Time:** Sunday, Nov 15, 2026.
- **Evaluation:** `isWithinRecipientSendingWindow` returns `allowed: false` with reason: `"Sending is paused over the weekend in recipient local time (Sun)."`.
- **Status:** **WORKING AS DESIGNED** (Product / Constitution rule: Mon-Fri 09:00 - 17:30 in recipient local timezone; not a statutory GDPR/PECR mandate). Test emails to self are exempt.

### e) Daily limit value at runtime
- **Setting `daily_email_limit`:** 25.
- **Setting `hard_daily_ceiling`:** 50.
- **Emails sent today:** 0.
- **Status:** **HEALTHY** (Budget is not exhausted or zero).

### f) Queue and scheduler
- **Distributed Locks:** 0 active locks (no stuck locks).
- **cron-job.org:** Configured to ping `https://zia-autonomus.vercel.app/api/cron/scheduled-run` every 15 minutes.
- **Cron Guard:** Accepts both `Bearer <token>` and raw `<token>`.
- **Status:** **HEALTHY**

### g) Gmail OAuth status & token
- **Tokens in DB:** 1 token for `ziauldin371@gmail.com`.
- **Expiration:** Stored `expires_at` was `2026-11-02T11:52:54.441Z` (expired 13 days ago).
- **Google API Response:** Live call to `https://oauth2.googleapis.com/token` returned:
  `Gmail token refresh failed (invalid_grant). Please reconnect ziauldin371@gmail.com.`
- **Status:** **FATAL BLOCKER (EXPIRED/REVOKED)**

### h) Environment variables
- **Required & Present:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `ENCRYPTION_SECRET`, `UNSUBSCRIBE_SECRET`, `CRON_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- **Missing / Needs Real Value:** `PHYSICAL_MAILING_ADDRESS` (currently set to placeholder `123 Innovation Way...`).

### i) Send call
- **Live Test Call:** `sendGmailMessage` to `ziauldin371@gmail.com` halted before dispatch because `getValidGmailAccessToken()` threw `invalid_grant`.
- **Status:** **BLOCKED BY OAUTH REVOCATION**

### j) Database schema & RLS
- **Tables tested:** `businesses`, `drafts`, `contacts`, `oauth_tokens`, `settings`, `distributed_locks`, `send_log`, `platforms`, `evidence`.
- **Findings:** Service role key has full access. The send history table is named `send_log` in the database schema.
- **Status:** **HEALTHY**

### k) Sender address verification
- **Locked Account:** Strictly `ziauldin371@gmail.com` across all code and database records.
- **Other addresses in repo:** Design fixtures were cleaned up to `ziauldin371@gmail.com`. No unauthorized sender configured.

---

## 3. Ranked Root Causes (Classification Taxonomy)

### 1. CONFIRMED (live evidence): Google OAuth Refresh Token Revoked (`invalid_grant`)
* **Evidence:** Live integration test against Google's Token Endpoint (`https://oauth2.googleapis.com/token`) returned: `Gmail token refresh failed (invalid_grant)`. In Google Cloud Console, when an OAuth consent screen is in "Testing" mode, refresh tokens are revoked after exactly 7 days. Stored token in Supabase expired on November 2, 2026.
* **Impact:** 100% of emails (both cold outreach and test emails to yourself) fail immediately.
* **Fix Required:** 
  1. Operator visits `https://zia-autonomus.vercel.app/setup` and clicks **"Reconnect Gmail"**.
  2. In Google Cloud Console (`console.cloud.google.com`), set OAuth Consent Screen to **"In Production"** so refresh tokens remain permanent.

### 2. CODE-VERIFIED: Invalid / Placeholder Physical Mailing Address
* **Evidence:** `isPhysicalMailingAddressValid` in `src/services/email/auto-send-guard.ts` explicitly rejects `"Zia Ul Din, USA"` and `"123 Innovation Way..."`. Cold emails are halted by `evaluateAutoSendGuard` with the reason `"Cold email is off until a mailing address is added (legal requirement)"`.
* **Impact:** Cold outreach emails to prospective business leads are rejected by the safety guard.
* **Fix Required:** Operator configures a genuine physical mailing address in Settings (`physical_mailing_address`).

### 3. CONFIRMED (live evidence): Empty Draft Queue
* **Evidence:** Direct query to `drafts` table returned 0 rows.
* **Impact:** No emails are queued to be dispatched.
* **Fix Required:** Run discovery against businesses with genuine websites to populate real drafts.

### 4. CODE-VERIFIED: Weekend Sending Pause
* **Evidence:** `isWithinRecipientSendingWindow` in `src/services/contact/contact-strategy.ts` returns `allowed: false` on `Sat` and `Sun`.
* **Nature:** This is a **product / constitution design decision** (business-hours respect), **NOT** a statutory requirement of GDPR or PECR (which regulate lawful basis and consent rather than days of the week).
* **Fix Required:** None. Working as designed.

### 5. SUSPECTED: Places & Gemini API Key Runtime Availability
* **Evidence:** `GOOGLE_PLACES_API_KEY` and `GEMINI_API_KEY` are not set in local `.env.local` (discovery uses seed directory fallback locally).
* **Fix Required:** Confirm whether keys are configured directly in Vercel Production Environment Settings.
