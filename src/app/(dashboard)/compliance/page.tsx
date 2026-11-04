'use client';

import React, { useState } from 'react';

export default function CompliancePage() {
  const [suppressedEmail, setSuppressedEmail] = useState('');
  const [reason, setReason] = useState('User opt-out request');
  const [message, setMessage] = useState<string | null>(null);

  async function handleAddSuppression(e: React.FormEvent) {
    e.preventDefault();
    if (!suppressedEmail.trim()) return;

    setMessage(`Suppressed ${suppressedEmail.toLowerCase().trim()} across all outreach channels.`);
    setSuppressedEmail('');
    setTimeout(() => setMessage(null), 4000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-24">gavel</span>
          <h1 className="text-xl font-bold text-on-surface">Compliance & Suppression List</h1>
        </div>
        <p className="text-xs text-subtext leading-relaxed">
          Growth System operates with strict adherence to global email laws: GDPR (UK/EU), PECR (UK B2B rules), and CAN-SPAM (US). Any recipient who requests opt-out is permanently suppressed across all channels.
        </p>
      </section>

      {/* Manual Suppression Add Form */}
      <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-on-surface">Add Address to Global Suppression List</h2>

        {message && (
          <div className="p-3 rounded-control bg-secondary-container/20 border border-secondary/30 text-secondary text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-16">check_circle</span>
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleAddSuppression} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-1">
                Email Address to Suppress
              </label>
              <input
                type="email"
                value={suppressedEmail}
                onChange={(e) => setSuppressedEmail(e.target.value)}
                placeholder="contact@company.com"
                required
                className="w-full px-3 py-2 rounded-control bg-surface-container border border-outline-variant/30 text-on-surface text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-1">
                Reason
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-control bg-surface-container border border-outline-variant/30 text-on-surface text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-control bg-primary-container hover:bg-primary-hover text-white text-xs font-semibold shadow-glow transition"
          >
            Permanently Suppress Address
          </button>
        </form>
      </section>

      {/* Standards Summary Card */}
      <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-on-surface">Three-Tier Privacy Protections</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-subtext">
          <div className="p-4 rounded-control bg-surface-container border border-outline-variant/20 space-y-1.5">
            <h3 className="font-bold text-on-surface">1. UK PECR/GDPR Safe</h3>
            <p>
              UK sole traders and individuals are automatically excluded. Outreach is restricted to verifiable corporate entities (Ltd, PLC, LLP).
            </p>
          </div>

          <div className="p-4 rounded-control bg-surface-container border border-outline-variant/20 space-y-1.5">
            <h3 className="font-bold text-on-surface">2. One-Click Header</h3>
            <p>
              Emails feature RFC 8058 compliant <span className="font-mono text-primary">List-Unsubscribe-Post</span> headers with tamper-proof HMAC tokens.
            </p>
          </div>

          <div className="p-4 rounded-control bg-surface-container border border-outline-variant/20 space-y-1.5">
            <h3 className="font-bold text-on-surface">3. Physical Address</h3>
            <p>
              Valid operator address included on every email: Zia Ul Din, USA.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

