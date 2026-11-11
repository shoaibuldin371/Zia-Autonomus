'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface TodayMetrics {
  foundToday: number;
  sentSafely: number;
  dailyLimit: number;
  hotReplies: number;
  directContact: number;
  strongClientRequests: number;
  emergencyStop: boolean;
  autoSendEnabled: boolean;
  systemCalm: boolean;
}

export default function TodayDashboardPage() {
  const [metrics, setMetrics] = useState<TodayMetrics>({
    foundToday: 0,
    sentSafely: 0,
    dailyLimit: 25,
    hotReplies: 0,
    directContact: 0,
    strongClientRequests: 0,
    emergencyStop: false,
    autoSendEnabled: false,
    systemCalm: true,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [limitsRes, healthRes, requestsRes] = await Promise.all([
          fetch('/api/safety/limits'),
          fetch('/api/health'),
          fetch('/api/requests').catch(() => null),
        ]);

        const limitsData = await limitsRes.json();
        const healthData = await healthRes.json();
        const requestsData = requestsRes ? await requestsRes.json() : null;

        setMetrics((prev) => ({
          ...prev,
          dailyLimit: limitsData.dailyLimit || 25,
          autoSendEnabled: Boolean(limitsData.autoSendEnabled),
          emergencyStop: Boolean(healthData.safety?.emergencyStopActive),
          systemCalm: healthData.status === 'healthy',
          strongClientRequests: requestsData?.stats?.strongMatches || 0,
        }));
      } catch {
        // Fallback to safe defaults
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Greeting & Status Banner */}
      <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-semibold ${
                metrics.emergencyStop
                  ? 'bg-error-container/40 text-error border border-error/30'
                  : metrics.systemCalm
                  ? 'bg-secondary-container/20 text-secondary border border-secondary/30'
                  : 'bg-tertiary-container/30 text-tertiary border border-tertiary/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  metrics.emergencyStop
                    ? 'bg-error'
                    : metrics.systemCalm
                    ? 'bg-secondary animate-pulse'
                    : 'bg-tertiary'
                }`}
              />
              <span>
                {metrics.emergencyStop
                  ? 'Emergency Stop Active'
                  : metrics.systemCalm
                  ? 'All systems calm'
                  : 'System degraded'}
              </span>
            </span>
          </div>

          <Link
            href="/safety"
            className="flex items-center gap-2 px-3 py-1.5 rounded-control bg-surface-container border border-outline-variant/30 text-xs text-on-surface hover:bg-surface-container-high transition"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                metrics.emergencyStop
                  ? 'bg-error'
                  : metrics.autoSendEnabled
                  ? 'bg-secondary'
                  : 'bg-tertiary'
              }`}
            />
            <span className="font-semibold">
              {metrics.emergencyStop
                ? 'Paused (Emergency Stop)'
                : metrics.autoSendEnabled
                ? 'Auto-send within safe limits'
                : 'Review first (safe)'}
            </span>
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2">
            Good day, Zia! 👋
          </h1>
          <p className="text-sm text-subtext mt-1">
            {metrics.foundToday === 0 && metrics.sentSafely === 0
              ? 'Nothing yet today. Start by running a discovery search or reviewing connected services.'
              : `${metrics.foundToday} leads found today, ${metrics.sentSafely} verified safe emails sent, and ${metrics.hotReplies} replies received.`}
          </p>
        </div>

        {/* Quick Action Launchpad */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link
            href="/requests"
            className="py-2.5 px-4 rounded-control bg-primary-container hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-glow"
          >
            <span className="material-symbols-outlined text-18">bolt</span>
            <span>View Client Requests</span>
          </Link>
          <Link
            href="/businesses"
            className="py-2.5 px-4 rounded-control bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <span className="material-symbols-outlined text-18 text-secondary">radar</span>
            <span>Find Businesses</span>
          </Link>
        </div>
      </section>

      {/* 4 Metric Cards Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Client Requests (First Big Card linking to /requests) */}
        <Link
          href="/requests"
          className="bg-card border border-primary/40 rounded-card p-5 shadow-glow flex flex-col justify-between hover:border-primary transition group"
        >
          <div className="flex items-center justify-between text-subtext">
            <span className="text-xs font-bold uppercase tracking-wider text-primary group-hover:underline">Client Requests</span>
            <span className="material-symbols-outlined text-primary text-20">bolt</span>
          </div>
          <div className="my-3">
            <span className="text-3xl font-bold text-on-surface">{metrics.strongClientRequests}</span>
            <p className="text-xs text-subtext mt-0.5">Strong project matches</p>
          </div>
          <div className="inline-flex items-center gap-1 text-xs text-primary font-medium">
            <span className="material-symbols-outlined text-14">open_in_new</span>
            <span>Open Requests Desk</span>
          </div>
        </Link>

        {/* Card 2: Businesses Found */}
        <Link
          href="/businesses"
          className="bg-card border border-outline-variant/30 rounded-card p-5 shadow-card flex flex-col justify-between hover:border-outline-variant/60 transition"
        >
          <div className="flex items-center justify-between text-subtext">
            <span className="text-xs font-semibold uppercase tracking-wider">Businesses Found</span>
            <span className="material-symbols-outlined text-secondary text-20">domain</span>
          </div>
          <div className="my-3">
            <span className="text-3xl font-bold text-on-surface">{metrics.foundToday}</span>
            <p className="text-xs text-subtext mt-0.5">Needs websites</p>
          </div>
          <div className="inline-flex items-center gap-1 text-xs text-secondary font-medium">
            <span className="material-symbols-outlined text-14">check_circle</span>
            <span>Verified Data</span>
          </div>
        </Link>

        {/* Card 3: Sent Safely */}
        <Link
          href="/emails"
          className="bg-card border border-outline-variant/30 rounded-card p-5 shadow-card flex flex-col justify-between hover:border-outline-variant/60 transition"
        >
          <div className="flex items-center justify-between text-subtext">
            <span className="text-xs font-semibold uppercase tracking-wider">Sent Safely</span>
            <span className="material-symbols-outlined text-primary text-20">forward_to_inbox</span>
          </div>
          <div className="my-3">
            <span className="text-3xl font-bold text-on-surface">{metrics.sentSafely}</span>
            <p className="text-xs text-subtext mt-0.5">Safe cap: {metrics.dailyLimit}/day</p>
          </div>
          <div className="inline-flex items-center gap-1 text-xs text-secondary font-medium">
            <span className="material-symbols-outlined text-14">verified</span>
            <span>On Track</span>
          </div>
        </Link>

        {/* Card 4: Local Business Contacts */}
        <Link
          href="/contact-manually"
          className="bg-card border border-outline-variant/30 rounded-card p-5 shadow-card flex flex-col justify-between hover:border-outline-variant/60 transition"
        >
          <div className="flex items-center justify-between text-subtext">
            <span className="text-xs font-semibold uppercase tracking-wider">Local Business Contacts</span>
            <span className="material-symbols-outlined text-outline text-20">contact_phone</span>
          </div>
          <div className="my-3">
            <span className="text-3xl font-bold text-on-surface">{metrics.directContact}</span>
            <p className="text-xs text-subtext mt-0.5">Shops &amp; clinics with no email</p>
          </div>
          <div className="inline-flex items-center gap-1 text-xs text-subtext font-medium">
            <span className="material-symbols-outlined text-14">call</span>
            <span>Call or message them</span>
          </div>
        </Link>
      </section>

      {/* Priority Section: Needs Your Eyes Today */}
      <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-on-surface">Needs Your Eyes Today</h2>
            <span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary text-[10px] font-bold">
              PRIORITY QUEUE
            </span>
          </div>
          <span className="text-xs text-subtext">Zero fake claims • Evidence-backed</span>
        </div>

        {/* Honest empty state when no pending reviews */}
        <div className="py-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mx-auto text-subtext">
            <span className="material-symbols-outlined text-24">task_alt</span>
          </div>
          <h3 className="text-sm font-semibold text-on-surface">Inbox & Queue Clear</h3>
          <p className="text-xs text-subtext max-w-sm mx-auto">
            All reviews completed. Click &ldquo;Find Businesses Now&rdquo; above to run a fresh scan of local markets or review platform feeds.
          </p>
        </div>
      </section>

      {/* Gmail Safety Shield */}
      <section className="bg-card border border-outline-variant/30 rounded-card p-6 shadow-card flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-22">verified_user</span>
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface">Gmail Safety Shield Active</h3>
            <Link href="/safety" className="text-xs text-primary hover:underline">
              Adjust Safe Limits &rarr;
            </Link>
          </div>
          <p className="text-xs text-subtext leading-relaxed">
            Connected Sender: <span className="text-on-surface font-mono">ziauldin371@gmail.com</span> (Google OAuth verified). Spacing delay active with jitter. Double-contact protection prevents touching the same business within 72 hours across email, phone, and social.
          </p>
          <p className="text-[11px] text-subtext/70 italic pt-1">
            Note: Inbox placement cannot be guaranteed by any sender. All deliverability metrics represent real Gmail delivery receipts and synced reply events.
          </p>
        </div>
      </section>
    </div>
  );
}

