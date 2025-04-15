/**
 * Tag utility functions for Obsidian Magic
 */
import type { ConfidenceScore } from '../models/ConfidenceScore';
import type { DomainTag } from '../models/DomainTag';
import type { SubdomainTag } from '../models/SubdomainTag';
import type { TagBehavior } from '../models/TagBehavior';
import type { TagConfidence } from '../models/TagConfidence';
import type { TagSet } from '../models/TagSet';
import type { TopicalTag } from '../models/TopicalTag';

/**
 * Formats a tag for display (adds # prefix)
 * @param tag - Tag to format
 * @returns Formatted tag
 */
export function formatTag(tag: string): string {
  return `#${tag}`;
}

/**
 * Creates a hierarchical tag from domain and optional subdomain
 * @param domain - Domain tag
 * @param subdomain - Optional subdomain tag
 * @returns Hierarchical tag string (e.g., "software-development/frontend")
 */
export function createHierarchicalTag(domain: DomainTag, subdomain?: SubdomainTag): string {
  return subdomain ? `${domain}/${subdomain}` : domain;
}

/**
 * Extracts a domain from a hierarchical tag
 * @param hierarchicalTag - Hierarchical tag string (e.g., "software-development/frontend")
 * @returns Domain portion of the tag
 */
export function extractDomain(hierarchicalTag: string): string | undefined {
  return hierarchicalTag.split('/')[0];
}

/**
 * Extracts a subdomain from a hierarchical tag
 * @param hierarchicalTag - Hierarchical tag string (e.g., "software-development/frontend")
 * @returns Subdomain portion of the tag or undefined if not present
 */
export function extractSubdomain(hierarchicalTag: string): string | undefined {
  const parts = hierarchicalTag.split('/');
  return parts.length > 1 ? parts[1] : undefined;
}

/**
 * Formats a tag set for display in Obsidian frontmatter
 * @param tagSet - Tag set to format
 * @returns Array of formatted tags
 */
export function formatTagSetForFrontmatter(tagSet: TagSet): string[] {
  const tags: string[] = [];

  // Add year tag
  tags.push(tagSet.year);

  // Add life area tag if present
  if (tagSet.life_area) {
    tags.push(tagSet.life_area);
  }

  // Add topical tags
  for (const topicalTag of tagSet.topical_tags) {
    // Add domain/subdomain hierarchical tag
    if (topicalTag.subdomain) {
      tags.push(createHierarchicalTag(topicalTag.domain, topicalTag.subdomain));
    } else {
      tags.push(topicalTag.domain);
    }

    // Add contextual tag if present
    if (topicalTag.contextual) {
      tags.push(topicalTag.contextual);
    }
  }

  // Add conversation type tag
  tags.push(tagSet.conversation_type);

  return tags;
}

/**
 * Creates a confidence object with optional fields
 */
export function createConfidence(
  overall: number,
  options: Partial<Omit<TagConfidence, 'overall'>> = {}
): TagConfidence {
  return {
    overall,
    ...options,
  };
}

/**
 * Merges two tag sets based on the specified behavior
 * @param existingTags - Existing tag set
 * @param newTags - New tag set
 * @param behavior - Merge behavior (append, replace, merge)
 * @returns Merged tag set
 */
export function mergeTagSets(existingTags: TagSet | undefined, newTags: TagSet, behavior: TagBehavior): TagSet {
  // If no existing tags or behavior is replace, just return new tags
  if (!existingTags || behavior === 'replace') {
    return newTags;
  }

  if (behavior === 'append') {
    // Append new tags to existing tags
    return {
      ...existingTags,
      topical_tags: [...existingTags.topical_tags, ...newTags.topical_tags],
      // Merge confidence scores
      confidence: {
        overall: Math.max(existingTags.confidence.overall, newTags.confidence.overall),
        ...((existingTags.confidence.year ?? newTags.confidence.year) && {
          year: Math.max(existingTags.confidence.year ?? 0, newTags.confidence.year ?? 0),
        }),
        ...((existingTags.confidence.life_area ?? newTags.confidence.life_area) && {
          life_area: Math.max(existingTags.confidence.life_area ?? 0, newTags.confidence.life_area ?? 0),
        }),
        ...((existingTags.confidence.domain ?? newTags.confidence.domain) && {
          domain: Math.max(existingTags.confidence.domain ?? 0, newTags.confidence.domain ?? 0),
        }),
        ...((existingTags.confidence.subdomain ?? newTags.confidence.subdomain) && {
          subdomain: Math.max(existingTags.confidence.subdomain ?? 0, newTags.confidence.subdomain ?? 0),
        }),
        ...((existingTags.confidence.contextual ?? newTags.confidence.contextual) && {
          contextual: Math.max(existingTags.confidence.contextual ?? 0, newTags.confidence.contextual ?? 0),
        }),
        ...((existingTags.confidence.conversation_type ?? newTags.confidence.conversation_type) && {
          conversation_type: Math.max(
            existingTags.confidence.conversation_type ?? 0,
            newTags.confidence.conversation_type ?? 0
          ),
        }),
      },
      // Merge explanations
      explanations: {
        ...existingTags.explanations,
        ...newTags.explanations,
      },
    };
  }

  // Merge behavior - intelligently combine tag sets
  const mergedConfidence = {
    overall: Math.max(existingTags.confidence.overall, newTags.confidence.overall),
    ...((existingTags.confidence.year ?? newTags.confidence.year) && {
      year: Math.max(existingTags.confidence.year ?? 0, newTags.confidence.year ?? 0),
    }),
    ...((existingTags.confidence.life_area ?? newTags.confidence.life_area) && {
      life_area: Math.max(existingTags.confidence.life_area ?? 0, newTags.confidence.life_area ?? 0),
    }),
    ...((existingTags.confidence.domain ?? newTags.confidence.domain) && {
      domain: Math.max(existingTags.confidence.domain ?? 0, newTags.confidence.domain ?? 0),
    }),
    ...((existingTags.confidence.subdomain ?? newTags.confidence.subdomain) && {
      subdomain: Math.max(existingTags.confidence.subdomain ?? 0, newTags.confidence.subdomain ?? 0),
    }),
    ...((existingTags.confidence.contextual ?? newTags.confidence.contextual) && {
      contextual: Math.max(existingTags.confidence.contextual ?? 0, newTags.confidence.contextual ?? 0),
    }),
    ...((existingTags.confidence.conversation_type ?? newTags.confidence.conversation_type) && {
      conversation_type: Math.max(
        existingTags.confidence.conversation_type ?? 0,
        newTags.confidence.conversation_type ?? 0
      ),
    }),
  };

  return {
    // Use new year if confidence is higher, otherwise keep existing
    year:
      newTags.confidence.year &&
      (!existingTags.confidence.year || newTags.confidence.year > existingTags.confidence.year)
        ? newTags.year
        : existingTags.year,

    // Use new life area if confidence is higher or existing doesn't have one
    life_area:
      newTags.life_area &&
      (!existingTags.life_area ||
        (newTags.confidence.life_area &&
          existingTags.confidence.life_area &&
          newTags.confidence.life_area > existingTags.confidence.life_area))
        ? newTags.life_area
        : existingTags.life_area,

    // Combine topical tags, preferring ones with higher confidence
    topical_tags: mergeTopicalTags(existingTags.topical_tags, newTags.topical_tags),

    // Use new conversation type if confidence is higher, otherwise keep existing
    conversation_type:
      newTags.confidence.conversation_type &&
      (!existingTags.confidence.conversation_type ||
        newTags.confidence.conversation_type > existingTags.confidence.conversation_type)
        ? newTags.conversation_type
        : existingTags.conversation_type,

    // Calculate new confidence scores
    confidence: mergedConfidence as TagConfidence,

    // Merge explanations
    explanations: {
      ...existingTags.explanations,
      ...newTags.explanations,
    },
  };
}

/**
 * Merges two arrays of topical tags, removing duplicates and keeping those with highest confidence
 * @param existingTags - Existing topical tags
 * @param newTags - New topical tags
 * @returns Merged topical tags array
 */
function mergeTopicalTags(existingTags: TopicalTag[], newTags: TopicalTag[]): TopicalTag[] {
  const mergedTags = [...existingTags];

  for (const newTag of newTags) {
    // Check if tag already exists
    const existingIndex = mergedTags.findIndex(
      (tag) => tag.domain === newTag.domain && tag.subdomain === newTag.subdomain
    );

    if (existingIndex === -1) {
      // Tag doesn't exist, add it
      mergedTags.push(newTag);
    } else {
      const existingTag = mergedTags[existingIndex];
      // Tag exists, merge contextual if needed
      if (existingTag && newTag.contextual && !existingTag.contextual) {
        mergedTags[existingIndex] = {
          domain: existingTag.domain,
          subdomain: existingTag.subdomain,
          contextual: newTag.contextual,
        };
      }
    }
  }

  return mergedTags;
}

/**
 * Gets the overall confidence score for a tag set
 * @param tagSet - Tag set to calculate confidence for
 * @returns Overall confidence score
 */
export function getOverallConfidence(tagSet: TagSet): ConfidenceScore {
  return tagSet.confidence.overall;
}

/**
 * Checks if a tag set needs review based on confidence threshold
 * @param tagSet - Tag set to check
 * @param threshold - Confidence threshold (default: 0.7)
 * @returns True if tag set needs review
 */
export function needsReview(tagSet: TagSet, threshold = 0.7): boolean {
  return tagSet.confidence.overall < threshold;
}

/**
 * Gets all domains from a tag set
 * @param tagSet - Tag set to extract domains from
 * @returns Array of unique domains
 */
export function getAllDomains(tagSet: TagSet): DomainTag[] {
  return [...new Set(tagSet.topical_tags.map((tag) => tag.domain))];
}

/**
 * Gets all subdomains from a tag set
 * @param tagSet - Tag set to extract subdomains from
 * @returns Array of unique subdomains (excluding undefined)
 */
export function getAllSubdomains(tagSet: TagSet): SubdomainTag[] {
  return [
    ...new Set(
      tagSet.topical_tags
        .map((tag) => tag.subdomain)
        .filter((subdomain): subdomain is SubdomainTag => subdomain !== undefined)
    ),
  ];
}

/**
 * Gets all contextual tags from a tag set
 * @param tagSet - Tag set to extract contextual tags from
 * @returns Array of unique contextual tags (excluding undefined)
 */
export function getAllContextualTags(tagSet: TagSet): string[] {
  return [
    ...new Set(
      tagSet.topical_tags
        .map((tag) => tag.contextual)
        .filter((contextual): contextual is string => contextual !== undefined)
    ),
  ];
}
