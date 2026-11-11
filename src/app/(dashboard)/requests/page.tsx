'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ScoredClientRequest } from '@/services/platforms/client-requests-service';

export default function ClientRequestsPage() {
  const [requests, setRequests] = useState<ScoredClientRequest[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    strongMatches: 0,
    contractFreelance: 0,
    enterpriseFullTime: 0,
    weakEvidence: 0,
  });
  const [sourceHealth, setSourceHealth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<'contract' | 'strong' | 'all'>('contract');
  const [showFullTime, setShowFullTime] = useState(false);
  const [showWeakEvidence, setShowWeakEvidence] = useState(false);

  // Modals & Popups
  const [selectedLeadForPitch, setSelectedLeadForPitch] = useState<ScoredClientRequest | null>(null);
  const [pitchText, setPitchText] = useState<string>('');
  const [pitchLoading, setPitchLoading] = useState(false);
  const [pitchCopied, setPitchCopied] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedContent, setPastedContent] = useState('');
  const [pastedPlatform, setPastedPlatform] = useState('Contra');

  async function loadRequests() {
    setLoading(true);
    try {
      const url = `/api/requests?filter=${filterType}${showFullTime ? '&filter=show_fulltime' : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setRequests(data.requests || []);
        setStats(data.stats || {});
        setSourceHealth(data.sourceHealth || []);
      }
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, [filterType, showFullTime]);

  async function handleScan(source: 'hacker_news' | 'remotive') {
    setScanning(source);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan_source', source }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Scanned ${data.scanned} posts from ${data.source}. Saved ${data.saved} relevant leads.${data.freelancerCount !== undefined ? ` (${data.freelancerCount} from Freelancer thread)` : ''}`);
        await loadRequests();
      } else {
        alert(data.error || 'Scan failed');
      }
    } catch {
      alert('Network error during scan');
    } finally {
      setScanning(null);
    }
  }

  async function handleOpenPitch(lead: ScoredClientRequest) {
    setSelectedLeadForPitch(lead);
    setPitchLoading(true);
    setPitchText('');
    setPitchCopied(false);

    try {
      const res = await fetch('/api/requests/pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: lead.id,
          quote: lead.quote,
          jobType: lead.job_type,
          serviceFit: lead.service_fit,
          platform: lead.source_platform,
        }),
      });
      const data = await res.json();
      if (data.pitch) {
        setPitchText(data.pitch);
      } else if (data.message) {
        setPitchText(data.message);
      }
    } catch {
      setPitchText('Failed to generate proposal.');
    } finally {
      setPitchLoading(false);
    }
  }

  async function handleRegeneratePitch() {
    if (!selectedLeadForPitch) return;
    setPitchLoading(true);
    try {
      const res = await fetch('/api/requests/pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedLeadForPitch.id,
          regenerate: true,
        }),
      });
      const data = await res.json();
      if (data.pitch) setPitchText(data.pitch);
    } catch {
      // ignore
    } finally {
      setPitchLoading(false);
    }
  }

  async function handlePasteSubmit() {
    if (!pastedContent.trim()) return;
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postContent: pastedContent,
          platformName: pastedPlatform,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Request analyzed and added!');
        setPastedContent('');
        setIsPasteModalOpen(false);
        await loadRequests();
      } else {
        alert(data.error || 'Failed to analyze post');
      }
    } catch {
      alert('Network error');
    }
  }

  function handleCopyPitch() {
    navigator.clipboard.writeText(pitchText);
    setPitchCopied(true);
    setTimeout(() => setPitchCopied(false), 3000);
  }

  // Filter items locally for instant UI toggle
  const displayedRequests = requests.filter((r) => {
    if (!showWeakEvidence && r.is_weak_evidence) return false;
    if (!showFullTime && r.is_enterprise_full_time) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-24">bolt</span>
              <h1 className="text-xl font-bold text-on-surface">Client Requests</h1>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary text-xs font-bold">
                MAIN WORKING DESK
              </span>
            </div>
            <p className="text-xs text-subtext">
              Companies and people that need your skills (Wellfound, Contra, Hacker News and more)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleScan('hacker_news')}
              disabled={scanning !== null}
              className="px-3.5 py-1.5 rounded-control bg-primary-container hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-glow transition disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-16">{scanning === 'hacker_news' ? 'sync' : 'search'}</span>
              <span>{scanning === 'hacker_news' ? 'Scanning HN...' : 'Scan Hacker News'}</span>
            </button>

            <button
              onClick={() => handleScan('remotive')}
              disabled={scanning !== null}
              className="px-3 py-1.5 rounded-control bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-16">{scanning === 'remotive' ? 'sync' : 'travel_explore'}</span>
              <span>{scanning === 'remotive' ? 'Scanning...' : 'Scan Remotive'}</span>
            </button>

            <button
              onClick={() => setIsPasteModalOpen(true)}
              className="px-3 py-1.5 rounded-control bg-surface-container border border-outline-variant/40 hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <span className="material-symbols-outlined text-16">content_paste</span>
              <span>Paste Request</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-outline-variant/20">
          <div className="p-3 rounded-control bg-surface-container">
            <span className="text-[11px] text-subtext uppercase font-semibold block">Strong Matches</span>
            <span className="text-2xl font-bold text-secondary">{stats.strongMatches}</span>
            <span className="text-[10px] text-subtext block">Score ≥ 75 with quote</span>
          </div>
          <div className="p-3 rounded-control bg-surface-container">
            <span className="text-[11px] text-subtext uppercase font-semibold block">Contract / Freelance</span>
            <span className="text-2xl font-bold text-primary">{stats.contractFreelance}</span>
            <span className="text-[10px] text-subtext block">Solo builder project fit</span>
          </div>
          <div className="p-3 rounded-control bg-surface-container">
            <span className="text-[11px] text-subtext uppercase font-semibold block">Enterprise Full-Time</span>
            <span className="text-2xl font-bold text-subtext">{stats.enterpriseFullTime}</span>
            <span className="text-[10px] text-subtext block">Hidden by default (&gt;500)</span>
          </div>
          <div className="p-3 rounded-control bg-surface-container">
            <span className="text-[11px] text-subtext uppercase font-semibold block">Weak Evidence</span>
            <span className="text-2xl font-bold text-subtext">{stats.weakEvidence}</span>
            <span className="text-[10px] text-subtext block">Filtered out</span>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="bg-card border border-outline-variant/30 rounded-card p-4 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('contract')}
            className={`px-3 py-1.5 rounded-pill text-xs font-bold transition flex items-center gap-1.5 ${
              filterType === 'contract'
                ? 'bg-primary-container text-white shadow-glow'
                : 'bg-surface-container text-subtext hover:text-on-surface'
            }`}
          >
            <span>Contract / Freelance First</span>
            <span className="text-[10px] opacity-80">({stats.contractFreelance})</span>
          </button>

          <button
            onClick={() => setFilterType('strong')}
            className={`px-3 py-1.5 rounded-pill text-xs font-bold transition flex items-center gap-1.5 ${
              filterType === 'strong'
                ? 'bg-primary-container text-white shadow-glow'
                : 'bg-surface-container text-subtext hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-14 text-secondary">verified</span>
            <span>Strong Matches Only</span>
            <span className="text-[10px] opacity-80">({stats.strongMatches})</span>
          </button>

          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-pill text-xs font-bold transition flex items-center gap-1.5 ${
              filterType === 'all'
                ? 'bg-primary-container text-white shadow-glow'
                : 'bg-surface-container text-subtext hover:text-on-surface'
            }`}
          >
            <span>All Scored</span>
            <span className="text-[10px] opacity-80">({stats.total})</span>
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs text-subtext">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showFullTime}
              onChange={(e) => setShowFullTime(e.target.checked)}
              className="rounded border-outline-variant/40 bg-surface-container text-primary"
            />
            <span>Show full-time jobs</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showWeakEvidence}
              onChange={(e) => setShowWeakEvidence(e.target.checked)}
              className="rounded border-outline-variant/40 bg-surface-container text-primary"
            />
            <span>Show weak evidence</span>
          </label>
        </div>
      </section>

      {/* Main Leads List */}
      <section className="space-y-3">
        {loading ? (
          <div className="bg-card border border-outline-variant/30 rounded-card p-12 text-center text-xs text-subtext shadow-card">
            <span className="material-symbols-outlined text-28 animate-spin mb-2 block">sync</span>
            <span>Loading verified client requests...</span>
          </div>
        ) : displayedRequests.length === 0 ? (
          <div className="bg-card border border-outline-variant/30 rounded-card p-12 text-center text-xs text-subtext shadow-card space-y-2">
            <span className="material-symbols-outlined text-32 text-subtext block">search_off</span>
            <p className="font-semibold text-on-surface">No client requests match the current filter.</p>
            <p>Try clicking &quot;Scan Hacker News&quot; or enable &quot;Show full-time jobs&quot;.</p>
          </div>
        ) : (
          displayedRequests.map((lead) => {
            const isContract = lead.job_type === 'contract' || lead.job_type === 'freelance';
            return (
              <div
                key={lead.id}
                className="bg-card border border-outline-variant/30 rounded-card p-5 shadow-card hover:border-primary/40 transition space-y-3.5"
              >
                {/* Top Row: Platform, Job Type, Score */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/30 text-[11px] font-bold text-on-surface flex items-center gap-1">
                      <span className="material-symbols-outlined text-12 text-primary">hub</span>
                      <span>{lead.source_platform}</span>
                    </span>

                    {/* Job Type Chip */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isContract
                          ? 'bg-secondary-container/30 text-secondary border border-secondary/30'
                          : lead.job_type === 'part_time'
                          ? 'bg-tertiary-container/30 text-tertiary border border-tertiary/30'
                          : 'bg-surface-container text-subtext'
                      }`}
                    >
                      {lead.job_type === 'contract'
                        ? 'Contract / Freelance'
                        : lead.job_type === 'part_time'
                        ? 'Part-Time'
                        : lead.is_enterprise_full_time
                        ? 'Enterprise Full-Time'
                        : 'Full-Time'}
                    </span>

                    {lead.company_size && (
                      <span className="text-[10px] text-subtext">
                        • {lead.company_size}
                      </span>
                    )}

                    {lead.budget && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                        {lead.budget}
                      </span>
                    )}
                  </div>

                  {/* Match Score Badge */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-2.5 py-1 rounded-pill text-xs font-bold flex items-center gap-1 ${
                        lead.match_score >= 75
                          ? 'bg-secondary-container/20 text-secondary border border-secondary/30'
                          : lead.match_score >= 60
                          ? 'bg-primary-container/20 text-primary border border-primary/30'
                          : 'bg-surface-container text-subtext'
                      }`}
                    >
                      <span>Match {lead.match_score}/100</span>
                    </div>
                  </div>
                </div>

                {/* Company / Poster Identity */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div>
                    <span className="text-subtext">Company: </span>
                    <strong className="text-on-surface">{lead.company_name || 'Direct Client / Startup'}</strong>
                  </div>
                  <div>
                    <span className="text-subtext">Poster / User: </span>
                    <span className="font-mono text-on-surface">@{lead.platform_username || 'Not shown'}</span>
                  </div>
                  {lead.person_name && (
                    <div>
                      <span className="text-subtext">Contact: </span>
                      <span className="text-on-surface">{lead.person_name}</span>
                    </div>
                  )}
                </div>

                {/* The Need Quote */}
                <div className="p-3 rounded-control bg-surface-container border border-outline-variant/20 text-xs text-on-surface/90 font-mono leading-relaxed">
                  <p className="line-clamp-3">&ldquo;{lead.quote}&rdquo;</p>
                </div>

                {/* Why It Matched (2-3 bullets) */}
                {lead.why_matched && lead.why_matched.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-subtext">
                    <span className="font-semibold text-on-surface">Why matched:</span>
                    {lead.why_matched.map((bullet, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded-full text-subtext">
                        <span className="material-symbols-outlined text-12 text-secondary">check</span>
                        <span>{bullet}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Bottom Action Bar: Public Channels + Prepare Pitch */}
                <div className="pt-2 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* Public Channels (Strictly Only What Is Present) */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-subtext">Channels:</span>
                    {lead.channels.email && (
                      <a
                        href={`mailto:${lead.channels.email}`}
                        className="px-2 py-0.5 rounded bg-surface-container text-on-surface hover:text-primary transition flex items-center gap-1 text-[11px]"
                      >
                        <span className="material-symbols-outlined text-12">mail</span>
                        <span>{lead.channels.email}</span>
                      </a>
                    )}
                    {lead.channels.url && (
                      <a
                        href={lead.channels.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 rounded bg-surface-container text-on-surface hover:text-primary transition flex items-center gap-1 text-[11px]"
                      >
                        <span className="material-symbols-outlined text-12">open_in_new</span>
                        <span>Source Post</span>
                      </a>
                    )}
                    {lead.channels.twitter && (
                      <span className="px-2 py-0.5 rounded bg-surface-container text-subtext text-[11px]">
                        {lead.channels.twitter}
                      </span>
                    )}
                    {!lead.channels.email && !lead.channels.url && (
                      <span className="text-[11px] text-subtext italic">On-platform message only</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenPitch(lead)}
                    className="px-3.5 py-1.5 rounded-control bg-primary-container hover:bg-primary-hover text-white font-semibold transition flex items-center gap-1.5 shadow-glow"
                  >
                    <span className="material-symbols-outlined text-16">edit_note</span>
                    <span>Prepare Pitch</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Source Health Table (Part 1 Requirement) */}
      <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-20">health_and_safety</span>
            <h2 className="text-sm font-bold text-on-surface">Platform Source Health</h2>
          </div>
          <span className="text-xs text-subtext">Manual capture + Automatic live streams</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-outline-variant/20 text-subtext uppercase text-[10px]">
                <th className="py-2 px-3">Platform</th>
                <th className="py-2 px-3">Capture Mode</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Scan Frequency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
              {sourceHealth.map((src, i) => (
                <tr key={i} className="hover:bg-surface-container/50">
                  <td className="py-2 px-3 font-semibold">{src.name}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        src.type === 'Automatic'
                          ? 'bg-secondary-container/20 text-secondary'
                          : 'bg-surface-container text-subtext'
                      }`}
                    >
                      {src.type}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="inline-flex items-center gap-1 text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      <span>{src.status}</span>
                    </span>
                  </td>
                  <td className="py-2 px-3 text-subtext">{src.frequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pitch Popup Modal */}
      {selectedLeadForPitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-outline-variant/40 rounded-card max-w-2xl w-full p-6 shadow-glow space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div>
                <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-20">bolt</span>
                  <span>Proposal for {selectedLeadForPitch.company_name || selectedLeadForPitch.source_platform}</span>
                </h3>
                <p className="text-xs text-subtext mt-0.5">
                  Tailored to your verified Next.js, WellPredict &amp; AI automation track record
                </p>
              </div>
              <button
                onClick={() => setSelectedLeadForPitch(null)}
                className="text-subtext hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-20">close</span>
              </button>
            </div>

            {pitchLoading ? (
              <div className="py-12 text-center text-xs text-subtext space-y-2">
                <span className="material-symbols-outlined text-28 animate-spin block text-primary">sync</span>
                <span>Generating evidence-backed proposal...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  rows={9}
                  value={pitchText}
                  onChange={(e) => setPitchText(e.target.value)}
                  className="w-full p-4 rounded-control bg-surface-container border border-outline-variant/30 text-xs text-on-surface font-mono leading-relaxed focus:outline-none focus:border-primary-container"
                />

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleRegeneratePitch}
                    className="px-3 py-1.5 rounded-control bg-surface-container hover:bg-surface-container-high text-xs text-subtext hover:text-on-surface transition flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-16">refresh</span>
                    <span>Regenerate</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedLeadForPitch(null)}
                      className="px-3 py-1.5 rounded-control text-xs text-subtext hover:text-on-surface transition"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleCopyPitch}
                      className="px-4 py-1.5 rounded-control bg-primary-container hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-glow transition"
                    >
                      <span className="material-symbols-outlined text-16">
                        {pitchCopied ? 'check' : 'content_copy'}
                      </span>
                      <span>{pitchCopied ? 'Copied to Clipboard!' : 'Copy Proposal'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paste Post Modal */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-outline-variant/40 rounded-card max-w-xl w-full p-6 shadow-glow space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <h3 className="font-bold text-sm text-on-surface">Paste Client Request</h3>
              <button onClick={() => setIsPasteModalOpen(false)} className="text-subtext hover:text-on-surface">
                <span className="material-symbols-outlined text-20">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-subtext mb-1">Source Platform</label>
                <select
                  value={pastedPlatform}
                  onChange={(e) => setPastedPlatform(e.target.value)}
                  className="w-full p-2.5 rounded-control bg-surface-container border border-outline-variant/30 text-xs text-on-surface"
                >
                  <option value="Contra">Contra</option>
                  <option value="Wellfound">Wellfound</option>
                  <option value="Upwork">Upwork</option>
                  <option value="Catalant">Catalant</option>
                  <option value="Toptal">Toptal</option>
                  <option value="Hacker News">Hacker News</option>
                  <option value="Direct Inbound">Direct Inbound / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-subtext mb-1">Paste Job / Post Text</label>
                <textarea
                  rows={6}
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  placeholder="Paste client post here..."
                  className="w-full p-3 rounded-control bg-surface-container border border-outline-variant/30 text-xs text-on-surface font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsPasteModalOpen(false)}
                  className="px-3 py-1.5 rounded-control text-xs text-subtext hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasteSubmit}
                  className="px-4 py-1.5 rounded-control bg-primary-container text-white text-xs font-semibold shadow-glow"
                >
                  Analyze &amp; Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
