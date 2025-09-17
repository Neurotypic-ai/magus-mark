import { Logger } from '@magus-mark/core/utils/Logger';

export interface EntityValues {
  path?: string;
  model?: string;
  key?: string;
  value?: string;
  period?: string;
  type?: string;
}

export interface NLCommand {
  intent: string;
  entities: EntityValues;
  confidence: number;
  rawInput: string;
}

export interface NLResponse {
  success: boolean;
  message: string;
  action?: string;
  parameters?: Record<string, unknown>;
}

export class NaturalLanguageProcessor {
  private logger: Logger;
  private patterns = new Map<string, RegExp>();

  constructor() {
    this.logger = Logger.getInstance('nl-processor');
    this.initializePatterns();
  }

  private initializePatterns(): void {
    // Intent patterns for common CLI operations
    this.patterns.set('tag_files', /tag|process|analyze (.*?)( files?| documents?)?/i);
    this.patterns.set('show_stats', /show|display|view (stats|statistics|usage|cost)/i);
    this.patterns.set('configure', /config|configure|setup|set (.*)/i);
    this.patterns.set('help', /help|how to|what is|explain/i);
    this.patterns.set('dashboard', /dashboard|monitor|watch|live view/i);
    this.patterns.set('test_models', /test|benchmark|compare models?/i);
    this.patterns.set('list_files', /list|show|find files?/i);
  }

  processCommand(input: string): NLCommand {
    const normalizedInput = input.trim().toLowerCase();

    this.logger.debug(`Processing natural language input: ${input}`);

    // Try to match against known patterns
    for (const [intent, pattern] of this.patterns.entries()) {
      const match = pattern.exec(normalizedInput);
      if (match) {
        const entities = this.extractEntities(intent, match, normalizedInput);

        return {
          intent,
          entities,
          confidence: this.calculateConfidence(intent, match),
          rawInput: input,
        };
      }
    }

    // Fallback for unrecognized commands
    return {
      intent: 'unknown',
      entities: {},
      confidence: 0.1,
      rawInput: input,
    };
  }

  executeCommand(command: NLCommand): NLResponse {
    this.logger.info(`Executing command: ${command.intent}`);

    try {
      switch (command.intent) {
        case 'tag_files':
          return this.handleTagFiles(command);
        case 'show_stats':
          return this.handleShowStats(command);
        case 'configure':
          return this.handleConfigure(command);
        case 'dashboard':
          return this.handleDashboard(command);
        case 'test_models':
          return this.handleTestModels(command);
        case 'help':
          return this.handleHelp(command);
        default:
          return {
            success: false,
            message: `Sorry, I don't understand "${command.rawInput}". Try "help" for available commands.`,
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error executing command: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private extractEntities(
    intent: string,
    match: RegExpExecArray,
    input: string
  ): EntityValues {
    const entities: EntityValues = {};

    switch (intent) {
      case 'tag_files':
        if (match[1]) {
          entities.path = match[1].trim();
        }
        // Extract model if mentioned
        if (input.includes('gpt-4')) entities.model = 'gpt-4';
        if (input.includes('gpt-3.5')) entities.model = 'gpt-3.5-turbo';
        break;

      case 'configure':
        if (match[1]) {
          const configPart = match[1].trim();
          // Extract key-value pairs
          const kvMatch = /(\w+)\s+(?:to\s+)?(.+)/i.exec(configPart);
          if (kvMatch?.[1] && kvMatch[2]) {
            entities.key = kvMatch[1];
            entities.value = kvMatch[2];
          }
        }
        break;

      case 'show_stats':
        if (input.includes('week')) entities.period = 'week';
        if (input.includes('month')) entities.period = 'month';
        if (input.includes('day')) entities.period = 'day';
        if (input.includes('cost')) entities.type = 'cost';
        if (input.includes('usage')) entities.type = 'usage';
        break;
    }

    return entities;
  }

  private calculateConfidence(_intent: string, match: RegExpExecArray): number {
    // Base confidence on pattern match quality
    let confidence = 0.7;

    // Boost confidence for exact matches
    if (match[0] && match[0].length > 3) {
      confidence += 0.1;
    }

    // Boost for specific entities found
    if (match[1] && match[1].trim().length > 0) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  private handleTagFiles(command: NLCommand): NLResponse {
    const path = command.entities.path || '.';
    const model = command.entities.model || 'gpt-4o';

    return {
      success: true,
      message: `I'll tag files in "${path}" using ${model}`,
      action: 'tag',
      parameters: { paths: [path], model },
    };
  }

  private handleShowStats(command: NLCommand): NLResponse {
    const period = command.entities.period || 'all';
    const type = command.entities.type || 'all';

    return {
      success: true,
      message: `Here are your ${type} statistics for ${period}`,
      action: 'stats',
      parameters: { period, type },
    };
  }

  private handleConfigure(command: NLCommand): NLResponse {
    const key = command.entities.key;
    const value = command.entities.value;

    if (key && value) {
      return {
        success: true,
        message: `I'll set ${key} to ${value}`,
        action: 'config',
        parameters: { key, value },
      };
    }

    return {
      success: true,
      message: "I'll open the interactive configuration setup",
      action: 'setup',
      parameters: {},
    };
  }

  private handleDashboard(_command: NLCommand): NLResponse {
    return {
      success: true,
      message: 'Launching the God Tier dashboard experience!',
      action: 'dashboard',
      parameters: { theme: 'matrix' },
    };
  }

  private handleTestModels(_command: NLCommand): NLResponse {
    return {
      success: true,
      message: "I'll run model benchmarks to find the best performance",
      action: 'test',
      parameters: { benchmark: true },
    };
  }

  private handleHelp(_command: NLCommand): NLResponse {
    const helpMessage = `
🔥 Magus Mark CLI - Natural Language Interface

Here's what you can say:

📋 File Operations:
  "tag my files"
  "process conversations in ./notes"
  "analyze documents with gpt-4"

📊 Statistics:
  "show my usage stats"
  "display cost for this week"
  "view monthly statistics"

⚙️  Configuration:
  "set my api key to sk-..."
  "configure the default model to gpt-4"
  "open setup"

🚀 Advanced:
  "launch dashboard"
  "test model performance"
  "benchmark all models"

💡 Pro tip: Just describe what you want to do in natural language!
    `;

    return {
      success: true,
      message: helpMessage,
    };
  }
}
