# Working Agreement: Growth System (Zia Ul Din)

This agreement governs all engineering work on the "Growth System" project for Zia Ul Din (Pakistan, Asia/Karachi, `ziauldin371@gmail.com`).

## 1. Inspect Before Changing
Record the baseline (what passes or fails) first. Never apply fixes without knowing current state.

## 2. Plan First
Write a short plan (files, risks, tests) before editing. If requirements conflict, stop and ask the operator.

## 3. Git Discipline
- Work on task-specific branches (e.g. `stage/r0-diagnose`).
- Small conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- No force-pushing.
- Tag before and after major stages/diagnoses (`r0-before`, `r0-after`).

## 4. Quality Gates
Lint, typecheck (`tsc --noEmit`), unit tests (`vitest run`), and Next.js production build (`next build`) must be green before reporting.

## 5. No Fake Success
Label every result honestly:
- **LIVE**: Verified against real Gmail API, Supabase Postgres, or live Vercel endpoint.
- **SIMULATED**: Tested via mocks, unit tests, or test harnesses.
If something is blocked (missing key, no credentials, revoked token), STOP and report the blocker immediately; never fall back silently to mock data in production.

## 6. No Invented Claims
Facts about Zia (experience, skills, tools, offerings) come ONLY from the verified facts repository / stored records with evidence. Every claim about a business must reference stored evidence.

## 7. Secrets Management
Secrets exist ONLY in environment variables.
- NEVER print, log, or commit secret values.
- Print variable NAMES only (e.g. `GMAIL_CLIENT_ID`, `CRON_SECRET`).
- Pre-commit secret scanning enforced.

## 8. Fail Visible (Never Stop Silently)
All errors, pauses, skipped runs, or delivery failures must write to `system_events`, trigger user-visible alerts, and never be swallowed silently in empty `catch` blocks.

## 9. Forbidden Terminology
Never use dishonest marketing wording:
- Forbidden: "inbox guaranteed", "spam safe", "primary inbox", "open tracking", "click tracking", "100% deliverability".
- Honest delivery statuses: Sent (confirmed with Gmail `messageId` and `SENT` label), Reply received, Bounced, Unsubscribed, Not measured.

## 10. Audit Log & Decisions
Any deviation, trade-off, or architectural choice must be documented in `docs/DECISIONS.md` with rationale.
