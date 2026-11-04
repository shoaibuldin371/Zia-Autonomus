# Operational Runbook: Growth System v2

## 1. Daily Workflow Summary

```
09:00 PKT (04:00 UTC) -> Cron Run 1 (Morning discovery & review draft generation)
09:15 PKT             -> Operator triage: Review drafts in /emails queue, approve or adjust
17:00 PKT (12:00 UTC) -> Cron Run 2 (Afternoon rotation)
17:30 PKT             -> Review new replies & hot requests
```

## 2. Emergency Operations
- **Halt All Operations Immediately:**
  1. Open the console on desktop or mobile.
  2. Navigate to **Safety & Rules** (or open the mobile bottom sheet).
  3. Click **Emergency Stop Everything**.
  4. All active discovery jobs, automated queues, and scheduled cron executions will immediately halt.

## 3. Disconnecting or Reconnecting Gmail
If Google revokes OAuth tokens or invalidates refresh credentials:
1. Navigate to **Setup & Connections**.
2. Locate the Gmail integration card.
3. Click **Connect Gmail**.
4. Authenticate strictly with `ziauldin371@gmail.com`.
5. Run **Send 1 Test Email to Myself** to confirm verification.

## 4. Adjusting Safe Limits
- Daily email limit can be adjusted from 5 to 50 (stepper on `/safety`). Default is 25.
- Spacing delay between sends can be toggled between 4, 6, and 10 minutes.
- Auto-send remains disabled until explicitly toggled after a live test email is verified.
