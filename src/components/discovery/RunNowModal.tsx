'use client';

import React, { useState } from 'react';

interface RunNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunComplete?: () => void;
}

export function RunNowModal({ isOpen, onClose, onRunComplete }: RunNowModalProps) {
  const [country, setCountry] = useState('UK');
  const [city, setCity] = useState('Manchester');
  const [industry, setIndustry] = useState('dentists');
  const [maxLeads, setMaxLeads] = useState(5);
  const [mode, setMode] = useState<'find_only' | 'find_and_draft'>('find_and_draft');
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleStartDiscovery() {
    setLoading(true);
    setError(null);
    setResultMessage(null);
    setSteps(['Connecting to Google Places API...', 'Searching for local businesses...', 'Verifying mobile performance and websites...']);

    try {
      const res = await fetch('/api/discovery/run-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, city, industry, maxLeads, mode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Discovery execution failed.');
        setLoading(false);
        return;
      }

      setSteps((prev) => [...prev, 'Scoring opportunities...', 'Drafting evidence-backed pitches for Zia review...', 'Done!']);
      setResultMessage(data.summary?.message || 'Discovery run completed successfully.');
      if (onRunComplete) onRunComplete();
    } catch {
      setError('Network communication failed during discovery.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-outline-variant/30 rounded-card p-6 shadow-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-24">radar</span>
            <h2 className="text-lg font-bold text-on-surface">Find Businesses Now</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-control text-subtext hover:text-on-surface hover:bg-surface-container transition"
          >
            <span className="material-symbols-outlined text-20">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-control bg-error-container/40 border border-error/30 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-18">error</span>
            <span>{error}</span>
          </div>
        )}

        {resultMessage && (
          <div className="mb-4 p-3 rounded-control bg-secondary-container/20 border border-secondary/30 text-secondary text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-18">check_circle</span>
            <span>{resultMessage}</span>
          </div>
        )}

        {!loading && !resultMessage ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-1">
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 rounded-control bg-surface-container border border-outline-variant/40 text-on-surface text-sm"
                >
                  <option value="UK">United Kingdom</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="UAE">United Arab Emirates</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Manchester, London, Austin"
                  className="w-full px-3 py-2 rounded-control bg-surface-container border border-outline-variant/40 text-on-surface text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-1">
                Target Industry
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. dentists, plumbers, roofers, clinics"
                className="w-full px-3 py-2 rounded-control bg-surface-container border border-outline-variant/40 text-on-surface text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-1">
                  Max Leads
                </label>
                <select
                  value={maxLeads}
                  onChange={(e) => setMaxLeads(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-control bg-surface-container border border-outline-variant/40 text-on-surface text-sm"
                >
                  <option value={5}>5 leads (Quick batch)</option>
                  <option value={10}>10 leads (Standard)</option>
                  <option value={20}>20 leads (Full page)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-1">
                  Mode
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as 'find_only' | 'find_and_draft')}
                  className="w-full px-3 py-2 rounded-control bg-surface-container border border-outline-variant/40 text-on-surface text-sm"
                >
                  <option value="find_and_draft">Find & Draft Pitch (Safe)</option>
                  <option value="find_only">Find Only (Inspection)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartDiscovery}
                className="w-full py-2.5 px-4 rounded-control bg-primary-container hover:bg-primary-hover text-white font-medium text-sm transition shadow-glow flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-18">bolt</span>
                <span>Execute Search Now</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-3">
            <div className="space-y-2">
              {steps.map((st, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-on-surface/90">
                  <span className="material-symbols-outlined text-primary text-16">
                    {i === steps.length - 1 && loading ? 'progress_activity' : 'check_circle'}
                  </span>
                  <span>{st}</span>
                </div>
              ))}
            </div>

            {!loading && (
              <button
                onClick={onClose}
                className="w-full mt-4 py-2 rounded-control bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-medium transition"
              >
                Close & View Results
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
