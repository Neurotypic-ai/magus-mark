/**
 * Prompt utility functions for Magus Mark
 */
import fs from 'fs/promises';
import path from 'path';

/**
 * Maximum prompt token length to target
 */
export const MAX_PROMPT_LENGTH = 16000;

/**
 * Approximate token conversion for English text
 * 1 token ≈ 4 characters or 0.75 words
 */
export const TOKENS_PER_CHARACTER = 0.25;
export const WORDS_PER_TOKEN = 0.75;

/**
 * Estimates token count from text length
 * @param text - Text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length * TOKENS_PER_CHARACTER);
}

/**
 * Truncates text to fit within token limit
 * @param text - Text to truncate
 * @param maxTokens - Maximum token count
 * @returns Truncated text
 */
export function truncateToTokenLimit(text: string, maxTokens: number = MAX_PROMPT_LENGTH): string {
  const estimatedTokens = estimateTokenCount(text);

  if (estimatedTokens <= maxTokens) {
    return text;
  }

  // Calculate approximate character limit
  const charLimit = Math.floor(maxTokens / TOKENS_PER_CHARACTER);

  // Try to truncate at sentence boundary
  const truncated = text.slice(0, charLimit);
  const lastSentenceEnd = Math.max(truncated.lastIndexOf('.'), truncated.lastIndexOf('!'), truncated.lastIndexOf('?'));

  if (lastSentenceEnd > charLimit * 0.8) {
    return text.slice(0, lastSentenceEnd + 1);
  }

  return truncated;
}

/**
 * Loads a prompt template from a file
 * @param templatePath - Path to template file
 * @returns Template content
 */
export async function loadPromptTemplate(templatePath: string): Promise<string> {
  try {
    return await fs.readFile(templatePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to load prompt template from ${templatePath}: ${(error as Error).message}`);
  }
}

/**
 * Substitutes variables in a prompt template
 * @param template - Prompt template
 * @param variables - Variable substitutions
 * @returns Processed template
 */
export function processTemplate(template: string, variables: Record<string, string>): string {
  let processed = template;

  for (const [key, value] of Object.entries(variables)) {
    processed = processed.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), value);
  }

  return processed;
}

/**
 * Formats a document for insertion into a prompt
 * @param content - Document content
 * @param maxTokens - Maximum token count to allow
 * @returns Formatted document
 */
export function formatDocumentForPrompt(content: string, maxTokens: number = MAX_PROMPT_LENGTH * 0.8): string {
  // Clean and normalize content
  const normalized = content.replace(/\r\n/g, '\n').replace(/\t/g, '    ').trim();

  return truncateToTokenLimit(normalized, maxTokens);
}

/**
 * Combines a system prompt, user content, and context
 * @param systemPrompt - System instructions
 * @param userContent - User content
 * @param context - Additional context
 * @param maxTokens - Maximum token count
 * @returns Combined prompt
 */
export function combinePromptComponents(
  systemPrompt: string,
  userContent: string,
  context?: string,
  maxTokens: number = MAX_PROMPT_LENGTH
): string {
  // Start with system prompt which we never truncate
  let combinedPrompt = systemPrompt;
  const remainingTokens = maxTokens - estimateTokenCount(systemPrompt);

  if (remainingTokens <= 0) {
    return combinedPrompt;
  }

  // Add context if provided, using up to 30% of remaining tokens
  if (context) {
    const contextTokens = Math.floor(remainingTokens * 0.3);
    const truncatedContext = truncateToTokenLimit(context, contextTokens);
    combinedPrompt += `\n\nContext:\n${truncatedContext}`;
  }

  // Calculate tokens used so far
  const tokensUsed = estimateTokenCount(combinedPrompt);
  const userTokens = maxTokens - tokensUsed;

  // Add user content with remaining tokens
  const truncatedUserContent = truncateToTokenLimit(userContent, userTokens);
  combinedPrompt += `\n\nDocument:\n${truncatedUserContent}`;

  return combinedPrompt;
}

/**
 * Loads a set of prompt templates from a directory
 * @param templateDir - Directory containing templates
 * @returns Map of template names to contents
 */
export async function loadPromptTemplates(templateDir: string): Promise<Map<string, string>> {
  const templates = new Map<string, string>();

  try {
    const files = await fs.readdir(templateDir);

    for (const file of files) {
      if (path.extname(file) === '.txt' || path.extname(file) === '.md') {
        const templateName = path.basename(file, path.extname(file));
        const templatePath = path.join(templateDir, file);
        const templateContent = await loadPromptTemplate(templatePath);
        templates.set(templateName, templateContent);
      }
    }

    return templates;
  } catch (error) {
    throw new Error(`Failed to load prompt templates from ${templateDir}: ${(error as Error).message}`);
  }
}
