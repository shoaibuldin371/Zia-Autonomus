export interface GooglePlaceResult {
  id: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  photos?: Array<{ name: string; widthPx: number; heightPx: number }>;
  primaryType?: string;
  types?: string[];
  reviews?: Array<{
    text?: { text: string };
    rating?: number;
    publishTime?: string;
  }>;
}

export interface PlacesSearchResponse {
  places: GooglePlaceResult[];
  nextPageToken?: string;
  estimatedCostUsd: number;
}

const PLACES_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.websiteUri',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.googleMapsUri',
  'places.rating',
  'places.userRatingCount',
  'places.businessStatus',
  'places.regularOpeningHours',
  'places.photos',
  'places.primaryType',
  'places.types',
  'places.reviews',
  'nextPageToken',
].join(',');

// Standard Google Places API TextSearch pricing: ~$0.032 per request (Text Search Enterprise with review/contact fields)
const COST_PER_SEARCH_REQUEST_USD = 0.035;

/**
 * Searches places via Google Places API (New) with exponential backoff and fail-closed safety.
 */
export async function searchGooglePlacesNew(params: {
  textQuery: string;
  pageToken?: string;
  maxResultCount?: number;
}): Promise<PlacesSearchResponse> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('Google Places key is missing. Add GOOGLE_PLACES_API_KEY in Setup & Connections.');
  }

  const endpoint = 'https://places.googleapis.com/v1/places:searchText';
  const maxRetries = 3;
  let attempt = 0;
  let delay = 1000;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const body: Record<string, unknown> = {
        textQuery: params.textQuery,
        pageSize: Math.min(params.maxResultCount || 20, 20),
      };

      if (params.pageToken) {
        body.pageToken = params.pageToken;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey.trim(),
          'X-Goog-FieldMask': PLACES_FIELD_MASK,
        },
        body: JSON.stringify(body),
      });

      if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
        if (attempt === maxRetries) {
          throw new Error(`Google Places API returned HTTP ${res.status} after ${maxRetries} attempts.`);
        }
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
        continue;
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Google Places API error (HTTP ${res.status}): ${errorText}`);
      }

      const data = await res.json();
      return {
        places: data.places || [],
        nextPageToken: data.nextPageToken,
        estimatedCostUsd: COST_PER_SEARCH_REQUEST_USD,
      };
    } catch (err: unknown) {
      if (attempt === maxRetries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new Error('Google Places API request failed unexpectedly.');
}
