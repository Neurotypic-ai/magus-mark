import { describe, it, expect } from 'vitest';
import type {
  YearTag,
  LifeAreaTag,
  DomainTag,
  ConversationTypeTag,
  TopicalTag,
  TagConfidence,
  TagSet,
  ConfidenceScore,
  TagBehavior
} from './tags';

describe('Tag Types', () => {
  it('validates YearTag type constraints', () => {
    const validYear: YearTag = '2023';
    expect(typeof validYear).toBe('string');
    expect(validYear.length).toBe(4);
  });

  it('validates LifeAreaTag type usage', () => {
    const validLifeAreas: LifeAreaTag[] = [
      'career',
      'relationships',
      'health',
      'learning',
      'projects',
      'personal-growth',
      'finance',
      'hobby'
    ];
    
    expect(validLifeAreas.length).toBeGreaterThan(0);
    validLifeAreas.forEach(area => {
      expect(typeof area).toBe('string');
    });
  });

  it('validates DomainTag type usage', () => {
    const validDomains: DomainTag[] = [
      'technology',
      'science',
      'business',
      'arts',
      'humanities'
    ];
    
    expect(validDomains.length).toBeGreaterThan(0);
    validDomains.forEach(domain => {
      expect(typeof domain).toBe('string');
    });
  });

  it('validates ConversationTypeTag type usage', () => {
    const validConversationTypes: ConversationTypeTag[] = [
      'deep-dive',
      'practical',
      'theory',
      'question',
      'analysis'
    ];
    
    expect(validConversationTypes.length).toBeGreaterThan(0);
    validConversationTypes.forEach(type => {
      expect(typeof type).toBe('string');
    });
  });

  it('validates ConfidenceScore type constraints', () => {
    const validScores: ConfidenceScore[] = [0, 0.5, 1];
    validScores.forEach(score => {
      expect(typeof score).toBe('number');
      expect(score >= 0 && score <= 1).toBe(true);
    });
  });

  it('validates TopicalTag interface structure', () => {
    const validTopicalTag: TopicalTag = {
      domain: 'technology',
      subdomain: 'ai',
      contextual: 'beginner'
    };
    
    const minimalTopicalTag: TopicalTag = {
      domain: 'technology'
    };
    
    expect(validTopicalTag.domain).toBe('technology');
    expect(validTopicalTag.subdomain).toBe('ai');
    expect(validTopicalTag.contextual).toBe('beginner');
    
    expect(minimalTopicalTag.domain).toBe('technology');
    expect(minimalTopicalTag.subdomain).toBeUndefined();
    expect(minimalTopicalTag.contextual).toBeUndefined();
  });

  it('validates TagConfidence interface structure', () => {
    const validTagConfidence: TagConfidence = {
      overall: 0.92,
      domain: 0.95,
      subdomain: 0.85,
      conversation_type: 0.90
    };
    
    const minimalTagConfidence: TagConfidence = {
      overall: 0.75
    };
    
    expect(validTagConfidence.overall).toBe(0.92);
    expect(typeof validTagConfidence.domain).toBe('number');
    
    expect(minimalTagConfidence.overall).toBe(0.75);
    expect(minimalTagConfidence.domain).toBeUndefined();
  });

  it('validates TagSet interface structure', () => {
    const validTagSet: TagSet = {
      year: '2023',
      life_area: 'learning',
      topical_tags: [
        {
          domain: 'technology',
          subdomain: 'ai',
          contextual: 'beginner'
        }
      ],
      conversation_type: 'deep-dive',
      confidence: {
        overall: 0.92
      }
    };
    
    expect(validTagSet.year).toBe('2023');
    expect(validTagSet.life_area).toBe('learning');
    expect(validTagSet.topical_tags.length).toBe(1);
    expect(validTagSet.conversation_type).toBe('deep-dive');
    expect(validTagSet.confidence.overall).toBe(0.92);
  });

  it('validates TagBehavior type constraints', () => {
    const validBehaviors: TagBehavior[] = [
      'append',
      'replace',
      'merge',
      'suggest'
    ];
    
    expect(validBehaviors.length).toBe(4);
    validBehaviors.forEach(behavior => {
      expect(typeof behavior).toBe('string');
    });
  });
}); 