import React from 'react';

export default function TermsPage() {
  return (
    <main className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto text-on-surface">
      <div className="mb-6">
        <a href="/login" className="text-primary hover:underline text-sm inline-flex items-center gap-1.5 font-medium">
          <span className="material-symbols-outlined text-16">arrow_back</span>
          Back to Login
        </a>
      </div>

      <header className="mb-8 pb-6 border-b border-outline-variant/30">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-2">Terms of Service</h1>
        <p className="text-xs text-subtext uppercase tracking-wider">Growth System • Last Updated: November 2026</p>
      </header>

      {/* Roman Urdu Executive Summary */}
      <div className="mb-8 p-4 rounded-card bg-surface-container border border-outline-variant/40">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-16">translate</span>
          Roman Urdu Khulasa (Summary)
        </h2>
        <p className="text-sm text-on-surface/90 leading-relaxed">
          Yeh terms of service Growth System ke liye hain jo Zia Ul Din ka private aur zaati outreach management tool hai. Yeh public service ya commercial SaaS product nahi hai. System ko tamam anti-spam qawaneen (CAN-SPAM, GDPR, PECR) ke mutabiq chalaya jata hai aur ghair-qanooni ya unauthorized access sakhti se mana hai.
        </p>
      </div>

      <div className="space-y-8 text-sm text-on-surface/90 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2">1. Nature of the System</h2>
          <p>
            Growth System is a single-operator, private intelligence and communication dashboard operated solely by Zia Ul Din for legitimate freelance and software consulting operations. It is not offered as a multi-tenant service, public utility, or commercial SaaS product to the general public.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2">2. Prohibited Uses &amp; Access Controls</h2>
          <p>
            Unauthorized attempts to authenticate, bypass security checks, probe API endpoints, reverse-engineer, or misuse the infrastructure of Growth System are strictly prohibited. The system enforces strict fail-closed token verification and IP rate-limiting.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2">3. Anti-Spam &amp; Regulatory Compliance</h2>
          <p>
            All electronic communications initiated via this console are strictly restricted to business-to-business (B2B) communications and must comply with international email standards:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-xs md:text-sm">
            <li><strong>CAN-SPAM Act:</strong> Accurate sender identity, truthful subject lines, valid physical contact address, and instantaneous opt-out processing.</li>
            <li><strong>GDPR &amp; PECR:</strong> Legitimate interest basis for B2B communications, immediate honoring of right to object and right to erasure, and full suppression adherence.</li>
            <li><strong>No Fake Claims:</strong> Zero tolerance for inflated, misleading, or synthetic metrics or evidence.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2">4. Disclaimer of Warranties &amp; Limitation of Liability</h2>
          <p>
            The software, data pipelines, integrations, and reports are provided on an &quot;AS-IS&quot; and &quot;AS-AVAILABLE&quot; basis without warranties of any kind, whether express or implied. The operator assumes no liability for external platform API changes, rate limits, or network interruptions.
          </p>
        </section>

        <section className="pt-4 border-t border-outline-variant/30">
          <h2 className="text-lg font-bold text-on-surface mb-2">5. Governing Law &amp; Contact</h2>
          <p>
            For questions regarding these terms, contact Zia Ul Din directly at{' '}
            <a href="mailto:ziauldin371@gmail.com" className="text-primary hover:underline font-mono">
              ziauldin371@gmail.com
            </a>.
          </p>
        </section>
      </div>
    </main>
  );
}
