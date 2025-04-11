/**
 * Tagging module for analyzing and categorizing conversations
 */
import { PromptEngineering } from './openai';
import { TaxonomyManager } from './tagging/taxonomy';

import type { Document, TagSet, TaggingOptions, TaggingResult } from '@obsidian-magic/types';

import type { OpenAIClient } from './openai';
import type { Taxonomy } from './tagging/taxonomy';

/**
 * Default tagging options
 */
export const DEFAULT_TAGGING_OPTIONS: TaggingOptions = {
  model: 'gpt-4o',
  behavior: 'merge',
  minConfidence: 0.65,
  reviewThreshold: 0.85,
  generateExplanations: true,
};

/**
 * Service for tagging conversations using AI
 */
export class TaggingService {
  private openAIClient: OpenAIClient;
  private options: TaggingOptions;
  private taxonomyManager: TaxonomyManager;

  constructor(openAIClient: OpenAIClient, options: Partial<TaggingOptions> = {}, customTaxonomy?: Partial<Taxonomy>) {
    this.openAIClient = openAIClient;
    this.options = { ...DEFAULT_TAGGING_OPTIONS, ...options };
    this.taxonomyManager = new TaxonomyManager(customTaxonomy);
  }

  /**
   * Tag a document with AI-generated tags
   */
  async tagDocument(document: Document): Promise<TaggingResult> {
    try {
      // Check if document content is valid
      if (!document.content || document.content.trim() === '') {
        return {
          success: false,
          error: {
            message: 'Document content is empty',
            code: 'EMPTY_CONTENT',
            recoverable: false,
          },
        };
      }

      // Prepare document content for analysis
      const preparedContent = this.prepareContent(document.content);

      // Generate the tagging prompt
      const prompt = PromptEngineering.createTaggingPrompt(
        preparedContent,
        this.taxonomyManager.getTaxonomyForPrompt(),
        {
          includeExamples: true,
          maxLength: 8000, // Limit to ~2000 tokens for the content
        }
      );

      // Set the system message for the AI
      const systemMessage =
        'You are a precise conversation classifier specialized in identifying topics, conversation types, and contextual metadata.';

      // Make the OpenAI request
      const response = await this.openAIClient.makeRequest<{ classification: TagSet }>(prompt, systemMessage, {
        temperature: 0.3, // Lower temperature for more consistent results
        maxTokens: 1000, // Limit response length
      });

      // Handle errors
      if (!response.success || !response.data) {
        return {
          success: false,
          error: {
            message: response.error?.message ?? 'Failed to generate tags',
            code: response.error?.code ?? 'TAGGING_FAILED',
            recoverable: true,
          },
        };
      }

      // Process the tags based on confidence thresholds
      const tags = this.processTagsWithConfidence(response.data.classification);

      // Apply the tags based on the selected behavior
      const finalTags = this.applyTagBehavior(tags, document.existingTags);

      return {
        success: true,
        tags: finalTags,
      };
    } catch (err) {
      // Handle unexpected errors
      const error = err as Error;
      return {
        success: false,
        error: {
          message: error.message || 'Unknown error during tagging',
          code: 'UNEXPECTED_ERROR',
          recoverable: false,
        },
      };
    }
  }

  /**
   * Prepare the document content for analysis
   */
  private prepareContent(content: string): string {
    // Trim and normalize whitespace
    let prepared = content.trim().replace(/\s+/g, ' ');

    // If content is too long, extract relevant sections
    if (prepared.length > 32000) {
      // ~8K tokens
      prepared = PromptEngineering.extractRelevantSections(prepared, 8000);
    }

    return prepared;
  }

  /**
   * Process tags based on confidence thresholds
   */
  private processTagsWithConfidence(tags: TagSet): TagSet {
    const result = { ...tags };

    // Filter out low confidence tags
    if (
      result.life_area &&
      (!result.confidence.life_area || result.confidence.life_area < this.options.minConfidence)
    ) {
      delete result.life_area;
    }

    // Filter low confidence topical tags
    result.topical_tags = result.topical_tags.filter(() => {
      const domainConfidence = result.confidence.domain ?? 0;
      return domainConfidence >= this.options.minConfidence;
    });

    // Generate explanations only if needed
    if (!this.options.generateExplanations) {
      delete result.explanations;
    } else if (result.explanations) {
      // Keep explanations only for medium confidence tags
      const explanationsToKeep: Record<string, string> = {};

      if (
        result.confidence.life_area &&
        result.confidence.life_area >= this.options.minConfidence &&
        result.confidence.life_area < this.options.reviewThreshold &&
        result.explanations['life_area']
      ) {
        explanationsToKeep['life_area'] = result.explanations['life_area'];
      }

      if (
        result.confidence.domain &&
        result.confidence.domain >= this.options.minConfidence &&
        result.confidence.domain < this.options.reviewThreshold &&
        result.explanations['domain']
      ) {
        explanationsToKeep['domain'] = result.explanations['domain'];
      }

      // Add any contextual tag explanations
      if (result.explanations['contextual_tag']) {
        explanationsToKeep['contextual_tag'] = result.explanations['contextual_tag'];
      }

      result.explanations = explanationsToKeep;
    }

    return result;
  }

  /**
   * Apply tag behavior (replace, append, merge) with existing tags
   */
  private applyTagBehavior(newTags: TagSet, existingTags?: TagSet): TagSet {
    // If no existing tags or in replace mode, just return new tags
    if (!existingTags || this.options.behavior === 'replace') {
      return newTags;
    }

    // Handle append mode - keep existing and add non-conflicting tags
    if (this.options.behavior === 'append') {
      // Year and conversation type are always overwritten
      const result: TagSet = {
        ...existingTags,
        year: newTags.year,
        conversation_type: newTags.conversation_type,
        confidence: newTags.confidence,
      };

      // Only add life area if not already present
      if (!existingTags.life_area && newTags.life_area) {
        result.life_area = newTags.life_area;
      }

      // Add new topical tags that don't exist
      const existingDomains = new Set(existingTags.topical_tags.map((tag) => tag.domain));

      const newTopicalTags = newTags.topical_tags.filter((tag) => !existingDomains.has(tag.domain));

      result.topical_tags = [...existingTags.topical_tags, ...newTopicalTags];

      return result;
    }

    // For merge mode (or any other behavior)
    // Start with new tags as the base
    const result: TagSet = { ...newTags };

    // Keep existing life area if new one doesn't exist or has low confidence
    const lifeAreaConfidence = newTags.confidence.life_area ?? 0;
    if (existingTags.life_area && (!newTags.life_area || lifeAreaConfidence < this.options.reviewThreshold)) {
      result.life_area = existingTags.life_area;
    }

    // Merge topical tags, preferring new ones for the same domain
    const newDomains = new Set(newTags.topical_tags.map((tag) => tag.domain));

    const existingNonConflictingTags = existingTags.topical_tags.filter((tag) => !newDomains.has(tag.domain));

    result.topical_tags = [...newTags.topical_tags, ...existingNonConflictingTags];

    return result;
  }
}
