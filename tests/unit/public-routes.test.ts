import { describe, it, expect } from 'vitest';
import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

describe('Public and Protected Routes in Middleware', () => {
  it('allows access to /privacy without a session cookie (HTTP 200/next)', async () => {
    const req = new NextRequest('http://localhost:3000/privacy');
    const res = await middleware(req);
    expect(res.status).toBe(200);
    // Should NOT redirect to /login
    expect(res.headers.get('location')).toBeNull();
  });

  it('allows access to /terms without a session cookie (HTTP 200/next)', async () => {
    const req = new NextRequest('http://localhost:3000/terms');
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('allows access to /login without a session cookie', async () => {
    const req = new NextRequest('http://localhost:3000/login');
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects unauthenticated access to /requests to /login', async () => {
    const req = new NextRequest('http://localhost:3000/requests');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login?next=%2Frequests');
  });

  it('redirects unauthenticated access to /emails to /login', async () => {
    const req = new NextRequest('http://localhost:3000/emails');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login?next=%2Femails');
  });
});
