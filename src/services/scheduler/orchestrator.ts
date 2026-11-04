import { IDataStore } from '@/lib/supabase/data-store';
import { searchGooglePlacesNew } from '../discovery/places-client';
import { verifyBusinessWebsite } from '../discovery/website-verifier';
import { calculateOpportunity } from '../discovery/scoring';
import { findDuplicateBusiness } from '../discovery/dedupe';
import { generatePitchWithGemini } from '../pitch/gemini-client';

export interface DiscoveryRunParams {
  city: string;
  country: string;
  industry: string;
  maxLeads?: number;
  mode?: 'find_only' | 'find_and_draft';
}

export interface RunSummary {
  city: string;
  country: string;
  industry: string;
  leadsFound: number;
  leadsCreated: number;
  draftsCreated: number;
  skippedDuplicates: number;
  costUsd: number;
  status: 'completed' | 'skipped' | 'failed';
  message: string;
}

export async function executeDiscoveryRun(
  params: DiscoveryRunParams,
  store: IDataStore,
  jobId?: string
): Promise<RunSummary> {
  const maxLeads = params.maxLeads || 5;
  const mode = params.mode || 'find_and_draft';

  // Step 1: Check emergency stop
  const emergencyStop = await store.getSetting<boolean>('emergency_stop', false);
  if (emergencyStop) {
    if (jobId) await store.addJobStep(jobId, 'Check Emergency Stop', 'failed', 'Emergency stop active');
    return {
      city: params.city,
      country: params.country,
      industry: params.industry,
      leadsFound: 0,
      leadsCreated: 0,
      draftsCreated: 0,
      skippedDuplicates: 0,
      costUsd: 0,
      status: 'skipped',
      message: 'Run skipped: Emergency Stop is active.',
    };
  }

  // Step 2: Search Google Places
  if (jobId) await store.addJobStep(jobId, 'Searching Google Places', 'running', `Query: ${params.industry} in ${params.city}, ${params.country}`);

  let placesResponse;
  try {
    placesResponse = await searchGooglePlacesNew({
      textQuery: `${params.industry} in ${params.city}, ${params.country}`,
      maxResultCount: maxLeads,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (jobId) await store.addJobStep(jobId, 'Searching Google Places', 'failed', errorMsg);
    return {
      city: params.city,
      country: params.country,
      industry: params.industry,
      leadsFound: 0,
      leadsCreated: 0,
      draftsCreated: 0,
      skippedDuplicates: 0,
      costUsd: 0,
      status: 'failed',
      message: `Search failed: ${errorMsg}`,
    };
  }

  if (jobId) await store.addJobStep(jobId, 'Searching Google Places', 'completed', `Found ${placesResponse.places.length} places`);

  // Existing businesses for deduplication
  const existingBusinesses = await store.getBusinesses({ city: params.city, limit: 100 });

  let leadsCreated = 0;
  let draftsCreated = 0;
  let skippedDuplicates = 0;

  for (const place of placesResponse.places) {
    const name = place.displayName?.text || 'Local Business';
    const rawWebsite = place.websiteUri;
    const phone = place.internationalPhoneNumber || place.nationalPhoneNumber;
    const address = place.formattedAddress;

    // Deduplication check
    const dupCheck = findDuplicateBusiness(
      {
        sourceIdentifier: place.id,
        name,
        phone,
        address,
        domain: rawWebsite,
      },
      existingBusinesses
    );

    if (dupCheck.isDuplicate) {
      skippedDuplicates++;
      continue;
    }

    // Step 3: Check Website
    if (jobId) await store.addJobStep(jobId, 'Checking Website', 'running', `Verifying ${name}...`);
    const websiteResult = await verifyBusinessWebsite(rawWebsite);

    // Step 4: Calculate Opportunity Score
    const opportunity = calculateOpportunity(`temp_${place.id}`, {
      name,
      websiteStatus: websiteResult.status,
      websiteDetails: websiteResult.details,
      rating: place.rating,
      reviewCount: place.userRatingCount,
      hasPhone: Boolean(phone),
      hasHours: Boolean(place.regularOpeningHours?.weekdayDescriptions?.length),
      photoCount: place.photos?.length || 0,
      measuredLoadTimeMs: websiteResult.loadTimeMs,
    });

    // Save business to database
    const savedBiz = await store.saveBusiness({
      name,
      normalized_name: name.toLowerCase(),
      country: params.country,
      city: params.city,
      address,
      phone,
      domain: rawWebsite,
      industry: params.industry,
      pipeline_type: opportunity.pipelineType,
      qualification_status: 'qualified',
      source_provider: 'google_places',
      source_identifier: place.id,
      rating: place.rating,
      user_rating_count: place.userRatingCount,
      opportunity_text: opportunity.opportunityText,
    });

    // Save evidence
    await store.saveEvidence({
      business_id: savedBiz.id,
      source_name: 'google_places',
      source_url: place.googleMapsUri,
      summary: opportunity.opportunityText,
      evidence_type: 'places_verification',
      is_factual: true,
      captured_at: new Date().toISOString(),
    });

    // Save opportunity score
    await store.saveOpportunityScore({
      ...opportunity.score,
      business_id: savedBiz.id,
    });

    leadsCreated++;

    // Step 5: Draft Generation (if mode === 'find_and_draft')
    if (mode === 'find_and_draft') {
      if (jobId) await store.addJobStep(jobId, 'Writing Draft', 'running', `Drafting pitch for ${name}...`);
      const pitch = await generatePitchWithGemini({
        businessName: name,
        industry: params.industry,
        city: params.city,
        evidence: [
          {
            business_id: savedBiz.id,
            source_name: 'google_places',
            summary: opportunity.opportunityText,
            evidence_type: 'places_verification',
            is_factual: true,
          },
        ],
        offerName: 'Rapid Business Website & Direct Booking System',
        offerPriceUsd: 500,
        offerTimelineDays: 3,
        channel: 'email',
      });

      await store.saveDraft({
        business_id: savedBiz.id,
        recipient_email: 'inquiry@' + (rawWebsite ? new URL(rawWebsite).hostname.replace(/^www\./, '') : 'localbusiness.com'),
        subject: pitch.subject || `Website for ${name}`,
        body_text: pitch.body,
        status: 'pending_approval',
        requires_approval: true,
      });

      draftsCreated++;
    }
  }

  if (jobId) {
    await store.addJobStep(
      jobId,
      'Done',
      'completed',
      `Processed ${placesResponse.places.length} leads. Created ${leadsCreated} verified records, ${draftsCreated} drafts.`
    );
  }

  return {
    city: params.city,
    country: params.country,
    industry: params.industry,
    leadsFound: placesResponse.places.length,
    leadsCreated,
    draftsCreated,
    skippedDuplicates,
    costUsd: placesResponse.estimatedCostUsd,
    status: 'completed',
    message: `Discovery complete for ${params.industry} in ${params.city}: ${leadsCreated} new qualified leads, ${draftsCreated} drafts for Zia's review.`,
  };
}
