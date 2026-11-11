import { processClientRequestItem, ScoredClientRequest } from './client-requests-service';

export interface ScanResult {
  source: string;
  scanned: number;
  newLeads: number;
  freelancerThreadCount?: number;
  error?: string;
}

export async function scanHackerNews(maxPosts = 100): Promise<{ leads: ScoredClientRequest[]; freelancerCount: number }> {
  const leads: ScoredClientRequest[] = [];
  let freelancerCount = 0;

  try {
    // 1. Fetch current month's "Freelancer? Seeking freelancer?" thread
    const freeRes = await fetch(
      'https://hn.algolia.com/api/v1/search_by_date?query=Seeking%20freelancer&tags=story&hitsPerPage=3',
      { headers: { 'User-Agent': 'GrowthSystem/2.0' } }
    );

    if (freeRes.ok) {
      const freeData = await freeRes.json();
      const currentStory = freeData.hits?.find((h: { title: string }) =>
        /Ask HN: Freelancer\? Seeking freelancer\?/i.test(h.title)
      ) || freeData.hits?.[0];

      if (currentStory) {
        // Fetch top-level comments for this story
        const commentsRes = await fetch(
          `https://hn.algolia.com/api/v1/search?tags=comment,story_${currentStory.objectID}&hitsPerPage=100`,
          { headers: { 'User-Agent': 'GrowthSystem/2.0' } }
        );

        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          for (const c of commentsData.hits || []) {
            const text = (c.comment_text || '').replace(/<[^>]*>/g, ' ');
            // Look for companies or clients seeking freelancers / contractors
            const isSeekingFreelancer = /SEEKING FREELANCER/i.test(text) || (!/SEEKING WORK/i.test(text) && /\b(looking for|seeking|need|hire|contract|freelancer)\b/i.test(text));
            if (isSeekingFreelancer && text.length > 50) {
              freelancerCount++;
              const item = processClientRequestItem({
                id: `hn_${c.objectID}`,
                source_platform: 'Hacker News (Freelancer Thread)',
                source_url: `https://news.ycombinator.com/item?id=${c.objectID}`,
                post_url: `https://news.ycombinator.com/item?id=${c.objectID}`,
                quote: text,
                platform_username: c.author || 'Not shown',
                platform_profile_url: `https://news.ycombinator.com/user?id=${c.author}`,
                found_at: c.created_at,
              });
              leads.push(item);
            }
          }
        }
      }
    }

    // 2. Fetch current month's "Who is hiring?" thread
    const hiringRes = await fetch(
      'https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&hitsPerPage=2',
      { headers: { 'User-Agent': 'GrowthSystem/2.0' } }
    );

    if (hiringRes.ok) {
      const hiringData = await hiringRes.json();
      const hiringStory = hiringData.hits?.find((h: { title: string }) => /Ask HN: Who is hiring\?/i.test(h.title));

      if (hiringStory) {
        const commentsRes = await fetch(
          `https://hn.algolia.com/api/v1/search?tags=comment,story_${hiringStory.objectID}&hitsPerPage=${Math.min(maxPosts, 100)}`,
          { headers: { 'User-Agent': 'GrowthSystem/2.0' } }
        );

        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          for (const c of commentsData.hits || []) {
            const text = (c.comment_text || '').replace(/<[^>]*>/g, ' ');
            if (text.length > 60) {
              const item = processClientRequestItem({
                id: `hn_hire_${c.objectID}`,
                source_platform: 'Hacker News (Who is Hiring)',
                source_url: `https://news.ycombinator.com/item?id=${c.objectID}`,
                post_url: `https://news.ycombinator.com/item?id=${c.objectID}`,
                quote: text,
                platform_username: c.author || 'Not shown',
                platform_profile_url: `https://news.ycombinator.com/user?id=${c.author}`,
                found_at: c.created_at,
              });
              leads.push(item);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[SourcesScanner] Hacker News scan error:', err);
  }

  return { leads, freelancerCount };
}

export async function scanRemotive(limit = 50): Promise<ScoredClientRequest[]> {
  const leads: ScoredClientRequest[] = [];
  try {
    const res = await fetch(`https://remotive.com/api/remote-jobs?category=software-dev&limit=${limit}`, {
      headers: { 'User-Agent': 'GrowthSystem/2.0' },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      for (const job of (data.jobs || []).slice(0, limit)) {
        const rawDescription = (job.description || '').replace(/<[^>]*>/g, ' ');
        const item = processClientRequestItem({
          id: `remotive_${job.id}`,
          source_platform: 'Remotive',
          source_url: job.url,
          post_url: job.url,
          title: job.title,
          quote: `${job.title} at ${job.company_name}. ${rawDescription.slice(0, 500)}`,
          company_name: job.company_name,
          platform_username: 'Not shown',
          budget: job.salary || null,
          found_at: job.publication_date,
        });
        leads.push(item);
      }
    }
  } catch (err) {
    console.warn('[SourcesScanner] Remotive scan error:', err);
  }
  return leads;
}

export async function scanSingleSource(sourceName: 'hacker_news' | 'remotive'): Promise<{
  leads: ScoredClientRequest[];
  freelancerCount?: number;
}> {
  if (sourceName === 'hacker_news') {
    return scanHackerNews(100);
  }
  if (sourceName === 'remotive') {
    const leads = await scanRemotive(60);
    return { leads };
  }
  return { leads: [] };
}
