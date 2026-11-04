# Growth System v2

**Clean, Autonomous Intelligence & B2B Client Outreach Platform**  
*Custom-engineered exclusively for Zia Ul Din (Full-Stack AI Developer & Automation Architect, Karachi, PKT UTC+5)*

---

## 1. System Overview

Growth System v2 is a single-tenant, private automation tool built from scratch to identify high-probability client opportunities worldwide, audit technical and digital presence gaps using stored factual evidence, and draft tailored, low-friction technical proposals for operator approval.

### Two Core Engines
1. **Local Business Engine**: Discovers commercial businesses worldwide (US, UK, Canada, Australia, UAE, Europe) with missing websites, social-only profiles, or broken/slow mobile experiences.
2. **Platform Engine**: Monitors client acquisition channels across 89 platforms (marketplaces, vetted networks, lead databases, public job feeds, tender portals) plus a Hot Client Requests desk for classified, evidence-backed proposals.

---

## 2. Fixed Operator & Architectural Decisions

- **Single Operator:** Zia Ul Din (`ziauldin371@gmail.com`). Timezone: Asia/Karachi (PKT, UTC+5).
- **Sender & Recipient:** `ziauldin371@gmail.com` is locked as the sole outbound sender and test recipient.
- **Frontend:** Next.js 14 App Router, React 18, Tailwind CSS (Stitch dark-navy console tokens), Inter font, Material Symbols Outlined.
- **Backend:** Node-runtime Next.js Route Handlers (`export const runtime = 'nodejs'`) in the same repository. Edge runtime is restricted strictly to `middleware.ts` using `jose/jwt/verify`.
- **Database:** Supabase PostgreSQL with Row Level Security (RLS) and Supabase Realtime subscriptions.
- **Scheduler:** Vercel Cron (`0 4 * * *` and `0 12 * * *` UTC / 09:00 and 17:00 PKT) with constant-time Bearer header verification.

---

## 3. Five Rebuilt Stitch Screens

All five console screens are faithfully componentized in React with Tailwind CSS:
1. **Today (`/`):** Real-data greeting, system health status ("All systems calm"), 4 metrics (Found Today, Sent Safely, Hot Replies, Direct Contact), and Priority Review Queue.
2. **Found (`/businesses`):** Live Discovery Radar, filter chips (All, No Website, Broken/Slow, Needs AI), opportunity summaries, detail drawer, and Batch Outreach Queue modal.
3. **Emails (`/emails`):** Google OAuth sender status, review drafts queue with one-click approve/reject, and verified sent history.
4. **Manual (`/contact-manually`):** Direct phone & WhatsApp queue for businesses without public email, 30-second phone script with one-click copy, and 72-hour cross-channel touch logging.
5. **Safety & Rules (`/safety`):** Guardian Safety Shield, immediate Emergency Stop switch, 1-Click live test email to `ziauldin371@gmail.com`, speed limiters, and global suppression list.

---

## 4. Verification & Testing Evidence

- **Unit Tests:** 47 passing tests across 11 test suites covering JWT session signing, fail-closed auth, rate limiting, cron Bearer validation, SSRF URL isolation, AES-256-GCM encryption, HMAC unsubscribe tokens, scoring, claim checking, and linter.
- **Live Server Gate Audit:** 18/18 tests passed against the running production server (verifying forged cookie rejection, 307 redirects, 401 unauthenticated API blocks, 400 query-secret rejections, and HTML sanitization).
- **Playwright E2E Tests:** Passing end-to-end browser automation with real Chrome testing login validation, empty prefill enforcement, and public routing.
- **Honesty Grep Audit:** Zero instances of forbidden marketing phrases (`Primary Inbox`, `Spam Safe`, `Opened`, `Clicked`, `bypass`, `100% Perfect`).

---

## 5. Development & Deployment

```bash
# Typecheck
npm run typecheck

# Unit & Integration Tests
npm test

# Production Build
npm run build

# Start Production Server
npm start
```

