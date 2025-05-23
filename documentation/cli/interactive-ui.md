# Interactive UI Features

The Obsidian Magic CLI implements a rich interactive user interface for an engaging and intuitive command-line experience. The system provides real-time feedback, sophisticated progress visualization, and comprehensive cost monitoring during processing.

## Terminal UI Components

The CLI leverages several high-quality libraries to create an interactive terminal UI:

### Libraries and Components

- **@inquirer/prompts**: Modern interactive prompts and menus with enhanced UX
- **ora**: Elegant terminal spinners with success/failure states
- **chalk**: Terminal text styling and coloring for enhanced readability
- **cli-progress**: Customizable progress bars with real-time updates
- **boxen**: Information boxes for statistics, summaries, and cost breakdowns
- **figures**: Unicode symbols for better visual indicators and status display
- **fs-extra**: Enhanced file system operations with better error handling

## Interactive Workflows

The CLI provides an interactive workflow mode:

### Mode Selection

```bash
# Enable interactive mode
tag-conversations tag ./convos/ --mode=interactive
```

### Interactive Processing Flow

The interactive mode follows a guided workflow:

1. **Initial File Scan**: Displays progress during file discovery
2. **Pre-processing Summary**: Shows token counts and cost estimates
3. **Model Selection**: Interactive menu for model choice with cost information
4. **Per-file Confirmation**: Prompt for each file with preview information
5. **Tag Review**: Interactive review and editing of generated tags
6. **Batch Configuration**: Adaptive options based on current batch

```typescript
// Example of interactive file confirmation
const processFilesInteractively = async (files: string[], options: ProcessOptions): Promise<ProcessResult[]> => {
  const results: ProcessResult[] = [];

  for (const file of files) {
    // Display file information
    const fileInfo = await getFileInfo(file);

    console.log(
      boxen(formatFileInfo(fileInfo), {
        padding: 1,
        margin: 1,
        borderColor: 'blue',
        title: path.basename(file),
        titleAlignment: 'center',
      })
    );

    // Prompt for action
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do with this file?',
        choices: [
          { name: 'Process file', value: 'process' },
          { name: 'Skip file', value: 'skip' },
          { name: 'Preview file content', value: 'preview' },
          { name: 'View estimated tokens', value: 'tokens' },
        ],
      },
    ]);

    if (action === 'skip') {
      continue;
    } else if (action === 'preview') {
      await previewFile(file);
      // Ask again after preview
      const { nextAction } = await inquirer.prompt([
        {
          type: 'list',
          name: 'nextAction',
          message: 'Next action:',
          choices: [
            { name: 'Process file', value: 'process' },
            { name: 'Skip file', value: 'skip' },
          ],
        },
      ]);

      if (nextAction === 'skip') {
        continue;
      }
    } else if (action === 'tokens') {
      await showTokenEstimate(file, options.model);
      // Continue to processing after showing tokens
    }

    // Process file with spinner
    const spinner = ora(`Processing ${path.basename(file)}...`).start();

    try {
      const result = await processFile(file, options);
      spinner.succeed(`Processed ${path.basename(file)}`);

      // Tag review and editing
      const editedResult = await reviewTags(result);
      results.push(editedResult);
    } catch (error) {
      spinner.fail(`Failed to process ${path.basename(file)}`);
      console.error(chalk.red('Error:'), error.message);

      // Prompt for retry
      const { retry } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'retry',
          message: 'Would you like to retry this file?',
          default: true,
        },
      ]);

      if (retry) {
        // Decrement counter to retry this file
        i--;
      }
    }
  }

  return results;
};
```

## Tag Review and Editing

The CLI provides interactive tag review and editing:

### Tag Editor

```typescript
const reviewTags = async (result: ProcessResult): Promise<ProcessResult> => {
  console.log(chalk.bold('\nGenerated Tags:'));

  // Display tags with confidence scores
  result.tags.forEach((tag, index) => {
    const confidence = tag.confidence || 1.0;
    const color = confidence > 0.8 ? 'green' : confidence > 0.5 ? 'yellow' : 'red';

    console.log(
      `${index + 1}. ${chalk[color](tag.name)} ` + `(${chalk.dim(`${(confidence * 100).toFixed(1)}% confidence`)})`
    );
  });

  // Prompt for tag editing
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Would you like to edit these tags?',
      choices: [
        { name: 'Keep tags as is', value: 'keep' },
        { name: 'Edit tags', value: 'edit' },
        { name: 'Add new tag', value: 'add' },
        { name: 'Remove tag', value: 'remove' },
      ],
    },
  ]);

  // Handle different actions
  if (action === 'keep') {
    return result;
  } else if (action === 'edit') {
    return await editExistingTags(result);
  } else if (action === 'add') {
    return await addNewTag(result);
  } else if (action === 'remove') {
    return await removeTag(result);
  }

  return result;
};
```

## Progress Visualization

The CLI provides rich progress visualization:

### Progress Bars

```typescript
const processBatchWithProgress = async (files: string[], options: ProcessOptions): Promise<BatchResult> => {
  // Create multi-bar container
  const multibar = new cliProgress.MultiBar(
    {
      clearOnComplete: false,
      hideCursor: true,
      format: '{bar} {percentage}% | {value}/{total} files | ETA: {eta_formatted}',
    },
    cliProgress.Presets.shades_grey
  );

  // Main progress bar
  const mainBar = multibar.create(files.length, 0, {
    task: 'Processing',
  });

  // Token usage bar (updates during processing)
  const tokenBar = multibar.create(100, 0, {
    task: 'Token usage',
  });

  // Create processing queue with concurrency control
  const results: ProcessResult[] = [];
  const errors: ProcessError[] = [];

  const queue = new PQueue({ concurrency: options.concurrency });

  // Add tasks to queue
  for (const file of files) {
    queue.add(async () => {
      try {
        const result = await processFile(file, options);
        results.push(result);

        // Update token usage in the second bar
        const tokenPercentage = calculateTokenPercentage(result, options.maxTokens);
        tokenBar.update(tokenPercentage);
      } catch (error) {
        errors.push({
          file,
          error: error instanceof CliError ? error : new CliError(error.message, 'UNKNOWN_ERROR'),
        });
      } finally {
        mainBar.increment();
      }
    });
  }

  // Wait for all tasks to complete
  await queue.onIdle();
  multibar.stop();

  return {
    results,
    errors,
    success: results.length,
    failed: errors.length,
    total: files.length,
  };
};
```

### Spinners

```typescript
const verifyApiKeyWithSpinner = async (apiKey: string): Promise<boolean> => {
  const spinner = ora('Verifying API key...').start();

  try {
    await verifyApiKey(apiKey);
    spinner.succeed('API key verified successfully');
    return true;
  } catch (error) {
    spinner.fail(`API key verification failed: ${error.message}`);
    return false;
  }
};
```

## Interactive Configuration

The CLI provides interactive configuration management:

### Configuration Wizard

```typescript
const runConfigWizard = async (): Promise<void> => {
  console.log(chalk.bold('Configuration Wizard'));
  console.log("Let's set up your Obsidian Magic CLI configuration.\n");

  // API key setup
  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter your OpenAI API key:',
      validate: (input) => (input.length > 0 ? true : 'API key is required'),
    },
  ]);

  // Verify API key
  const isValid = await verifyApiKeyWithSpinner(apiKey);

  if (!isValid) {
    console.log(chalk.red('Invalid API key. Please try again.'));
    return;
  }

  // Default model selection
  const { defaultModel } = await inquirer.prompt([
    {
      type: 'list',
      name: 'defaultModel',
      message: 'Select your default model:',
      choices: [
        { name: 'GPT-3.5 Turbo (Faster, lower cost)', value: 'gpt-3.5-turbo' },
        { name: 'GPT-4 (Higher accuracy, higher cost)', value: 'gpt-4' },
        { name: 'GPT-4 Turbo (Best balance of speed/accuracy)', value: 'gpt-4-turbo-preview' },
      ],
    },
  ]);

  // Default behavior preferences
  const { defaultMode, maxConcurrency, backupFiles } = await inquirer.prompt([
    {
      type: 'list',
      name: 'defaultMode',
      message: 'Select default processing mode:',
      choices: [
        { name: 'Auto (Process all files automatically)', value: 'auto' },
        { name: 'Interactive (Confirm each file)', value: 'interactive' },
        { name: 'Differential (Only process files missing tags)', value: 'differential' },
      ],
    },
    {
      type: 'number',
      name: 'maxConcurrency',
      message: 'Maximum concurrent operations:',
      default: 3,
      validate: (input) => (input > 0 ? true : 'Must be greater than 0'),
    },
    {
      type: 'confirm',
      name: 'backupFiles',
      message: 'Create backups before modifying files?',
      default: true,
    },
  ]);

  // Save configuration
  await saveConfig({
    apiKey,
    defaultModel,
    defaultMode,
    maxConcurrency,
    backupFiles,
  });

  console.log(chalk.green('\nConfiguration saved successfully!'));
  console.log('You can modify these settings anytime using:');
  console.log(chalk.cyan('tag-conversations config set <key> <value>'));
};
```

## Rich Data Display

The CLI implements visually appealing data displays:

### Statistics Display

```typescript
const displayProcessingSummary = (batchResult: BatchResult, options: ProcessOptions): void => {
  // Calculate statistics
  const totalTokens = batchResult.results.reduce((sum, result) => sum + (result.tokenUsage?.total || 0), 0);

  const totalCost = batchResult.results.reduce((sum, result) => sum + (result.cost || 0), 0);

  const avgTokensPerFile = totalTokens / batchResult.results.length || 0;

  // Generate summary box
  const summary = [
    `${chalk.bold('Processing Summary')}`,
    ``,
    `${chalk.green('✓')} Files Processed: ${batchResult.success} of ${batchResult.total}`,
    `${chalk.red('✗')} Files Failed: ${batchResult.failed}`,
    ``,
    `${chalk.bold('Resource Usage')}`,
    `${figures.triangleRight} Total Tokens: ${totalTokens.toLocaleString()}`,
    `${figures.triangleRight} Avg. Tokens/File: ${avgTokensPerFile.toFixed(1)}`,
    `${figures.triangleRight} Total Cost: $${totalCost.toFixed(4)}`,
    ``,
    `${chalk.bold('Model')}`,
    `${figures.triangleRight} ${options.model}`,
  ];

  console.log(
    boxen(summary.join('\n'), {
      padding: 1,
      margin: 1,
      borderColor: 'green',
      title: 'Tagging Complete',
      titleAlignment: 'center',
    })
  );

  // Display tag distribution if requested
  if (options.showStats) {
    displayTagDistribution(batchResult.results);
  }
};
```

### Color-Coded Information

```typescript
const formatModelComparison = (models: ModelComparisonResult[]): string => {
  let output = '';

  models.forEach((model) => {
    // Color-code based on performance
    const nameColor = model.recommended ? chalk.green : chalk.white;
    const costColor = model.costRank === 1 ? chalk.green : chalk.yellow;
    const accuracyColor = model.accuracyRank === 1 ? chalk.green : chalk.yellow;

    output += `${nameColor.bold(model.name)}\n`;
    output += `  Accuracy: ${accuracyColor(`${(model.accuracy * 100).toFixed(1)}%`)}\n`;
    output += `  Cost: ${costColor(`$${model.costPer100Files.toFixed(2)} per 100 files`)}\n`;
    output += `  Speed: ${model.avgProcessingTime.toFixed(2)}s per file\n`;

    if (model.recommended) {
      output += `  ${chalk.green.bold('✓ Recommended')}\n`;
    }

    output += '\n';
  });

  return output;
};
```

## Customizable UI Experience

The CLI allows customization of the UI experience:

### Output Formats

```bash
# Pretty format (default)
tag-conversations tag ./convos/ --format=pretty

# JSON output (for programmatic consumption)
tag-conversations tag ./convos/ --format=json

# Minimal output (for scripting)
tag-conversations tag ./convos/ --format=minimal

# Silent mode (no output except errors)
tag-conversations tag ./convos/ --format=silent
```

### Verbosity Levels

```bash
# Standard output
tag-conversations tag ./convos/

# Verbose output
tag-conversations tag ./convos/ --verbose

# Debug output
tag-conversations tag ./convos/ --debug
```

## Keyboard Controls

The CLI implements keyboard shortcuts for interactive sessions:

### Key Bindings

```typescript
const configureKeyBindings = (state: SessionState): void => {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', (key) => {
    // Ctrl+C - Exit
    if (key === '\u0003') {
      handleExitRequest(state);
      return;
    }

    // Space - Pause/Resume
    if (key === ' ') {
      if (state.status === 'running') {
        pauseProcessing(state);
        console.log(chalk.yellow('Processing paused. Press space to resume.'));
      } else if (state.status === 'paused') {
        resumeProcessing(state);
        console.log(chalk.green('Processing resumed.'));
      }
      return;
    }

    // S - Show status
    if (key.toLowerCase() === 's') {
      displaySessionStatus(state);
      return;
    }

    // H - Show help
    if (key.toLowerCase() === 'h') {
      displayKeyboardShortcuts();
      return;
    }
  });
};

const displayKeyboardShortcuts = (): void => {
  console.log(
    boxen(
      `${chalk.bold('Keyboard Shortcuts')}\n\n` +
        `${chalk.bold('Space')} - Pause/Resume processing\n` +
        `${chalk.bold('S')} - Show current status\n` +
        `${chalk.bold('H')} - Show this help\n` +
        `${chalk.bold('Ctrl+C')} - Exit (with confirmation)`,
      {
        padding: 1,
        margin: 1,
        borderColor: 'blue',
        title: 'Help',
        titleAlignment: 'center',
      }
    )
  );
};
```

## Discoverability Features

The CLI implements features to enhance discoverability:

### Dynamic Help

```typescript
const showContextualHelp = (context: string, options: HelpOptions = {}): void => {
  let helpContent = '';

  switch (context) {
    case 'token-optimization':
      helpContent = formatTokenOptimizationHelp(options);
      break;
    case 'model-selection':
      helpContent = formatModelSelectionHelp(options);
      break;
    case 'tag-editing':
      helpContent = formatTagEditingHelp(options);
      break;
    default:
      helpContent = formatGeneralHelp();
      break;
  }

  console.log(
    boxen(helpContent, {
      padding: 1,
      margin: 1,
      borderColor: 'blue',
      title: 'Help',
      titleAlignment: 'center',
    })
  );
};
```

### Tips and Suggestions

```typescript
const showProTips = (context: string, usage: UsageStatistics): void => {
  let tip = '';

  // Select tip based on context and usage patterns
  if (context === 'cost-management' && usage.avgTokensPerFile > 2000) {
    tip =
      `Pro Tip: You're using ${usage.avgTokensPerFile.toFixed(0)} tokens per file on average. ` +
      `Try enabling token optimization with --optimize-tokens to reduce costs.`;
  } else if (context === 'processing-speed' && usage.filesProcessed > 50) {
    tip =
      `Pro Tip: For large batches like this (${usage.filesProcessed} files), ` +
      `try increasing concurrency with --concurrency=5 to speed up processing.`;
  } else if (context === 'tag-quality' && usage.avgTagsPerFile < 3) {
    tip =
      `Pro Tip: Your files are receiving only ${usage.avgTagsPerFile.toFixed(1)} tags on average. ` +
      `Consider using --model=gpt-4 for more comprehensive tagging.`;
  } else {
    // General tips
    const tips = [
      `Pro Tip: Use --dry-run to estimate costs before processing.`,
      `Pro Tip: Create configuration profiles for different use cases with 'config create-profile'.`,
      `Pro Tip: Press H during processing to see keyboard shortcuts.`,
      `Pro Tip: Use --mode=differential to only process files missing tags.`,
    ];

    // Select random tip
    tip = tips[Math.floor(Math.random() * tips.length)];
  }

  console.log(chalk.blue(figures.info), chalk.italic(tip));
};
```

## Integration with System UI

The CLI integrates with system notifications for long-running operations:

### Desktop Notifications

```typescript
const sendNotification = async (title: string, message: string, options: NotificationOptions = {}): Promise<void> => {
  // Skip if notifications are disabled
  if (config.get('disableNotifications')) return;

  try {
    // Use node-notifier if available
    const notifier = await import('node-notifier').catch(() => null);

    if (notifier) {
      notifier.notify({
        title,
        message,
        icon: options.icon || path.join(__dirname, '../assets/icon.png'),
        sound: options.sound !== false,
        wait: options.wait || false,
      });
    }
  } catch (error) {
    // Silently fail if notifications aren't supported
    logDebug('Failed to send notification', { error });
  }
};

// Usage example
const notifyProcessingComplete = (batchResult: BatchResult): void => {
  sendNotification(
    'Processing Complete',
    `Successfully processed ${batchResult.success} files with ${batchResult.failed} failures.`,
    { sound: true }
  );
};
```

The interactive UI features create an engaging and efficient command-line experience, balancing ease of use with
powerful functionality for both beginners and advanced users.
