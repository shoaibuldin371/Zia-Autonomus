'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { RunNowModal } from '../discovery/RunNowModal';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, toggleLanguage, t } = useLanguage();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Today', icon: 'home', desc: 'Daily triage & pipeline pace' },
    { href: '/businesses', label: 'Found', icon: 'radar', desc: 'Live Radar & verified leads' },
    { href: '/emails', label: 'Emails', icon: 'mail', desc: 'Sent & queue with Gmail sync' },
    { href: '/contact-manually', label: 'Manual', icon: 'call', desc: 'Phone scripts & social touches' },
    { href: '/safety', label: 'Safety & Rules', icon: 'shield', desc: 'Guardian shield & limits' },
  ];

  const moreItems = [
    { href: '/platforms', label: 'Platforms', icon: 'hub', desc: '89 AI & marketplace channels' },
    { href: '/requests', label: 'Hot Client Requests', icon: 'bolt', desc: 'Paste client post for proposal' },
    { href: '/search-plan', label: 'Search Plan', icon: 'map', desc: 'Rotating metro coverage matrix' },
    { href: '/setup', label: 'Setup & Connections', icon: 'settings', desc: 'Traffic light API diagnostics' },
    { href: '/compliance', label: 'Compliance & Suppression', icon: 'gavel', desc: 'Global do-not-contact list' },
  ];

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-canvas text-on-surface flex flex-col">
      {/* Top Fixed Header */}
      <header className="fixed top-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 h-16 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-white shadow-glow">
              <span className="material-symbols-outlined text-20">rocket_launch</span>
            </div>
            <span className="font-bold text-base tracking-tight text-on-surface hidden sm:inline">
              Growth System
            </span>
          </Link>
          <span className="text-xs text-subtext hidden md:inline">• Pakistan PKT (UTC+5)</span>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsRunModalOpen(true)}
            className="px-3 py-1.5 rounded-control bg-primary-container hover:bg-primary-hover text-white text-xs font-semibold shadow-glow flex items-center gap-1.5 transition"
          >
            <span className="material-symbols-outlined text-16">bolt</span>
            <span>{t('Find Businesses Now', 'Find Businesses Now')}</span>
          </button>

          {/* Urdu Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1 rounded-control bg-surface-container border border-outline-variant/30 text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition flex items-center gap-1"
            title="Switch Language (EN | اردو)"
          >
            <span className="material-symbols-outlined text-16">translate</span>
            <span>{language === 'en' ? 'EN | اردو' : 'اردو | EN'}</span>
          </button>

          {/* Help Popover Button */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-1.5 rounded-control text-subtext hover:text-on-surface hover:bg-surface-container transition"
            title="Operator Help"
          >
            <span className="material-symbols-outlined text-20">help_outline</span>
          </button>

          {/* Operator Profile Chip */}
          <div className="relative group">
            <button className="flex items-center gap-2 p-1 rounded-pill bg-surface-container border border-outline-variant/30 hover:border-primary-container/40 transition">
              <div className="w-7 h-7 rounded-full bg-primary-container/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs">
                ZD
              </div>
              <span className="text-xs font-medium text-on-surface pr-2 hidden md:inline">Zia Ul Din</span>
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-card border border-outline-variant/40 rounded-card shadow-card p-2 hidden group-hover:block z-50">
              <div className="px-2 py-1.5 text-xs text-subtext border-b border-outline-variant/20 mb-1">
                Operator: <span className="text-on-surface font-mono">ziauldin371@gmail.com</span>
              </div>
              <Link
                href="/setup"
                className="block px-2 py-1.5 text-xs text-on-surface hover:bg-surface-container rounded-control transition"
              >
                Setup & Connections
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-2 py-1.5 text-xs text-error hover:bg-error-container/30 rounded-control transition flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-14">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main 12-Column Grid Layout */}
      <div className="pt-16 pb-20 lg:pb-8 flex-1 max-w-[1440px] w-full mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Desktop Sidebar (lg:col-span-3) */}
        <aside className="hidden lg:block lg:col-span-3 pt-6 space-y-6">
          <div className="bg-card border border-outline-variant/30 rounded-card p-4 space-y-1 shadow-card">
            <p className="text-[10px] uppercase font-bold tracking-wider text-subtext px-2 mb-2">Main Navigation</p>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-control text-sm transition ${
                    isActive
                      ? 'bg-primary-container text-white font-semibold shadow-glow'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-20">{item.icon}</span>
                  <div>
                    <p className="leading-none">{item.label}</p>
                    <p className={`text-[10px] mt-0.5 leading-none ${isActive ? 'text-white/80' : 'text-subtext'}`}>
                      {item.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="bg-card border border-outline-variant/30 rounded-card p-4 space-y-1 shadow-card">
            <p className="text-[10px] uppercase font-bold tracking-wider text-subtext px-2 mb-2">Engines & Tools</p>
            {moreItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-control text-xs transition ${
                    isActive
                      ? 'bg-primary-container text-white font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-18">{item.icon}</span>
                  <div className="truncate">
                    <p className="font-medium truncate">{item.label}</p>
                    <p className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-subtext'}`}>
                      {item.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Primary Page Content (lg:col-span-9) */}
        <main className="col-span-1 lg:col-span-9 pt-6">{children}</main>
      </div>

      {/* Mobile Bottom Navigation (under 1024px) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-lg border-t border-outline-variant/20 h-16 flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                isActive ? 'text-primary' : 'text-subtext hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-22">{item.icon}</span>
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setIsMoreOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-subtext hover:text-on-surface transition"
        >
          <span className="material-symbols-outlined text-22">more_horiz</span>
          <span className="text-[10px] font-medium mt-0.5">More</span>
        </button>
      </nav>

      {/* Mobile "More" Bottom Sheet Drawer */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm lg:hidden">
          <div className="bg-card border-t border-outline-variant/30 rounded-t-card p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h3 className="font-bold text-sm text-on-surface">Console Destinations</h3>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1 rounded-control text-subtext hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-20">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMoreOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-control bg-surface-container border border-outline-variant/20 hover:border-primary-container text-xs transition"
                >
                  <span className="material-symbols-outlined text-primary text-20">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-on-surface">{item.label}</p>
                    <p className="text-subtext text-[11px]">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Run Now Modal */}
      <RunNowModal isOpen={isRunModalOpen} onClose={() => setIsRunModalOpen(false)} />

      {/* Help Popover Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-card border border-outline-variant/30 rounded-card p-6 max-w-md w-full shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-22">help</span>
                <h3 className="font-bold text-sm text-on-surface">Growth System Guide</h3>
              </div>
              <button onClick={() => setIsHelpOpen(false)} className="text-subtext hover:text-on-surface">
                <span className="material-symbols-outlined text-20">close</span>
              </button>
            </div>
            <div className="text-xs text-on-surface/90 space-y-3 leading-relaxed">
              <p>
                <strong>Operator:</strong> Zia Ul Din (Karachi, PKT UTC+5).
              </p>
              <p>
                <strong>Safety First:</strong> Review first mode is enabled by default. Every outbound email is drafted for your approval. Auto-send remains locked until you test and confirm a real email to your own Gmail address.
              </p>
              <p>
                <strong>Evidence Only:</strong> Every observation and opportunity claim is backed by stored Google Places data, PageSpeed measurements, or business records.
              </p>
              <p>
                <strong>اردو رہنمائی:</strong> یہ سسٹم خودکار طریقے سے دنیا بھر میں حقیقی کلائنٹس تلاش کرتا ہے اور مکمل رازداری و حفاظت کے ساتھ تجاویز تیار کرتا ہے۔
              </p>
            </div>
            <button
              onClick={() => setIsHelpOpen(false)}
              className="w-full py-2 bg-primary-container text-white rounded-control text-xs font-semibold hover:bg-primary-hover transition"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
