import { OpportunityScoreEntity } from '@/lib/supabase/data-store';
import { WebsiteVerificationResult } from './website-verifier';

export interface ScoreContext {
  name: string;
  websiteStatus: WebsiteVerificationResult['status'];
  websiteDetails: string;
  rating?: number | null;
  reviewCount?: number | null;
  hasPhone: boolean;
  hasHours: boolean;
  photoCount: number;
  measuredLoadTimeMs?: number;
}

export interface CalculatedOpportunity {
  score: OpportunityScoreEntity;
  opportunityText: string;
  pipelineType: 'website_opportunities' | 'ai_software_opportunities';
  issueBadge: string;
}

export function calculateOpportunity(businessId: string, ctx: ScoreContext): CalculatedOpportunity {
  let points = 20; // baseline
  const breakdown: Record<string, number | string> = {};
  const observations: string[] = [];
  let pipelineType: 'website_opportunities' | 'ai_software_opportunities' = 'website_opportunities';
  let issueBadge = 'Standard Profile';

  // 1. Website Status Scoring
  if (ctx.websiteStatus === 'no_website') {
    points += 45;
    breakdown['no_website_penalty'] = 45;
    observations.push('No website link is present on Google Maps');
    pipelineType = 'website_opportunities';
    issueBadge = 'No Website Found';
  } else if (ctx.websiteStatus === 'social_only') {
    points += 35;
    breakdown['social_page_only'] = 35;
    observations.push('Relies exclusively on a third-party social media profile');
    pipelineType = 'website_opportunities';
    issueBadge = 'Social Page Only';
  } else if (ctx.websiteStatus === 'has_problems') {
    points += 30;
    breakdown['website_issues'] = 30;
    observations.push(ctx.websiteDetails);
    pipelineType = 'website_opportunities';
    issueBadge = ctx.measuredLoadTimeMs && ctx.measuredLoadTimeMs > 3500
      ? `Broken on Mobile Phones (${(ctx.measuredLoadTimeMs / 1000).toFixed(1)}s load)`
      : 'Website has problems';
  } else if (ctx.websiteStatus === 'healthy') {
    pipelineType = 'ai_software_opportunities';
    issueBadge = 'Needs AI Assistant';
  }

  // 2. High rating with customer volume represents high conversion potential
  if (ctx.rating && ctx.reviewCount) {
    if (ctx.rating >= 4.0 && ctx.reviewCount >= 20) {
      points += 20;
      breakdown['reputation_strength'] = 20;
      observations.push(`Strong reputation with ${ctx.rating} stars across ${ctx.reviewCount} customer reviews`);
    } else if (ctx.rating < 4.0 && ctx.reviewCount >= 10) {
      points += 15;
      breakdown['reputation_improvement_needed'] = 15;
      observations.push(`Public rating is ${ctx.rating} stars, indicating opportunity for proactive customer triage`);
    }
  }

  // 3. Operational completeness
  if (!ctx.hasHours) {
    points += 10;
    breakdown['missing_operating_hours'] = 10;
    observations.push('Business hours are not published on Google profile');
  }

  if (ctx.photoCount < 3) {
    points += 5;
    breakdown['sparse_photos'] = 5;
    observations.push('Fewer than 3 photos available on profile');
  }

  // Clamp score between 0 and 100
  const totalScore = Math.min(100, Math.max(0, points));

  let scoreLabel: 'Excellent' | 'Good' | 'Weak' = 'Weak';
  if (totalScore >= 75) {
    scoreLabel = 'Excellent';
  } else if (totalScore >= 50) {
    scoreLabel = 'Good';
  }

  const summaryReason = observations.length > 0
    ? observations.join('. ') + '.'
    : 'Standard local business profile with verified contact details.';

  // Construct honest, evidence-only opportunity text without fake revenue claims
  let opportunityText = '';
  if (ctx.websiteStatus === 'no_website' && ctx.reviewCount && ctx.rating) {
    opportunityText = `Has ${ctx.reviewCount} reviews (${ctx.rating}★) on Google Maps but no official website for direct booking or customer intake.`;
  } else if (ctx.websiteStatus === 'social_only') {
    opportunityText = 'Directs Google Maps visitors to a social profile without an independent mobile site.';
  } else if (ctx.websiteStatus === 'has_problems' && ctx.measuredLoadTimeMs) {
    opportunityText = `Existing website recorded a measured response time of ${(ctx.measuredLoadTimeMs / 1000).toFixed(1)}s, impacting mobile visitors.`;
  } else {
    opportunityText = summaryReason;
  }

  return {
    score: {
      business_id: businessId,
      total_score: totalScore,
      score_label: scoreLabel,
      summary_reason: summaryReason,
      breakdown,
    },
    opportunityText,
    pipelineType,
    issueBadge,
  };
}

