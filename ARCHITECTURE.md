# Architecture Specification: Growth System v2

## 1. System Topology

```
+---------------------------------------------------------------------------------+
| Vercel Cloud Platform (Serverless & Edge)                                       |
|                                                                                 |
|   +-------------------------------------------------------------------------+   |
|   | Edge Middleware (src/middleware.ts)                                      |   |
|   | - jose/jwt/verify (HS256 Session Signature Validation)                  |   |
|   | - Public Route Allowlist (/login, /privacy, /terms, /api/health)        |   |
|   | - Automatic 307 Redirects for Unauthenticated Web Navigation            |   |
|   | - 401 JSON for Unauthenticated API Calls                                |   |
|   +-------------------------------------------------------------------------+   |
|                                     |                                           |
|         +---------------------------+---------------------------+               |
|         |                                                       |               |
|         v                                                       v               |
|   +---------------------------------------+   +-----------------------------+   |
|   | Next.js App Router (UI Layer)         |   | Node Route Handlers (API)   |   |
|   | - Today Dashboard (/)                 |   | - /api/cron/scheduled-run   |   |
|   | - Live Discovery Radar (/businesses)  |   | - /api/discovery/run-now    |   |
|   | - Email Review & Sent Queue (/emails) |   | - /api/drafts               |   |
|   | - Direct Manual Outreach (/manual)    |   | - /api/emails/send-test     |   |
|   | - Guardian Safety Shield (/safety)    |   | - /api/safety/limits        |   |
|   | - Platform Engine (/platforms)        |   | - /api/requests             |   |
|   | - Search Plan (/search-plan)          |   | - /api/health               |   |
|   | - Setup & Diagnostics (/setup)        |   | - /api/compliance/unsub     |   |
|   +---------------------------------------+   +-----------------------------+   |
|                                                             |                   |
+-------------------------------------------------------------|-------------------+
                                                              |
                               +------------------------------+
                               |
                               v
+---------------------------------------------------------------------------------+
| External Service Integrations                                                   |
|                                                                                 |
|   +--------------------------+   +--------------------------+   +-------------+ |
|   | Supabase PostgreSQL (RLS)|   | Google Gmail API         |   | Google      | |
|   | - Service Role on Server |   | - Locked to:             |   | Places API  | |
|   | - Anon Key for Realtime  |   |   ziauldin371@gmail.com  |   | - TextSearch| |
|   | - Encrypted OAuth Tokens |   | - Sent Label Confirmed   |   | - Reviews   | |
|   +--------------------------+   +--------------------------+   +-------------+ |
+---------------------------------------------------------------------------------+
```

## 2. Security Boundaries & Fail-Closed Behavior
- **Zero Mock Stores in Production:** The application requires valid Supabase environment variables in production.
- **Constant-Time Verification:** Auth checks and cron bearer token checks utilize `crypto.timingSafeEqual`.
- **SSRF Network Isolation:** Outbound HTTP fetches to unknown targets execute through `safeFetch()`, preventing requests to private, loopback, or cloud metadata IP ranges.
- **AES-256-GCM Token Encryption:** Stored Gmail OAuth tokens are encrypted at rest using `ENCRYPTION_SECRET`.
