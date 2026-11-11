import React from 'react';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto text-on-surface">
      <div className="mb-6">
        <a href="/login" className="text-primary hover:underline text-sm inline-flex items-center gap-1.5 font-medium">
          <span className="material-symbols-outlined text-16">arrow_back</span>
          Back to Login
        </a>
      </div>

      <header className="mb-8 pb-6 border-b border-outline-variant/30">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-2">Privacy Policy</h1>
        <p className="text-xs text-subtext uppercase tracking-wider">Growth System • Last Updated: November 2026</p>
      </header>

      {/* Roman Urdu Executive Summary */}
      <div className="mb-8 p-4 rounded-card bg-surface-container border border-outline-variant/40">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-16">translate</span>
          Roman Urdu Khulasa (Summary)
        </h2>
        <p className="text-sm text-on-surface/90 leading-relaxed">
          Yeh page Growth System ki privacy policy hai. Yeh application Zia Ul Din ka private zaati tool hai jo business outreach aur client requests find karne ke liye use hota hai. Gmail access sirf operator (Zia Ul Din) ke apne account se outreach emails bhejne aur direct replies check karne ke liye use hota hai. Koi bhi private data kisi third-party ko becha ya share nahi kiya jata aur na hi AI models ko train karne ke liye use hota hai.
        </p>
      </div>

      <div className="space-y-8 text-sm text-on-surface/90 leading-relaxed">
        {/* Section 1 */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2">1. Who Operates This Application</h2>
          <p>
            Growth System is a private, operator-restricted web application owned and operated solely by <strong className="text-on-surface">Zia Ul Din</strong> (contact: <a href="mailto:ziauldin371@gmail.com" className="text-primary hover:underline font-mono">ziauldin371@gmail.com</a>). It is designed strictly for internal business operations, freelance client discovery, and professional business-to-business communications.
          </p>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2">2. What the Application Does</h2>
          <p>
            Growth System assists its operator in discovering public business opportunities, aggregating client requests from public boards (such as Hacker News, Remotive, and professional platforms), and managing outreach communications directly through the operator&apos;s own verified Google Workspace / Gmail account.
          </p>
        </section>

        {/* Section 3 - Google API Disclosures */}
        <section className="p-4 rounded-card bg-surface-container/60 border border-outline-variant/40 space-y-4">
          <h2 className="text-lg font-bold text-on-surface mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-20">verified_user</span>
            3. Google User Data &amp; Gmail API Permissions
          </h2>
          <p>
            Growth System accesses Google APIs solely to enable the operator to send professional outreach and manage responses. The following scopes are requested:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm">
            <li>
              <code className="px-1.5 py-0.5 rounded bg-surface border border-outline-variant/30 text-primary font-mono text-xs">https://www.googleapis.com/auth/gmail.send</code>:
              Used exclusively to transmit business outreach emails authored or approved by the operator directly from the operator&apos;s own connected mailbox (<span className="font-mono text-on-surface">ziauldin371@gmail.com</span>).
            </li>
            <li>
              <code className="px-1.5 py-0.5 rounded bg-surface border border-outline-variant/30 text-primary font-mono text-xs">https://www.googleapis.com/auth/gmail.readonly</code>:
              Used exclusively to detect incoming replies to sent outreach messages and verify sent message confirmation (<code className="font-mono text-xs">SENT</code> label and message IDs) within the operator&apos;s own mailbox.
            </li>
            <li>
              <code className="px-1.5 py-0.5 rounded bg-surface border border-outline-variant/30 text-primary font-mono text-xs">https://www.googleapis.com/auth/userinfo.email</code>:
              Used exclusively to verify the identity of the operator during the OAuth authentication flow.
            </li>
          </ul>

          <div className="space-y-2 pt-2 border-t border-outline-variant/30 text-xs md:text-sm">
            <p>
              <strong>Owner Mailbox Only:</strong> Access is strictly restricted to the operator&apos;s own authorized mailbox. The application never accesses, reads, or manages third-party Gmail inboxes.
            </p>
            <p>
              <strong>Encrypted Storage:</strong> OAuth access tokens and refresh tokens are encrypted at rest using AES-256-GCM authenticated encryption before being saved into a secure, protected database.
            </p>
            <p>
              <strong>No Sale or Sharing:</strong> Google user data is never sold, rented, leased, or transferred to third parties, data brokers, or advertising networks.
            </p>
            <p>
              <strong>No AI Model Training on Gmail Data:</strong> Google user data and Gmail message contents are never used to train, retrain, fine-tune, or improve generalized machine learning or artificial intelligence models.
            </p>
          </div>
        </section>

        {/* Section 4 - AI Usage */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2">4. Use of Artificial Intelligence (Google Gemini API)</h2>
          <p>
            Artificial intelligence (Google Gemini API) is utilized within the application solely for assisting the operator in drafting proposals based on public job requirements and public business descriptions provided by the operator.
          </p>
          <p className="mt-2 text-subtext">
            <strong>Clear Reply Privacy Guarantee:</strong> Incoming email reply bodies and personal email correspondence are NEVER transmitted to Google Gemini or any external large language model. Email reply classification is performed deterministically using email transport headers (<code className="font-mono text-xs">In-Reply-To</code>, <code className="font-mono text-xs">References</code>, and message thread IDs).
          </p>
        </section>

        {/* Section 5 - Public Data */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2">5. Public Business Information Collected</h2>
          <p>
            The system collects publicly accessible business information—such as company names, publicly listed corporate websites, public support/contact email addresses, and public postings from freelance job boards (e.g., Hacker News hiring threads, Remotive, OpenStreetMap)—for legitimate B2B commercial outreach.
          </p>
        </section>

        {/* Section 6 - Limited Use Disclosure */}
        <section className="p-4 rounded-card bg-primary-container/10 border border-primary-container/30">
          <h2 className="text-base font-bold text-on-surface mb-1">6. Google API Services User Data Policy Compliance</h2>
          <p className="italic text-on-surface/90">
            Growth System&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </section>

        {/* Section 7 - Unsubscribe & Deletion */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2">7. Recipient Rights, Unsubscribe &amp; Data Deletion</h2>
          <p>
            Every outreach email sent through the system includes a one-click unsubscribe header and an opt-out link. When a recipient opts out, their email address and domain are immediately added to a permanent suppression table, preventing future contact.
          </p>
          <p className="mt-2">
            To revoke the application&apos;s access to your Google account at any time, visit the{' '}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Account Permissions
            </a>{' '}
            page. To request permanent deletion of your business contact information from our internal records, contact{' '}
            <a href="mailto:ziauldin371@gmail.com" className="text-primary hover:underline font-mono">
              ziauldin371@gmail.com
            </a>
            . Requests are processed within 24 hours.
          </p>
        </section>

        {/* Section 8 - Contact */}
        <section className="pt-4 border-t border-outline-variant/30">
          <h2 className="text-lg font-bold text-on-surface mb-2">8. Contact Information</h2>
          <p>
            Zia Ul Din<br />
            Operator, Growth System<br />
            Email: <a href="mailto:ziauldin371@gmail.com" className="text-primary hover:underline font-mono">ziauldin371@gmail.com</a>
          </p>
        </section>
      </div>
    </main>
  );
}
