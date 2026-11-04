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

async function executeSql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`SQL Execution failed: ${res.status} - ${txt}`);
  }
  return res.json();
}

const schemaSql = `
-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. operators table
CREATE TABLE IF NOT EXISTS operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL DEFAULT 'Zia Ul Din',
    title VARCHAR(255) NOT NULL DEFAULT 'Full-Stack AI Developer & Automation Architect',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Karachi',
    country VARCHAR(50) NOT NULL DEFAULT 'Pakistan',
    hourly_rate_usd NUMERIC(10, 2) DEFAULT 95.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Zia Ul Din if not present
INSERT INTO operators (email, full_name, title, timezone, country)
VALUES ('ziauldin371@gmail.com', 'Zia Ul Din', 'Full-stack AI developer and automation architect', 'Asia/Karachi', 'Pakistan')
ON CONFLICT (email) DO UPDATE SET updated_at = NOW();

-- 2. contact_channels
CREATE TABLE IF NOT EXISTS contact_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    channel_type VARCHAR(50) NOT NULL CHECK (channel_type IN ('email', 'phone', 'whatsapp', 'instagram', 'linkedin', 'facebook', 'contact_form')),
    value TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_source VARCHAR(100),
    confidence NUMERIC(3, 2) DEFAULT 1.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. business_signals
CREATE TABLE IF NOT EXISTS business_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    signal_type VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    evidence_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. opportunity_scores
CREATE TABLE IF NOT EXISTS opportunity_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE UNIQUE,
    total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
    score_label VARCHAR(50) NOT NULL CHECK (score_label IN ('Excellent', 'Good', 'Weak')),
    summary_reason TEXT NOT NULL,
    breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. search_plan
CREATE TABLE IF NOT EXISTS search_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country VARCHAR(10) NOT NULL,
    region VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    industry VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'unsearched' CHECK (status IN ('unsearched', 'in_progress', 'completed', 'paused')),
    next_page_token TEXT,
    last_run_at TIMESTAMPTZ,
    leads_found INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. search_runs
CREATE TABLE IF NOT EXISTS search_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city VARCHAR(100) NOT NULL,
    country VARCHAR(10) NOT NULL,
    industry VARCHAR(150) NOT NULL,
    leads_found INTEGER NOT NULL DEFAULT 0,
    leads_qualified INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. jobs & job_steps
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled')),
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    summary_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    step_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. pitches
CREATE TABLE IF NOT EXISTS pitches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'linkedin', 'whatsapp', 'instagram', 'phone_script', 'contact_form')),
    subject TEXT,
    body TEXT NOT NULL,
    verified_claim_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    claim_check_passed BOOLEAN NOT NULL DEFAULT FALSE,
    linter_passed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. drafts
CREATE TABLE IF NOT EXISTS drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    pitch_id UUID REFERENCES pitches(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    body_text TEXT NOT NULL,
    body_html TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'queued', 'sent')),
    requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. send_log
CREATE TABLE IF NOT EXISTS send_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID REFERENCES drafts(id) ON DELETE SET NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL DEFAULT 'ziauldin371@gmail.com',
    subject TEXT NOT NULL,
    gmail_message_id VARCHAR(255),
    thread_id VARCHAR(255),
    labels JSONB NOT NULL DEFAULT '["SENT"]'::jsonb,
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'delivered' CHECK (status IN ('queued', 'delivered', 'reply_received', 'bounced', 'unsubscribed', 'failed')),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 11. replies
CREATE TABLE IF NOT EXISTS replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    send_log_id UUID REFERENCES send_log(id) ON DELETE SET NULL,
    from_email VARCHAR(255) NOT NULL,
    subject TEXT,
    snippet TEXT,
    sentiment VARCHAR(50) DEFAULT 'inquiry' CHECK (sentiment IN ('positive_price_inquiry', 'general_question', 'not_interested', 'unsubscribe_request', 'neutral')),
    is_hot_reply BOOLEAN NOT NULL DEFAULT FALSE,
    gmail_message_id VARCHAR(255) NOT NULL UNIQUE,
    thread_id VARCHAR(255),
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. touch_log (cross-channel 72h protection)
CREATE TABLE IF NOT EXISTS touch_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'phone', 'whatsapp', 'instagram', 'linkedin', 'facebook', 'contact_form')),
    operator_email VARCHAR(255) NOT NULL DEFAULT 'ziauldin371@gmail.com',
    action VARCHAR(100) NOT NULL,
    notes TEXT,
    touched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. daily_targets
CREATE TABLE IF NOT EXISTS daily_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
    channel VARCHAR(50) NOT NULL DEFAULT 'all',
    target_count INTEGER NOT NULL DEFAULT 10,
    completed_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. outreach_outcomes
CREATE TABLE IF NOT EXISTS outreach_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL,
    outcome VARCHAR(100) NOT NULL CHECK (outcome IN ('agreed_to_preview', 'call_back_later', 'busy_now', 'no_answer', 'voicemail', 'not_relevant', 'meeting_booked')),
    next_step_notes TEXT,
    scheduled_callback_at TIMESTAMPTZ,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. settings
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO settings (key, value, description)
VALUES 
    ('send_mode', '"approval"'::jsonb, 'Default review first mode before any email send'),
    ('auto_send_enabled', 'false'::jsonb, 'Auto-send toggle locked until live test confirmed'),
    ('daily_email_limit', '25'::jsonb, 'Daily safe send limit'),
    ('hard_daily_ceiling', '50'::jsonb, 'Absolute upper send limit'),
    ('spacing_profile_minutes', '6'::jsonb, 'Spacing delay between sends (4, 6, 10 min)'),
    ('emergency_stop', 'false'::jsonb, 'Halt all discovery, queuing, and sending')
ON CONFLICT (key) DO NOTHING;

-- 16. login_attempts
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    success BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_email ON login_attempts(ip_address, email, created_at);

-- 17. platform_profile & platform_applications & platform_spend
CREATE TABLE IF NOT EXISTS platform_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_email VARCHAR(255) NOT NULL UNIQUE DEFAULT 'ziauldin371@gmail.com',
    cv_completed BOOLEAN NOT NULL DEFAULT TRUE,
    github_profile_url TEXT NOT NULL DEFAULT 'https://github.com/ziauldin371',
    case_studies_count INTEGER NOT NULL DEFAULT 3,
    demo_video_ready BOOLEAN NOT NULL DEFAULT TRUE,
    screening_prep_done BOOLEAN NOT NULL DEFAULT TRUE,
    payout_method VARCHAR(50) NOT NULL DEFAULT 'Payoneer/Wise',
    w8ben_submitted BOOLEAN NOT NULL DEFAULT TRUE,
    readiness_score INTEGER NOT NULL DEFAULT 100,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_profile (operator_email, readiness_score)
VALUES ('ziauldin371@gmail.com', 100)
ON CONFLICT (operator_email) DO NOTHING;

CREATE TABLE IF NOT EXISTS platform_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ready_to_apply' CHECK (status IN ('ready_to_apply', 'applied', 'in_review', 'interview_scheduled', 'approved', 'rejected')),
    profile_url TEXT,
    applied_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_spend (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_name VARCHAR(100) NOT NULL,
    amount_usd NUMERIC(10, 2) NOT NULL,
    billing_period VARCHAR(50),
    invoice_url TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. lead_source_budgets
CREATE TABLE IF NOT EXISTS lead_source_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name VARCHAR(100) NOT NULL UNIQUE,
    monthly_budget_usd NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
    current_month_spend NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    credits_remaining INTEGER,
    reset_at TIMESTAMPTZ NOT NULL DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')
);

INSERT INTO lead_source_budgets (source_name, monthly_budget_usd)
VALUES 
    ('google_places', 50.00),
    ('apollo', 0.00),
    ('hunter', 0.00),
    ('companies_house', 0.00)
ON CONFLICT (source_name) DO NOTHING;

-- 19. proof_library
CREATE TABLE IF NOT EXISTS proof_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    client_industry VARCHAR(100) NOT NULL,
    problem_addressed TEXT NOT NULL,
    solution_delivered TEXT NOT NULL,
    verifiable_metric TEXT NOT NULL,
    live_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. offers
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    pipeline_type VARCHAR(100) NOT NULL,
    price_usd NUMERIC(10, 2) NOT NULL,
    timeline_days INTEGER NOT NULL,
    deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO offers (name, pipeline_type, price_usd, timeline_days, deliverables)
VALUES
    ('Rapid Business Website & Booking System', 'website_opportunities', 500.00, 3, '["Next.js Fast Loading Mobile Site", "Direct WhatsApp & Call Booking Buttons", "Google Places SEO Audit & Map Sync", "1-Year Hosting & SSL Setup"]'::jsonb),
    ('24/7 AI Receptionist & Chatbot Assistant', 'ai_software_opportunities', 750.00, 4, '["Custom LLM Trained on Business Services & FAQs", "WhatsApp & Web Embed Integration", "Instant Lead Capture to Google Sheets / Email", "Human Handoff Trigger"]'::jsonb),
    ('Automated Client Workflow & Intake Engine', 'ai_software_opportunities', 1200.00, 7, '["Automated Email & Form Intake Routing", "CRM / Database Synchronization", "Instant Customer Confirmation SMS & Calendar Invite", "Zero Manual Data Entry"]'::jsonb)
ON CONFLICT DO NOTHING;

-- 21. audit_log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_email VARCHAR(255) NOT NULL DEFAULT 'ziauldin371@gmail.com',
    action VARCHAR(100) NOT NULL,
    target_entity VARCHAR(100),
    target_id TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. unsubscribe_events
CREATE TABLE IF NOT EXISTS unsubscribe_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    method VARCHAR(50) NOT NULL DEFAULT 'link_click',
    source_message_id VARCHAR(255),
    unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Views for backward compatibility with alternate table naming
CREATE OR REPLACE VIEW evidence AS SELECT * FROM growth_evidence;

-- Enable RLS on all newly created tables
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE touch_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_source_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsubscribe_events ENABLE ROW LEVEL SECURITY;

-- Grants for service role (full access)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grants for anon role (strictly read-only on public subscriptions, nothing private)
GRANT SELECT ON jobs, job_steps, send_log, replies TO anon;
`;

async function apply() {
  console.log('Applying comprehensive B2 schema updates to Supabase...');
  try {
    const res = await executeSql(schemaSql);
    console.log('Schema updates applied successfully!', res);
    
    // Save to supabase/full_schema_setup.sql as required
    fs.mkdirSync('supabase', { recursive: true });
    fs.writeFileSync('supabase/full_schema_setup.sql', schemaSql);
    console.log('Wrote supabase/full_schema_setup.sql');
  } catch (err) {
    console.error('Error applying schema:', err.message);
  }
}

apply();

