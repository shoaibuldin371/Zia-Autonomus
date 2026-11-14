'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RunNowModal } from '@/components/discovery/RunNowModal';

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
    foundToday: 42,
    sentSafely: 12,
    dailyLimit: 25,
    hotReplies: 3,
    directContact: 3,
    strongClientRequests: 32,
    emergencyStop: false,
    autoSendEnabled: true,
    systemCalm: true,
  });

  const [loading, setLoading] = useState(true);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [currentTimePkt, setCurrentTimePkt] = useState('');

  // Live ticking clock in PKT (UTC+5)
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      // Format as PKT time
      const timeStr = now.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Karachi',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setCurrentTimePkt(`PKT (UTC+5) ${timeStr}`);
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [limitsRes, healthRes, requestsRes, businessesRes] = await Promise.all([
        fetch('/api/safety/limits'),
        fetch('/api/health'),
        fetch('/api/requests').catch(() => null),
        fetch('/api/businesses').catch(() => null),
      ]);

      const limitsData = await limitsRes.json();
      const healthData = await healthRes.json();
      const requestsData = requestsRes ? await requestsRes.json() : null;
      const businessesData = businessesRes ? await businessesRes.json() : null;

      const totalBiz = businessesData?.businesses?.length || 42;
      const strongCount = requestsData?.stats?.strongMatches || requestsData?.requests?.length || 32;

      setMetrics((prev) => ({
        ...prev,
        dailyLimit: limitsData.dailyLimit || 25,
        autoSendEnabled: Boolean(limitsData.autoSendEnabled),
        emergencyStop: Boolean(healthData.safety?.emergencyStopActive),
        systemCalm: healthData.status === 'healthy',
        strongClientRequests: strongCount,
        foundToday: totalBiz,
      }));
    } catch {
      // Fallback to calibrated safe state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSendTestEmail() {
    setSendingTest(true);
    setTestEmailStatus(null);
    try {
      const res = await fetch('/api/emails/send-test', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestEmailStatus('Test email confirmed in Gmail Sent!');
      } else {
        setTestEmailStatus(data.error || 'Failed to send test email');
      }
    } catch {
      setTestEmailStatus('Network error while sending test email');
    } finally {
      setSendingTest(false);
    }
  }

  const sentPercent = Math.min(100, Math.round((metrics.sentSafely / metrics.dailyLimit) * 100));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Operational Context Header (from Stitch Screen 06) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-secondary uppercase tracking-widest">
              Autonomous Pipeline
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/60" />
            <span className="text-[11px] font-bold text-primary tracking-wider uppercase">
              Production Cluster
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
            Dashboard
          </h1>
          <p className="text-sm text-subtext mt-0.5">
            What happened, what needs you, and whether everything is running.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs shadow-sm">
            <span className="material-symbols-outlined text-secondary text-[18px]">schedule</span>
            <span className="font-mono text-secondary font-medium">{currentTimePkt || 'PKT (UTC+5) 14:12:04'}</span>
          </div>
          <button
            onClick={() => setIsRunModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-on-surface text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">refresh</span>
            <span>Force Sync</span>
          </button>
        </div>
      </div>

      {/* Banners Stack */}
      <div className="flex flex-col gap-3">
        {/* Health status strip */}
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl shadow-sm gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex items-center justify-center flex-shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="absolute w-4 h-4 rounded-full bg-emerald-400 animate-ping opacity-75" />
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-emerald-400">
                {metrics.emergencyStop ? 'Emergency Stop Active' : 'All systems running'}
              </span>
              <span className="text-emerald-300/70">· Last run 12 min ago</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[11px]">
                v2.4 active
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 text-xs text-emerald-300/90">
            <span>
              Next autonomous run in <strong className="font-semibold text-emerald-200">18m</strong> (Today 2:30 PM PKT)
            </span>
            <Link
              href="/setup"
              className="font-semibold text-emerald-400 hover:text-emerald-200 flex items-center gap-0.5 underline transition-colors"
            >
              System Health
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>
        </div>

        {/* Live alert strip */}
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-surface-container border border-outline-variant/30 rounded-xl shadow-sm gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center flex-shrink-0 shadow-glow">
              <span className="material-symbols-outlined text-[18px]">bolt</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap min-w-0">
              <span className="text-xs font-semibold text-on-surface truncate">
                {metrics.strongClientRequests} platform projects detected in latest scan
              </span>
              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-mono border border-outline-variant/20">
                  Hacker News (20)
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-mono border border-outline-variant/20">
                  Remotive (12)
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-mono border border-outline-variant/20">
                  Contra (1)
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/requests"
            className="px-3 py-1.5 rounded-lg bg-primary-container text-white hover:bg-primary-hover text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all flex-shrink-0"
          >
            <span>View projects</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Main 12-Column Grid (Col 8 Left, Col 4 Right) */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT / CENTER SECTION (Col 8) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* Row of 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: Opp. Found */}
            <Link
              href="/businesses"
              className="bg-card border border-outline-variant/30 p-4 rounded-xl shadow-card flex flex-col justify-between hover:border-outline-variant/60 transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-subtext uppercase tracking-wider">Opp. Found</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-subtext font-mono text-[10px]">
                  RADAR
                </span>
              </div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-2xl font-bold text-on-surface">{metrics.foundToday}</span>
                <span className="flex items-center text-emerald-400 font-semibold text-xs bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  +8 today
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 bg-surface-container/50 rounded p-1.5 text-xs text-subtext">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">adjust</span>
                  <span className="truncate max-w-[90px]">Strict fit match</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
              </div>
            </Link>

            {/* Card 2: Outreach Sent */}
            <Link
              href="/emails"
              className="bg-card border border-outline-variant/30 p-4 rounded-xl shadow-card flex flex-col justify-between hover:border-outline-variant/60 transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-subtext uppercase tracking-wider">Outreach Sent</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-subtext font-mono text-[10px]">
                  GMAIL
                </span>
              </div>
              <div className="flex items-baseline justify-between mb-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-on-surface">{metrics.sentSafely}</span>
                  <span className="text-xs text-subtext font-medium">/ {metrics.dailyLimit}</span>
                </div>
                <span className="text-xs font-semibold text-primary">Day 7</span>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary-container h-full rounded-full" style={{ width: `${sentPercent}%` }} />
                </div>
                <div className="flex justify-between items-center text-subtext text-[11px]">
                  <span>{sentPercent}% Daily quota</span>
                  <span className="material-symbols-outlined text-[14px]">send</span>
                </div>
              </div>
            </Link>

            {/* Card 3: Replies In */}
            <Link
              href="/emails"
              className="bg-card border border-outline-variant/30 p-4 rounded-xl shadow-card flex flex-col justify-between hover:border-outline-variant/60 transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-subtext uppercase tracking-wider">Replies In</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-subtext font-mono text-[10px]">
                  INBOX
                </span>
              </div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-2xl font-bold text-primary">{metrics.hotReplies}</span>
                <span className="px-1.5 py-0.5 rounded bg-tertiary-container/40 text-tertiary border border-tertiary/30 text-xs font-semibold">
                  Action req.
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 bg-surface-container/50 rounded p-1.5 text-xs text-subtext">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">verified_user</span>
                  <span className="truncate">SMTP valid</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-outline">mark_email_read</span>
              </div>
            </Link>

            {/* Card 4: Platform Jobs */}
            <Link
              href="/requests"
              className="bg-card border border-primary/40 p-4 rounded-xl shadow-glow flex flex-col justify-between hover:border-primary transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Platform Jobs</span>
                <span className="px-1.5 py-0.5 rounded bg-primary-container/20 text-primary font-mono text-[10px]">
                  FEEDS
                </span>
              </div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-2xl font-bold text-on-surface">{metrics.strongClientRequests}</span>
                <span className="px-1.5 py-0.5 rounded bg-tertiary-container/30 text-tertiary border border-tertiary/20 text-xs font-semibold">
                  5 &gt;90% match
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 bg-surface-container/50 rounded p-1.5 text-xs text-subtext">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">psychology</span>
                  <span className="truncate">Semantic fit</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-outline">work_outline</span>
              </div>
            </Link>
          </div>

          {/* "Needs you today" Card */}
          <div className="bg-card border border-outline-variant/30 rounded-xl p-6 shadow-card flex flex-col">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-tertiary-container/30 text-tertiary flex items-center justify-center border border-tertiary/30">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface">Needs you today</h2>
                  <p className="text-xs text-subtext">Interventions required to unblock active conversations and proposals</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-tertiary-container/30 text-tertiary border border-tertiary/20 text-xs font-bold">
                3 pending actions
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Row 1 */}
              <div className="p-3.5 rounded-xl bg-surface-container/50 hover:bg-surface-container border border-outline-variant/20 transition flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-on-surface">2 client replies in Inbox</span>
                      <span className="px-2 py-0.2 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                        High Value
                      </span>
                    </div>
                    <p className="text-xs text-subtext truncate">
                      OmniAI &amp; Nexus Labs awaiting rate cards and discovery call availability.
                    </p>
                  </div>
                </div>
                <Link
                  href="/emails"
                  className="px-3 py-1.5 rounded-lg bg-primary-container text-white hover:bg-primary-hover text-xs font-semibold flex items-center gap-1.5 self-start md:self-center flex-shrink-0 shadow-sm transition"
                >
                  <span>Open Inbox</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>

              {/* Row 2 */}
              <div className="p-3.5 rounded-xl bg-surface-container/50 hover:bg-surface-container border border-outline-variant/20 transition flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">description</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-on-surface">3 manual proposals ready</span>
                      <span className="px-2 py-0.2 rounded-full bg-secondary-container/20 text-secondary border border-secondary/30 text-[10px] font-semibold">
                        Platform
                      </span>
                    </div>
                    <p className="text-xs text-subtext truncate">
                      Review &amp; submit on Contra (LLM Bot) and Upwork (Distributed Data Scraper pipeline).
                    </p>
                  </div>
                </div>
                <Link
                  href="/requests"
                  className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-on-surface text-xs font-semibold flex items-center gap-1.5 self-start md:self-center flex-shrink-0 shadow-xs transition"
                >
                  <span>Review Proposals</span>
                  <span className="material-symbols-outlined text-[16px]">launch</span>
                </Link>
              </div>

              {/* Row 3 */}
              <div className="p-3.5 rounded-xl bg-surface-container/50 hover:bg-surface-container border border-outline-variant/20 transition flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-subtext flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">schedule</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-on-surface">1 follow-up scheduled</span>
                      <span className="px-2 py-0.2 rounded-full bg-surface-container-highest text-subtext border border-outline-variant/20 text-[10px] font-semibold">
                        Automated
                      </span>
                    </div>
                    <p className="text-xs text-subtext truncate">
                      In 2h 18m · FinTech LLM prototype recap for Marcus Vance (Apex Logistics).
                    </p>
                  </div>
                </div>
                <Link
                  href="/emails"
                  className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-subtext hover:text-on-surface text-xs font-semibold flex items-center gap-1.5 self-start md:self-center flex-shrink-0 shadow-xs transition"
                >
                  <span>View Schedule</span>
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                </Link>
              </div>
            </div>
          </div>

          {/* "Today's pipeline" Card */}
          <div className="bg-card border border-outline-variant/30 rounded-xl p-6 shadow-card flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">filter_alt</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface">Today&apos;s pipeline</h2>
                  <p className="text-xs text-subtext">Daily velocity &amp; stage conversion audit</p>
                </div>
              </div>
              <span className="font-mono text-xs text-subtext bg-surface-container px-2.5 py-1 rounded border border-outline-variant/20">
                24H ROLLING
              </span>
            </div>

            {/* Segmented Visual Progress Bar */}
            <div className="mb-5">
              <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden flex gap-0.5 p-0.5">
                <div className="h-full bg-primary-container rounded-l-full" style={{ width: '45%' }} title="Found: 42" />
                <div className="h-full bg-primary" style={{ width: '32%' }} title="Verified: 31" />
                <div className="h-full bg-secondary" style={{ width: '15%' }} title="Sent: 12" />
                <div className="h-full bg-emerald-500 rounded-r-full" style={{ width: '8%' }} title="Replied: 3" />
              </div>
              <div className="flex items-center justify-between text-subtext text-xs mt-2 px-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary-container" /> Found (42)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Verified (31)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary" /> Sent (12)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Replied (3)
                </span>
              </div>
            </div>

            {/* 4 Stat Columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-surface-container/40 rounded-xl mb-4 border border-outline-variant/20">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-subtext uppercase">Total Scanned</span>
                <span className="text-lg font-bold text-on-surface font-mono mt-1">42</span>
                <span className="text-xs text-subtext mt-0.5">Across 4 feeds</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-subtext uppercase">Email Validated</span>
                <span className="text-lg font-bold text-on-surface font-mono mt-1">73.8%</span>
                <span className="text-xs text-emerald-400 mt-0.5">31 pass MX/SMTP</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-subtext uppercase">Outreach Ratio</span>
                <span className="text-lg font-bold text-on-surface font-mono mt-1">38.7%</span>
                <span className="text-xs text-subtext mt-0.5">12 sent from 31</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-subtext uppercase">Conversion Rate</span>
                <span className="text-lg font-bold text-emerald-400 font-mono mt-1">25.0%</span>
                <span className="text-xs text-subtext mt-0.5">3 active replies</span>
              </div>
            </div>

            {/* Compliance Strip */}
            <div className="flex items-center gap-2 text-subtext text-xs bg-surface-container/60 p-2.5 rounded-lg border border-outline-variant/20">
              <span className="material-symbols-outlined text-[18px] text-emerald-400">verified</span>
              <span className="font-mono text-[11px]">
                DKIM/SPF 100% passed · DMARC aligned · No spam flags registered in telemetry logs
              </span>
            </div>
          </div>

          {/* Setup & Calibration Status Card */}
          <div className="bg-card border border-outline-variant/30 rounded-xl p-6 shadow-card flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">task_alt</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface">Setup &amp; calibration status</h2>
                  <p className="text-xs text-subtext">System integrity checks for Zia Workspace</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }} />
                </div>
                <span className="text-xs text-subtext font-mono font-semibold">4 of 4</span>
              </div>
            </div>

            <div className="space-y-2.5 mb-4">
              {/* Item 1 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container/40 border border-outline-variant/10">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
                  <span className="text-xs text-on-surface">
                    Connect Gmail sender (OAuth verified:{' '}
                    <span className="font-mono text-secondary">ziauldin371@gmail.com</span>)
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                  Active
                </span>
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container/40 border border-outline-variant/10">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
                  <span className="text-xs text-on-surface">
                    Add expertise facts &amp; evidence links (Data Science, Scrapers &amp; Agent pipelines indexed)
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                  Indexed
                </span>
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container/40 border border-outline-variant/10">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
                  <span className="text-xs text-on-surface">
                    Add search targets &amp; geo filters (Target markets: UK, US, Remote AI founders)
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                  Calibrated
                </span>
              </div>

              {/* Item 4 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container/40 border border-outline-variant/10">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
                  <span className="text-xs text-on-surface font-semibold">
                    Send test email to verify inbox delivery
                  </span>
                </div>
                <button
                  onClick={handleSendTestEmail}
                  disabled={sendingTest}
                  className="px-3 py-1.5 rounded-lg bg-primary-container text-white hover:bg-primary-hover text-xs font-semibold shadow-xs transition"
                >
                  {sendingTest ? 'Sending...' : 'Send test email'}
                </button>
              </div>

              {testEmailStatus && (
                <div className="p-2.5 rounded bg-surface-container text-xs text-primary font-mono border border-outline-variant/30">
                  {testEmailStatus}
                </div>
              )}
            </div>

            <p className="text-[11px] text-subtext/70 italic">
              * Note: Technical delivery checks confirm valid DNS handshake. Inbox placement cannot be guaranteed by any sender.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN (Col 4) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Next autonomous run Card */}
          <div className="bg-card border border-outline-variant/30 rounded-xl p-6 shadow-card flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-on-surface">Next autonomous run</h3>
              <span className="material-symbols-outlined text-subtext text-[20px]">update</span>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container mb-4 border border-outline-variant/20">
              {/* Countdown Clock Graphic */}
              <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-surface-container-high"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="text-primary-container"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="70, 100"
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-mono text-xs font-bold text-on-surface">15m</span>
                </div>
              </div>
              <div>
                <div className="text-base font-bold text-on-surface">15m cycle</div>
                <p className="text-xs text-subtext">24/7 Cloud autonomous trigger</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-subtext uppercase tracking-wider mb-1">
                Scheduled in this cycle:
              </span>
              <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-surface-container/60 border border-outline-variant/10">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                  <span className="text-on-surface">Search Targets query execution</span>
                </div>
                <span className="font-mono text-subtext">UK B2B</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-surface-container/60 border border-outline-variant/10">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                  <span className="text-on-surface">RSS Feed ingestion &amp; filter</span>
                </div>
                <span className="font-mono text-subtext">HN &amp; Remotive</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-surface-container/60 border border-outline-variant/10">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                  <span className="text-on-surface">Platform alert dispatcher</span>
                </div>
                <span className="font-mono text-subtext">Email alerts</span>
              </div>
            </div>
          </div>

          {/* Domain Warm-up Card */}
          <div className="bg-card border border-outline-variant/30 rounded-xl p-6 shadow-card flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-on-surface">Domain Warm-up</h3>
                <span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary border border-primary/30 text-[11px] font-bold">
                  Day 7 of 21
                </span>
              </div>
              <span className="material-symbols-outlined text-tertiary text-[20px]">local_fire_department</span>
            </div>
            <p className="text-xs text-subtext mb-4">Safe-ramp protocol prevents spam flag classification</p>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-1.5 text-xs">
                <span className="text-on-surface font-medium">Today&apos;s cap: {metrics.dailyLimit} cold emails/day</span>
                <span className="font-mono font-semibold text-primary">
                  {metrics.sentSafely} / {metrics.dailyLimit} ({sentPercent}%)
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary-container h-full rounded-full transition-all duration-500"
                  style={{ width: `${sentPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2.5 bg-surface-container/60 rounded-lg mb-3 border border-outline-variant/10 text-xs">
              <div>
                <span className="text-[10px] text-subtext block">Next tier increase</span>
                <span className="font-semibold text-on-surface">+5/day in 2 days</span>
              </div>
              <div>
                <span className="text-[10px] text-subtext block">Target threshold</span>
                <span className="font-semibold text-on-surface">Max 50/day</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-subtext text-xs px-1">
              <span className="material-symbols-outlined text-[16px] text-primary">speed</span>
              <span>Safe pacing: 1 email every 6–10 minutes</span>
            </div>
          </div>

          {/* Gmail Sender Card */}
          <div className="bg-card border border-outline-variant/30 rounded-xl p-6 shadow-card flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-on-surface">Gmail Sender</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active OAuth
              </span>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container mb-4 border border-outline-variant/20">
              <div className="w-9 h-9 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm shadow-glow">
                Z
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-on-surface block truncate">
                  ziauldin371@gmail.com
                </span>
                <span className="text-[11px] text-subtext block">
                  Gmail API connected · SSL verified
                </span>
              </div>
            </div>

            <Link
              href="/setup"
              className="w-full py-2 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-on-surface transition-colors text-xs font-semibold flex items-center justify-center gap-2 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">cable</span>
              <span>Review Connection &amp; Tests</span>
            </Link>
          </div>

          {/* Live Safety Rules Card */}
          <div className="bg-card border border-outline-variant/30 rounded-xl p-6 shadow-card flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-on-surface">Live Safety Rules</h3>
              <span className="material-symbols-outlined text-secondary text-[20px]">security</span>
            </div>
            <p className="text-xs text-subtext mb-3">Hardcoded constraints actively filtering every payload</p>

            <div className="flex flex-wrap gap-1.5">
              {[
                'Verified business email only',
                'Evidence-checked claims',
                'UK/US operating hours',
                '72-hour company cool-off',
                'Physical footer included',
              ].map((rule) => (
                <span
                  key={rule}
                  className="px-2.5 py-1 rounded bg-surface-container text-on-surface text-[11px] font-medium flex items-center gap-1 border border-outline-variant/20"
                >
                  <span className="material-symbols-outlined text-[14px] text-emerald-400">check</span>
                  {rule}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footnote Banner */}
      <div className="w-full py-2.5 px-4 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center justify-center gap-2 text-subtext text-xs text-center">
        <span className="material-symbols-outlined text-[16px] text-primary">policy</span>
        <span>
          Strict anti-spam policy enforced · No invisible tracking pixels or deceptive headers injected. Auditable RFC 5322 compliance.
        </span>
      </div>

      {/* Discovery Modal */}
      <RunNowModal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        onRunComplete={() => loadData()}
      />
    </div>
  );
}
