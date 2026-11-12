# ANTIGRAVITY V3 CONSTITUTION & CORE SPECIFICATION

## Project Identity & Inviolable Directives

- **Operator:** Zia Ul Din, Pakistan (`Asia/Karachi` timezone).
- **Authorized Login & Gmail Account:** `ziauldin371@gmail.com` exclusively.
- **Sole Commercial Expertise:** Data Science, ML, LLM Chatbots, Data Pipelines, Web Scrapers, and Analytics Dashboards. *Nothing else is sold.*
- **Technology Stack:**
  - **Frontend:** Next.js 14 App Router, React 18, TypeScript (strict mode), Tailwind CSS (derived from Stitch UI design specifications).
  - **Backend:** Next.js Route Handlers (`nodejs` runtime). No standalone Express server.
  - **Database:** Supabase PostgreSQL with strict Row Level Security (RLS) on all tables.
  - **Outreach & Communication:** Official Google Gmail API with OAuth 2.0 (no App Password / IMAP).
  - **Artificial Intelligence:** Google Gemini API (`GEMINI_MODEL` configured via environment variable).
  - **Hosting Infrastructure:** 100% cloud-hosted on Vercel, Supabase, and GitHub. External pinger (e.g. `cron-job.org`) is authorized exclusively to trigger Bearer-authenticated cron endpoints.
- **Production Data Rule:** Zero demo data and zero mock providers in production. Pure empty states with typed indicators only.

---

## Constitution Rules

### Rule 1: No Invented Claims
1. Facts about Zia Ul Din (years of experience, technical results, tools, historical deliverables, client cases) exist solely in the `verified_facts` table (editable in Settings), each containing a verifiable evidence URL and an `is_enabled` flag.
2. A fact without supporting evidence is never referenced or used in any pitch or proposal.
3. Every factual sentence about a target business must be backed by an immutable stored evidence record (`source_name`, `source_url`, `captured_at`).

### Rule 2: No Demo Data & No Mock Providers in Production
1. In production, missing API keys, unreachable database connections, or expired credentials halt the affected pipeline with a clear diagnostic message and trigger an operator alert.
2. The application never falls back silently to mock data or simulated responses in production.

### Rule 3: Fail-Closed Security
1. Secrets reside exclusively in environment variables; they are never printed, logged, returned in API payloads, or committed to source control.
2. All dashboard routes, private views, and mutating API endpoints verify a cryptographically signed HS256 JWT session cookie server-side.
3. Forged, altered, or expired session cookies are unconditionally rejected.

### Rule 4: Never Stop Silently
1. Any pipeline pause, system failure, revoked OAuth token, rate-limit threshold, or skipped execution writes an audit log entry to `system_events`.
2. Critical events immediately surface a prominent red banner on the dashboard and dispatch an email alert and optional Telegram notification detailing the root cause and providing a secure one-click resume link.

### Rule 5: Honest Communication & Delivery Wording
1. Forbidden marketing terms are banned from the codebase: `"inbox guaranteed"`, `"spam safe"`, `"primary inbox"`, `"100% delivery"`, `"guaranteed results"`, open tracking, click tracking.
2. Outbound delivery status states are limited to:
   - `Sent` (strictly confirmed via Gmail API `messageId` and verified `SENT` label)
   - `Reply received`
   - `Bounced`
   - `Unsubscribed`
   - `Not measured`
3. The UI explicitly states: *"Inbox placement cannot be guaranteed by any sender."*

### Rule 6: Regulatory Compliance & Safe Outreach
1. Electronic mail is sent only to verified corporate email addresses obtained from documented public sources. Never personal email addresses; never addresses harvested from platform members.
2. Sole traders and individual consumer entities in the UK are excluded under PECR / GDPR regulations.
3. Every email includes a functional one-click unsubscribe mechanism, standard `List-Unsubscribe` headers (with HMAC verification), automatic suppression enforcement, and a verified physical mailing address in the footer.
4. A mandatory minimum 72-hour quiet gap is enforced across all channels before any follow-up touch to the same business entity.

### Rule 7: Manual Action for Platform Proposals
1. The system never logs in to, posts on, bids on, applies to, or sends messages through third-party freelance or project platforms (such as Toptal, Catalant, Contra, Upwork, Freelancer).
2. The platform engine discovers, ingests, scores, and prepares tailored proposals; operator Zia Ul Din reviews, copies, and manually submits every proposal.

### Rule 8: Short Serverless Runs (<8 Seconds)
1. Every scheduled cron job and push webhook execution must complete within 8 seconds by processing small deterministic batches, saving incremental checkpoints in PostgreSQL, and cleanly resuming on the next invocation.
2. Overlapping executions are prevented using PostgreSQL distributed locks with TTL expiration.

### Rule 9: Testing Honesty & Transparent Reporting
1. All stage reports must strictly differentiate between:
   - Unit-tested
   - Integration-tested
   - E2E-tested
   - Live-verified
   - Simulated
   - Not verified
2. The claim "Works" is permissible only when verified against a live, running server instance.
