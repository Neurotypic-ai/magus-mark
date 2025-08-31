import { input } from '@inquirer/prompts';
import chalk from 'chalk';

import { Logger } from '@magus-mark/core/utils/Logger';

import { NaturalLanguageProcessor } from '../quality-of-life/natural-lang/NaturalLanguageProcessor';

import type { CommandModule } from 'yargs';

const logger = Logger.getInstance('natural');

interface NaturalOptions {
  interactive: boolean;
  command?: string;
}

export const naturalCommand: CommandModule<object, NaturalOptions> = {
  command: 'ask [command]',
  describe: '🧠 Natural language interface - just tell me what you want to do!',

  builder: (yargs) => {
    return yargs
      .positional('command', {
        describe: 'Natural language command (optional - will prompt if not provided)',
        type: 'string',
      })
      .option('interactive', {
        describe: 'Start interactive natural language session',
        type: 'boolean',
        alias: 'i',
        default: false,
      })
      .example('$0 ask "tag my files with gpt-4"', 'Process files with natural language')
      .example('$0 ask "show me usage stats for this week"', 'Get statistics')
      .example('$0 ask --interactive', 'Start interactive session')
      .example('$0 ask "launch the dashboard"', 'Open dashboard');
  },

  handler: async (argv) => {
    console.log(chalk.bold.cyan('🧠 NATURAL LANGUAGE INTERFACE'));
    console.log(chalk.gray('Just tell me what you want to do in plain English!'));

    const processor = new NaturalLanguageProcessor();

    try {
      if (argv.interactive) {
        await runInteractiveSession(processor);
      } else {
        const command = argv.command || (await promptForCommand());
        await processSingleCommand(processor, command);
      }
    } catch (error) {
      logger.error(`Natural language processing failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  },
};

async function runInteractiveSession(processor: NaturalLanguageProcessor): Promise<void> {
  console.log(chalk.green('\n🎯 Interactive Natural Language Session Started'));
  console.log(chalk.gray('Type "exit" or "quit" to end the session\n'));

  while (true) {
    try {
      const userInput = await input({
        message: chalk.cyan('What would you like me to do?'),
        validate: (value) => {
          if (value.trim().length === 0) {
            return 'Please enter a command or type "exit" to quit';
          }
          return true;
        },
      });

      const trimmedInput = userInput.trim();

      // Check for exit commands
      if (['exit', 'quit', 'bye', 'done'].includes(trimmedInput.toLowerCase())) {
        console.log(chalk.yellow('👋 Goodbye! Natural language session ended.'));
        break;
      }

      await processSingleCommand(processor, trimmedInput);
      console.log(); // Add spacing between commands
    } catch (error) {
      if (error && typeof error === 'object' && 'isTTYError' in error) {
        // User interrupted with Ctrl+C
        console.log(chalk.yellow('\n👋 Session interrupted. Goodbye!'));
        break;
      }

      logger.error(`Error in interactive session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function processSingleCommand(processor: NaturalLanguageProcessor, input: string): Promise<void> {
  console.log(chalk.blue(`\n🔍 Processing: "${input}"`));

  // Parse the natural language command
  const command = await processor.processCommand(input);

  console.log(
    chalk.gray(`💭 Understood as: ${command.intent} (confidence: ${(command.confidence * 100).toFixed(0)}%)`)
  );

  if (command.confidence < 0.3) {
    console.log(chalk.yellow('⚠️  Low confidence in understanding. Here are some suggestions:'));
    console.log(chalk.gray('• "tag files in ./my-notes"'));
    console.log(chalk.gray('• "show usage statistics"'));
    console.log(chalk.gray('• "configure api key"'));
    console.log(chalk.gray('• "launch dashboard"'));
    return;
  }

  // Execute the command
  const response = await processor.executeCommand(command);

  if (response.success) {
    console.log(chalk.green(`✅ ${response.message}`));

    if (response.action && response.parameters) {
      console.log(chalk.cyan(`🚀 Executing: ${response.action}`));
      console.log(chalk.gray(`Parameters: ${JSON.stringify(response.parameters, null, 2)}`));

      // Here you would actually execute the CLI command
      await executeCliAction(response.action, response.parameters);
    }
  } else {
    console.log(chalk.red(`❌ ${response.message}`));
  }
}

async function executeCliAction(action: string, parameters: Record<string, unknown>): Promise<void> {
  // This would integrate with the actual CLI commands
  // For now, we'll simulate the execution

  switch (action) {
    case 'tag':
      console.log(chalk.green('🏷️  Tagging operation would be executed here'));
      console.log(chalk.gray(`Would run: magus-mark tag ${JSON.stringify(parameters)}`));
      break;

    case 'stats':
      console.log(chalk.green('📊 Statistics would be displayed here'));
      console.log(chalk.gray(`Would run: magus-mark stats ${JSON.stringify(parameters)}`));
      break;

    case 'config':
      console.log(chalk.green('⚙️  Configuration would be updated here'));
      console.log(chalk.gray(`Would run: magus-mark config set ${JSON.stringify(parameters)}`));
      break;

    case 'setup':
      console.log(chalk.green('🔧 Interactive setup would launch here'));
      console.log(chalk.gray('Would run: magus-mark setup'));
      break;

    case 'dashboard':
      console.log(chalk.green('🔥 God Tier dashboard would launch here'));
      console.log(chalk.gray(`Would run: magus-mark dashboard ${JSON.stringify(parameters)}`));
      break;

    case 'test':
      console.log(chalk.green('🧪 Model testing would start here'));
      console.log(chalk.gray(`Would run: magus-mark test ${JSON.stringify(parameters)}`));
      break;

    default:
      console.log(chalk.yellow(`Unknown action: ${action}`));
  }
}

async function promptForCommand(): Promise<string> {
  return await input({
    message: 'What would you like me to do?',
    validate: (value) => {
      if (value.trim().length === 0) {
        return 'Please describe what you want to do';
      }
      return true;
    },
  });
}
