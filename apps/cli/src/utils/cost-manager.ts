import * as fs from 'fs-extra';
import * as path from 'path';
import { config } from './config';
import { logger } from './logger';
import { CostLimitError } from './errors';
import type { AIModel } from '@obsidian-magic/types';

// Token pricing per 1K tokens (in USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-3.5-turbo': {
    input: 0.0005,
    output: 0.0015
  },
  'gpt-4o': {
    input: 0.01,
    output: 0.03
  }
};

// Default pricing for fallback
const DEFAULT_PRICING = {
  input: 0.0005,
  output: 0.0015
};

// Default token estimations
const DEFAULT_TOKENS_PER_WORD = 1.3;
const DEFAULT_TOKENS_PER_CHARACTER = 0.25;

/**
 * Usage record interface
 */
interface UsageRecord {
  timestamp: number;
  model: AIModel;
  tokens: number;
  cost: number;
  operation: string;
}

/**
 * Cost limits and thresholds
 */
interface CostLimits {
  warningThreshold: number;
  hardLimit: number;
  onLimitReached: 'warn' | 'pause' | 'stop';
}

/**
 * Token usage data by model
 */
interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
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
  maxCost?: number | undefined;
  onLimit?: 'pause' | 'warn' | 'stop';
}

/**
 * Cost manager class
 */
class CostManager {
  private static instance: CostManager;
  private usageData: UsageRecord[] = [];
  private session: {
    startTime: number;
    totalCost: number;
    totalTokens: number;
    models: Record<AIModel, TokenUsage>;
  };
  private dataFile: string;
  private limits: CostLimits;
  private paused = false;

  /**
   * Private constructor (singleton)
   */
  private constructor() {
    this.session = {
      startTime: Date.now(),
      totalCost: 0,
      totalTokens: 0,
      models: {
        'gpt-3.5-turbo': { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        'gpt-4': { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        'gpt-4o': { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
      }
    };

    // Set default limits
    this.limits = {
      warningThreshold: config.get('costLimit') ?? 5,
      hardLimit: config.get('costLimit') ?? 10,
      onLimitReached: config.get('onLimitReached') ?? 'warn'
    };

    // Set data file path
    const dataDir = path.join(
      process.env['HOME'] || process.env['USERPROFILE'] || '.',
      '.obsidian-magic'
    );
    this.dataFile = path.join(dataDir, 'usage-data.json');

    // Load existing data
    this.loadUsageData();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CostManager {
    if (!CostManager.instance) {
      CostManager.instance = new CostManager();
    }
    return CostManager.instance;
  }

  /**
   * Set cost limits
   */
  public setLimits(limits: Partial<CostLimits>): void {
    this.limits = { ...this.limits, ...limits };
  }

  /**
   * Track API usage
   */
  public trackUsage(
    model: AIModel,
    tokens: { input: number; output: number },
    operation: string
  ): number {
    const { input, output } = tokens;
    const totalTokens = input + output;
    
    // Calculate cost based on model pricing
    const cost = this.calculateCost(model, input, output);
    
    // Update session data
    this.session.totalCost += cost;
    this.session.totalTokens += totalTokens;
    
    // Update model-specific usage
    if (this.session.models[model]) {
      this.session.models[model].inputTokens += input;
      this.session.models[model].outputTokens += output;
      this.session.models[model].totalTokens += totalTokens;
    } else {
      this.session.models[model] = {
        inputTokens: input,
        outputTokens: output,
        totalTokens
      };
    }
    
    // Record usage
    const record: UsageRecord = {
      timestamp: Date.now(),
      model,
      tokens: totalTokens,
      cost,
      operation
    };
    
    this.usageData.push(record);
    
    // Check limits
    this.checkLimits();
    
    return cost;
  }
  
  /**
   * Calculate estimated cost for a given number of tokens
   */
  public estimateCost(
    model: AIModel,
    tokens: { input: number; output: number }
  ): number {
    return this.calculateCost(model, tokens.input, tokens.output);
  }
  
  /**
   * Get current session stats
   */
  public getSessionStats(): {
    duration: number;
    totalCost: number;
    totalTokens: number;
    modelBreakdown: Record<string, {
      cost: number;
      tokens: TokenUsage;
    }>;
  } {
    const modelBreakdown: Record<string, { cost: number; tokens: TokenUsage }> = {};
    
    // Calculate costs per model
    for (const [model, usage] of Object.entries(this.session.models)) {
      if (usage.totalTokens > 0) {
        modelBreakdown[model] = {
          tokens: { ...usage },
          cost: this.calculateCost(model as AIModel, usage.inputTokens, usage.outputTokens)
        };
      }
    }
    
    return {
      duration: Date.now() - this.session.startTime,
      totalCost: this.session.totalCost,
      totalTokens: this.session.totalTokens,
      modelBreakdown
    };
  }
  
  /**
   * Get usage history for a time period
   */
  public getUsageHistory(
    period: 'day' | 'week' | 'month' | 'all' = 'all'
  ): UsageRecord[] {
    const now = Date.now();
    let cutoff = 0;
    
    switch (period) {
      case 'day':
        cutoff = now - 24 * 60 * 60 * 1000;
        break;
      case 'week':
        cutoff = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        cutoff = now - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        cutoff = 0;
    }
    
    return this.usageData.filter(record => record.timestamp >= cutoff);
  }
  
  /**
   * Save usage data to file
   */
  public saveUsageData(): void {
    try {
      const dir = path.dirname(this.dataFile);
      fs.ensureDirSync(dir);
      fs.writeJSONSync(this.dataFile, this.usageData);
      logger.debug(`Usage data saved to ${this.dataFile}`);
    } catch (error) {
      logger.warn(`Failed to save usage data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Load usage data from file
   */
  private loadUsageData(): void {
    try {
      if (fs.existsSync(this.dataFile)) {
        this.usageData = fs.readJSONSync(this.dataFile);
        logger.debug(`Loaded usage data from ${this.dataFile}`);
      } else {
        this.usageData = [];
        logger.debug('No existing usage data found');
      }
    } catch (error) {
      logger.warn(`Failed to load usage data: ${error instanceof Error ? error.message : String(error)}`);
      this.usageData = [];
    }
  }
  
  /**
   * Calculate cost based on model and tokens
   */
  private calculateCost(model: AIModel, inputTokens: number, outputTokens: number): number {
    // Official OpenAI pricing as of April 2024
    switch (model) {
      case 'gpt-4':
        return (inputTokens / 1000) * 0.03 + (outputTokens / 1000) * 0.06;
      case 'gpt-4o':
        return (inputTokens / 1000) * 0.01 + (outputTokens / 1000) * 0.03;
      case 'gpt-3.5-turbo':
      default:
        return (inputTokens / 1000) * 0.0005 + (outputTokens / 1000) * 0.0015;
    }
  }
  
  /**
   * Check if limits have been exceeded
   */
  private checkLimits(): void {
    const { warningThreshold, hardLimit, onLimitReached } = this.limits;
    const currentCost = this.session.totalCost;
    
    // Warning threshold
    if (currentCost >= warningThreshold && currentCost < hardLimit) {
      logger.warn(`Cost warning: $${currentCost.toFixed(4)} spent so far (threshold: $${warningThreshold.toFixed(2)})`);
    }
    
    // Hard limit
    if (currentCost >= hardLimit) {
      logger.error(`Cost limit reached: $${currentCost.toFixed(4)} (limit: $${hardLimit.toFixed(2)})`);
      
      if (onLimitReached === 'stop') {
        throw new CostLimitError(
          `Cost limit of $${hardLimit.toFixed(2)} exceeded. Current cost: $${currentCost.toFixed(4)}`,
          { cost: currentCost, limit: hardLimit }
        );
      }
      
      if (onLimitReached === 'pause' && !this.paused) {
        this.paused = true;
        logger.warn('Processing paused due to cost limit. Use --force to continue.');
      }
    }
  }
  
  /**
   * Check if processing is paused
   */
  public isPaused(): boolean {
    return this.paused;
  }
  
  /**
   * Reset pause state
   */
  public resetPause(): void {
    this.paused = false;
  }
}

// Export singleton instance
export const costManager = CostManager.getInstance(); 