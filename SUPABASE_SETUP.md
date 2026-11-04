# Supabase Setup Guide: Growth System v2

## 1. Project Creation
1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Create a new organization and project (select a region close to your Vercel functions, e.g. London `eu-west-2` or Frankfurt `eu-central-1`).
3. Under **Project Settings > API**, copy the following:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret key` -> `SUPABASE_SERVICE_ROLE_KEY` (Keep secure, server-only)

## 2. Apply Database Migrations
Run the consolidated migration bundle located at `supabase/full_schema_setup.sql`:
1. In the Supabase Dashboard, open the **SQL Editor**.
2. Paste the full contents of `supabase/full_schema_setup.sql`.
3. Click **Run**.
4. Confirm that all 35 required tables and views are created with Row Level Security (RLS) enabled.

## 3. Enable Realtime Publications
Under **Database > Publications**:
Ensure the `supabase_realtime` publication includes:
- `jobs`
- `job_steps`
- `send_log`
- `replies`
