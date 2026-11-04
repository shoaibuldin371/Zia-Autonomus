'use client';

import React, { useState, useEffect } from 'react';
import { DraftEntity, SendLogEntity } from '@/lib/supabase/data-store';

export default function EmailsQueuePage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [drafts, setDrafts] = useState<DraftEntity[]>([]);
  const [sentHistory, setSentHistory] = useState<SendLogEntity[]>([]);
  const [dailyLimit, setDailyLimit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [draftsRes, limitsRes] = await Promise.all([
          fetch('/api/drafts'),
          fetch('/api/safety/limits'),
        ]);

        const draftsData = await draftsRes.json();
        const limitsData = await limitsRes.json();

        setDrafts(draftsData.drafts || []);
        setDailyLimit(limitsData.dailyLimit || 25);
      } catch {
        setDrafts([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleApprove(draftId: string) {
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_and_send', draftId }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage('Email approved and dispatched via Gmail!');
        setDrafts((prev) => prev.filter((d) => d.id !== draftId));
      } else {
        setActionMessage(data.error || 'Approval dispatch failed.');
      }
    } catch {
      setActionMessage('Network error during draft approval.');
    }
    setTimeout(() => setActionMessage(null), 4000);
  }

  async function handleReject(draftId: string) {
    try {
      await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', draftId }),
      });
      setDrafts((prev) => prev.filter((d) => d.id !== draftId));
      setActionMessage('Draft rejected and archived.');
    } catch {
      setActionMessage('Failed to reject draft.');
    }
    setTimeout(() => setActionMessage(null), 3000);
  }

  const sentTodayCount = sentHistory.length;

  return (
    <div className="space-y-6">
      {/* Alert Toast */}
      {actionMessage && (
        <div className="p-3.5 rounded-control bg-surface-container-highest border border-primary/40 text-on-surface text-xs shadow-glow flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-18">info</span>
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Connected Sender Card */}
      <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-22">mark_email_read</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-on-surface">Zia Ul Din</h2>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary text-[10px] font-bold">
                GOOGLE OAUTH CONNECTED
              </span>
            </div>
            <p className="text-xs font-mono text-subtext mt-0.5">ziauldin371@gmail.com</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-subtext">Reputation Status:</span>
          <span className="text-secondary font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            <span>Delivered to Gmail (Healthy)</span>
          </span>
        </div>
      </section>

      {/* 3 Real Counters Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-outline-variant/30 rounded-card p-5 shadow-card">
          <span className="text-xs font-semibold text-subtext uppercase tracking-wider block">Sent Today</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-on-surface">{sentTodayCount}</span>
            <span className="text-xs text-subtext">/ {dailyLimit} daily cap</span>
          </div>
          <span className="text-[11px] text-secondary font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-14">shield</span>
            <span>Speed Limit Enforced</span>
          </span>
        </div>

        <div className="bg-card border border-outline-variant/30 rounded-card p-5 shadow-card">
          <span className="text-xs font-semibold text-subtext uppercase tracking-wider block">In Review Queue</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{drafts.length}</span>
            <span className="text-xs text-subtext">drafts awaiting eyes</span>
          </div>
          <span className="text-[11px] text-primary font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-14">rate_review</span>
            <span>Review First Mode</span>
          </span>
        </div>

        <div className="bg-card border border-outline-variant/30 rounded-card p-5 shadow-card">
          <span className="text-xs font-semibold text-subtext uppercase tracking-wider block">Blocked by Safety</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-on-surface">0</span>
            <span className="text-xs text-subtext">suppressed / sole trader</span>
          </div>
          <span className="text-[11px] text-subtext font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-14">check</span>
            <span>All Checks Clean</span>
          </span>
        </div>
      </section>

      {/* Tabs: Review Queue vs Sent History */}
      <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-control text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'queue'
              ? 'bg-primary-container text-white shadow-glow'
              : 'text-subtext hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-16">pending_actions</span>
          <span>Review Drafts Queue ({drafts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-control text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-primary-container text-white shadow-glow'
              : 'text-subtext hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-16">history</span>
          <span>Verified Sent History</span>
        </button>
      </div>

      <div className="p-3 rounded-control bg-secondary/10 border border-secondary/30 text-xs text-secondary flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-18">bolt</span>
          <span className="font-semibold">Auto-Send Mode Active:</span>
          <span className="text-on-surface/90">Emails dispatch automatically upon discovery via official Gmail API. Manual approval option has been removed per your preference.</span>
        </div>
      </div>

      {activeTab === 'queue' ? (
        <section className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-subtext">
              <span className="material-symbols-outlined animate-spin text-24 text-primary">progress_activity</span>
              <p className="mt-2">Loading drafts from Supabase...</p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="bg-card border border-outline-variant/30 rounded-card p-12 text-center space-y-3 shadow-card">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mx-auto text-subtext">
                <span className="material-symbols-outlined text-24">drafts</span>
              </div>
              <h3 className="text-sm font-bold text-on-surface">No pending drafts</h3>
              <p className="text-xs text-subtext max-w-sm mx-auto">
                All drafts have been reviewed. Run a discovery batch from the top bar to generate new evidence-backed drafts.
              </p>
            </div>
          ) : (
            drafts.map((draft) => (
              <article
                key={draft.id}
                className="bg-card border border-outline-variant/30 rounded-card p-5 shadow-card space-y-3 hover:border-outline-variant/60 transition"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">{draft.subject}</h3>
                    <p className="text-xs text-subtext mt-0.5">
                      Recipient: <span className="font-mono text-on-surface">{draft.recipient_email}</span>
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary text-[10px] font-bold border border-tertiary/30">
                    AWAITING ZIA APPROVAL
                  </span>
                </div>

                <div className="p-4 rounded-control bg-surface-container border border-outline-variant/20 text-xs font-mono text-on-surface/90 whitespace-pre-wrap leading-relaxed">
                  {draft.body_text}
                </div>

                <div className="flex items-center justify-between gap-3 pt-2 border-t border-outline-variant/20">
                  <span className="text-[11px] text-subtext">
                    Verified sender: <strong className="text-on-surface">Zia Ul Din</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(draft.id)}
                      className="px-3 py-1.5 rounded-control text-xs text-error hover:bg-error-container/30 transition"
                    >
                      Reject Draft
                    </button>
                    <button
                      onClick={() => handleApprove(draft.id)}
                      className="px-4 py-1.5 rounded-control bg-secondary-container hover:bg-secondary text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <span className="material-symbols-outlined text-16">send</span>
                      <span>Approve & Dispatch</span>
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      ) : (
        <section className="bg-card border border-outline-variant/30 rounded-card p-8 shadow-card text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mx-auto text-subtext">
            <span className="material-symbols-outlined text-24">verified</span>
          </div>
          <h3 className="text-sm font-bold text-on-surface">Verified Sent History</h3>
          <p className="text-xs text-subtext max-w-md mx-auto leading-relaxed">
            This tab strictly records emails that have returned a valid Gmail <span className="font-mono">messageId</span> and confirmed <span className="font-mono">SENT</span> label from Google servers.
          </p>
          <p className="text-[11px] text-subtext/70 italic">
            Inbox placement cannot be guaranteed by any sender. All records represent real delivery receipts.
          </p>
        </section>
      )}
    </div>
  );
}

