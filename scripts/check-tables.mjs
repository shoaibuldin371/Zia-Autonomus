import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '')];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const requiredTables = [
  'operators', 'businesses', 'contacts', 'contact_channels', 'evidence',
  'business_signals', 'opportunity_scores', 'search_plan', 'search_runs',
  'jobs', 'job_steps', 'drafts', 'pitches', 'send_log', 'replies',
  'suppression_list', 'unsubscribe_events', 'touch_log', 'daily_targets',
  'outreach_outcomes', 'oauth_tokens', 'settings', 'login_attempts',
  'platforms', 'platform_profile', 'platform_applications', 'platform_spend',
  'lead_sources', 'lead_source_budgets', 'client_requests', 'proof_library',
  'offers', 'distributed_locks', 'scheduler_checkpoints', 'audit_log'
];

async function check() {
  const missing = [];
  const existing = [];

  for (const table of requiredTables) {
    const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error && (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist'))) {
      missing.push(table);
    } else {
      existing.push(table);
    }
  }

  console.log('Existing tables (' + existing.length + '):', existing.join(', '));
  console.log('Missing tables (' + missing.length + '):', missing.join(', '));
}

check();
