import { logger } from './logger.js';
import { config } from './config.js';
import { CostLimitError } from './errors.js';
import type { AIModel } from '@obsidian-magic/types';

// Token pricing per 1K tokens (in USD)
const MODEL_PRICING = {
  'gpt-3.5-turbo': {
    input: 0.0005,
    output: 0.0015
  },
  'gpt-4': {
    input: 0.03,
    output: 0.06
  },
  'gpt-4o': {
    input: 0.01,
    output: 0.03
  }
};

// Default token estimations
const DEFAULT_TOKENS_PER_WORD = 1.3;
const DEFAULT_TOKENS_PER_CHARACTER = 0.25;

/**
 * Token usage data
 */
interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

/**
 * Cost data
 */
interface CostData {
  input: number;
  output: number;
  total: number;
}

/**
 * Cost manager options
 */
interface CostManagerOptions {
  maxCost?: number;
  onLimit?: 'pause' | 'warn' | 'stop';
}

/**
 * Cost manager for tracking API usage and costs
 */
export class CostManager {
  private static instance: CostManager;
  private tokenUsage: Record<AIModel, TokenUsage> = {
    'gpt-3.5-turbo': { input: 0, output: 0, total: 0 },
    'gpt-4': { input: 0, output: 0, total: 0 },
    'gpt-4o': { input: 0, output: 0, total: 0 }
  };
  
  private costs: Record<AIModel, CostData> = {
    'gpt-3.5-turbo': { input: 0, output: 0, total: 0 },
    'gpt-4': { input: 0, output: 0, total: 0 },
    'gpt-4o': { input: 0, output: 0, total: 0 }
  };
  
  private options: CostManagerOptions = {
    maxCost: undefined,
    onLimit: 'warn'
  };
  
  private constructor() {
    // Load options from config
    const configMaxCost = config.get('costLimit');
    const configOnLimit = config.get('costLimitAction');
    
    if (configMaxCost !== undefined) {
      this.options.maxCost = configMaxCost;
    }
    
    if (configOnLimit !== undefined) {
      this.options.onLimit = configOnLimit as 'pause' | 'warn' | 'stop';
    }
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): CostManager {
    if (!CostManager.instance) {
      CostManager.instance = new CostManager();
    }
    return CostManager.instance;
  }
  
  /**
   * Configure the cost manager
   */
  public configure(options: CostManagerOptions): void {
    if (options.maxCost !== undefined) {
      this.options.maxCost = options.maxCost;
    }
    
    if (options.onLimit !== undefined) {
      this.options.onLimit = options.onLimit;
    }
  }
  
  /**
   * Track token usage
   */
  public trackTokens(
    model: AIModel, 
    tokens: { input: number; output: number }
  ): void {
    // Update token counts
    this.tokenUsage[model].input += tokens.input;
    this.tokenUsage[model].output += tokens.output;
    this.tokenUsage[model].total += tokens.input + tokens.output;
    
    // Calculate costs
    const inputCost = (tokens.input / 1000) * MODEL_PRICING[model].input;
    const outputCost = (tokens.output / 1000) * MODEL_PRICING[model].output;
    const totalCost = inputCost + outputCost;
    
    this.costs[model].input += inputCost;
    this.costs[model].output += outputCost;
    this.costs[model].total += totalCost;
    
    // Check against limits
    this.checkLimits();
  }
  
  /**
   * Estimate tokens for text
   */
  public estimateTokens(text: string): number {
    // Basic estimation algorithm
    const wordCount = text.split(/\s+/).length;
    const charCount = text.length;
    
    // Combine word-based and char-based estimates
    const wordBasedEstimate = wordCount * DEFAULT_TOKENS_PER_WORD;
    const charBasedEstimate = charCount * DEFAULT_TOKENS_PER_CHARACTER;
    
    // Average the two approaches
    return Math.ceil((wordBasedEstimate + charBasedEstimate) / 2);
  }
  
  /**
   * Estimate cost for token usage
   */
  public estimateCost(
    model: AIModel, 
    tokens: { input: number; output: number }
  ): CostData {
    const inputCost = (tokens.input / 1000) * MODEL_PRICING[model].input;
    const outputCost = (tokens.output / 1000) * MODEL_PRICING[model].output;
    
    return {
      input: inputCost,
      output: outputCost,
      total: inputCost + outputCost
    };
  }
  
  /**
   * Check if operation is under budget
   */
  public isUnderBudget(cost: number): boolean {
    if (this.options.maxCost === undefined) {
      return true;
    }
    
    const totalCost = this.getTotalCost();
    return totalCost + cost <= this.options.maxCost;
  }
  
  /**
   * Get current token usage
   */
  public getTokenUsage(): Record<AIModel, TokenUsage> {
    return this.tokenUsage;
  }
  
  /**
   * Get current costs
   */
  public getCosts(): Record<AIModel, CostData> {
    return this.costs;
  }
  
  /**
   * Get total cost across all models
   */
  public getTotalCost(): number {
    return Object.values(this.costs).reduce(
      (total, modelCost) => total + modelCost.total, 
      0
    );
  }
  
  /**
   * Reset usage tracking
   */
  public reset(): void {
    for (const model of Object.keys(this.tokenUsage) as AIModel[]) {
      this.tokenUsage[model] = { input: 0, output: 0, total: 0 };
      this.costs[model] = { input: 0, output: 0, total: 0 };
    }
  }
  
  /**
   * Save usage data to config
   */
  public saveUsageData(): void {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const usageHistory = config.get('usageHistory') || {};
    
    if (!usageHistory[currentMonth]) {
      usageHistory[currentMonth] = {
        tokens: { ...this.tokenUsage },
        costs: { ...this.costs }
      };
    } else {
      // Update existing data
      for (const model of Object.keys(this.tokenUsage) as AIModel[]) {
        usageHistory[currentMonth].tokens[model] = usageHistory[currentMonth].tokens[model] || { input: 0, output: 0, total: 0 };
        usageHistory[currentMonth].costs[model] = usageHistory[currentMonth].costs[model] || { input: 0, output: 0, total: 0 };
        
        usageHistory[currentMonth].tokens[model].input += this.tokenUsage[model].input;
        usageHistory[currentMonth].tokens[model].output += this.tokenUsage[model].output;
        usageHistory[currentMonth].tokens[model].total += this.tokenUsage[model].total;
        
        usageHistory[currentMonth].costs[model].input += this.costs[model].input;
        usageHistory[currentMonth].costs[model].output += this.costs[model].output;
        usageHistory[currentMonth].costs[model].total += this.costs[model].total;
      }
    }
    
    config.set('usageHistory', usageHistory);
  }
  
  /**
   * Select best model for a task based on content complexity and cost constraints
   */
  public selectBestModel(
    text: string, 
    options: { 
      preferredModel?: AIModel;
      requirePrecision?: boolean;
      maxCost?: number;
    } = {}
  ): AIModel {
    const estimatedTokens = this.estimateTokens(text);
    const expectedOutputTokens = Math.ceil(estimatedTokens * 0.5); // Estimate output as 50% of input
    
    // If a preferred model is specified and it's under budget, use it
    if (options.preferredModel) {
      const costEstimate = this.estimateCost(
        options.preferredModel, 
        { input: estimatedTokens, output: expectedOutputTokens }
      ).total;
      
      if (options.maxCost === undefined || costEstimate <= options.maxCost) {
        return options.preferredModel;
      }
    }
    
    // Determine based on content complexity
    const complexityScore = this.assessComplexity(text);
    
    // High precision requirements
    if (options.requirePrecision === true || complexityScore > 0.7) {
      const gpt4oCost = this.estimateCost(
        'gpt-4o', 
        { input: estimatedTokens, output: expectedOutputTokens }
      ).total;
      
      const gpt4Cost = this.estimateCost(
        'gpt-4', 
        { input: estimatedTokens, output: expectedOutputTokens }
      ).total;
      
      // Check against max cost
      if (options.maxCost !== undefined) {
        if (gpt4oCost <= options.maxCost) {
          return 'gpt-4o';
        } else if (gpt4Cost <= options.maxCost) {
          return 'gpt-4';
        } else {
          return 'gpt-3.5-turbo'; // Fallback to cheapest option
        }
      }
      
      // No cost limit, prefer the most accurate
      return 'gpt-4o';
    }
    
    // Medium complexity
    if (complexityScore > 0.4) {
      const gpt4oCost = this.estimateCost(
        'gpt-4o', 
        { input: estimatedTokens, output: expectedOutputTokens }
      ).total;
      
      // Check against max cost
      if (options.maxCost !== undefined && gpt4oCost > options.maxCost) {
        return 'gpt-3.5-turbo'; // Fallback to cheapest option
      }
      
      return 'gpt-4o';
    }
    
    // Low complexity, use cheapest option
    return 'gpt-3.5-turbo';
  }
  
  /**
   * Check against cost limits
   */
  private checkLimits(): void {
    if (this.options.maxCost === undefined) {
      return;
    }
    
    const totalCost = this.getTotalCost();
    
    if (totalCost >= this.options.maxCost) {
      logger.warn(`Cost limit reached: $${totalCost.toFixed(4)} of $${this.options.maxCost.toFixed(4)}`);
      
      if (this.options.onLimit === 'stop') {
        throw new CostLimitError(
          'Cost limit reached. Stopping operation.', 
          { cost: totalCost, limit: this.options.maxCost }
        );
      }
    } else if (totalCost >= this.options.maxCost * 0.9) {
      // Warn when approaching limit (90%)
      logger.warn(`Approaching cost limit: $${totalCost.toFixed(4)} of $${this.options.maxCost.toFixed(4)}`);
    }
  }
  
  /**
   * Assess text complexity (simplified algorithm)
   */
  private assessComplexity(text: string): number {
    // This is a simplified complexity assessment 
    // Real implementation would consider multiple factors
    
    // Length factor
    const lengthScore = Math.min(text.length / 10000, 1) * 0.3;
    
    // Vocabulary complexity
    const uniqueWords = new Set(text.toLowerCase().match(/\b\w+\b/g) || []).size;
    const totalWords = (text.match(/\b\w+\b/g) || []).length || 1;
    const vocabularyScore = Math.min(uniqueWords / totalWords * 3, 1) * 0.3;
    
    // Technical content indicators
    const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).length;
    const technicalTerms = (text.match(/\b(function|class|interface|component|algorithm|method|api|database|query|server|client|framework|library)\b/gi) || []).length;
    const technicalScore = Math.min((codeBlocks * 0.2) + (technicalTerms / 20), 1) * 0.4;
    
    return lengthScore + vocabularyScore + technicalScore;
  }
}

export const costManager = CostManager.getInstance(); 