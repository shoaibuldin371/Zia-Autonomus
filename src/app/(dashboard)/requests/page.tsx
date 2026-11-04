'use client';

import React, { useState } from 'react';
import { ClassificationResult } from '@/services/platforms/client-request-classifier';

export default function HotClientRequestsPage() {
  const [postContent, setPostContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{
    classification: ClassificationResult;
    generatedProposal: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleAnalyze() {
    if (!postContent.trim()) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postContent }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to analyze request');
      } else {
        setAnalysis(data);
      }
    } catch {
      setError('Network communication failed.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopyProposal() {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis.generatedProposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-24">bolt</span>
          <h1 className="text-xl font-bold text-on-surface">Hot Client Requests Desk</h1>
        </div>
        <p className="text-xs text-subtext leading-relaxed">
          Paste any job posting, Upwork project description, or client brief. The classifier flags scams (off-platform contact, escrow bypass), calculates technical fit, and drafts an evidence-only proposal adhering to your stored profile.
        </p>
      </section>

      {/* Input Form */}
      <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card space-y-4">
        <div>
          <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-2">
            Paste Client Job Description or Post
          </label>
          <textarea
            rows={6}
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="e.g. Looking for a full-stack Next.js developer to build an automated workflow with AI chatbots and PostgreSQL persistence..."
            className="w-full p-3.5 rounded-control bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-subtext/50 text-xs font-mono focus:outline-none focus:border-primary-container"
          />
        </div>

        {error && (
          <div className="p-3 rounded-control bg-error-container/30 border border-error/30 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-16">error</span>
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading || !postContent.trim()}
          className="px-5 py-2.5 rounded-control bg-primary-container hover:bg-primary-hover text-white text-xs font-semibold shadow-glow flex items-center gap-2 transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-16">progress_activity</span>
              <span>Scanning Requirements & Red Flags...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-16">analytics</span>
              <span>Analyze Post & Generate Proposal</span>
            </>
          )}
        </button>
      </section>

      {/* Analysis & Proposal Result */}
      {analysis && (
        <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-on-surface">Classification:</span>
              <span className="px-2.5 py-0.5 rounded-pill bg-primary-container/20 text-primary text-xs font-bold">
                {analysis.classification.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-pill bg-surface-container-high text-subtext text-xs font-semibold">
                Fit Score: {analysis.classification.fitScore}/100 ({analysis.classification.fitLabel})
              </span>
            </div>

            <span
              className={`px-2.5 py-1 rounded-pill text-xs font-bold flex items-center gap-1 ${
                analysis.classification.isSafeToPitch
                  ? 'bg-secondary-container/20 text-secondary border border-secondary/30'
                  : 'bg-error-container/30 text-error border border-error/30'
              }`}
            >
              <span className="material-symbols-outlined text-16">
                {analysis.classification.isSafeToPitch ? 'verified' : 'warning'}
              </span>
              <span>{analysis.classification.isSafeToPitch ? 'Safe To Pitch' : 'Red Flags Detected'}</span>
            </span>
          </div>

          {/* Scam Flags */}
          {analysis.classification.scamRedFlags.length > 0 && (
            <div className="p-3 rounded-control bg-error-container/30 border border-error/30 text-xs text-error space-y-1">
              <span className="font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-16">security</span>
                <span>Scam & Safety Warnings:</span>
              </span>
              <ul className="list-disc list-inside space-y-0.5 pl-2">
                {analysis.classification.scamRedFlags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Proposal Draft */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Evidence-Only Proposal (Zia Ul Din)
              </span>
              <button
                onClick={handleCopyProposal}
                className="px-3 py-1 rounded-control bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-medium flex items-center gap-1 transition"
              >
                <span className="material-symbols-outlined text-14">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Copied!' : 'Copy Proposal'}</span>
              </button>
            </div>
            <div className="p-4 rounded-control bg-surface-container border border-outline-variant/20 text-xs font-mono text-on-surface/90 whitespace-pre-wrap leading-relaxed">
              {analysis.generatedProposal}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
