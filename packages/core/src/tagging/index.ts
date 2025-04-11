/**
 * Tagging module for analyzing and categorizing conversations
 */
import type { 
  TagSet, 
  TaggingOptions, 
  TaggingResult, 
  Document,
  TagBehavior
} from '@obsidian-magic/types';
import { OpenAIClient, PromptEngineering } from '../openai';

/**
 * Default tagging options
 */
export const DEFAULT_TAGGING_OPTIONS: TaggingOptions = {
  model: 'gpt-4o',
  behavior: 'merge',
  minConfidence: 0.65,
  reviewThreshold: 0.85,
  generateExplanations: true
};

/**
 * Service for tagging conversations using AI
 */
export class TaggingService {
  private openAIClient: OpenAIClient;
  private options: TaggingOptions;
  private taxonomy: Record<string, unknown>;
  
  constructor(
    openAIClient: OpenAIClient,
    options: Partial<TaggingOptions> = {},
    taxonomy?: Record<string, unknown>
  ) {
    this.openAIClient = openAIClient;
    this.options = { ...DEFAULT_TAGGING_OPTIONS, ...options };
    this.taxonomy = taxonomy || this.getDefaultTaxonomy();
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
            recoverable: false
          }
        };
      }
      
      // Prepare document content for analysis
      const preparedContent = this.prepareContent(document.content);
      
      // Generate the tagging prompt
      const prompt = PromptEngineering.createTaggingPrompt(
        preparedContent,
        this.taxonomy,
        {
          includeExamples: true,
          maxLength: 8000 // Limit to ~2000 tokens for the content
        }
      );
      
      // Set the system message for the AI
      const systemMessage = 'You are a precise conversation classifier specialized in identifying topics, conversation types, and contextual metadata.';
      
      // Make the OpenAI request
      const response = await this.openAIClient.makeRequest<{ classification: TagSet }>(
        prompt,
        systemMessage,
        {
          temperature: 0.3, // Lower temperature for more consistent results
          maxTokens: 1000  // Limit response length
        }
      );
      
      // Handle errors
      if (!response.success || !response.data) {
        return {
          success: false,
          error: {
            message: response.error?.message || 'Failed to generate tags',
            code: response.error?.code || 'TAGGING_FAILED',
            recoverable: true
          }
        };
      }
      
      // Process the tags based on confidence thresholds
      const tags = this.processTagsWithConfidence(response.data.classification);
      
      // Apply the tags based on the selected behavior
      const finalTags = this.applyTagBehavior(tags, document.existingTags);
      
      return {
        success: true,
        tags: finalTags
      };
    } catch (err) {
      // Handle unexpected errors
      const error = err as Error;
      return {
        success: false,
        error: {
          message: error.message || 'Unknown error during tagging',
          code: 'UNEXPECTED_ERROR',
          recoverable: false
        }
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
    if (prepared.length > 32000) { // ~8K tokens
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
    result.topical_tags = result.topical_tags.filter(tag => {
      const domainConfidence = result.confidence.domain || 0;
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
        confidence: newTags.confidence
      };
      
      // Only add life area if not already present
      if (!existingTags.life_area && newTags.life_area) {
        result.life_area = newTags.life_area;
      }
      
      // Add new topical tags that don't exist
      const existingDomains = new Set(
        existingTags.topical_tags.map(tag => tag.domain)
      );
      
      const newTopicalTags = newTags.topical_tags.filter(
        tag => !existingDomains.has(tag.domain)
      );
      
      result.topical_tags = [...existingTags.topical_tags, ...newTopicalTags];
      
      return result;
    }
    
    // Handle merge mode - intelligent merge of old and new tags
    if (this.options.behavior === 'merge') {
      // Start with new tags as the base
      const result: TagSet = { ...newTags };
      
      // Keep existing life area if new one doesn't exist or has low confidence
      if (
        existingTags.life_area && 
        (!newTags.life_area || 
         (newTags.confidence.life_area || 0) < this.options.reviewThreshold)
      ) {
        result.life_area = existingTags.life_area;
      }
      
      // Merge topical tags, preferring new ones for the same domain
      const newDomains = new Set(
        newTags.topical_tags.map(tag => tag.domain)
      );
      
      const existingNonConflictingTags = existingTags.topical_tags.filter(
        tag => !newDomains.has(tag.domain)
      );
      
      result.topical_tags = [...newTags.topical_tags, ...existingNonConflictingTags];
      
      return result;
    }
    
    // Default to just returning new tags
    return newTags;
  }
  
  /**
   * Get the default taxonomy for classification
   */
  private getDefaultTaxonomy(): Record<string, unknown> {
    return {
      year_tags: [
        "2020", "2021", "2022", "2023", "2024"
      ],
      life_areas: [
        "career", "relationships", "health", "learning", 
        "projects", "personal-growth", "finance", "hobby"
      ],
      domains: {
        "software-development": {
          description: "Topics related to programming, software engineering, and development practices",
          subdomains: [
            "frontend", "backend", "devops", "mobile", "desktop", 
            "web", "api", "database", "security", "architecture",
            "performance", "testing", "debugging", "game-dev"
          ]
        },
        "ai": {
          description: "Artificial intelligence, machine learning, and related topics",
          subdomains: [
            "machine-learning", "deep-learning", "nlp", "computer-vision",
            "reinforcement-learning", "prompt-engineering", "data-science",
            "neural-networks", "generative-ai", "llms"
          ]
        },
        "philosophy": {
          description: "Philosophical discussions and concepts",
          subdomains: [
            "ethics", "metaphysics", "epistemology", "logic", 
            "existentialism", "phenomenology", "political-philosophy",
            "philosophy-of-mind", "philosophy-of-science"
          ]
        },
        "design": {
          description: "Visual, interaction, and user experience design",
          subdomains: [
            "ui", "ux", "graphic-design", "typography", "visual-design",
            "animation", "illustration", "branding", "information-architecture",
            "interaction-design", "product-design"
          ]
        },
        "psychology": {
          description: "Human behavior, cognition, and mental processes",
          subdomains: [
            "cognitive", "behavioral", "clinical", "developmental",
            "social", "positive-psychology", "neuroscience",
            "personality", "motivation", "emotion"
          ]
        },
        "productivity": {
          description: "Methods and systems for improving efficiency and output",
          subdomains: [
            "time-management", "task-management", "note-taking",
            "knowledge-management", "systems", "workflow",
            "organization", "habits", "focus", "tools"
          ]
        },
        "business": {
          description: "Topics related to commerce, startups, and organizations",
          subdomains: [
            "strategy", "marketing", "finance", "management",
            "entrepreneurship", "startups", "operations",
            "sales", "product-management", "leadership"
          ]
        },
        "writing": {
          description: "The craft of writing and content creation",
          subdomains: [
            "fiction", "non-fiction", "technical-writing", "blogging",
            "copywriting", "storytelling", "editing", "publishing",
            "journalism", "creative-writing", "documentation"
          ]
        },
        "education": {
          description: "Learning, teaching, and educational systems",
          subdomains: [
            "pedagogy", "learning-theory", "curriculum", "e-learning",
            "self-directed-learning", "teaching", "educational-technology",
            "literacy", "higher-education", "lifelong-learning"
          ]
        }
      },
      contextual_tags: [
        // Cross-domain concepts
        "strategy", "planning", "implementation", "theory", "practice",
        "innovation", "creativity", "problem-solving", "optimization",
        "reflection", "analysis", "synthesis", "communication", "collaboration",
        
        // Technical concepts
        "automation", "tooling", "infrastructure", "api", "algorithms",
        "data-structures", "patterns", "frameworks", "libraries",
        
        // Learning and growth
        "tutorial", "guide", "learning", "expertise", "skill-development",
        "mastery", "knowledge", "research", "experimentation",
        
        // Process and methodology
        "process", "methodology", "workflow", "system", "framework",
        "approach", "technique", "best-practice", "convention", "standard"
      ],
      conversation_types: [
        {
          "tag": "theory",
          "description": "Abstract or conceptual discussions"
        },
        {
          "tag": "practical",
          "description": "Implementation-focused or action-oriented"
        },
        {
          "tag": "meta",
          "description": "Self-referential or about the process itself"
        },
        {
          "tag": "casual",
          "description": "Informal, exploratory conversations"
        },
        {
          "tag": "adhd-thought",
          "description": "Non-linear, associative thinking patterns"
        },
        {
          "tag": "deep-dive",
          "description": "Comprehensive exploration of a topic"
        },
        {
          "tag": "exploration",
          "description": "Initial investigation of new concepts"
        },
        {
          "tag": "experimental",
          "description": "Testing ideas or hypotheses"
        },
        {
          "tag": "reflection",
          "description": "Contemplative assessment"
        },
        {
          "tag": "planning",
          "description": "Forward-looking organization"
        },
        {
          "tag": "question",
          "description": "Inquiry-driven exchange"
        },
        {
          "tag": "analysis",
          "description": "Detailed examination of specifics"
        }
      ]
    };
  }
} 