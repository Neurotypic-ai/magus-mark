import { join } from 'path';

import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { readPackage } from 'read-pkg';

import { Database } from '../db/Database';
import { DuckDBAdapter } from '../db/adapter/DuckDBAdapter';
import { ClassRepository } from '../db/repositories/ClassRepository';
import { InterfaceRepository } from '../db/repositories/InterfaceRepository';
import { MethodRepository } from '../db/repositories/MethodRepository';
import { ModuleRepository } from '../db/repositories/ModuleRepository';
import { PackageRepository } from '../db/repositories/PackageRepository';
import { ParameterRepository } from '../db/repositories/ParameterRepository';
import { PropertyRepository } from '../db/repositories/PropertyRepository';
import { PackageParser } from '../parsers/PackageParser';

const program = new Command();

program.name('typescript-viewer').description('TypeScript codebase visualization tool').version('1.0.0');

program
  .command('analyze')
  .description('Analyze a TypeScript project')
  .argument('<dir>', 'Directory containing the TypeScript project')
  .option('-o, --output <file>', 'Output database file', 'typescript-viewer.duckdb')
  .action(async (dir: string, options: { output: string; readOnly?: boolean }) => {
    const spinner = ora('Analyzing TypeScript project...').start();

    try {
      console.log('options.output', options.output);
      // Initialize database and repositories
      const adapter = new DuckDBAdapter(options.output, { allowWrite: true });
      await adapter.init(); // Initialize the adapter first
      const db = new Database(adapter, options.output);
      await db.initializeDatabase();

      const repositories = {
        package: new PackageRepository(adapter),
        module: new ModuleRepository(adapter),
        class: new ClassRepository(adapter),
        interface: new InterfaceRepository(adapter),
        method: new MethodRepository(adapter),
        parameter: new ParameterRepository(adapter),
        property: new PropertyRepository(adapter),
      };

      // Parse package.json
      spinner.text = 'Parsing package.json...';
      const pkgJson = await readPackage({ cwd: dir });

      // Create package parser and parse the project
      spinner.text = 'Analyzing TypeScript files...';
      const packageParser = new PackageParser(dir, pkgJson.name, pkgJson.version);
      const parseResult = await packageParser.parse();

      // Save all entities using repositories
      spinner.text = 'Saving to database...';

      // Save package first
      if (parseResult.package) {
        await repositories.package.create(parseResult.package);
      }

      // Save modules
      for (const module of parseResult.modules) {
        await repositories.module.create(module);
      }

      // Save classes
      for (const cls of parseResult.classes) {
        await repositories.class.create(cls);
      }

      // Save interfaces
      for (const iface of parseResult.interfaces) {
        await repositories.interface.create(iface);
      }

      // Save methods
      for (const method of parseResult.methods) {
        await repositories.method.create(method);
      }

      // Save parameters
      for (const param of parseResult.parameters) {
        await repositories.parameter.create(param);
      }

      // Save properties
      for (const prop of parseResult.properties) {
        await repositories.property.create(prop);
      }

      spinner.succeed(chalk.green('Analysis complete!'));
      console.log();
      console.log(chalk.blue('Statistics:'));
      console.log(chalk.gray('- Files analyzed:'), parseResult.modules.length);
      console.log(chalk.gray('- Modules found:'), parseResult.modules.length);
      console.log(chalk.gray('- Classes found:'), parseResult.classes.length);
      console.log(chalk.gray('- Interfaces found:'), parseResult.interfaces.length);
      console.log(chalk.gray('- Methods found:'), parseResult.methods.length);
      console.log(chalk.gray('- Properties found:'), parseResult.properties.length);
      console.log(chalk.gray('- Parameters found:'), parseResult.parameters.length);

      await db.close();
    } catch (error) {
      spinner.fail(chalk.red('Analysis failed!'));
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('serve')
  .description('Start the visualization server')
  .argument('[file]', 'Database file to visualize', 'typescript-viewer.duckdb')
  .option('-p, --port <number>', 'Port to listen on', '4000')
  .action(async (_file: string, options: { port: string }) => {
    const spinner = ora('Starting visualization server...').start();

    try {
      // Import dynamically to avoid loading React in CLI mode
      const { createServer } = await import('vite');

      const server = await createServer({
        configFile: join(__dirname, '../../vite.config.ts'),
        root: join(__dirname, '../..'),
        server: {
          port: parseInt(options.port, 10),
        },
      });

      await server.listen();

      spinner.succeed(chalk.green('Server started!'));
      console.log();
      console.log(chalk.blue('Visualization available at:'), chalk.cyan(`http://localhost:${options.port}`));
    } catch (error) {
      spinner.fail(chalk.red('Failed to start server!'));
      console.error(error);
      process.exit(1);
    }
  });

export function cli(args: string[] = process.argv): void {
  program.parse(args);
}
