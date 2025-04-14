import chalk from 'chalk';

import { initializeCore } from '@obsidian-magic/core';
import { Logger } from '@obsidian-magic/core/Logger';

import type { CommandModule } from 'yargs';

// Initialize logger
const logger = Logger.getInstance();

export const taxonomyCommand: CommandModule = {
  command: 'taxonomy',
  describe: 'Manage taxonomies',
  builder: (yargs) => {
    return yargs
      .command({
        command: 'list',
        describe: 'List all taxonomies',
        handler: () => {
          try {
            const coreServices = initializeCore({});
            const { taxonomyManager } = coreServices;
            const taxonomy = taxonomyManager.getTaxonomy();

            console.log(chalk.green('\nAvailable domains:'));
            taxonomy.domains.forEach((domain: string) => {
              console.log(`- ${domain}`);
              const subdomains = taxonomyManager.getSubdomains(domain);
              if (subdomains.length > 0) {
                subdomains.forEach((subdomain: string) => {
                  console.log(`  └─ ${subdomain}`);
                });
              }
            });

            console.log(chalk.green('\nContextual tags:'));
            taxonomy.contextualTags.forEach((tag: string) => {
              console.log(`- ${tag}`);
            });

            console.log(chalk.green('\nLife areas:'));
            taxonomy.lifeAreas.forEach((area: string) => {
              console.log(`- ${area}`);
            });

            console.log(chalk.green('\nConversation types:'));
            taxonomy.conversationTypes.forEach((type: string) => {
              console.log(`- ${type}`);
            });
          } catch (error) {
            logger.error(`Failed to list taxonomies: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
          }
        },
      })
      .command({
        command: 'add-domain <domain>',
        describe: 'Add a new domain',
        builder: (yargs) => {
          return yargs
            .positional('domain', {
              type: 'string',
              describe: 'Domain name',
              demandOption: true,
            })
            .option('description', {
              type: 'string',
              describe: 'Domain description',
            });
        },
        handler: (argv) => {
          try {
            const coreServices = initializeCore({});
            const { taxonomyManager } = coreServices;
            const { domain } = argv as { domain: string };

            if (taxonomyManager.hasDomain(domain)) {
              logger.warn(`Domain '${domain}' already exists`);
              return;
            }

            taxonomyManager.addDomain(domain);
            logger.success(`Added domain '${domain}'`);
          } catch (error) {
            logger.error(`Failed to add domain: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
          }
        },
      })
      .command({
        command: 'add-subdomain <domain> <subdomain>',
        describe: 'Add a new subdomain to a domain',
        builder: (yargs) => {
          return yargs
            .positional('domain', {
              type: 'string',
              describe: 'Parent domain name',
              demandOption: true,
            })
            .positional('subdomain', {
              type: 'string',
              describe: 'Subdomain name',
              demandOption: true,
            });
        },
        handler: (argv) => {
          try {
            const coreServices = initializeCore({});
            const { taxonomyManager } = coreServices;
            const { domain, subdomain } = argv as { domain: string; subdomain: string };

            if (!taxonomyManager.hasDomain(domain)) {
              logger.error(`Domain '${domain}' does not exist`);
              process.exit(1);
            }

            if (taxonomyManager.hasSubdomain(domain, subdomain)) {
              logger.warn(`Subdomain '${subdomain}' already exists in domain '${domain}'`);
              return;
            }

            taxonomyManager.addSubdomain(domain, subdomain);
            logger.success(`Added subdomain '${subdomain}' to domain '${domain}'`);
          } catch (error) {
            logger.error(`Failed to add subdomain: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
          }
        },
      })
      .command({
        command: 'add-tag <tag>',
        describe: 'Add a new contextual tag',
        builder: (yargs) => {
          return yargs.positional('tag', {
            type: 'string',
            describe: 'Tag name',
            demandOption: true,
          });
        },
        handler: (argv) => {
          try {
            const coreServices = initializeCore({});
            const { taxonomyManager } = coreServices;
            const { tag } = argv as { tag: string };

            taxonomyManager.addContextualTag(tag);
            logger.success(`Added contextual tag '${tag}'`);
          } catch (error) {
            logger.error(`Failed to add contextual tag: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
          }
        },
      });
  },
  handler: () => {
    console.log('Taxonomy command');
  }, // Default handler for the taxonomy command
};
