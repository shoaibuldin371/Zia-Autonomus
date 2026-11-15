import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const env = parseEnv('.env.local');

console.log('=== STEP 3: TRACE THE SENDING CHAIN (LIVE DIAGNOSIS) ===');

// Check Required Environment Variables (Names Only)
const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'SESSION_SECRET',
  'ENCRYPTION_SECRET',
  'UNSUBSCRIBE_SECRET',
  'CRON_SECRET',
  'GMAIL_CLIENT_ID',
  'GMAIL_CLIENT_SECRET',
  'GEMINI_API_KEY',
  'GOOGLE_PLACES_API_KEY',
];

console.log('\n--- (h) Environment Variables Check ---');
for (const varName of requiredEnv) {
  const isSet = !!env[varName] && env[varName].trim().length > 0;
  console.log(`${varName}: ${isSet ? 'SET' : 'MISSING/EMPTY'}`);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // a) Leads and Verified Emails
  console.log('\n--- (a) Leads & Verified Email Count ---');
  const { data: businesses, error: bErr } = await supabase.from('businesses').select('id, name, website, pipeline_type');
  if (bErr) console.error('Error fetching businesses:', bErr);
  else console.log(`Total Businesses in DB: ${businesses.length}`);

  const { data: contacts, error: cErr } = await supabase.from('contacts').select('id, business_id, email, is_verified');
  if (cErr) console.error('Error fetching contacts:', cErr);
  else {
    const verified = contacts.filter(c => c.is_verified && c.email);
    const unverified = contacts.filter(c => !c.is_verified || !c.email);
    console.log(`Total Contacts: ${contacts.length}`);
    console.log(`Contacts with verified email: ${verified.length}`);
    console.log(`Contacts without verified email: ${unverified.length}`);
  }

  // b) Drafts created & status
  console.log('\n--- (b) Drafts Created & Status ---');
  const { data: drafts, error: dErr } = await supabase.from('drafts').select('id, business_id, status, recipient_email, subject, review_status, claim_check_passed');
  if (dErr) console.error('Error fetching drafts:', dErr);
  else {
    console.log(`Total Drafts in DB: ${drafts.length}`);
    const statusCounts = {};
    for (const d of drafts) {
      statusCounts[d.status || 'null'] = (statusCounts[d.status || 'null'] || 0) + 1;
    }
    console.log('Draft Status Counts:', statusCounts);
  }

  // c) Outreach emails / send attempts
  console.log('\n--- (c) Outreach Emails Table ---');
  const { data: outreach, error: oErr } = await supabase.from('outreach_emails').select('id, status, scheduled_at, sent_at, gmail_message_id');
  if (oErr) console.error('Error fetching outreach_emails:', oErr);
  else {
    console.log(`Total Outreach Emails in DB: ${outreach.length}`);
    const outStatus = {};
    for (const o of outreach) {
      outStatus[o.status] = (outStatus[o.status] || 0) + 1;
    }
    console.log('Outreach Status Counts:', outStatus);
  }

  // d) Business Hours & Timezone Logic
  console.log('\n--- (d) Business-Hours Window & Timezone Logic ---');
  const now = new Date();
  const karachiTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
  }).format(now);
  console.log(`Current Server Time (UTC): ${now.toISOString()}`);
  console.log(`Current Operator Time (Asia/Karachi): ${karachiTime}`);

  // e) Settings & Daily Limit at runtime
  console.log('\n--- (e) Settings & Daily Limit at Runtime ---');
  const { data: settings, error: sErr } = await supabase.from('settings').select('*');
  if (sErr) console.error('Error fetching settings:', sErr);
  else {
    console.log(`Settings rows: ${settings.length}`);
    for (const s of settings) {
      console.log(`Setting [${s.key || s.id}]:`, s);
    }
  }

  // f) Queue, scheduler, locks, checkpoints, heartbeats
  console.log('\n--- (f) Queue, Scheduler, Locks & Heartbeats ---');
  const { data: locks, error: lErr } = await supabase.from('distributed_locks').select('*');
  console.log('Distributed Locks in DB:', locks || lErr);

  const { data: heartbeats, error: hErr } = await supabase.from('heartbeats').select('*').order('last_seen_at', { ascending: false }).limit(5);
  console.log('Recent Heartbeats:', heartbeats || hErr);

  const { data: checkpoints, error: cpErr } = await supabase.from('checkpoints').select('*').limit(5);
  console.log('Checkpoints in DB:', checkpoints || cpErr);

  // g) Gmail OAuth status & Token
  console.log('\n--- (g) Gmail OAuth Token Status ---');
  const { data: oauthTokens, error: oaErr } = await supabase.from('oauth_tokens').select('*');
  if (oaErr) console.error('Error fetching oauth_tokens:', oaErr);
  else {
    console.log(`OAuth Tokens found: ${oauthTokens.length}`);
    for (const t of oauthTokens) {
      console.log(`Token ID: ${t.id}, Provider: ${t.provider}, User: ${t.user_email}, Status: ${t.status}, Expires At: ${t.expires_at}, Scopes: ${t.scopes}`);
    }
  }

  // System Events
  console.log('\n--- Recent System Events (Errors/Alerts) ---');
  const { data: events, error: evErr } = await supabase.from('system_events').select('id, event_type, severity, message, created_at').order('created_at', { ascending: false }).limit(8);
  if (evErr) console.error('Error fetching system_events:', evErr);
  else {
    for (const ev of events) {
      console.log(`[${ev.created_at}] [${ev.severity}] ${ev.event_type}: ${ev.message}`);
    }
  }
}

run().catch(console.error);

