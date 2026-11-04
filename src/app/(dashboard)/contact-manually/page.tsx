'use client';

import React, { useState } from 'react';

export default function ContactManuallyPage() {
  const [activeChannel, setActiveChannel] = useState<'all' | 'call' | 'whatsapp' | 'instagram'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isScriptExpanded, setIsScriptExpanded] = useState(true);
  const [dailyCompleted, setDailyCompleted] = useState(0);
  const dailyTarget = 10;

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  const scriptText = `1. "Hi, is this the owner or manager at [Business Name]?"
2. "My name is Zia Ul Din — I'm an automation and website developer based in Karachi."
3. "I noticed your Google profile has [Rating] stars from [Review Count] customers, but no direct website link for mobile visitors."
4. "I build fast, high-converting Next.js booking systems for local businesses for $500, delivered in 3 days."
5. "Could I send a 2-minute video preview to your WhatsApp so you can see how it looks?"`;

  function copyScript() {
    navigator.clipboard.writeText(scriptText);
    showToast('Script copied to clipboard!');
  }

  function handleLogContact(businessName: string, channel: string) {
    setDailyCompleted((prev) => Math.min(dailyTarget, prev + 1));
    showToast(`Logged ${channel} contact for ${businessName}. 72h protection active.`);
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-card bg-surface-container-highest border border-primary/40 text-on-surface text-xs shadow-glow flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-18">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Intro Banner */}
      <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-24">phone_in_talk</span>
            <h1 className="text-xl font-bold text-on-surface">Direct Phone & Social Outreach</h1>
          </div>
          <span className="px-2.5 py-1 rounded-pill bg-tertiary-container/30 text-tertiary text-xs font-semibold border border-tertiary/30">
            Manual Actions Only • No Bot Calling
          </span>
        </div>
        <p className="text-xs text-subtext leading-relaxed">
          These businesses have no public email. Reaching them directly via phone or WhatsApp yields high responsiveness when backed by verifiable Google Maps profile evidence.
        </p>

        {/* Daily Target Tracker */}
        <div className="pt-2 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-subtext">Today&apos;s Outreach Target:</span>{' '}
            <strong className="text-on-surface">
              {dailyCompleted} / {dailyTarget} completed
            </strong>
          </div>
          <div className="w-48 bg-surface-container h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary-container h-full transition-all duration-300"
              style={{ width: `${(dailyCompleted / dailyTarget) * 100}%` }}
            />
          </div>
        </div>
      </section>

      {/* 30-Second Phone Script Card */}
      <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-20">mic</span>
            <h2 className="text-sm font-bold text-on-surface">30-Second Phone Script (Zia Ul Din)</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyScript}
              className="px-3 py-1.5 rounded-control bg-primary-container hover:bg-primary-hover text-white text-xs font-semibold shadow-glow flex items-center gap-1 transition"
            >
              <span className="material-symbols-outlined text-16">content_copy</span>
              <span>Copy Script to Clipboard</span>
            </button>
            <button
              onClick={() => setIsScriptExpanded(!isScriptExpanded)}
              className="p-1 rounded-control text-subtext hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-20">
                {isScriptExpanded ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>
        </div>

        {isScriptExpanded && (
          <div className="p-4 rounded-control bg-surface-container border border-outline-variant/20 text-xs font-mono text-on-surface/90 whitespace-pre-wrap leading-relaxed">
            {scriptText}
          </div>
        )}

        <p className="text-[11px] text-subtext/80 italic">
          Compliance Reminder: Verify that the recipient is not on a national Do-Not-Call / TPS register before placing cold calls.
        </p>
      </section>

      {/* Channel Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'call', 'whatsapp', 'instagram'] as const).map((ch) => (
          <button
            key={ch}
            onClick={() => setActiveChannel(ch)}
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold capitalize transition ${
              activeChannel === ch
                ? 'bg-primary-container text-white shadow-glow'
                : 'bg-card border border-outline-variant/30 text-subtext hover:text-on-surface'
            }`}
          >
            {ch === 'all' ? 'All Leads' : ch === 'call' ? 'Call Ready' : ch}
          </button>
        ))}
      </div>

      {/* Priority Leads Feed */}
      <div className="space-y-4">
        {/* Lead Card Example */}
        <article className="bg-card border border-outline-variant/30 rounded-card p-5 shadow-card space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-on-surface">The Artisan Bakery & Cafe</h3>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-subtext text-[10px] font-semibold">
                  Bakery
                </span>
                <span className="text-xs text-subtext">• Manchester, UK</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-subtext">
                <span className="text-tertiary font-bold">4.8★</span>
                <span>(184 Google reviews)</span>
                <span className="text-error font-medium">• No website found on Maps</span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-pill bg-tertiary-container/30 text-tertiary text-xs font-semibold border border-tertiary/30">
              High Priority Lead
            </span>
          </div>

          <div className="p-3 rounded-control bg-surface-container border border-outline-variant/20 text-xs text-on-surface/90">
            <strong>Evidence:</strong> Active Google Maps listing with 184 reviews and strong local reputation, but zero direct website link for mobile menu orders or customer inquiries.
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-outline-variant/20">
            <div className="flex items-center gap-2 text-xs font-mono text-on-surface">
              <span className="material-symbols-outlined text-16 text-primary">phone</span>
              <span>+44 161 832 9900</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="tel:+441618329900"
                onClick={() => handleLogContact('The Artisan Bakery', 'Phone')}
                className="px-3 py-1.5 rounded-control bg-primary-container hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1 shadow-glow transition"
              >
                <span className="material-symbols-outlined text-16">call</span>
                <span>Call Now</span>
              </a>

              <button
                onClick={() => handleLogContact('The Artisan Bakery', 'WhatsApp')}
                className="px-3 py-1.5 rounded-control bg-secondary-container hover:bg-secondary text-white text-xs font-semibold flex items-center gap-1 transition"
              >
                <span className="material-symbols-outlined text-16">chat</span>
                <span>Send WhatsApp</span>
              </button>

              <button
                onClick={() => handleLogContact('The Artisan Bakery', 'Logged')}
                className="px-3 py-1.5 rounded-control bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-medium transition"
              >
                Mark Contacted
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
