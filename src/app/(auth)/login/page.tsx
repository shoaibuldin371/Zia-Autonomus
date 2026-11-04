'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function NextParamTracker({ onParam }: { onParam: (url: string) => void }) {
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  React.useEffect(() => {
    if (next) onParam(next);
  }, [next, onParam]);
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [nextUrl, setNextUrl] = useState('/');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication failed');
        if (typeof data.remainingAttempts === 'number') {
          setRemainingAttempts(data.remainingAttempts);
        }
        setLoading(false);
        return;
      }

      // Successful login
      router.push(nextUrl);
      router.refresh();
    } catch {
      setError('Network communication failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-canvas">
      <Suspense fallback={null}>
        <NextParamTracker onParam={(url) => setNextUrl(url)} />
      </Suspense>

      <div className="w-full max-w-md bg-card border border-outline-variant/30 rounded-card p-8 shadow-card">
        {/* Header - No admin email, no sidebar links */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-container/20 text-primary mb-4">
            <span className="material-symbols-outlined text-28">shield_person</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Growth System</h1>
          <p className="text-sm text-on-surface-variant mt-1">Autonomous Intelligence Console</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-control bg-error-container/40 border border-error/30 text-error text-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-18 mt-0.5">error</span>
            <div>
              <p>{error}</p>
              {remainingAttempts !== null && (
                <p className="text-xs mt-1 text-on-surface-variant">
                  Remaining attempts before lockout: {remainingAttempts}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Immediate login form rendered in HTML */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
              required
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-control bg-surface-container border border-outline-variant/40 text-on-surface placeholder:text-subtext/50 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container text-sm transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full px-3.5 py-2.5 rounded-control bg-surface-container border border-outline-variant/40 text-on-surface placeholder:text-subtext/50 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container text-sm transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-control bg-primary-container hover:bg-primary-hover text-white font-medium text-sm transition shadow-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-18">progress_activity</span>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Console</span>
                <span className="material-symbols-outlined text-18">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-xs text-subtext">
          <a href="/privacy" className="hover:text-on-surface transition">Privacy Policy</a>
          <span>•</span>
          <a href="/terms" className="hover:text-on-surface transition">Terms of Use</a>
          <span>•</span>
          <span>Fail-Closed Security</span>
        </div>
      </div>
    </main>
  );
}
