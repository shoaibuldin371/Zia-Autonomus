# Engineering Decisions Log

This document records architectural, security, and operational decisions made during development and diagnosis.

## Decision 001: Fail-Closed Security & No Demo Data in Production
- **Date**: 2026-11-14
- **Decision**: Production routes must fail closed when credentials or database connections are absent. No dummy/mock provider fallbacks in production.

## Decision 002: Strict Email Domain Requirement for Outreach Drafts
- **Date**: 2026-11-14
- **Decision**: Businesses discovered on Google Maps without independent website domains (e.g., having only Facebook, Instagram, or no URL) must NOT generate email drafts to dummy addresses (e.g., `inquiry@facebook.com`). They are classified as local phone/call leads under `Local Business Contacts`.

## Decision 003: Authorization Header Tolerance for External Cron Pinger
- **Date**: 2026-11-14
- **Decision**: Support both `Bearer <token>` and raw `<token>` in `cron-guard.ts` constant-time verification to prevent third-party pingers (like cron-job.org) from failing if the `Bearer ` prefix is omitted by the operator in the UI header field.

## Decision 004: Diagnosing Email Dispatch Failures (Stage R0)
- **Date**: 2026-11-15
- **Decision**: Execute a comprehensive trace of all 11 stages of the email sending pipeline (Lead verification, draft rules, send guard rules, business hours/timezone calculation, daily limits, cron/scheduler status, Google OAuth tokens, environment variables, Gmail API calls, Supabase database schema, and sender address verification).
