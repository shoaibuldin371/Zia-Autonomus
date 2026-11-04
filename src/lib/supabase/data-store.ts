import { getSupabaseServerClient } from './client';

export interface BusinessEntity {
  id: string;
  name: string;
  normalized_name: string;
  domain?: string | null;
  country: string;
  city?: string | null;
  region?: string | null;
  address?: string | null;
  phone?: string | null;
  industry?: string | null;
  pipeline_type: 'website_opportunities' | 'ai_software_opportunities' | 'unassigned' | 'disqualified';
  qualification_status: 'unreviewed' | 'qualified' | 'disqualified' | 'contacted' | 'replied' | 'closed_won';
  source_provider: string;
  source_identifier?: string | null;
  website_status?: 'no_website' | 'social_only' | 'has_problems' | 'healthy' | 'unknown';
  rating?: number | null;
  user_rating_count?: number | null;
  opportunity_text?: string | null;
  best_way_to_reach?: string | null;
  is_demo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EvidenceEntity {
  id?: string;
  business_id: string;
  source_name: string;
  source_url?: string | null;
  summary: string;
  evidence_type: string;
  is_factual: boolean;
  confidence?: number;
  metadata?: Record<string, unknown>;
  captured_at?: string;
}

export interface OpportunityScoreEntity {
  business_id: string;
  total_score: number;
  score_label: 'Excellent' | 'Good' | 'Weak';
  summary_reason: string;
  breakdown: Record<string, number | string>;
}

export interface DraftEntity {
  id: string;
  business_id: string;
  recipient_email: string;
  subject: string;
  body_text: string;
  body_html?: string | null;
  status: 'pending_approval' | 'approved' | 'rejected' | 'queued' | 'sent';
  requires_approval: boolean;
  created_at?: string;
}

export interface SendLogEntity {
  id: string;
  business_id?: string | null;
  draft_id?: string | null;
  recipient_email: string;
  sender_email: string;
  subject: string;
  gmail_message_id?: string | null;
  thread_id?: string | null;
  labels: string[];
  idempotency_key: string;
  status: 'queued' | 'delivered' | 'reply_received' | 'bounced' | 'unsubscribed' | 'failed';
  sent_at?: string;
}

export interface ReplyEntity {
  id: string;
  send_log_id?: string | null;
  from_email: string;
  subject?: string | null;
  snippet?: string | null;
  sentiment: 'positive_price_inquiry' | 'general_question' | 'not_interested' | 'unsubscribe_request' | 'neutral';
  is_hot_reply: boolean;
  gmail_message_id: string;
  thread_id?: string | null;
  received_at?: string;
}

export interface TouchLogEntity {
  id?: string;
  business_id: string;
  channel: 'email' | 'phone' | 'whatsapp' | 'instagram' | 'linkedin' | 'facebook' | 'contact_form';
  operator_email: string;
  action: string;
  notes?: string | null;
  touched_at?: string;
}

export interface SearchPlanEntity {
  id: string;
  country: string;
  region?: string | null;
  city: string;
  industry: string;
  status: 'unsearched' | 'in_progress' | 'completed' | 'paused';
  next_page_token?: string | null;
  last_run_at?: string | null;
  leads_found: number;
}

export interface JobEntity {
  id: string;
  job_type: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  parameters: Record<string, unknown>;
  progress_percentage: number;
  summary_message?: string | null;
  created_at?: string;
}

export interface IDataStore {
  mode: 'supabase_postgresql' | 'in_memory_dev';
  isConnected(): Promise<boolean>;

  // Businesses
  getBusinesses(options?: {
    filter?: string;
    city?: string;
    limit?: number;
    offset?: number;
    includeDemo?: boolean;
  }): Promise<BusinessEntity[]>;
  getBusinessById(id: string): Promise<BusinessEntity | null>;
  saveBusiness(business: Partial<BusinessEntity>): Promise<BusinessEntity>;
  
  // Evidence & Scores
  getEvidence(businessId: string): Promise<EvidenceEntity[]>;
  saveEvidence(evidence: EvidenceEntity): Promise<void>;
  getOpportunityScore(businessId: string): Promise<OpportunityScoreEntity | null>;
  saveOpportunityScore(score: OpportunityScoreEntity): Promise<void>;

  // Drafts & Sending
  getDrafts(status?: string): Promise<DraftEntity[]>;
  getDraftById(id: string): Promise<DraftEntity | null>;
  saveDraft(draft: Partial<DraftEntity>): Promise<DraftEntity>;
  updateDraftStatus(id: string, status: DraftEntity['status']): Promise<void>;
  getSendLogs(limit?: number): Promise<SendLogEntity[]>;
  saveSendLog(log: SendLogEntity): Promise<void>;
  getReplies(): Promise<ReplyEntity[]>;
  saveReply(reply: ReplyEntity): Promise<void>;

  // Safety & Suppression
  isSuppressed(email: string): Promise<boolean>;
  addToSuppressionList(email: string, reason: string): Promise<void>;
  recordTouch(touch: TouchLogEntity): Promise<void>;
  hasRecentTouch(businessId: string, withinHours?: number): Promise<boolean>;
  getSetting<T>(key: string, defaultValue: T): Promise<T>;
  updateSetting<T>(key: string, value: T): Promise<void>;

  // Search Plan & Jobs
  getSearchPlan(): Promise<SearchPlanEntity[]>;
  getNextSearchPlanRow(): Promise<SearchPlanEntity | null>;
  updateSearchPlanRow(id: string, updates: Partial<SearchPlanEntity>): Promise<void>;
  createJob(jobType: string, parameters: Record<string, unknown>): Promise<JobEntity>;
  getJob(id: string): Promise<JobEntity | null>;
  updateJob(id: string, updates: Partial<JobEntity>): Promise<void>;
  addJobStep(jobId: string, stepName: string, status: 'pending' | 'running' | 'completed' | 'failed', details?: string): Promise<void>;

  // Locks
  acquireLock(key: string, ttlSeconds: number): Promise<boolean>;
  releaseLock(key: string): Promise<void>;
}

/**
 * Concrete Supabase Implementation of IDataStore
 */
export class SupabaseDataStore implements IDataStore {
  readonly mode = 'supabase_postgresql';

  private get client() {
    return getSupabaseServerClient();
  }

  async isConnected(): Promise<boolean> {
    try {
      const { error } = await this.client.from('businesses').select('count', { count: 'exact', head: true });
      return !error;
    } catch {
      return false;
    }
  }

  async getBusinesses(options: {
    filter?: string;
    city?: string;
    limit?: number;
    offset?: number;
    includeDemo?: boolean;
  } = {}): Promise<BusinessEntity[]> {
    let query = this.client.from('businesses').select('*');

    if (options.city) {
      query = query.ilike('city', `%${options.city}%`);
    }

    if (options.filter && options.filter !== 'all') {
      if (options.filter === 'no_website') {
        query = query.eq('pipeline_type', 'website_opportunities');
      } else if (options.filter === 'needs_ai') {
        query = query.eq('pipeline_type', 'ai_software_opportunities');
      }
    }

    query = query.order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Supabase query failed: ${error.message}`);
    return (data || []) as BusinessEntity[];
  }

  async getBusinessById(id: string): Promise<BusinessEntity | null> {
    const { data, error } = await this.client.from('businesses').select('*').eq('id', id).single();
    if (error || !data) return null;
    return data as BusinessEntity;
  }

  async saveBusiness(business: Partial<BusinessEntity>): Promise<BusinessEntity> {
    const { data, error } = await this.client
      .from('businesses')
      .upsert(business)
      .select()
      .single();
    if (error) throw new Error(`Failed to save business: ${error.message}`);
    return data as BusinessEntity;
  }

  async getEvidence(businessId: string): Promise<EvidenceEntity[]> {
    const { data, error } = await this.client
      .from('evidence')
      .select('*')
      .eq('business_id', businessId)
      .order('observation_time', { ascending: false });
    if (error) return [];
    return (data || []) as EvidenceEntity[];
  }

  async saveEvidence(evidence: EvidenceEntity): Promise<void> {
    const { error } = await this.client.from('growth_evidence').insert({
      business_id: evidence.business_id,
      source_name: evidence.source_name,
      source_url: evidence.source_url,
      summary: evidence.summary,
      evidence_type: evidence.evidence_type,
      is_factual: evidence.is_factual,
      confidence: evidence.confidence ?? 1.0,
      metadata: evidence.metadata ?? {},
    });
    if (error) throw new Error(`Failed to insert evidence: ${error.message}`);
  }

  async getOpportunityScore(businessId: string): Promise<OpportunityScoreEntity | null> {
    const { data, error } = await this.client
      .from('opportunity_scores')
      .select('*')
      .eq('business_id', businessId)
      .single();
    if (error || !data) return null;
    return data as OpportunityScoreEntity;
  }

  async saveOpportunityScore(score: OpportunityScoreEntity): Promise<void> {
    const { error } = await this.client.from('opportunity_scores').upsert(score);
    if (error) throw new Error(`Failed to save score: ${error.message}`);
  }

  async getDrafts(status?: string): Promise<DraftEntity[]> {
    let query = this.client.from('drafts').select('*').order('created_at', { ascending: false });
    if (status) {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) return [];
    return (data || []) as DraftEntity[];
  }

  async getDraftById(id: string): Promise<DraftEntity | null> {
    const { data, error } = await this.client.from('drafts').select('*').eq('id', id).single();
    if (error || !data) return null;
    return data as DraftEntity;
  }

  async saveDraft(draft: Partial<DraftEntity>): Promise<DraftEntity> {
    const { data, error } = await this.client.from('drafts').upsert(draft).select().single();
    if (error) throw new Error(`Failed to save draft: ${error.message}`);
    return data as DraftEntity;
  }

  async updateDraftStatus(id: string, status: DraftEntity['status']): Promise<void> {
    const { error } = await this.client.from('drafts').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw new Error(`Failed to update draft status: ${error.message}`);
  }

  async getSendLogs(limit = 50): Promise<SendLogEntity[]> {
    const { data, error } = await this.client
      .from('send_log')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data || []) as SendLogEntity[];
  }

  async saveSendLog(log: SendLogEntity): Promise<void> {
    const { error } = await this.client.from('send_log').insert(log);
    if (error) throw new Error(`Failed to record send log: ${error.message}`);
  }

  async getReplies(): Promise<ReplyEntity[]> {
    const { data, error } = await this.client
      .from('replies')
      .select('*')
      .order('received_at', { ascending: false });
    if (error) return [];
    return (data || []) as ReplyEntity[];
  }

  async saveReply(reply: ReplyEntity): Promise<void> {
    const { error } = await this.client.from('replies').insert(reply);
    if (error) throw new Error(`Failed to save reply: ${error.message}`);
  }

  async isSuppressed(email: string): Promise<boolean> {
    const normalized = email.trim().toLowerCase();
    const { data } = await this.client
      .from('suppression_list')
      .select('email')
      .eq('email', normalized)
      .maybeSingle();
    return !!data;
  }

  async addToSuppressionList(email: string, reason: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    await this.client.from('suppression_list').upsert({
      email: normalized,
      reason,
      suppressed_at: new Date().toISOString(),
    });
  }

  async recordTouch(touch: TouchLogEntity): Promise<void> {
    const { error } = await this.client.from('touch_log').insert(touch);
    if (error) throw new Error(`Failed to record touch: ${error.message}`);
  }

  async hasRecentTouch(businessId: string, withinHours = 72): Promise<boolean> {
    const threshold = new Date(Date.now() - withinHours * 3600 * 1000).toISOString();
    const { data } = await this.client
      .from('touch_log')
      .select('id')
      .eq('business_id', businessId)
      .gte('touched_at', threshold)
      .limit(1);
    return Boolean(data && data.length > 0);
  }

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const { data, error } = await this.client.from('settings').select('value').eq('key', key).single();
      if (error || !data) return defaultValue;
      return data.value as T;
    } catch {
      return defaultValue;
    }
  }

  async updateSetting<T>(key: string, value: T): Promise<void> {
    const { error } = await this.client.from('settings').upsert({
      key,
      value: JSON.stringify(value),
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(`Failed to update setting ${key}: ${error.message}`);
  }

  async getSearchPlan(): Promise<SearchPlanEntity[]> {
    const { data, error } = await this.client.from('search_plan').select('*').order('created_at', { ascending: true });
    if (error) return [];
    return (data || []) as SearchPlanEntity[];
  }

  async getNextSearchPlanRow(): Promise<SearchPlanEntity | null> {
    const { data, error } = await this.client
      .from('search_plan')
      .select('*')
      .neq('status', 'paused')
      .order('last_run_at', { ascending: true, nullsFirst: true })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return data as SearchPlanEntity;
  }

  async updateSearchPlanRow(id: string, updates: Partial<SearchPlanEntity>): Promise<void> {
    await this.client.from('search_plan').update(updates).eq('id', id);
  }

  async createJob(jobType: string, parameters: Record<string, unknown>): Promise<JobEntity> {
    const { data, error } = await this.client
      .from('jobs')
      .insert({
        job_type: jobType,
        parameters,
        status: 'pending',
        progress_percentage: 0,
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to create job: ${error.message}`);
    return data as JobEntity;
  }

  async getJob(id: string): Promise<JobEntity | null> {
    const { data, error } = await this.client.from('jobs').select('*').eq('id', id).single();
    if (error || !data) return null;
    return data as JobEntity;
  }

  async updateJob(id: string, updates: Partial<JobEntity>): Promise<void> {
    await this.client.from('jobs').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  }

  async addJobStep(jobId: string, stepName: string, status: 'pending' | 'running' | 'completed' | 'failed', details?: string): Promise<void> {
    await this.client.from('job_steps').insert({
      job_id: jobId,
      step_name: stepName,
      status,
      details,
    });
  }

  async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    // Try deleting expired lock first
    await this.client.from('distributed_locks').delete().eq('lock_key', key).lt('expires_at', now.toISOString());

    // Try insert
    const { error } = await this.client.from('distributed_locks').insert({
      lock_key: key,
      holder_id: `process_${process.pid}_${Math.random()}`,
      acquired_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    return !error;
  }

  async releaseLock(key: string): Promise<void> {
    await this.client.from('distributed_locks').delete().eq('lock_key', key);
  }
}

/**
 * In-Memory Data Store Implementation for unit testing and local development
 */
export class InMemoryDataStore implements IDataStore {
  readonly mode = 'in_memory_dev';
  private businesses = new Map<string, BusinessEntity>();
  private evidence = new Map<string, EvidenceEntity[]>();
  private scores = new Map<string, OpportunityScoreEntity>();
  private drafts = new Map<string, DraftEntity>();
  private sendLogs: SendLogEntity[] = [];
  private replies: ReplyEntity[] = [];
  private suppression = new Set<string>();
  private touchLog: TouchLogEntity[] = [];
  private settings = new Map<string, unknown>();
  private searchPlan: SearchPlanEntity[] = [];
  private jobs = new Map<string, JobEntity>();
  private locks = new Map<string, number>();

  async isConnected(): Promise<boolean> {
    return true;
  }

  async getBusinesses(options: { filter?: string; city?: string; limit?: number } = {}): Promise<BusinessEntity[]> {
    let list = Array.from(this.businesses.values());
    if (options.city) list = list.filter(b => b.city?.toLowerCase().includes(options.city!.toLowerCase()));
    if (options.limit) list = list.slice(0, options.limit);
    return list;
  }

  async getBusinessById(id: string): Promise<BusinessEntity | null> {
    return this.businesses.get(id) || null;
  }

  async saveBusiness(b: Partial<BusinessEntity>): Promise<BusinessEntity> {
    const entity = {
      id: b.id || `biz_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: b.name || 'Untitled Business',
      normalized_name: (b.name || '').toLowerCase(),
      country: b.country || 'US',
      pipeline_type: b.pipeline_type || 'unassigned',
      qualification_status: b.qualification_status || 'unreviewed',
      source_provider: b.source_provider || 'manual',
      ...b,
    } as BusinessEntity;
    this.businesses.set(entity.id, entity);
    return entity;
  }

  async getEvidence(businessId: string): Promise<EvidenceEntity[]> {
    return this.evidence.get(businessId) || [];
  }

  async saveEvidence(e: EvidenceEntity): Promise<void> {
    const list = this.evidence.get(e.business_id) || [];
    list.push(e);
    this.evidence.set(e.business_id, list);
  }

  async getOpportunityScore(businessId: string): Promise<OpportunityScoreEntity | null> {
    return this.scores.get(businessId) || null;
  }

  async saveOpportunityScore(score: OpportunityScoreEntity): Promise<void> {
    this.scores.set(score.business_id, score);
  }

  async getDrafts(status?: string): Promise<DraftEntity[]> {
    let list = Array.from(this.drafts.values());
    if (status) list = list.filter(d => d.status === status);
    return list;
  }

  async getDraftById(id: string): Promise<DraftEntity | null> {
    return this.drafts.get(id) || null;
  }

  async saveDraft(d: Partial<DraftEntity>): Promise<DraftEntity> {
    const entity = {
      id: d.id || `draft_${Date.now()}`,
      business_id: d.business_id || '',
      recipient_email: d.recipient_email || '',
      subject: d.subject || '',
      body_text: d.body_text || '',
      status: d.status || 'pending_approval',
      requires_approval: d.requires_approval ?? true,
      created_at: new Date().toISOString(),
      ...d,
    } as DraftEntity;
    this.drafts.set(entity.id, entity);
    return entity;
  }

  async updateDraftStatus(id: string, status: DraftEntity['status']): Promise<void> {
    const d = this.drafts.get(id);
    if (d) d.status = status;
  }

  async getSendLogs(limit = 50): Promise<SendLogEntity[]> {
    return this.sendLogs.slice(0, limit);
  }

  async saveSendLog(log: SendLogEntity): Promise<void> {
    this.sendLogs.unshift(log);
  }

  async getReplies(): Promise<ReplyEntity[]> {
    return this.replies;
  }

  async saveReply(reply: ReplyEntity): Promise<void> {
    this.replies.unshift(reply);
  }

  async isSuppressed(email: string): Promise<boolean> {
    return this.suppression.has(email.toLowerCase());
  }

  async addToSuppressionList(email: string, _reason?: string): Promise<void> {
    this.suppression.add(email.toLowerCase());
  }

  async recordTouch(touch: TouchLogEntity): Promise<void> {
    this.touchLog.push(touch);
  }

  async hasRecentTouch(businessId: string, withinHours = 72): Promise<boolean> {
    const threshold = Date.now() - withinHours * 3600 * 1000;
    return this.touchLog.some(
      t => t.business_id === businessId && new Date(t.touched_at || 0).getTime() >= threshold
    );
  }

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    return (this.settings.get(key) as T) ?? defaultValue;
  }

  async updateSetting<T>(key: string, value: T): Promise<void> {
    this.settings.set(key, value);
  }

  async getSearchPlan(): Promise<SearchPlanEntity[]> {
    return this.searchPlan;
  }

  async getNextSearchPlanRow(): Promise<SearchPlanEntity | null> {
    return this.searchPlan[0] || null;
  }

  async updateSearchPlanRow(id: string, updates: Partial<SearchPlanEntity>): Promise<void> {
    const idx = this.searchPlan.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.searchPlan[idx] = { ...this.searchPlan[idx], ...updates };
    }
  }

  async createJob(jobType: string, parameters: Record<string, unknown>): Promise<JobEntity> {
    const job: JobEntity = {
      id: `job_${Date.now()}`,
      job_type: jobType,
      parameters,
      status: 'pending',
      progress_percentage: 0,
      created_at: new Date().toISOString(),
    };
    this.jobs.set(job.id, job);
    return job;
  }

  async getJob(id: string): Promise<JobEntity | null> {
    return this.jobs.get(id) || null;
  }

  async updateJob(id: string, updates: Partial<JobEntity>): Promise<void> {
    const job = this.jobs.get(id);
    if (job) Object.assign(job, updates);
  }

  async addJobStep(): Promise<void> {
    // no-op in memory
  }

  async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
    const now = Date.now();
    const exp = this.locks.get(key);
    if (exp && exp > now) return false;
    this.locks.set(key, now + ttlSeconds * 1000);
    return true;
  }

  async releaseLock(key: string): Promise<void> {
    this.locks.delete(key);
  }
}

/**
 * Returns the singleton data store based on environment
 */
let dataStoreInstance: IDataStore | null = null;

export function getDataStore(): IDataStore {
  if (dataStoreInstance) return dataStoreInstance;

  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasSupabaseKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (hasSupabaseUrl && hasSupabaseKey) {
    dataStoreInstance = new SupabaseDataStore();
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FAIL CLOSED: Supabase configuration missing in production environment.');
    }
    dataStoreInstance = new InMemoryDataStore();
  }

  return dataStoreInstance;
}
