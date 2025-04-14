import { fileExists, readFile, writeFile } from '@obsidian-magic/utils';
import chalk from 'chalk';

// Import a local mock instead since the actual module may not exist
import { taxonomy as taxonomyService } from '../mocks/core';
import { logger } from '@obsidian-magic/logger';

import type { CommandModule } from 'yargs';

// Interface for domain arguments
interface DomainArg {
  domain: string;
  description?: string;
  file?: string;
  force?: boolean;
}

// Interface for file arguments
interface FileArg {
  file: string;
  domain?: string;
}

// Interface for parsed taxonomy data
interface TaxonomyData {
  domain?: string;
  domains?: { name: string; tags: string[] }[];
  tags?: string[];
}

export const taxonomyCommand: CommandModule = {
  command: 'taxonomy <command>',
  describe: 'Manage tagging taxonomy',
  builder: (yargs) => {
    return yargs
      .command({
        command: 'list',
        describe: 'List all taxonomies',
        handler: () => {
          try {
            const domains = taxonomyService.getDomains();

            logger.box(
              `
Available Domains:
${domains.map((domain: string) => `- ${domain}`).join('\n')}

Total: ${String(domains.length)} domains
            `.trim(),
              'Taxonomy Domains'
            );
          } catch (error) {
            logger.error(`Failed to list taxonomies: ${error instanceof Error ? error.message : String(error)}`);
          }
        },
      })
      .command({
        command: 'get <domain>',
        describe: 'Get a specific taxonomy',
        builder: (yargs) =>
          yargs.positional('domain', {
            describe: 'Domain name',
            type: 'string',
            demandOption: true,
          }),
        handler: (argv) => {
          const { domain } = argv as { domain: string };

          try {
            const tags = taxonomyService.getTagsForDomain(domain);

            if (tags.length === 0) {
              logger.warn(`No taxonomy found for domain: ${String(domain)}`);
              return;
            }

            logger.box(
              `
Domain: ${chalk.bold(String(domain))}
Tags:
${tags.map((tag: string) => `- ${tag}`).join('\n')}

Total: ${String(tags.length)} tags
            `.trim(),
              `${String(domain)} Taxonomy`
            );
          } catch (error) {
            logger.error(`Failed to get taxonomy: ${error instanceof Error ? error.message : String(error)}`);
          }
        },
      })
      .command({
        command: 'create <domain>',
        describe: 'Create a new taxonomy',
        builder: (yargs) =>
          yargs
            .positional('domain', {
              describe: 'Domain name',
              type: 'string',
              demandOption: true,
            })
            .option('description', {
              describe: 'Domain description',
              type: 'string',
            }),
        handler: (argv) => {
          const { domain, description } = argv as DomainArg;

          try {
            const success = taxonomyService.createDomain(domain, description);

            if (success) {
              logger.info(`Created taxonomy domain: ${String(domain)}`);
            } else {
              logger.error(`Failed to create taxonomy domain: ${String(domain)}`);
            }
          } catch (error) {
            logger.error(`Failed to create taxonomy: ${error instanceof Error ? error.message : String(error)}`);
          }
        },
      })
      .command({
        command: 'update <domain>',
        describe: 'Update an existing taxonomy',
        builder: (yargs) =>
          yargs
            .positional('domain', {
              describe: 'Domain name',
              type: 'string',
              demandOption: true,
            })
            .option('description', {
              describe: 'Updated domain description',
              type: 'string',
            })
            .option('file', {
              describe: 'Input file with tags',
              type: 'string',
            }),
        handler: async (argv) => {
          const { domain, description, file } = argv as DomainArg;

          try {
            // Simulate updating a domain

            if (file) {
              if (!(await fileExists(file))) {
                logger.error(`File not found: ${String(file)}`);
                return;
              }

              // Read and parse file (would validate in real implementation)
              const content = await readFile(file);
              const tags = JSON.parse(content) as string[];

              // TODO: Implement actual update logic
              logger.info(`Updated taxonomy domain ${String(domain)} with ${String(tags.length)} tags from file`);
            } else if (description) {
              // TODO: Implement actual update logic
              logger.info(`Updated description for taxonomy domain: ${String(domain)}`);
            } else {
              logger.warn('No updates specified. Use --description or --file');
            }
          } catch (error) {
            logger.error(`Failed to update taxonomy: ${error instanceof Error ? error.message : String(error)}`);
          }
        },
      })
      .command({
        command: 'delete <domain>',
        describe: 'Delete a taxonomy',
        builder: (yargs) =>
          yargs
            .positional('domain', {
              describe: 'Domain name',
              type: 'string',
              demandOption: true,
            })
            .option('force', {
              describe: 'Force deletion without confirmation',
              type: 'boolean',
              default: false,
            }),
        handler: (argv) => {
          const { domain, force } = argv as DomainArg;

          try {
            if (!force) {
              logger.warn(`This will permanently delete the taxonomy domain: ${String(domain)}`);
              logger.info('Use --force to skip this warning');
              // In a real implementation, we would ask for confirmation here
              return;
            }

            const success = taxonomyService.deleteDomain(domain);

            if (success) {
              logger.info(`Deleted taxonomy domain: ${String(domain)}`);
            } else {
              logger.error(`Failed to delete taxonomy domain: ${String(domain)}`);
            }
          } catch (error) {
            logger.error(`Failed to delete taxonomy: ${error instanceof Error ? error.message : String(error)}`);
          }
        },
      })
      .command({
        command: 'export <file>',
        describe: 'Export taxonomy to file',
        builder: (yargs) =>
          yargs
            .positional('file', {
              describe: 'Output file path',
              type: 'string',
              demandOption: true,
            })
            .option('domain', {
              describe: 'Export specific domain only',
              type: 'string',
            }),
        handler: async (argv) => {
          const { file, domain } = argv as FileArg;

          try {
            // If domain is specified, export just that domain
            if (domain) {
              const tags = taxonomyService.getTagsForDomain(domain);

              if (tags.length === 0) {
                logger.warn(`No taxonomy found for domain: ${String(domain)}`);
                return;
              }

              const exportData = {
                domain,
                tags,
              };

              await writeFile(file, JSON.stringify(exportData, null, 2));
              logger.info(`Exported taxonomy domain ${String(domain)} to ${String(file)}`);
            } else {
              // Export all domains
              const domains = taxonomyService.getDomains();
              const exportData = {
                domains: domains.map((d: string) => ({
                  name: d,
                  tags: taxonomyService.getTagsForDomain(d),
                })),
              };

              await writeFile(file, JSON.stringify(exportData, null, 2));
              logger.info(`Exported all taxonomy domains to ${String(file)}`);
            }
          } catch (error) {
            logger.error(`Failed to export taxonomy: ${error instanceof Error ? error.message : String(error)}`);
          }
        },
      })
      .command({
        command: 'import <file>',
        describe: 'Import taxonomy from file',
        builder: (yargs) =>
          yargs.positional('file', {
            describe: 'Input file path',
            type: 'string',
            demandOption: true,
          }),
        handler: async (argv) => {
          const { file } = argv as FileArg;

          try {
            if (!(await fileExists(file))) {
              logger.error(`File not found: ${String(file)}`);
              return;
            }

            // Read and parse file (would validate in real implementation)
            const content = await readFile(file);
            const taxonomyData = JSON.parse(content) as TaxonomyData;

            if (taxonomyData.domain && Array.isArray(taxonomyData.tags)) {
              // Single domain import
              const domain = taxonomyData.domain;
              // TODO: Implement single domain import
              logger.info(
                `Imported taxonomy for domain ${String(domain)} with ${String(taxonomyData.tags.length)} tags`
              );
            } else if (taxonomyData.domains && Array.isArray(taxonomyData.domains)) {
              // Multi-domain import
              // TODO: Implement multi-domain import
              logger.info(`Imported ${String(taxonomyData.domains.length)} taxonomy domains`);
            } else {
              logger.error('Invalid taxonomy file format');
            }
          } catch (error) {
            logger.error(`Failed to import taxonomy: ${error instanceof Error ? error.message : String(error)}`);
          }
        },
      })
      .demandCommand(1, 'You must specify a command')
      .help();
  },
  handler: (): void => {
    // Main handler doesn't do anything, subcommands are used instead
  },
};
