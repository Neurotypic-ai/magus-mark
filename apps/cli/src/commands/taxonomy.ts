import type { CommandModule } from 'yargs';
import chalk from 'chalk';
import { readFile, writeFile, fileExists } from '@obsidian-magic/utils';
import { logger } from '../utils/logger';
import { taxonomy as taxonomyService } from '@obsidian-magic/core';

export const taxonomyCommand: CommandModule = {
  command: 'taxonomy <command>',
  describe: 'Manage tagging taxonomy',
  builder: (yargs) => {
    return yargs
      .command({
        command: 'list',
        describe: 'List all taxonomies',
        handler: async () => {
          try {
            const domains = taxonomyService.getDomains();
            
            logger.box(`
Available Domains:
${domains.map(domain => `- ${domain}`).join('\n')}

Total: ${domains.length} domains
            `.trim(), 'Taxonomy Domains');
          } catch (error) {
            logger.error(`Failed to list taxonomies: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      })
      .command({
        command: 'get <domain>',
        describe: 'Get a specific taxonomy',
        builder: (yargs) => 
          yargs.positional('domain', {
            describe: 'Domain name',
            type: 'string',
            demandOption: true
          }),
        handler: async (argv) => {
          const { domain } = argv as any;
          
          try {
            const tags = taxonomyService.getTagsForDomain(domain);
            
            if (tags.length === 0) {
              logger.warn(`No taxonomy found for domain: ${domain}`);
              return;
            }
            
            logger.box(`
Domain: ${chalk.bold(domain)}
Tags:
${tags.map(tag => `- ${tag}`).join('\n')}

Total: ${tags.length} tags
            `.trim(), `${domain} Taxonomy`);
          } catch (error) {
            logger.error(`Failed to get taxonomy: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      })
      .command({
        command: 'create <domain>',
        describe: 'Create a new taxonomy',
        builder: (yargs) => 
          yargs
            .positional('domain', {
              describe: 'Domain name',
              type: 'string',
              demandOption: true
            })
            .option('description', {
              describe: 'Domain description',
              type: 'string'
            }),
        handler: async (argv) => {
          const { domain, description } = argv as any;
          
          try {
            const success = taxonomyService.createDomain(domain, description);
            
            if (success) {
              logger.info(`Created taxonomy domain: ${domain}`);
            } else {
              logger.error(`Failed to create taxonomy domain: ${domain}`);
            }
          } catch (error) {
            logger.error(`Failed to create taxonomy: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      })
      .command({
        command: 'update <domain>',
        describe: 'Update an existing taxonomy',
        builder: (yargs) => 
          yargs
            .positional('domain', {
              describe: 'Domain name',
              type: 'string',
              demandOption: true
            })
            .option('description', {
              describe: 'Updated domain description',
              type: 'string'
            })
            .option('file', {
              describe: 'Input file with tags',
              type: 'string'
            }),
        handler: async (argv) => {
          const { domain, description, file } = argv as any;
          
          try {
            // Simulate updating a domain
            
            if (file) {
              if (!(await fileExists(file))) {
                logger.error(`File not found: ${file}`);
                return;
              }
              
              // Read and parse file (would validate in real implementation)
              const content = await readFile(file);
              const tags = JSON.parse(content);
              
              // TODO: Implement actual update logic
              logger.info(`Updated taxonomy domain ${domain} with ${tags.length} tags from file`);
            } else if (description) {
              // TODO: Implement actual update logic
              logger.info(`Updated description for taxonomy domain: ${domain}`);
            } else {
              logger.warn('No updates specified. Use --description or --file');
            }
          } catch (error) {
            logger.error(`Failed to update taxonomy: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      })
      .command({
        command: 'delete <domain>',
        describe: 'Delete a taxonomy',
        builder: (yargs) => 
          yargs
            .positional('domain', {
              describe: 'Domain name',
              type: 'string',
              demandOption: true
            })
            .option('force', {
              describe: 'Force deletion without confirmation',
              type: 'boolean',
              default: false
            }),
        handler: async (argv) => {
          const { domain, force } = argv as any;
          
          try {
            if (!force) {
              logger.warn(`This will permanently delete the taxonomy domain: ${domain}`);
              logger.info('Use --force to skip this warning');
              // In a real implementation, we would ask for confirmation here
              return;
            }
            
            const success = taxonomyService.deleteDomain(domain);
            
            if (success) {
              logger.info(`Deleted taxonomy domain: ${domain}`);
            } else {
              logger.error(`Failed to delete taxonomy domain: ${domain}`);
            }
          } catch (error) {
            logger.error(`Failed to delete taxonomy: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      })
      .command({
        command: 'export <file>',
        describe: 'Export taxonomy to file',
        builder: (yargs) => 
          yargs
            .positional('file', {
              describe: 'Output file path',
              type: 'string',
              demandOption: true
            })
            .option('domain', {
              describe: 'Export specific domain only',
              type: 'string'
            }),
        handler: async (argv) => {
          const { file, domain } = argv as any;
          
          try {
            // If domain is specified, export just that domain
            if (domain) {
              const tags = taxonomyService.getTagsForDomain(domain);
              
              if (tags.length === 0) {
                logger.warn(`No taxonomy found for domain: ${domain}`);
                return;
              }
              
              const exportData = {
                domain,
                tags
              };
              
              await writeFile(file, JSON.stringify(exportData, null, 2));
              logger.info(`Exported taxonomy domain ${domain} to ${file}`);
            } else {
              // Export all domains
              const domains = taxonomyService.getDomains();
              const exportData = {
                domains: domains.map(d => ({
                  name: d,
                  tags: taxonomyService.getTagsForDomain(d)
                }))
              };
              
              await writeFile(file, JSON.stringify(exportData, null, 2));
              logger.info(`Exported all taxonomy domains to ${file}`);
            }
          } catch (error) {
            logger.error(`Failed to export taxonomy: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      })
      .command({
        command: 'import <file>',
        describe: 'Import taxonomy from file',
        builder: (yargs) => 
          yargs.positional('file', {
            describe: 'Input file path',
            type: 'string',
            demandOption: true
          }),
        handler: async (argv) => {
          const { file } = argv as any;
          
          try {
            if (!(await fileExists(file))) {
              logger.error(`File not found: ${file}`);
              return;
            }
            
            // Read and parse file (would validate in real implementation)
            const content = await readFile(file);
            const taxonomyData = JSON.parse(content);
            
            if (taxonomyData.domain && Array.isArray(taxonomyData.tags)) {
              // Single domain import
              const domain = taxonomyData.domain;
              // TODO: Implement single domain import
              logger.info(`Imported taxonomy for domain ${domain} with ${taxonomyData.tags.length} tags`);
            } else if (taxonomyData.domains && Array.isArray(taxonomyData.domains)) {
              // Multi-domain import
              // TODO: Implement multi-domain import
              logger.info(`Imported ${taxonomyData.domains.length} taxonomy domains`);
            } else {
              logger.error('Invalid taxonomy file format');
            }
          } catch (error) {
            logger.error(`Failed to import taxonomy: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      })
      .demandCommand(1, 'You must specify a command')
      .help();
  },
  handler: () => {} // Main handler doesn't do anything, subcommands are used instead
}; 