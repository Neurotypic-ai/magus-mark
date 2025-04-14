import { describe, expect, it } from 'vitest';

import {
  clamp,
  confidenceScoreSchema,
  contextualTagSchema,
  conversationTypeTagSchema,
  domainTagSchema,
  getSubdomainsForDomain,
  isDomainWithSubdomain,
  isValidConversationType,
  isValidDomain,
  isValidLifeArea,
  lifeAreaTagSchema,
  tagConfidenceSchema,
  tagSetSchema,
  topicalTagSchema,
  validateTagSet,
  yearTagSchema,
} from './validation';

import type { ConversationTypeTag, DomainTag, LifeAreaTag, TagSet, YearTag } from '@obsidian-magic/types';

describe('Validation Utilities', () => {
  describe('clamp', () => {
    it('should return value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('should return min when value is below range', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should return max when value is above range', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe('Schema Validation', () => {
    describe('confidenceScoreSchema', () => {
      it('should validate values between 0 and 1', () => {
        expect(confidenceScoreSchema.safeParse(0).success).toBe(true);
        expect(confidenceScoreSchema.safeParse(0.5).success).toBe(true);
        expect(confidenceScoreSchema.safeParse(1).success).toBe(true);
      });

      it('should reject values outside 0-1 range', () => {
        expect(confidenceScoreSchema.safeParse(-0.1).success).toBe(false);
        expect(confidenceScoreSchema.safeParse(1.1).success).toBe(false);
      });

      it('should reject non-numeric values', () => {
        expect(confidenceScoreSchema.safeParse('0.5').success).toBe(false);
        expect(confidenceScoreSchema.safeParse(NaN).success).toBe(false);
      });
    });

    describe('yearTagSchema', () => {
      it('should validate 4-digit years', () => {
        expect(yearTagSchema.safeParse('2023').success).toBe(true);
        expect(yearTagSchema.safeParse('1999').success).toBe(true);
      });

      it('should reject non-4-digit strings', () => {
        expect(yearTagSchema.safeParse('12345').success).toBe(false);
        expect(yearTagSchema.safeParse('abc').success).toBe(false);
        expect(yearTagSchema.safeParse('20').success).toBe(false);
      });
    });

    describe('domainTagSchema', () => {
      it('should validate known domains', () => {
        // This test assumes 'technology' is a valid domain from DOMAINS
        expect(domainTagSchema.safeParse('technology').success).toBe(true);
      });

      it('should reject unknown domains', () => {
        expect(domainTagSchema.safeParse('not-a-real-domain').success).toBe(false);
      });
    });

    describe('topicalTagSchema', () => {
      it('should validate complete topical tags', () => {
        const validTag = {
          domain: 'technology' as DomainTag,
          subdomain: 'programming',
          contextual: 'beginner',
        };

        expect(topicalTagSchema.safeParse(validTag).success).toBe(true);
      });

      it('should validate topical tags with only required fields', () => {
        const minimalTag = {
          domain: 'technology' as DomainTag,
        };

        expect(topicalTagSchema.safeParse(minimalTag).success).toBe(true);
      });

      it('should reject invalid topical tags', () => {
        const invalidTag = {
          domain: 'not-a-domain',
          subdomain: 'programming',
        };

        expect(topicalTagSchema.safeParse(invalidTag).success).toBe(false);
      });
    });

    describe('tagConfidenceSchema', () => {
      it('should validate complete confidence objects', () => {
        const validConfidence = {
          overall: 0.95,
          year: 0.97,
          life_area: 0.9,
          domain: 0.93,
          subdomain: 0.85,
          contextual: 0.8,
          conversation_type: 0.92,
        };

        expect(tagConfidenceSchema.safeParse(validConfidence).success).toBe(true);
      });

      it('should validate minimal confidence objects with only required fields', () => {
        const minimalConfidence = {
          overall: 0.9,
        };

        expect(tagConfidenceSchema.safeParse(minimalConfidence).success).toBe(true);
      });

      it('should reject invalid confidence objects', () => {
        const invalidConfidence = {
          overall: 1.2, // Must be <= 1
        };

        expect(tagConfidenceSchema.safeParse(invalidConfidence).success).toBe(false);
      });
    });

    describe('tagSetSchema', () => {
      it('should validate complete tag sets', () => {
        const validTagSet: TagSet = {
          year: '2023' as YearTag,
          life_area: 'learning' as LifeAreaTag,
          topical_tags: [
            {
              domain: 'technology' as DomainTag,
              subdomain: 'programming',
              contextual: 'beginner',
            },
          ],
          conversation_type: 'deep-dive' as ConversationTypeTag,
          confidence: {
            overall: 0.92,
            domain: 0.95,
          },
        };

        expect(tagSetSchema.safeParse(validTagSet).success).toBe(true);
      });

      it('should reject tag sets missing required fields', () => {
        const invalidTagSet = {
          year: '2023',
          // Missing topical_tags (required)
          conversation_type: 'deep-dive',
          confidence: {
            overall: 0.92,
          },
        };

        expect(tagSetSchema.safeParse(invalidTagSet).success).toBe(false);
      });

      it('should reject tag sets with invalid values', () => {
        const invalidTagSet = {
          year: '23', // Not a 4-digit year
          topical_tags: [
            {
              domain: 'technology',
            },
          ],
          conversation_type: 'deep-dive',
          confidence: {
            overall: 0.92,
          },
        };

        expect(tagSetSchema.safeParse(invalidTagSet).success).toBe(false);
      });
    });

    describe('lifeAreaTagSchema', () => {
      it('should validate known life areas', () => {
        // Assuming 'career' is a valid life area from LIFE_AREAS
        expect(lifeAreaTagSchema.safeParse('career').success).toBe(true);
        expect(lifeAreaTagSchema.safeParse('learning').success).toBe(true);
      });

      it('should reject unknown life areas', () => {
        expect(lifeAreaTagSchema.safeParse('not-a-life-area').success).toBe(false);
      });
    });

    describe('conversationTypeTagSchema', () => {
      it('should validate known conversation types', () => {
        // Assuming 'deep-dive' is a valid conversation type from CONVERSATION_TYPES
        expect(conversationTypeTagSchema.safeParse('deep-dive').success).toBe(true);
        expect(conversationTypeTagSchema.safeParse('practical').success).toBe(true);
      });

      it('should reject unknown conversation types', () => {
        expect(conversationTypeTagSchema.safeParse('not-a-conversation-type').success).toBe(false);
      });
    });

    describe('contextualTagSchema', () => {
      it('should validate any string as contextual tag', () => {
        expect(contextualTagSchema.safeParse('beginner').success).toBe(true);
        expect(contextualTagSchema.safeParse('advanced').success).toBe(true);
        expect(contextualTagSchema.safeParse('custom-context').success).toBe(true);
      });

      it('should reject non-string values', () => {
        expect(contextualTagSchema.safeParse(123).success).toBe(false);
        expect(contextualTagSchema.safeParse(null).success).toBe(false);
        expect(contextualTagSchema.safeParse(undefined).success).toBe(false);
      });
    });
  });

  describe('Domain and Subdomain Validation', () => {
    describe('isDomainWithSubdomain', () => {
      it('should return true for valid domain-subdomain combinations', () => {
        // This test assumes the domain 'technology' has a subdomain 'programming'
        expect(isDomainWithSubdomain('technology' as DomainTag, 'programming')).toBe(true);
      });

      it('should return false for invalid subdomain', () => {
        expect(isDomainWithSubdomain('technology' as DomainTag, 'not-a-real-subdomain')).toBe(false);
      });
    });

    describe('getSubdomainsForDomain', () => {
      it('should return array of subdomains for valid domain', () => {
        const subdomains = getSubdomainsForDomain('technology' as DomainTag);
        expect(Array.isArray(subdomains)).toBe(true);
        expect(subdomains.length).toBeGreaterThan(0);
      });

      it('should return empty array for invalid domain', () => {
        // Testing with type casting for the test case
        const result = getSubdomainsForDomain('invalid-domain' as DomainTag);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      });
    });
  });

  describe('Validation Functions', () => {
    describe('validateTagSet', () => {
      it('should validate and return valid tag set', () => {
        const validTagSet: TagSet = {
          year: '2023' as YearTag,
          topical_tags: [
            {
              domain: 'technology' as DomainTag,
            },
          ],
          conversation_type: 'deep-dive' as ConversationTypeTag,
          confidence: {
            overall: 0.92,
          },
        };

        expect(() => validateTagSet(validTagSet)).not.toThrow();
        expect(validateTagSet(validTagSet)).toEqual(validTagSet);
      });

      it('should throw for invalid tag sets', () => {
        const invalidTagSet = {
          // Missing required fields
        };

        expect(() => validateTagSet(invalidTagSet)).toThrow();
      });
    });

    describe('isValidDomain', () => {
      it('should return true for valid domains', () => {
        // Assuming 'technology' is a valid domain
        expect(isValidDomain('technology')).toBe(true);
      });

      it('should return false for invalid domains', () => {
        expect(isValidDomain('not-a-domain')).toBe(false);
      });
    });

    describe('isValidLifeArea', () => {
      it('should return true for valid life areas', () => {
        // Assuming 'career' is a valid life area
        expect(isValidLifeArea('career')).toBe(true);
      });

      it('should return false for invalid life areas', () => {
        expect(isValidLifeArea('not-a-life-area')).toBe(false);
      });
    });

    describe('isValidConversationType', () => {
      it('should return true for valid conversation types', () => {
        // Assuming 'deep-dive' is a valid conversation type
        expect(isValidConversationType('deep-dive')).toBe(true);
      });

      it('should return false for invalid conversation types', () => {
        expect(isValidConversationType('not-a-type')).toBe(false);
      });
    });
  });
});
