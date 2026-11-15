# STITCH V4: CHANGES AND NEW SCREENS (white theme)

Use in the SAME Stitch project as STITCH_V3_SCREENS_PROMPT.md. Paste each block one at a time. Generate Desktop (1440px) first, then Mobile (390px). Re-export every screen listed in EXPORT NAMES at the end.

> **Important**: Antigravity will build ONLY what appears in these screens. If an element is missing here, it will not exist in the app. So every screen must contain every button, tab, empty state and error state the app needs.

---

### BLOCK 1: Sidebar on ALL screens (update every existing screen)
"Update the left sidebar on every screen. New nav order: Dashboard, Opportunities, Approvals, Sent, Inbox, LinkedIn Outreach, Platform Projects (live red count badge), Manual Outreach (count badge), Platforms, Search Targets. Pinned at the bottom: Settings, System Health. Remove the item 'Auto Outreach'. Mobile bottom nav: Dashboard, Opportunities, Approvals, LinkedIn, More."

---

### BLOCK 2: Replace "Auto Outreach" with "Approvals"
Screen "Approvals", subtitle "Nothing is sent until you approve it. You press the button, Gmail sends it."
- **Top card**: sender "Zia Ul Din ziauldin371@gmail.com", chip "Gmail connected", daily limit bar "Sent today 6 of 15", and a note "Your first send needs a confirmed test email" with a "Send 1 test email to myself" button. No auto-send switch anywhere.
- **Filter chips with counts**: Waiting (14), Blocked (3), Approved and scheduled (5).
- **Draft cards**: business name, country flag, subject, first two lines of the email, word count, green chips (Verified email, Every claim has evidence, Inside business hours) and red reason chips on blocked drafts (for example "Email not verified", "Contacted 2 days ago", "Evidence older than 48 hours").
- **Per-card buttons**: Approve and send (primary), Edit, Reject, View evidence.
- **Bulk bar at the bottom**: "Approve 6 selected" with a choice: Send now | Spread over today (shows estimated finish time, for example "Done by 3:40 PM").
- **Edit state (full screen)**: subject, body, live checker (word count, link count, spam-word warnings), evidence list for each sentence, From and To lines, buttons Save, Approve and send.
- **Confirmation toast**: "Sent. Open in Gmail".
- **Empty state**: "No drafts waiting. New drafts appear after the next search."
- **Footnote**: "Inbox placement cannot be guaranteed by any sender."

---

### BLOCK 3 (NEW): LinkedIn Outreach
Screen "LinkedIn Outreach", subtitle "Your daily list of 20 to 20 to 30 professional people. You send, the app prepares."
- **Top strip, four meters**: Today 12 of 25 done (progress bar); Connection requests this week 46 of 80; Personalized notes this month 2 of 5; Replies this week 4. Chip "Plan: Free" with a small edit link.
- **Tabs**: Today | Pipeline | Scripts.
- **Today tab**: task cards. Each card: avatar initials, full name, role, company, city and country, "Why this person" evidence chip (for example "Founder, company registered 5 months ago", "Hiring a data analyst"), task type chip (Send connection request, Message new connection, Follow up, Comment on post), prepared text box with character counter "168/200", buttons Open profile on LinkedIn (primary, external-link icon), Copy text, Mark done, Skip, Log outcome. Filter chips: All, Requests, Messages, Follow-ups, Engagement.
- **Pipeline tab**: board with columns Request sent, Connected, Messaged, Replied, Call booked, Won, Not relevant; cards show name, company, date and next step.
- **Scripts tab**: saved message templates (connection note, first message after accept, follow-up after 6 days, thank-you), each with character counter, Copy, Edit and a green "No unproven claims" chip.
- **Right panel**: Add prospects card with three options (Paste LinkedIn profile links, Import CSV, Pick from Opportunities) and a reminder card: "You send everything yourself. This app never logs in to LinkedIn."
- **Log outcome sheet**: Accepted, Replied, Call booked, Not interested, No response, plus note and follow-up date.
- **Prospect details drawer**: facts with sources, prepared messages, history.
- **Weekly limit warning state (amber)**: "You are near this week's invitation limit. Remaining tasks are messages and follow-ups only."
- **Empty state**: "No prospects yet. Add some or let the app suggest from your Opportunities."

---

### BLOCK 4: Platforms (fit list only)
Replace the Platforms screen. Title "Platforms", subtitle "Only places that fit data science and AI work and pay well." Two tabs only:
1. **High-paying networks and marketplaces**: Toptal, Catalant, Contra, Arc.dev, Braintrust, Turing, A.Team, Gun.io, Lemon.io, Flexiple, Index.dev, Upwork (Data Science and ML categories), Kolabtree.
2. **Job and project feeds**: Wellfound, Work at a Startup (Y Combinator), Hacker News "Who is hiring", RemoteOK, ai-jobs.net.
- **Each platform card**: logo or initial, one-line "good for", how projects reach you (Email alert, Feed or Manual), status chip (Alerts connected, Not connected), amber chip "Check eligibility for Pakistan", amber chip "Terms not verified yet", button "Set up alerts" opening a short how-to, and an application status. No other platforms, no tools, no lead databases.

---

### BLOCK 5: Platform Projects (source pills)
Update the source filter pills to exactly the platforms in Change 4. Keep the live indicator, the "Just now" badge, fit score, budget, "Prepared proposal" preview, and buttons Open on platform, Add to Manual Outreach, Not a fit.

---

### BLOCK 6: Dashboard
Replace the Auto Outreach pieces with:
- Card "Waiting for your approval: 14 emails" with a button "Review now"
- Card "LinkedIn today 12 of 25" with a button "Open LinkedIn Outreach"
- Keep the live platform strip, health strip, "Needs you today", and "Next automatic run" cards. Remove the warm-up card.

---

### BLOCK 7: Settings
Add a LinkedIn tab:
- LinkedIn plan (Free, Premium, Sales Navigator)
- Daily target stepper (20 to 30, default 25)
- Weekly invitation budget (default 80)
- Personalized notes per month (default 5 for Free, unlimited for Premium)
- Note character limit (default 200)
- ICP roles and countries chips
- Helper text: "Limits are reported by third parties. Check your own account."
- Keep: Expertise and Facts, Offers, Sending (sender fixed as ziauldin371@gmail.com, daily limit, business-hours window, postal address), Alerts, Account.

---

### FINAL CHECK TO ASK STITCH
"Check every screen for the same sidebar, top bar, chips and icons. Make sure no screen mentions auto-send, auto-pilot, warm-up charts, or any platform outside the list in Change 4. Confirm each screen has desktop, mobile, empty and error states. List every button on every screen so nothing is missing."

---

### EXPORT NAMES
Re-export these folders:
1. `dashboard`
2. `opportunities`
3. `approvals` (new)
4. `sent`
5. `inbox`
6. `linkedin-outreach` (new)
7. `platform-projects`
8. `manual-outreach`
9. `platforms`
10. `search-targets`
11. `settings`
12. `system-health`
13. `setup`
14. `emails-preview`
15. `login`

