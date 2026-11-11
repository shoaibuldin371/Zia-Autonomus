import { describe, it, expect } from 'vitest';
import {
  classifyJobType,
  detectCompanySize,
  extractNeedSentence,
  calculateNuancedScore,
  processClientRequestItem,
} from '@/services/platforms/client-requests-service';

describe('Part 5: Lead Quality & Scoring for Client Requests', () => {
  it('correctly classifies job types from text only', () => {
    expect(classifyJobType('Looking for contract developer for 3 months')).toBe('contract');
    expect(classifyJobType('Freelance AI specialist needed to build RAG pipeline')).toBe('contract');
    expect(classifyJobType('Part-time fractional CTO (15 hrs/week)')).toBe('part_time');
    expect(classifyJobType('Senior Staff Software Engineer (Full-time FTE role)')).toBe('full_time');
    expect(classifyJobType('Need someone to help fix our website')).toBe('unknown');
  });

  it('detects large enterprise companies and flags them', () => {
    expect(detectCompanySize('Senior engineer at NVIDIA corporation', 'NVIDIA').isLarge).toBe(true);
    expect(detectCompanySize('Staff engineer at WellSky healthcare', 'WellSky').isLarge).toBe(true);
    expect(detectCompanySize('General Dynamics defense systems', 'General Dynamics').isLarge).toBe(true);
    expect(detectCompanySize('Early-stage AI startup with 8 engineers', 'Acme AI').isLarge).toBe(false);
  });

  it('extracts real need sentence rather than generic titles', () => {
    const rawPost = `WellSky | Staff Software Engineer | Austin, TX | ONSITE\nWe are looking for a backend engineer to integrate third-party billing APIs and automate insurance claims processing.\nSalary $160,000.`;
    const { sentence, isWeak } = extractNeedSentence(rawPost);
    expect(isWeak).toBe(false);
    expect(sentence).toContain('looking for a backend engineer to integrate third-party billing APIs');
  });

  it('penalizes skill mismatches like .NET, Java-only, hardware and enterprise', () => {
    const dotNetLead = calculateNuancedScore({
      text: 'WellSky looking for senior .NET C# ASP.NET staff engineer',
      jobType: 'full_time',
      isLargeCompany: true,
      isWeakEvidence: false,
    });

    const aiLead = calculateNuancedScore({
      text: 'Small startup looking for a contract Python developer to build LLM chatbot with LangChain and Next.js frontend',
      jobType: 'contract',
      isLargeCompany: false,
      isWeakEvidence: false,
      budgetStated: true,
    });

    // AI contract lead should score much higher than enterprise .NET full-time role
    expect(aiLead.score).toBeGreaterThanOrEqual(80);
    expect(dotNetLead.score).toBeLessThan(50);
  });

  it('processes item and flags enterprise full-time as hidden', () => {
    const item = processClientRequestItem({
      source_platform: 'Hacker News',
      company_name: 'NVIDIA',
      quote: 'NVIDIA | Senior Software Engineer | Full-Time | Santa Clara\nWe are building next gen GPU compilers.',
    });

    expect(item.job_type).toBe('full_time');
    expect(item.is_enterprise_full_time).toBe(true);
    expect(item.is_hidden).toBe(true);
    expect(item.status).toBe('hidden');
  });
});
