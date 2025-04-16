import { promises as fs } from 'node:fs';
import path from 'node:path';

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
  useChainOfThought: true,
};

// Utility to load and interpolate prompt templates
async function loadPromptTemplate(templateName: string, variables: Record<string, string>): Promise<string> {
  const templatePath = path.join(__dirname, '../../../prompts', templateName);
  let template = await fs.readFile(templatePath, 'utf8');
  for (const [key, value] of Object.entries(variables)) {
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return template;
}

/**
 * Create a tagging prompt for classifying conversation content
 */
export async function createTaggingPrompt(
  content: string,
  taxonomy: Record<string, unknown>,
  options: TaggingPromptOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_TAGGING_PROMPT_OPTIONS, ...options };
  let truncatedContent = content;
  if (opts.maxLength && content.length > opts.maxLength) {
    truncatedContent =
      content.substring(0, opts.maxLength) +
      `\n\n[Note: content truncated for length, ${String(content.length - opts.maxLength)} characters omitted]`;
  }
  // Load examples from file if needed
  let examples = '';
  if (opts.includeExamples) {
    const examplesPath = path.join(__dirname, '../../../prompts/tagging-examples.txt');
    examples = `<examples>\n${await fs.readFile(examplesPath, 'utf8')}\n</examples>\n`;
  }
  const variables: Record<string, string> = {
    content: truncatedContent,
    chain_of_thought: opts.useChainOfThought
      ? 'Think step-by-step about the classification process:\n1. First identify the general topic and temporal context\n2. Then map to specific domains and subdomains\n3. Finally determine conversation type and life area\n'
      : '',
    explanations: opts.requestExplanations
      ? 'Provide brief explanations for tags with medium confidence (0.65-0.85).\nAlways provide detailed justification for any new contextual tag suggestions.\n'
      : '',
    domains:
      taxonomy['domains'] && Array.isArray(taxonomy['domains'])
        ? (taxonomy['domains'] as string[]).map((d) => `- ${d}`).join('\n')
        : '',
    subdomains:
      taxonomy['subdomains'] && typeof taxonomy['subdomains'] === 'object'
        ? Object.entries(taxonomy['subdomains'] as Record<string, string[]>)
            .map(
              ([domain, subdomains]) =>
                `## ${domain}\n${Array.isArray(subdomains) ? subdomains.map((s) => `- ${s}`).join('\n') : ''}\n`
            )
            .join('')
        : '',
    life_areas:
      taxonomy['life_areas'] && Array.isArray(taxonomy['life_areas'])
        ? (taxonomy['life_areas'] as string[]).map((a) => `- ${a}`).join('\n')
        : '',
    conversation_types:
      taxonomy['conversation_types'] && Array.isArray(taxonomy['conversation_types'])
        ? (taxonomy['conversation_types'] as string[]).map((t) => `- ${t}`).join('\n')
        : '',
    contextual_tags:
      taxonomy['contextual_tags'] && Array.isArray(taxonomy['contextual_tags'])
        ? (taxonomy['contextual_tags'] as string[]).map((t) => `- ${t}`).join('\n')
        : '',
    examples,
    explanations_block: opts.requestExplanations
      ? ',\n  "explanations": {\n    "life_area": "Explanation for life area classification...",  // Only for medium confidence\n    "domain": "Explanation for domain classification...",  // Only for medium confidence\n    "contextual_tag": "Detailed justification for new contextual tag..."  // Always include for new tags\n  }\n'
      : '\n',
  };
  return loadPromptTemplate('tagging.txt', variables);
}

/**
 * Create a prompt for extracting relevant sections from a long document
 */
export async function createExtractionPrompt(content: string, maxTokens: number): Promise<string> {
  const truncated = content.substring(0, 3000) + (content.length > 3000 ? '\n\n[Document truncated for brevity]' : '');
  const variables = {
    content: truncated,
    word_count: String(Math.floor(maxTokens / 4)),
    max_tokens: String(maxTokens),
  };
  return loadPromptTemplate('extraction.txt', variables);
}

/**
 * Create a prompt for summarizing a document for classification
 */
export async function createSummaryPrompt(content: string): Promise<string> {
  const truncated = content.substring(0, 8000) + (content.length > 8000 ? '\n\n[Document truncated for brevity]' : '');
  const variables = {
    content: truncated,
  };
  return loadPromptTemplate('summary.txt', variables);
}
