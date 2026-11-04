import React from 'react';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto text-on-surface">
      <div className="mb-8">
        <a href="/login" className="text-primary hover:underline text-sm inline-flex items-center gap-1">
          &larr; Back to Login
        </a>
      </div>
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-sm text-subtext mb-6">Last updated: November 2026</p>
      
      <div className="space-y-6 text-sm text-on-surface/90 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">1. Overview</h2>
          <p>
            Growth System is a private business intelligence console operated solely by Zia Ul Din. We respect your privacy and only process publicly verifiable business contact data in full compliance with GDPR, PECR, and CAN-SPAM regulations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">2. Data We Process</h2>
          <p>
            We process publicly available business information including company name, public business address, public website URL, and verified corporate email addresses obtained from public directories and business registries.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">3. Unsubscribe & Right to Erasure</h2>
          <p>
            Any recipient can opt out permanently at any time via the one-click unsubscribe header or link included in all communications. Unsubscribed addresses are immediately and permanently added to our global suppression list.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">4. Contact & Inquiries</h2>
          <p>
            For any privacy inquiries or deletion requests, contact Zia Ul Din directly at <span className="font-mono text-primary">ziauldin371@gmail.com</span>.
          </p>
        </section>
      </div>
    </main>
  );
}
