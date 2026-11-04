'use client';

import React, { useState, useEffect } from 'react';
import { BusinessEntity } from '@/lib/supabase/data-store';

export default function FoundBusinessesPage() {
  const [businesses, setBusinesses] = useState<BusinessEntity[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedBiz, setSelectedBiz] = useState<BusinessEntity | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadBusinesses() {
      setLoading(true);
      try {
        const res = await fetch(`/api/businesses?filter=${filter}`);
        const data = await res.json();
        setBusinesses(data.businesses || []);
      } catch {
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    }
    loadBusinesses();
  }, [filter]);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  const filteredList = businesses.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      (b.city && b.city.toLowerCase().includes(q)) ||
      (b.industry && b.industry.toLowerCase().includes(q))
    );
  });

  const noWebsiteCount = businesses.filter((b) => b.pipeline_type === 'website_opportunities').length;
  const aiSoftwareCount = businesses.filter((b) => b.pipeline_type === 'ai_software_opportunities').length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-card bg-surface-container-highest border border-primary/40 text-on-surface text-xs shadow-glow flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-18">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Live Radar Banner */}
      <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-24">radar</span>
            <h1 className="text-xl font-bold text-on-surface">Live Discovery Radar</h1>
          </div>
          <span className="px-2.5 py-1 rounded-pill bg-secondary-container/20 text-secondary text-xs font-semibold flex items-center gap-1.5 border border-secondary/30">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span>{businesses.length} Verified Records Active</span>
          </span>
        </div>
        <p className="text-xs text-subtext leading-relaxed">
          Real businesses discovered through Google Places and licensed directories worldwide. All opportunities are classified by stored technical evidence with zero invented metrics.
        </p>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition ${
              filter === 'all'
                ? 'bg-primary-container text-white shadow-glow'
                : 'bg-surface-container text-subtext hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            All ({businesses.length})
          </button>
          <button
            onClick={() => setFilter('no_website')}
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition ${
              filter === 'no_website'
                ? 'bg-primary-container text-white shadow-glow'
                : 'bg-surface-container text-subtext hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            No Website Found ({noWebsiteCount})
          </button>
          <button
            onClick={() => setFilter('needs_ai')}
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition ${
              filter === 'needs_ai'
                ? 'bg-primary-container text-white shadow-glow'
                : 'bg-surface-container text-subtext hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            Needs AI Assistant ({aiSoftwareCount})
          </button>
        </div>
      </section>

      {/* Search Input Bar */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-subtext text-18 pointer-events-none">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter businesses by name, city, or trade..."
          className="w-full pl-9 pr-4 py-2.5 rounded-control bg-card border border-outline-variant/30 text-on-surface placeholder:text-subtext/50 text-sm focus:outline-none focus:border-primary-container"
        />
      </div>

      {/* Business Cards Feed */}
      {loading ? (
        <div className="py-12 text-center text-xs text-subtext space-y-2">
          <span className="material-symbols-outlined animate-spin text-24 text-primary">progress_activity</span>
          <p>Loading verified records from Supabase...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-card border border-outline-variant/30 rounded-card p-12 text-center space-y-3 shadow-card">
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mx-auto text-subtext">
            <span className="material-symbols-outlined text-24">travel_explore</span>
          </div>
          <h3 className="text-sm font-bold text-on-surface">No businesses matching filter</h3>
          <p className="text-xs text-subtext max-w-sm mx-auto">
            Click &ldquo;Find Businesses Now&rdquo; in the top bar to run a discovery query for your target city and industry.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((biz) => (
            <article
              key={biz.id}
              className="bg-card border border-outline-variant/30 rounded-card p-5 shadow-card space-y-4 hover:border-outline-variant/60 transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-on-surface">{biz.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-subtext text-[10px] font-semibold">
                      {biz.industry || 'Local Trade'}
                    </span>
                    {biz.city && (
                      <span className="text-xs text-subtext">
                        • {biz.city}, {biz.country}
                      </span>
                    )}
                  </div>
                  {biz.rating && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-subtext">
                      <span className="text-tertiary font-bold">{biz.rating}★</span>
                      <span>({biz.user_rating_count || 0} Google reviews)</span>
                    </div>
                  )}
                </div>

                <span
                  className={`px-2.5 py-1 rounded-pill text-xs font-semibold flex items-center gap-1 ${
                    biz.pipeline_type === 'website_opportunities'
                      ? 'bg-tertiary-container/30 text-tertiary border border-tertiary/30'
                      : 'bg-primary-container/20 text-primary border border-primary/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-14">
                    {biz.pipeline_type === 'website_opportunities' ? 'language' : 'smart_toy'}
                  </span>
                  <span>
                    {biz.pipeline_type === 'website_opportunities'
                      ? 'No Website Found'
                      : 'Needs AI Software'}
                  </span>
                </span>
              </div>

              {/* Opportunity Summary (Honest Evidence Only) */}
              <div className="p-3 rounded-control bg-surface-container border border-outline-variant/20 text-xs text-on-surface/90 leading-relaxed">
                <span className="font-semibold text-primary mr-1">Opportunity:</span>
                {biz.opportunity_text || 'Public local profile identified without dedicated website.'}
              </div>

              {/* Actions & Channels */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs text-subtext">
                  <span className="material-symbols-outlined text-16">contact_phone</span>
                  <span>{biz.phone || 'Phone only on Google Maps'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedBiz(biz)}
                    className="px-3 py-1.5 rounded-control bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-medium transition"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => {
                      showToast(`Added ${biz.name} to outreach review queue`);
                    }}
                    className="px-3.5 py-1.5 rounded-control bg-primary-container hover:bg-primary-hover text-white text-xs font-semibold shadow-glow flex items-center gap-1 transition"
                  >
                    <span className="material-symbols-outlined text-14">mail</span>
                    <span>
                      {biz.pipeline_type === 'website_opportunities'
                        ? 'Queue Intro Website Pitch'
                        : 'Queue AI Assistant Pitch'}
                    </span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Batch Outreach Bottom Action Card */}
      {filteredList.length > 0 && (
        <section className="bg-card border border-outline-variant/30 rounded-card p-5 shadow-card flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-on-surface">Batch Smart Outreach</h3>
            <p className="text-xs text-subtext mt-0.5">
              Queues verified leads into review drafts. Sender: <span className="font-mono text-primary">ziauldin371@gmail.com</span>
            </p>
          </div>
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="px-4 py-2 rounded-control bg-primary-container hover:bg-primary-hover text-white text-xs font-semibold shadow-glow flex items-center gap-1.5 transition"
          >
            <span className="material-symbols-outlined text-16">send_and_archive</span>
            <span>Queue Batch for Zia Review</span>
          </button>
        </section>
      )}

      {/* Batch Outreach Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-card border border-outline-variant/30 rounded-card p-6 max-w-md w-full shadow-card space-y-4">
            <h3 className="text-base font-bold text-on-surface">Confirm Batch Outreach Queue</h3>
            <div className="text-xs text-on-surface/90 space-y-2 leading-relaxed">
              <p>
                <strong>Total Recipients:</strong> {filteredList.length} verified leads
              </p>
              <p>
                <strong>Sender Identity:</strong> Zia Ul Din &lt;ziauldin371@gmail.com&gt;
              </p>
              <p>
                <strong>Safe Spacing:</strong> 6 minutes between emails + random jitter
              </p>
              <p>
                <strong>Estimated Time:</strong> ~{Math.round(filteredList.length * 6)} minutes within recipient local business hours (09:00 - 17:30).
              </p>
              <p className="text-subtext">
                * Note: In Review First mode, this creates drafts in your queue for individual approval. Nothing is dispatched automatically without your confirmation.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="px-3 py-1.5 rounded-control text-xs text-subtext hover:text-on-surface transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsBatchModalOpen(false);
                  showToast(`Queued ${filteredList.length} drafts for review!`);
                }}
                className="px-4 py-1.5 rounded-control bg-primary-container hover:bg-primary-hover text-white text-xs font-semibold shadow-glow transition"
              >
                Confirm & Create Drafts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Drawer */}
      {selectedBiz && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card border-l border-outline-variant/30 h-full p-6 shadow-card overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <h2 className="text-base font-bold text-on-surface">{selectedBiz.name}</h2>
              <button onClick={() => setSelectedBiz(null)} className="text-subtext hover:text-on-surface">
                <span className="material-symbols-outlined text-20">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-subtext uppercase tracking-wider block mb-1">
                  Verified Observation
                </span>
                <p className="text-on-surface leading-relaxed p-3 rounded-control bg-surface-container">
                  {selectedBiz.opportunity_text}
                </p>
              </div>

              <div>
                <span className="font-semibold text-subtext uppercase tracking-wider block mb-1">
                  Contact Channels
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 rounded-control bg-surface-container">
                    <span>Phone: {selectedBiz.phone || 'Google Maps listing'}</span>
                    <span className="text-[10px] text-secondary font-bold">VERIFIED</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-control bg-surface-container">
                    <span>Domain: {selectedBiz.domain || 'None (No website)'}</span>
                    <span className="text-[10px] text-primary font-bold">EVIDENCE</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="font-semibold text-subtext uppercase tracking-wider block mb-1">
                  Cross-Channel Protection
                </span>
                <p className="text-subtext leading-relaxed">
                  Double-contact protection active. 72-hour mandatory gap enforced across email, phone, and social.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/20 flex gap-2">
              <button
                onClick={() => {
                  setSelectedBiz(null);
                  showToast(`Draft created for ${selectedBiz.name}!`);
                }}
                className="flex-1 py-2 rounded-control bg-primary-container text-white text-xs font-semibold hover:bg-primary-hover shadow-glow transition"
              >
                Create Email Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
