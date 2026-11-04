# Vercel Deployment Guide: Growth System v2

## 1. Create Vercel Project
1. Push your repository to your private GitHub repo.
2. In the Vercel Dashboard, click **Add New > Project** and import the repository.
3. Framework Preset: **Next.js**.
4. Root Directory: `./`.

## 2. Environment Variables Configuration
Configure the following environment variables in Vercel (**Settings > Environment Variables**):

| Variable Name | Environment | Description |
|---|---|---|
| `NODE_ENV` | Production, Preview, Dev | `production` |
| `APP_BASE_URL` | Production | Your Vercel canonical URL (`https://...`) |
| `ADMIN_EMAIL` | All | `ziauldin371@gmail.com` |
| `ADMIN_PASSWORD` | All | Strong random password |
| `SESSION_SECRET` | All | At least 32-character random key |
| `ENCRYPTION_SECRET` | All | 32-character random key for AES-256 |
| `UNSUBSCRIBE_SECRET` | All | Random key for HMAC tokens |
| `CRON_SECRET` | Production | High-entropy random secret |
| `NEXT_PUBLIC_SUPABASE_URL` | All | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | All | Supabase service-role key |
| `GMAIL_SENDER_ADDRESS` | All | `ziauldin371@gmail.com` |
| `GMAIL_SENDER_NAME` | All | `Zia Ul Din` |
| `GOOGLE_CLIENT_ID` | All | Google Cloud OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | All | Google Cloud OAuth Client Secret |
| `PHYSICAL_MAILING_ADDRESS` | All | Zia Ul Din, Karachi, Pakistan |
| `GEMINI_MODEL` | All | `gemini-1.5-flash` |
| `GEMINI_API_KEY` | All | Google Gemini API Key |
| `GOOGLE_PLACES_API_KEY` | All | Google Places API (New) Key |
| `PLACES_MONTHLY_BUDGET` | All | `50` |
| `HARD_DAILY_CEILING` | All | `50` |
| `DEFAULT_SEND_MODE` | All | `approval` |

## 3. Scheduler & Vercel Cron
`vercel.json` contains two daily cron entries:
```json
{
  "crons": [
    {
      "path": "/api/cron/scheduled-run",
      "schedule": "0 4 * * *"
    },
    {
      "path": "/api/cron/scheduled-run",
      "schedule": "0 12 * * *"
    }
  ]
}
```
- **Hobby Plan Notice:** On Vercel's Hobby plan, scheduled cron jobs may fire anywhere within the scheduled hour (up to 59 minutes late). Upgrading to Pro provides exact-minute dispatch.
- **Vercel Cron Header:** Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is set in the environment.
