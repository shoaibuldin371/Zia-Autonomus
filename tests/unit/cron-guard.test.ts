import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { validateCronRequest } from '@/lib/security/cron-guard';

describe('Cron Guard (Fail-Closed Vercel Cron Security)', () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = 'cron_super_secret_token_12345';
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  it('authorizes requests with correct Bearer header', () => {
    const req = new NextRequest('http://localhost:3000/api/cron/scheduled-run', {
      headers: {
        authorization: 'Bearer cron_super_secret_token_12345',
      },
    });

    const res = validateCronRequest(req);
    expect(res.authorized).toBe(true);
    expect(res.response).toBeUndefined();
  });

  it('rejects query-parameter cron secrets with 400 Bad Request', async () => {
    const req = new NextRequest('http://localhost:3000/api/cron/scheduled-run?secret=cron_super_secret_token_12345');

    const res = validateCronRequest(req);
    expect(res.authorized).toBe(false);
    expect(res.response?.status).toBe(400);
    const data = await res.response?.json();
    expect(data.error).toContain('Query parameter authentication is forbidden');
  });

  it('fails with 503 when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET;
    const req = new NextRequest('http://localhost:3000/api/cron/scheduled-run', {
      headers: {
        authorization: 'Bearer whatever',
      },
    });

    const res = validateCronRequest(req);
    expect(res.authorized).toBe(false);
    expect(res.response?.status).toBe(503);
  });

  it('fails with 401 when Authorization header is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/cron/scheduled-run');

    const res = validateCronRequest(req);
    expect(res.authorized).toBe(false);
    expect(res.response?.status).toBe(401);
  });

  it('fails with 401 when Bearer token is incorrect', async () => {
    const req = new NextRequest('http://localhost:3000/api/cron/scheduled-run', {
      headers: {
        authorization: 'Bearer wrong_token',
      },
    });

    const res = validateCronRequest(req);
    expect(res.authorized).toBe(false);
    expect(res.response?.status).toBe(401);
  });
});
