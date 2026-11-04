# Security Architecture & Rules: Growth System v2

## 1. Authentication & Session Hygiene
- **Signed Sessions Only:** All authentication sessions are issued as signed HS256 JSON Web Tokens (using `jose`) with standard `iat` and `exp` claims.
- **Cookie Security:** Cookies are set with `HttpOnly`, `SameSite=Lax`, `Secure` (in production), and `Path=/`.
- **Fail-Closed Operator Check:** Only `ADMIN_EMAIL=ziauldin371@gmail.com` matching constant-time comparison against environment variables can authenticate.
- **Login Rate Limiting:** Maximum 5 failed attempts per 15 minutes per IP + email, surviving serverless cold starts.

## 2. Cron & Scheduler Security
- **No Query Parameter Secrets:** Incoming requests with secrets in the URL query string (`?secret=...`) are explicitly rejected with `400 Bad Request`.
- **Bearer Authentication:** Requires `Authorization: Bearer <CRON_SECRET>` verified via constant-time comparison.
- **Fail-Closed Secret Check:** Returns `503 Service Unavailable` if `CRON_SECRET` is unset.
- **Zero Logging of Secrets:** Secret tokens are never printed to logs or responses.

## 3. Network Protection (SSRF Guard)
Third-party URLs inspected during website verification are validated against:
- IPv4 Loopback (`127.0.0.0/8`)
- IPv4 Private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
- Cloud Metadata service (`169.254.169.254`)
- Non-HTTP/HTTPS protocols
- Manual redirect following (redirect hops are validated individually)

## 4. Cryptographic Storage
Sensitive third-party OAuth access and refresh tokens are encrypted using `AES-256-GCM` with an authenticated 128-bit authentication tag before being stored in PostgreSQL.
