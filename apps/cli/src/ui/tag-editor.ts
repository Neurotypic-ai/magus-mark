import { checkbox, confirm, input, select } from '@inquirer/prompts';
import chalk from 'chalk';

import { logger } from '@obsidian-magic/core';

/**
 * Interactive tag editor options
 */
interface TagEditorOptions {
  minConfidence?: number;
  reviewThreshold?: number;
}

/**
 * Tag with confidence score
 */
interface TagWithConfidence {
  name: string;
  confidence: number;
}

/**
 * Interactive tag editor for reviewing and editing tags
 */
export class TagEditor {
  private options: TagEditorOptions;

  constructor(options: TagEditorOptions = {}) {
    this.options = {
      minConfidence: 0.7,
      reviewThreshold: 0.5,
      ...options,
    };
  }

  /**
   * Review and edit tags interactively
   */
  public async reviewTags(
    filePath: string,
    suggestedTags: TagWithConfidence[],
    existingTags: string[] = []
  ): Promise<{ tags: string[]; approved: boolean }> {
    // Sort tags by confidence
    const sortedTags = [...suggestedTags].sort((a, b) => b.confidence - a.confidence);

    // Automatically accept high-confidence tags
    const autoAcceptedTags = sortedTags
      .filter((tag) => tag.confidence >= (this.options.minConfidence ?? 0.7))
      .map((tag) => tag.name);

    // Tags that need review
    const reviewTags = sortedTags
      .filter(
        (tag) =>
          tag.confidence < (this.options.minConfidence ?? 0.7) &&
          tag.confidence >= (this.options.reviewThreshold ?? 0.5)
      )
      .map((tag) => tag.name);

    // Low confidence tags (ignored by default)
    const lowConfidenceTags = sortedTags
      .filter((tag) => tag.confidence < (this.options.reviewThreshold ?? 0.5))
      .map((tag) => tag.name);

    // Display information
    logger.info(`\nReviewing tags for: ${chalk.cyan(filePath)}`);

    if (existingTags.length > 0) {
      logger.info(`${chalk.bold('Existing tags:')} ${existingTags.map((t) => chalk.green(t)).join(', ')}`);
    }

    if (autoAcceptedTags.length > 0) {
      logger.info(`${chalk.bold('Auto-accepted tags:')} ${autoAcceptedTags.map((t) => chalk.green(t)).join(', ')}`);
    }

    if (reviewTags.length > 0) {
      logger.info(`${chalk.bold('Tags needing review:')} ${reviewTags.map((t) => chalk.yellow(t)).join(', ')}`);
    }

    if (lowConfidenceTags.length > 0) {
      logger.info(`${chalk.bold('Low confidence tags:')} ${lowConfidenceTags.map((t) => chalk.gray(t)).join(', ')}`);
    }

    // Build the interactive interface
    const selectedTags = await checkbox({
      message: 'Select tags to apply:',
      choices: sortedTags.map((tag) => ({
        name: `${tag.name} ${chalk.gray(`(${(tag.confidence * 100).toFixed(0)}%)`)}`,
        value: tag.name,
        checked: tag.confidence >= (this.options.reviewThreshold ?? 0.5),
      })),
    });

    // Ask for custom tags
    const addCustomTags = await confirm({
      message: 'Would you like to add custom tags?',
      default: false,
    });

    let customTags: string[] = [];

    if (addCustomTags) {
      const customTagInput = await input({
        message: 'Enter custom tags (comma separated):',
        validate: (value: string) => {
          if (value.trim() === '') {
            return 'Please enter at least one tag or press CTRL+C to cancel';
          }
          return true;
        },
      });

      customTags = customTagInput
        .split(',')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag !== '');
    }

    // Confirm final set
    const finalTags = [...new Set([...selectedTags, ...customTags])].sort();

    logger.info(`\n${chalk.bold('Final tag set:')}`);
    logger.info(finalTags.map((tag) => chalk.green(tag)).join(', '));

    const confirmTags = await confirm({
      message: 'Apply these tags?',
      default: true,
    });

    return {
      tags: finalTags,
      approved: confirmTags,
    };
  }

  /**
   * Prompt for merging tags
   */
  public async promptForMergeStrategy(): Promise<'append' | 'replace' | 'merge' | 'skip'> {
    const strategy = await select<'append' | 'replace' | 'merge' | 'skip'>({
      message: 'File already has tags. How would you like to proceed?',
      choices: [
        { value: 'merge', name: 'Merge - combine both sets of tags' },
        { value: 'append', name: 'Append - add new tags to existing ones' },
        { value: 'replace', name: 'Replace - use only new tags' },
        { value: 'skip', name: 'Skip - keep existing tags only' },
      ],
      default: 'merge',
    });

    return strategy;
  }

  /**
   * Display a side-by-side comparison of tag sets
   */
  public compareTagSets(existing: string[], suggested: string[]): void {
    // Create sets for easy comparison
    const existingSet = new Set(existing);
    const suggestedSet = new Set(suggested);

    // Find common tags
    const commonTags = existing.filter((tag) => suggestedSet.has(tag));

    // Find new tags (in suggested but not in existing)
    const newTags = suggested.filter((tag) => !existingSet.has(tag));

    // Find removed tags (in existing but not in suggested)
    const removedTags = existing.filter((tag) => !suggestedSet.has(tag));

    // Display the comparison
    logger.info('\nTag Comparison:');

    if (commonTags.length > 0) {
      logger.info(`${chalk.bold('Common tags:')} ${commonTags.map((t) => chalk.blue(t)).join(', ')}`);
    }

    if (newTags.length > 0) {
      logger.info(`${chalk.bold('New tags:')} ${newTags.map((t) => chalk.green(t)).join(', ')}`);
    }

    if (removedTags.length > 0) {
      logger.info(`${chalk.bold('Removed tags:')} ${removedTags.map((t) => chalk.red(t)).join(', ')}`);
    }
  }
}
