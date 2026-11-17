# ADD-ON: LinkedIn Client Finder (expertise-driven)

Two parts. **Part A** goes into Stitch (new tab and sheets on the existing LinkedIn Outreach screen). **Part B** goes into Antigravity as **Stage R3b**, after R3 has PASSED and the updated Stitch exports are in `design/stitch/`.

How it works (honest design): the app never touches LinkedIn. It (1) builds ready LinkedIn searches from Zia's expertise, which Zia opens in his own browser; (2) lets Zia bring a profile into the project by pasting the profile link plus the text he sees on it; (3) analyzes only that pasted text, scores the fit and writes evidence-based messages; (4) imports LinkedIn's own official Connections export; (5) opens the profile link so Zia sends the message himself.

---

# PART A: STITCH PROMPT

Use in the same Stitch project (white theme). Generate Desktop (1440px), then Mobile (390px). Re-export `linkedin-outreach`.

## A1. Update the LinkedIn Outreach screen tabs

"On the LinkedIn Outreach screen change the tabs to: Today | Find Clients | Pipeline | Scripts. Keep everything else on the screen as it is."

## A2. New tab: Find Clients

Title inside tab "Find Clients", subtitle "Searches built from your expertise. You open them on LinkedIn, then bring good profiles here."

Three cards in a responsive grid:

**Card 1: Search builder.** Chips for expertise (Data science, Machine learning, LLM chatbots, Data pipelines, Dashboards) taken from Settings. Multi-select chips for target roles (Founder, CEO, CTO, Head of Data, Head of Product, Operations lead, Agency owner, Hiring manager), countries (UK, USA, Canada, Australia, UAE, EU) and industries. Primary button "Build searches". Below it a list of "Ready searches" cards, each with a title (for example "Founders, UK, SaaS"), a type chip (People or Posts), a short description, buttons **Open on LinkedIn** (external-link icon, primary) and Copy search. Include a group "Posts asking for help" with searches like people asking for a data scientist or ML help. Small text: "Open these in your own browser. Refine filters on LinkedIn."

**Card 2: Add a profile.** Field "LinkedIn profile link", textarea "Paste what you see on their profile (headline, about, a recent post)", a segmented control "Connection: 1st (connected) | Not connected yet", button "Analyze and save". Result card below: name, role, company, fit score pill (Excellent, Good, Weak) with a one-line reason, "Needs we found in your pasted text" as evidence chips, prepared messages with tabs (Connection note, First message, Follow-up) each with a character counter "168/200", and buttons **Open profile on LinkedIn** (primary), Copy message, Save to pipeline. States: invalid link ("This is not a LinkedIn profile link"), duplicate ("Already in your pipeline"), too little text ("Paste a bit more so the message can be specific").

**Card 3: Import my connections.** Upload area "Drop your LinkedIn Connections.csv", a 4-step help ("Settings, Data privacy, Get a copy of your data, Connections"), then a result summary "1,240 connections read, 86 match your targets", a role filter, and a button "Add matching to today's plan". Note: "Email addresses in the file are ignored."

Include empty states for each card, a loading state and an error state. Reminder card on the tab: "You send every message yourself. This app never logs in to LinkedIn or reads LinkedIn pages."

## A3. Prospect details drawer update

Add to the existing drawer: the pasted text with an edit icon, the evidence chips, a connection toggle (1st or not connected), and a "Delete this person's data" link.

## A4. Final check to ask Stitch

"Confirm the new tab, the three cards, the drawer update, desktop and mobile versions, plus empty, loading and error states, with the same sidebar, top bar and chip styles as the other screens. List every button on the new tab."

---

# PART B: ANTIGRAVITY STAGE R3b (paste after R3 PASS)

```
TASK: STAGE R3b, LinkedIn Client Finder (expertise-driven, compliant)

Follow docs/WORKING_AGREEMENT.md and the Screen Fidelity Contract. Branch stage/r3b-client-finder, tag r3b-before.
Prerequisites: R3 PASSED; updated Stitch export design/stitch/linkedin-outreach/ contains the Find Clients tab. Build ONLY what the design shows; anything missing goes into design/GAPS.md.

HARD COMPLIANCE RULES
1. The server must NEVER request linkedin.com or any LinkedIn host: no scraping, no fetching profile URLs, no headless browser, no extension, no bookmarklet that reads pages, no login, no automated sending, no automated invitations or messages. Add a test that fails if any outbound request to a linkedin.com host is attempted by server code.
2. The only LinkedIn data entering the system is: (a) text and links Zia pastes himself, (b) LinkedIn's official Connections.csv export that Zia uploads.
3. No claims about the person that are not in the pasted text or stored evidence. No flattery, no "I saw you are struggling", no invented results. Zia's own claims only from enabled verified_facts.
4. Data protection: store only what is needed, provide "Delete this person's data" (hard delete including pasted text), and never use CSV email addresses (drop that column on import; do not store it).

BUILD
1. Data: extend linkedin_prospects (normalized_profile_url unique, vanity, source: search|pasted|connections_csv|opportunity, connection_degree: first|not_connected set manually by Zia, pasted_text, analysis jsonb, fit_score, fit_reason, status). New tables linkedin_searches (generated searches with last_verified null) and linkedin_import_batches (counts only).
2. Search builder (pure functions, no network): from enabled expertise in Settings plus chosen roles, countries and industries generate (a) People searches and (b) Posts searches such as people asking for a data scientist or machine learning help. Output LinkedIn search URLs using keywords only (location and industry go into the keyword text because LinkedIn geo and industry filters need internal IDs) in the form https://www.linkedin.com/search/results/people/?keywords=<encoded> and .../search/results/content/?keywords=<encoded>. Mark the URL pattern last_verified null and add a fallback that opens the generic LinkedIn search page if the pattern stops working. Also provide a Copy search text option.
3. Profile intake: validate the host strictly (exactly linkedin.com or www.linkedin.com, https, path /in/<vanity>), reject company pages, lookalike hosts such as linkedin.com.evil.com, and non-profile paths; normalize by stripping query and fragment; dedupe against existing prospects and against the 72-hour touch_log gap. Pasted text length limit with a clear message when too short.
4. Analysis (Gemini, key in x-goog-api-key header, model from GEMINI_MODEL): extract role, company and needs ONLY from the pasted text, each need stored with the exact pasted snippet as evidence. Score fit against enabled verified_facts and offers with a visible reason (Excellent, Good, Weak). If the text is insufficient, return "needs more text" and still allow a short generic professional note with no claims.
5. Message drafts: connection note (within the configured character limit, no pitch), first message after acceptance (2 to 3 sentences, one real observation from the pasted text, one soft question, no link), follow-up after 5 to 7 days (maximum 2). Variant chosen by the manual connection_degree toggle: first degree gets a direct message; not connected gets a note-free or noted connection request first, and the first message is shown as "send after they accept". Run the existing two-pass claim check against pasted text plus verified_facts; unsupported sentences block the draft.
6. Links: "Open profile on LinkedIn" opens the normalized profile URL in a new tab. Do not construct messaging compose URLs from guessed IDs. If Zia pastes a messaging thread link, keep and open it as is. Copy-to-clipboard for every message.
7. Connections.csv import: handle LinkedIn's export format (note lines before the header; columns First Name, Last Name, URL, Email Address, Company, Position, Connected On), process in memory, drop Email Address, match Position against target roles and expertise keywords, set connection_degree=first, dedupe, show counts only, and offer "Add matching to today's plan". Cap file size and rows.
8. Daily plan integration: prospects from this tab feed the R3 plan generator and respect the weekly invitation budget, the notes counter, the daily target range and the 72-hour gap shared with email in touch_log.
9. Wire the Find Clients tab, the Add a profile card, the Import card and the drawer exactly as designed; no extra UI.

TESTS
- No server request to any linkedin.com host (assert in tests).
- URL validation: valid profile, company page, lookalike host, http, missing vanity, extra query strings, trailing slash, mixed case.
- Dedupe and 72-hour gap.
- CSV parsing: preamble lines, quoted commas, missing columns, empty file, oversized file, email column dropped and never stored.
- Claim check blocks unsupported sentences; insufficient-text path; variant logic for first versus not connected; character limits.
- Search builder output is correctly encoded and contains no personal data.
- Delete-this-person's-data removes the row and pasted text.
- Visual regression of the updated linkedin-outreach screen at 390, 1280 and 1920 with difference percentage per screen.

REPORT in the standard format (Requirement | Evidence | Status | Notes), then LIVE-verified, SIMULATED, Missing items, Security gaps, Gaps for Stitch (design/GAPS.md), Env var names, Commit hashes and tags. Do not claim anything works unless you ran it.
```
