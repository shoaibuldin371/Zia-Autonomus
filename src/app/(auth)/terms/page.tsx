import React from 'react';

export default function TermsPage() {
  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto text-on-surface">
      <div className="mb-8">
        <a href="/login" className="text-primary hover:underline text-sm inline-flex items-center gap-1">
          &larr; Back to Login
        </a>
      </div>
      <h1 className="text-3xl font-bold mb-4">Terms of Use</h1>
      <p className="text-sm text-subtext mb-6">Last updated: November 2026</p>

      <div className="space-y-6 text-sm text-on-surface/90 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">1. System Purpose & Scope</h2>
          <p>
            Growth System is a private, operator-restricted intelligence application created exclusively for Zia Ul Din. Unauthorized access or attempts to access private APIs is strictly prohibited.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">2. Communication Standards</h2>
          <p>
            All communications facilitated by this system adhere to ethical business outreach practices: verified claims backed by real evidence, honest service offerings, no misleading metrics, and honoring all suppression requests.
          </p>
        </section>
      </div>
    </main>
  );
}
