import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { readPackage } from 'read-pkg';

import { Database } from '../db/Database';
import { DuckDBAdapter } from '../db/adapter/DuckDBAdapter';
import { ClassRepository } from '../db/repositories/ClassRepository';
import { ExportRepository } from '../db/repositories/ExportRepository';
import { FunctionRepository } from '../db/repositories/FunctionRepository';
import { ImportRepository } from '../db/repositories/ImportRepository';
import { ImportSpecifierRepository } from '../db/repositories/ImportSpecifierRepository';
import { InterfaceRepository } from '../db/repositories/InterfaceRepository';
import { MethodRepository } from '../db/repositories/MethodRepository';
import { ModuleRepository } from '../db/repositories/ModuleRepository';
import { PackageRepository } from '../db/repositories/PackageRepository';
import { ParameterRepository } from '../db/repositories/ParameterRepository';
import { PropertyRepository } from '../db/repositories/PropertyRepository';
import { PackageParser } from '../parsers/PackageParser';
import { ClassImplementsRepository } from '../db/repositories/ClassImplementsRepository';
import { InterfaceExtendsRepository } from '../db/repositories/InterfaceExtendsRepository';
import { generateClassImplementsUUID, generateInterfaceExtendsUUID } from '../utils/uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program.name('typescript-viewer').description('TypeScript codebase visualization tool').version('1.0.0');

program
  .command('analyze')
  .description('Analyze a TypeScript project')
  .argument('<dir>', 'Directory containing the TypeScript project')
  .option('-o, --output <file>', 'Output database file', 'typescript-viewer.duckdb')
  .option('--no-reset', 'Do not reset the database before analyzing (append mode)')
  .action(async (dir: string, options: { output: string; reset?: boolean; readOnly?: boolean }) => {
    const spinner = ora('Analyzing TypeScript project...').start();

    try {
      console.log('options.output', options.output);
      // Initialize database and repositories
      const adapter = new DuckDBAdapter(options.output, { allowWrite: true });
      const db = new Database(adapter, options.output);
      // Default to reset=true for idempotent behavior, unless --no-reset is specified
      const shouldReset = options.reset !== false;
      console.log(
        'reset mode:',
        shouldReset ? 'RESET (will delete existing data)' : 'APPEND (will keep existing data)'
      );
      await db.initializeDatabase(shouldReset);

      const repositories = {
        package: new PackageRepository(adapter),
        module: new ModuleRepository(adapter),
        class: new ClassRepository(adapter),
        export: new ExportRepository(adapter),
        interface: new InterfaceRepository(adapter),
        function: new FunctionRepository(adapter),
        import: new ImportRepository(adapter),
        importSpecifier: new ImportSpecifierRepository(adapter),
        method: new MethodRepository(adapter),
        parameter: new ParameterRepository(adapter),
        property: new PropertyRepository(adapter),
        classImplements: new ClassImplementsRepository(adapter),
        interfaceExtends: new InterfaceExtendsRepository(adapter),
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

      // Save functions
      for (const func of parseResult.functions) {
        await repositories.function.create(func);
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

      // Save imports with module context
      if (parseResult.importsWithModules) {
        for (const { import: imp, moduleId } of parseResult.importsWithModules) {
          const importDTO = {
            id: imp.uuid,
            package_id: parseResult.package?.id ?? '',
            module_id: moduleId,
            source: imp.fullPath,
          };
          await repositories.import.create(importDTO);
        }
      }

      // Save exports
      for (const exp of parseResult.exports) {
        const exportDTO = {
          id: exp.uuid,
          package_id: parseResult.package?.id ?? '',
          module_id: exp.module,
          name: exp.name,
          is_default: exp.isDefault,
        };
        await repositories.export.create(exportDTO);
      }

      // Save import specifiers
      if (parseResult.importSpecifiers && parseResult.importSpecifiers.length > 0) {
        await repositories.importSpecifier.batchCreate(parseResult.importSpecifiers);
      }

      // Persist implements/extends relationships after all classes and interfaces are saved
      const ifaceByName = new Map<string, string>();
      for (const iface of parseResult.interfaces) {
        ifaceByName.set(iface.name, iface.id);
      }

      if (parseResult.classImplements && parseResult.classImplements.length > 0) {
        for (const rel of parseResult.classImplements) {
          for (const ifaceName of rel.interfaceNames) {
            const ifaceId = ifaceByName.get(ifaceName);
            if (!ifaceId) continue; // skip unresolved
            const id = generateClassImplementsUUID(rel.classId, ifaceId);
            try {
              await repositories.classImplements.create({ id, class_id: rel.classId, interface_id: ifaceId });
            } catch {
              // ignore duplicates or failures to keep analysis going
            }
          }
        }
      }

      if (parseResult.interfaceExtends && parseResult.interfaceExtends.length > 0) {
        for (const rel of parseResult.interfaceExtends) {
          for (const extName of rel.extendedNames) {
            const extId = ifaceByName.get(extName);
            if (!extId) continue;
            const id = generateInterfaceExtendsUUID(rel.interfaceId, extId);
            try {
              await repositories.interfaceExtends.create({ id, interface_id: rel.interfaceId, extended_id: extId });
            } catch {
              // ignore duplicates or failures
            }
          }
        }
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
      console.log(chalk.gray('- Imports found:'), parseResult.importsWithModules?.length ?? 0);
      console.log(chalk.gray('- Import specifiers found:'), parseResult.importSpecifiers?.length ?? 0);
      console.log(chalk.gray('- Exports found:'), parseResult.exports.length);

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
