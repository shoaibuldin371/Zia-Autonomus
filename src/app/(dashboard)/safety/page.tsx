'use client';

import React, { useState, useEffect } from 'react';

export default function SafetyAndRulesPage() {
  const [dailyLimit, setDailyLimit] = useState(25);
  const [spacingMinutes, setSpacingMinutes] = useState(6);
  const [autoSendEnabled, setAutoSendEnabled] = useState(false);
  const [emergencyStop, setEmergencyStop] = useState(false);
  const [hardCeiling, setHardCeiling] = useState(50);
  const [testConfirmed, setTestConfirmed] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadLimits() {
      try {
        const [limitsRes, stopRes] = await Promise.all([
          fetch('/api/safety/limits'),
          fetch('/api/safety/emergency-stop'),
        ]);

        const limitsData = await limitsRes.json();
        const stopData = await stopRes.json();

        setDailyLimit(limitsData.dailyLimit || 25);
        setSpacingMinutes(limitsData.spacingMinutes || 6);
        setAutoSendEnabled(Boolean(limitsData.autoSendEnabled));
        setTestConfirmed(Boolean(limitsData.testConfirmed));
        setHardCeiling(limitsData.hardCeiling || 50);
        setEmergencyStop(Boolean(stopData.active));
      } catch {
        // Fallback
      }
    }
    loadLimits();
  }, []);

  async function handleToggleEmergencyStop() {
    const nextState = !emergencyStop;
    try {
      const res = await fetch('/api/safety/emergency-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextState }),
      });
      if (res.ok) {
        setEmergencyStop(nextState);
        setStatusMessage(
          nextState
            ? 'Emergency Stop is now ACTIVE. All discovery and email sending suspended immediately.'
            : 'Emergency Stop DEACTIVATED. System normal.'
        );
      }
    } catch {
      setErrorMessage('Failed to communicate with emergency stop service.');
    }
  }

  async function handleSendTestEmail() {
    setSendingTest(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/emails/send-test', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setTestConfirmed(true);
        setStatusMessage(
          `Success: Test email dispatched to ziauldin371@gmail.com and verified with messageId ${data.result?.gmailMessageId} (SENT label confirmed).`
        );
      } else {
        setErrorMessage(data.error || 'Failed to dispatch test email.');
      }
    } catch {
      setErrorMessage('Network communication error sending test email.');
    } finally {
      setSendingTest(false);
    }
  }

  async function handleSaveSettings() {
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/safety/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyLimit,
          spacingMinutes,
          autoSendEnabled,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to update safety guardrails.');
        return;
      }

      setStatusMessage('Safety limits and sending policies saved successfully.');
    } catch {
      setErrorMessage('Network communication failed saving settings.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Banners */}
      {statusMessage && (
        <div className="p-4 rounded-card bg-secondary-container/20 border border-secondary/30 text-secondary text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-18">check_circle</span>
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-card bg-error-container/30 border border-error/30 text-error text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-18">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Guardian Shield Status Card */}
      <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                emergencyStop
                  ? 'bg-error-container/30 text-error'
                  : 'bg-secondary-container/20 text-secondary'
              }`}
            >
              <span className="material-symbols-outlined text-28">
                {emergencyStop ? 'gpp_bad' : 'verified_user'}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-on-surface">Guardian Safety Shield</h1>
              <p className="text-xs text-subtext mt-0.5">
                Operator: <span className="text-on-surface font-mono">ziauldin371@gmail.com</span> (USA)
              </p>
            </div>
          </div>

          {/* Emergency Stop Button */}
          <button
            onClick={handleToggleEmergencyStop}
            className={`px-4 py-2.5 rounded-control font-bold text-xs flex items-center gap-2 transition shadow-card ${
              emergencyStop
                ? 'bg-secondary-container hover:bg-secondary text-white'
                : 'bg-error-container hover:bg-error text-white'
            }`}
          >
            <span className="material-symbols-outlined text-18">
              {emergencyStop ? 'play_arrow' : 'dangerous'}
            </span>
            <span>{emergencyStop ? 'Resume System Operations' : 'Emergency Stop Everything'}</span>
          </button>
        </div>

        <p className="text-xs text-subtext leading-relaxed">
          The Guardian Shield enforces 10 separate automated guardrails before any email is dispatched. All claims must be backed by stored technical observations.
        </p>
      </section>

      {/* Test Email Verification Card */}
      <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-on-surface">Send 1 Test Email to Myself</h2>
            <p className="text-xs text-subtext mt-0.5">
              Dispatches a live test message to <span className="font-mono text-primary">ziauldin371@gmail.com</span> and verifies Google messageId & SENT label.
            </p>
          </div>

          <button
            onClick={handleSendTestEmail}
            disabled={sendingTest || emergencyStop}
            className="px-4 py-2 rounded-control bg-primary-container hover:bg-primary-hover text-white text-xs font-semibold shadow-glow flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {sendingTest ? (
              <>
                <span className="material-symbols-outlined animate-spin text-16">progress_activity</span>
                <span>Verifying with Gmail...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-16">mark_email_read</span>
                <span>Send 1 Test Email</span>
              </>
            )}
          </button>
        </div>

        {testConfirmed && (
          <div className="p-3 rounded-control bg-surface-container border border-secondary/30 text-xs text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-16">check</span>
            <span>Live Gmail test confirmed. Auto-send toggle is unlocked.</span>
          </div>
        )}
      </section>

      {/* Guardrails Configuration */}
      <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card space-y-5">
        <h2 className="text-base font-bold text-on-surface">Sending Guardrails & Policy Steppers</h2>

        {/* Daily Email Limit Stepper */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-control bg-surface-container border border-outline-variant/20">
          <div>
            <label className="text-xs font-bold text-on-surface block">Daily Email Speed Limit</label>
            <p className="text-xs text-subtext mt-0.5">
              Safe conservative limit (Default 25/day, hard ceiling {hardCeiling} from env).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDailyLimit((prev) => Math.max(5, prev - 5))}
              className="w-8 h-8 rounded-control bg-surface-container-high hover:bg-surface-container-highest text-on-surface flex items-center justify-center font-bold"
            >
              -
            </button>
            <span className="text-base font-bold text-on-surface font-mono w-12 text-center">{dailyLimit}</span>
            <button
              onClick={() => setDailyLimit((prev) => Math.min(hardCeiling, prev + 5))}
              className="w-8 h-8 rounded-control bg-surface-container-high hover:bg-surface-container-highest text-on-surface flex items-center justify-center font-bold"
            >
              +
            </button>
          </div>
        </div>

        {/* Spacing Profile */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-control bg-surface-container border border-outline-variant/20">
          <div>
            <label className="text-xs font-bold text-on-surface block">Spacing Profile Between Emails</label>
            <p className="text-xs text-subtext mt-0.5">
              Spreads sends out to look like normal deliberate typing and protect sender reputation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[4, 6, 10].map((mins) => (
              <button
                key={mins}
                onClick={() => setSpacingMinutes(mins)}
                className={`px-3 py-1.5 rounded-control text-xs font-semibold transition ${
                  spacingMinutes === mins
                    ? 'bg-primary-container text-white shadow-glow'
                    : 'bg-surface-container-high text-subtext hover:text-on-surface'
                }`}
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>

        {/* Auto-Send Switch */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-control bg-surface-container border border-outline-variant/20">
          <div>
            <label className="text-xs font-bold text-on-surface block">Automatic Sending Mode</label>
            <p className="text-xs text-subtext mt-0.5">
              Default is &ldquo;Review first (safe)&rdquo;. Auto-send requires confirmed live test email.
            </p>
          </div>
          <button
            onClick={() => {
              if (!testConfirmed && !autoSendEnabled) {
                setErrorMessage('You must confirm a live test email to yourself first before enabling auto-send.');
                return;
              }
              setAutoSendEnabled(!autoSendEnabled);
            }}
            className={`px-3 py-1.5 rounded-pill text-xs font-bold transition flex items-center gap-1.5 ${
              autoSendEnabled
                ? 'bg-secondary-container text-white shadow-glow'
                : 'bg-surface-container-high text-subtext'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoSendEnabled ? 'bg-white' : 'bg-subtext'}`} />
            <span>{autoSendEnabled ? 'Auto-send ON' : 'Review First (Safe)'}</span>
          </button>
        </div>

        {/* Save Guardrails Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="px-5 py-2 rounded-control bg-primary-container hover:bg-primary-hover text-white text-xs font-semibold shadow-glow transition"
          >
            Save Guardrail Policy
          </button>
        </div>
      </section>
    </div>
  );
}

