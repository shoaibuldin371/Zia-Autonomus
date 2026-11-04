'use client';

import React, { useState } from 'react';
import { generateDefaultSearchPlan } from '@/services/discovery/search-plan';

export default function SearchPlanPage() {
  const [plan] = useState(generateDefaultSearchPlan());
  const [selectedCountry, setSelectedCountry] = useState<string>('all');

  const filtered = plan.filter((p) => {
    if (selectedCountry === 'all') return true;
    return p.country === selectedCountry;
  });

  return (
    <div className="space-y-6">
      <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-24">map</span>
            <h1 className="text-xl font-bold text-on-surface">Search Plan & Metro Coverage</h1>
          </div>
          <span className="px-2.5 py-1 rounded-pill bg-secondary-container/20 text-secondary text-xs font-semibold border border-secondary/30">
            {plan.length} Geographic Rotation Slots
          </span>
        </div>
        <p className="text-xs text-subtext leading-relaxed">
          The autonomous scheduler rotates systematically through this matrix on every daily cron run (09:00 and 17:00 PKT), pulling the next oldest unsearched slot so global coverage rotates evenly without duplication.
        </p>

        {/* Country Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {['all', 'UK', 'US', 'CA', 'AU', 'NZ', 'UAE', 'IE', 'DE', 'FR', 'NL'].map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCountry(c)}
              className={`px-3 py-1 rounded-pill text-xs font-semibold transition ${
                selectedCountry === c
                  ? 'bg-primary-container text-white shadow-glow'
                  : 'bg-surface-container text-subtext hover:text-on-surface'
              }`}
            >
              {c === 'all' ? 'All Metros' : c}
            </button>
          ))}
        </div>
      </section>

      {/* Coverage Grid */}
      <div className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-on-surface">Target Metros & Industries ({filtered.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.slice(0, 60).map((slot, idx) => (
            <div
              key={idx}
              className="p-3 rounded-control bg-surface-container border border-outline-variant/20 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-semibold text-on-surface">
                  {slot.city}, {slot.country}
                </p>
                <p className="text-subtext capitalize">{slot.industry}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-subtext text-[10px] font-bold">
                READY
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
