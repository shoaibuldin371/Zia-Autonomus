'use client';

import React, { useState } from 'react';
import { PLATFORMS_SEED, PlatformDefinition } from '@/data/platforms-seed';

export default function PlatformsEnginePage() {
  const [selectedCategory, setSelectedCategory] = useState<PlatformDefinition['category'] | 'all'>('all');

  const filtered = PLATFORMS_SEED.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-24">hub</span>
            <h1 className="text-xl font-bold text-on-surface">Platform Engine (89 Platforms)</h1>
          </div>
          <span className="px-2.5 py-1 rounded-pill bg-primary-container/20 text-primary text-xs font-semibold border border-primary/30">
            {PLATFORMS_SEED.length} Registered Ecosystems
          </span>
        </div>
        <p className="text-xs text-subtext leading-relaxed">
          Comprehensive intelligence database for client acquisition across vetted networks, marketplaces, tender portals, and automation communities. All fee statements are stored unverified with direct links to official terms.
        </p>

        {/* Pakistan Vetted Readiness Checklist */}
        <div className="mt-4 p-4 rounded-control bg-surface-container border border-outline-variant/20 space-y-2">
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Zia Ul Din • Vetted Networks Readiness Checklist (100% Ready)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-subtext">
            <div className="flex items-center gap-1.5 text-secondary">
              <span className="material-symbols-outlined text-16">check_circle</span>
              <span>Tailored Technical CV Ready</span>
            </div>
            <div className="flex items-center gap-1.5 text-secondary">
              <span className="material-symbols-outlined text-16">check_circle</span>
              <span>Polished GitHub Profile</span>
            </div>
            <div className="flex items-center gap-1.5 text-secondary">
              <span className="material-symbols-outlined text-16">check_circle</span>
              <span>3 Evidence-Backed Case Studies</span>
            </div>
            <div className="flex items-center gap-1.5 text-secondary">
              <span className="material-symbols-outlined text-16">check_circle</span>
              <span>2-Minute Architecture Demo Video</span>
            </div>
            <div className="flex items-center gap-1.5 text-secondary">
              <span className="material-symbols-outlined text-16">check_circle</span>
              <span>Pakistan Payouts: Wise & Payoneer</span>
            </div>
            <div className="flex items-center gap-1.5 text-secondary">
              <span className="material-symbols-outlined text-16">check_circle</span>
              <span>US W-8BEN Tax Form Prepared</span>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition ${
              selectedCategory === 'all'
                ? 'bg-primary-container text-white shadow-glow'
                : 'bg-surface-container text-subtext hover:text-on-surface'
            }`}
          >
            All Platforms ({PLATFORMS_SEED.length})
          </button>
          <button
            onClick={() => setSelectedCategory('marketplaces')}
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition ${
              selectedCategory === 'marketplaces'
                ? 'bg-primary-container text-white shadow-glow'
                : 'bg-surface-container text-subtext hover:text-on-surface'
            }`}
          >
            Group A: Marketplaces
          </button>
          <button
            onClick={() => setSelectedCategory('vetted_networks')}
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition ${
              selectedCategory === 'vetted_networks'
                ? 'bg-primary-container text-white shadow-glow'
                : 'bg-surface-container text-subtext hover:text-on-surface'
            }`}
          >
            Group B: Vetted Networks
          </button>
          <button
            onClick={() => setSelectedCategory('lead_databases_and_tenders')}
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition ${
              selectedCategory === 'lead_databases_and_tenders'
                ? 'bg-primary-container text-white shadow-glow'
                : 'bg-surface-container text-subtext hover:text-on-surface'
            }`}
          >
            Group C: Lead DBs & Tenders
          </button>
          <button
            onClick={() => setSelectedCategory('email_sending_tool')}
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition ${
              selectedCategory === 'email_sending_tool'
                ? 'bg-primary-container text-white shadow-glow'
                : 'bg-surface-container text-subtext hover:text-on-surface'
            }`}
          >
            Group D: Sending Tools
          </button>
        </div>
      </section>

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((platform) => (
          <article
            key={platform.id}
            className="bg-card border border-outline-variant/30 rounded-card p-5 shadow-card flex flex-col justify-between space-y-4 hover:border-outline-variant/60 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-on-surface">{platform.name}</h3>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-subtext text-[10px] font-semibold uppercase">
                  {platform.category.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="mt-2 space-y-1 text-xs text-subtext">
                <p>
                  <strong className="text-on-surface">Pitch Mode:</strong> {platform.pitch_mode}
                </p>
                <p>
                  <strong className="text-on-surface">Integration:</strong> {platform.integration_mode}
                </p>
                {platform.pakistan_payout_support && (
                  <p className="text-secondary">
                    <strong>Payouts:</strong> {platform.pakistan_payout_support}
                  </p>
                )}
                {platform.notes && <p className="text-tertiary italic">{platform.notes}</p>}
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
              <a
                href={platform.terms_url}
                target="_blank"
                rel="noreferrer"
                className="text-subtext hover:underline text-[11px]"
              >
                Verify Terms &rarr;
              </a>
              <a
                href={platform.official_url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-control bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-medium transition"
              >
                Open Platform
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
