/**
 * Prompt templates for the OpenAI API
 */

/**
 * Options for tagging prompt generation
 */
export interface TaggingPromptOptions {
  /**
   * Whether to include examples in the prompt
   */
  includeExamples?: boolean;
  
  /**
   * Maximum length of the content to include in the prompt
   */
  maxLength?: number;
  
  /**
   * Whether to request detailed explanations for tag assignments
   */
  requestExplanations?: boolean;
  
  /**
   * Whether to use the chain of thought reasoning approach
   */
  useChainOfThought?: boolean;
}

/**
 * Default options for tagging prompts
 */
export const DEFAULT_TAGGING_PROMPT_OPTIONS: TaggingPromptOptions = {
  includeExamples: true,
  maxLength: 8000,
  requestExplanations: true,
  useChainOfThought: true
};

/**
 * Templates for various types of prompts
 */
export class PromptTemplates {
  /**
   * Create a tagging prompt for classifying conversation content
   */
  static createTaggingPrompt(
    content: string,
    taxonomy: Record<string, unknown>,
    options: TaggingPromptOptions = {}
  ): string {
    const opts = { ...DEFAULT_TAGGING_PROMPT_OPTIONS, ...options };
    
    // Truncate content if it's too long
    let truncatedContent = content;
    if (opts.maxLength && content.length > opts.maxLength) {
      truncatedContent = content.substring(0, opts.maxLength) + 
        `\n\n[Note: content truncated for length, ${content.length - opts.maxLength} characters omitted]`;
    }
    
    // Start building the prompt
    let prompt = `<conversation>\n${truncatedContent}\n</conversation>\n\n`;
    
    // Add instructions
    prompt += '<instructions>\n';
    prompt += 'Analyze the conversation above and classify it according to the taxonomies below.\n';
    prompt += 'You are a precise conversation classifier specialized in identifying topics, conversation types, and contextual metadata.\n\n';
    
    if (opts.useChainOfThought) {
      prompt += 'Think step-by-step about the classification process:\n';
      prompt += '1. First identify the general topic and temporal context\n';
      prompt += '2. Then map to specific domains and subdomains\n';
      prompt += '3. Finally determine conversation type and life area\n\n';
    }
    
    prompt += 'You must classify this conversation using ONLY the approved tags listed below.\n';
    prompt += 'For domain/subdomain pairs, select exactly from the provided taxonomy.\n';
    prompt += 'For the contextual tag, either select from the approved list or, ONLY if none apply, suggest a single new tag with justification.\n\n';
    
    // Add confidence score instructions
    prompt += 'For each tag assigned, provide a confidence score from 0.0 to 1.0.\n';
    prompt += 'If you\'re unsure about a tag, set the confidence below 0.7.\n';
    prompt += 'Tags with confidence below 0.65 will be rejected.\n\n';
    
    if (opts.requestExplanations) {
      prompt += 'Provide brief explanations for tags with medium confidence (0.65-0.85).\n';
      prompt += 'Always provide detailed justification for any new contextual tag suggestions.\n\n';
    }
    
    // Add taxonomy sections
    prompt += '<taxonomies>\n';
    
    // Add domains
    prompt += '# Domains\n';
    if (taxonomy['domains'] && Array.isArray(taxonomy['domains'])) {
      taxonomy['domains'].forEach((domain: unknown) => {
        prompt += `- ${domain}\n`;
      });
    }
    prompt += '\n';
    
    // Add subdomains
    prompt += '# Subdomains by Domain\n';
    if (taxonomy['subdomains'] && typeof taxonomy['subdomains'] === 'object') {
      Object.entries(taxonomy['subdomains'] as Record<string, unknown>).forEach(([domain, subdomains]) => {
        prompt += `## ${domain}\n`;
        if (Array.isArray(subdomains)) {
          subdomains.forEach((subdomain) => {
            prompt += `- ${subdomain}\n`;
          });
        }
        prompt += '\n';
      });
    }
    
    // Add life areas
    prompt += '# Life Areas\n';
    if (taxonomy['life_areas'] && Array.isArray(taxonomy['life_areas'])) {
      taxonomy['life_areas'].forEach((area: unknown) => {
        prompt += `- ${area}\n`;
      });
    }
    prompt += '\n';
    
    // Add conversation types
    prompt += '# Conversation Types\n';
    if (taxonomy['conversation_types'] && Array.isArray(taxonomy['conversation_types'])) {
      taxonomy['conversation_types'].forEach((type: unknown) => {
        prompt += `- ${type}\n`;
      });
    }
    prompt += '\n';
    
    // Add contextual tags
    prompt += '# Contextual Tags\n';
    if (taxonomy['contextual_tags'] && Array.isArray(taxonomy['contextual_tags'])) {
      taxonomy['contextual_tags'].forEach((tag: unknown) => {
        prompt += `- ${tag}\n`;
      });
    }
    prompt += '\n';
    
    prompt += '</taxonomies>\n\n';
    
    // Add examples if requested
    if (opts.includeExamples) {
      prompt += '<examples>\n';
      prompt += this.getTaggingExamples();
      prompt += '</examples>\n\n';
    }
    
    // Add output format
    prompt += '<output_format>\n';
    prompt += 'Provide your classification as a valid JSON object with the following structure:\n';
    prompt += '{\n';
    prompt += '  "year": "YYYY",\n';
    prompt += '  "life_area": "area_name",  // Optional if not clearly applicable\n';
    prompt += '  "topical_tags": [\n';
    prompt += '    {"domain": "domain_name", "subdomain": "subdomain_name"},  // Subdomain is optional\n';
    prompt += '    {"domain": "domain_name2"},  // Additional domain if relevant\n';
    prompt += '    {"contextual": "contextual_tag"}  // Optional contextual tag\n';
    prompt += '  ],\n';
    prompt += '  "conversation_type": "type_name",\n';
    prompt += '  "confidence": {\n';
    prompt += '    "overall": 0.95,  // Overall confidence in classification\n';
    prompt += '    "year": 0.98,  // Confidence in year\n';
    prompt += '    "life_area": 0.87,  // Confidence in life area (if provided)\n';
    prompt += '    "domain": 0.92,  // Confidence in primary domain\n';
    prompt += '    "subdomain": 0.85,  // Confidence in subdomain (if provided)\n';
    prompt += '    "contextual": 0.80,  // Confidence in contextual tag (if provided)\n';
    prompt += '    "conversation_type": 0.94  // Confidence in conversation type\n';
    prompt += '  }';
    
    if (opts.requestExplanations) {
      prompt += ',\n';
      prompt += '  "explanations": {\n';
      prompt += '    "life_area": "Explanation for life area classification...",  // Only for medium confidence\n';
      prompt += '    "domain": "Explanation for domain classification...",  // Only for medium confidence\n';
      prompt += '    "contextual_tag": "Detailed justification for new contextual tag..."  // Always include for new tags\n';
      prompt += '  }\n';
    } else {
      prompt += '\n';
    }
    
    prompt += '}\n';
    prompt += '</output_format>\n';
    prompt += '</instructions>\n';
    
    return prompt;
  }
  
  /**
   * Create a prompt for extracting relevant sections from a long document
   */
  static createExtractionPrompt(
    content: string,
    maxTokens: number
  ): string {
    let prompt = `<document>\n${content.substring(0, 3000)}`;
    
    if (content.length > 3000) {
      prompt += '\n\n[Document truncated for brevity]';
    }
    
    prompt += '\n</document>\n\n';
    
    prompt += '<instructions>\n';
    prompt += 'The document above is very long. Your task is to extract the most relevant sections that would help with classifying the document\'s topic and content.\n\n';
    
    prompt += 'Focus on sections that contain:\n';
    prompt += '1. Clear indications of the subject matter or domain\n';
    prompt += '2. Key concepts, technologies, or methodologies discussed\n';
    prompt += '3. Statements about the purpose or context of the conversation\n';
    prompt += '4. Important questions or problems being solved\n\n';
    
    prompt += `Extract approximately ${maxTokens / 4} words (${maxTokens} tokens) that best represent the document's content.\n`;
    prompt += 'Preserve the original wording of the selected sections.\n';
    prompt += 'Format your response as a continuous text with paragraph breaks where appropriate.\n';
    prompt += 'Do not include your own analysis or commentary.\n';
    prompt += '</instructions>';
    
    return prompt;
  }
  
  /**
   * Create a prompt for summarizing a document for classification
   */
  static createSummaryPrompt(content: string): string {
    let prompt = `<document>\n${content.substring(0, 8000)}`;
    
    if (content.length > 8000) {
      prompt += '\n\n[Document truncated for brevity]';
    }
    
    prompt += '\n</document>\n\n';
    
    prompt += '<instructions>\n';
    prompt += 'Create a concise summary of the document focused on elements that would help with topic classification.\n\n';
    
    prompt += 'Your summary should identify:\n';
    prompt += '1. The main subject domains and topics discussed\n';
    prompt += '2. Any specific technologies, methodologies, or frameworks mentioned\n';
    prompt += '3. The general context and purpose of the conversation\n';
    prompt += '4. The conversation style or modality (theoretical, practical, question-based, etc.)\n';
    prompt += '5. Any specific life areas it relates to (career, health, learning, etc.)\n\n';
    
    prompt += 'Keep your summary under 400 words and focus only on extracting factual information.\n';
    prompt += 'Do not include your own analysis or commentary on the quality or correctness of the content.\n';
    prompt += '</instructions>';
    
    return prompt;
  }
  
  /**
   * Get example classifications for few-shot learning
   */
  private static getTaggingExamples(): string {
    return `
# Example 1: Programming Discussion
Input: A conversation about React hooks, state management, and component optimization

Output:
{
  "year": "2023",
  "life_area": "career",
  "topical_tags": [
    {"domain": "software-development", "subdomain": "frontend"},
    {"contextual": "advanced"}
  ],
  "conversation_type": "practical",
  "confidence": {
    "overall": 0.93,
    "year": 0.85,
    "life_area": 0.78,
    "domain": 0.96,
    "subdomain": 0.94,
    "contextual": 0.82,
    "conversation_type": 0.91
  }
}

# Example 2: Philosophy Discussion
Input: A debate about determinism, free will, and moral responsibility in light of neuroscience findings

Output:
{
  "year": "2022",
  "life_area": "learning",
  "topical_tags": [
    {"domain": "philosophy", "subdomain": "ethics"},
    {"domain": "psychology", "subdomain": "cognitive"},
    {"contextual": "deep-dive"}
  ],
  "conversation_type": "theory",
  "confidence": {
    "overall": 0.89,
    "year": 0.76,
    "life_area": 0.72,
    "domain": 0.95,
    "subdomain": 0.87,
    "contextual": 0.85,
    "conversation_type": 0.96
  }
}

# Example 3: Personal Development Conversation
Input: A discussion about forming better productivity habits, managing time, and overcoming procrastination

Output:
{
  "year": "2023",
  "life_area": "personal-growth",
  "topical_tags": [
    {"domain": "productivity", "subdomain": "time-management"},
    {"domain": "psychology", "subdomain": "behavioral"},
    {"contextual": "techniques"}
  ],
  "conversation_type": "practical",
  "confidence": {
    "overall": 0.92,
    "year": 0.79,
    "life_area": 0.94,
    "domain": 0.95,
    "subdomain": 0.88,
    "contextual": 0.81,
    "conversation_type": 0.93
  },
  "explanations": {
    "contextual_tag": "Selected 'techniques' because the conversation focuses on specific actionable methods rather than theory or tools."
  }
}

# Example 4: Technical Question
Input: A question about setting up Docker with Kubernetes and troubleshooting deployment issues

Output:
{
  "year": "2023",
  "life_area": "career",
  "topical_tags": [
    {"domain": "software-development", "subdomain": "devops"},
    {"contextual": "troubleshooting"}
  ],
  "conversation_type": "question",
  "confidence": {
    "overall": 0.94,
    "year": 0.82,
    "life_area": 0.76,
    "domain": 0.97,
    "subdomain": 0.95,
    "contextual": 0.88,
    "conversation_type": 0.96
  },
  "explanations": {
    "contextual_tag": "Suggested 'troubleshooting' as it specifically focuses on resolving technical issues rather than learning or implementation."
  }
}
`;
  }
} 