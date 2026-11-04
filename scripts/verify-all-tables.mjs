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

const projectRef = 'lajquqdzqfbhnunftgbn';
const accessToken = env.SUPABASE_ACCESS_TOKEN;

async function check() {
  const query = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  const data = await res.json();
  const tables = data.map(r => r.table_name);
  console.log('Total public tables in Supabase:', tables.length);

  const required = [
    'operators', 'businesses', 'contacts', 'contact_channels', 'evidence',
    'business_signals', 'opportunity_scores', 'search_plan', 'search_runs',
    'jobs', 'job_steps', 'drafts', 'pitches', 'send_log', 'replies',
    'suppression_list', 'unsubscribe_events', 'touch_log', 'daily_targets',
    'outreach_outcomes', 'oauth_tokens', 'settings', 'login_attempts',
    'platforms', 'platform_profile', 'platform_applications', 'platform_spend',
    'lead_sources', 'lead_source_budgets', 'client_requests', 'proof_library',
    'offers', 'distributed_locks', 'scheduler_checkpoints', 'audit_log'
  ];

  const missing = required.filter(t => !tables.includes(t));
  console.log('Missing tables from B2 minimum:', missing.length === 0 ? 'NONE! All present!' : missing.join(', '));
}

check();
