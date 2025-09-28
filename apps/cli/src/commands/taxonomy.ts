import * as os from 'node:os';
import * as path from 'node:path';

import { TaxonomyManager } from '@magus-mark/core/tagging/TaxonomyManager';
import { Logger } from '@magus-mark/core/utils/Logger';
import chalk from 'chalk';

import { loadTaxonomy, saveTaxonomy } from '../utils/config';

import type { CommandModule } from 'yargs';
import type { Taxonomy } from '@magus-mark/core/models/Taxonomy';

const logger = Logger.getInstance('taxonomy');

/**
 * Get taxonomy file path from CLI args or default
 */
function getTaxonomyPath(argv: { taxonomy?: string }): string {
  return argv.taxonomy ?? path.join(os.homedir(), '.config', 'magus-mark', 'taxonomy.json');
}

/**
 * Load taxonomy manager from file
 */
async function loadTaxonomyManager(taxonomyPath: string): Promise<TaxonomyManager> {
  const taxonomyData = await loadTaxonomy(taxonomyPath);
  return new TaxonomyManager(taxonomyData as Partial<Taxonomy> | undefined);
}

/**
 * Save taxonomy manager to file
 */
async function saveTaxonomyManager(taxonomyManager: TaxonomyManager, taxonomyPath: string): Promise<void> {
  const taxonomyData = taxonomyManager.exportTaxonomy();
  await saveTaxonomy(taxonomyData, taxonomyPath);
}

export const taxonomyCommand: CommandModule = {
  command: 'taxonomy',
  describe: 'Manage taxonomies',
  builder: (yargs) => {
    return yargs
      .command({
        command: 'list',
        describe: 'List all taxonomies',
        handler: async (argv) => {
          try {
            const taxonomyPath = getTaxonomyPath(argv as { taxonomy?: string });
            const taxonomyManager = await loadTaxonomyManager(taxonomyPath);
            const taxonomy = taxonomyManager.getTaxonomy();

            console.log(chalk.green(`\nTaxonomy from: ${taxonomyPath}`));
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
        handler: async (argv) => {
          try {
            const { domain } = argv as { domain: string; taxonomy?: string };
            const taxonomyPath = getTaxonomyPath(argv as { taxonomy?: string });
            const taxonomyManager = await loadTaxonomyManager(taxonomyPath);

            if (taxonomyManager.hasDomain(domain)) {
              logger.warn(`Domain '${domain}' already exists`);
              return;
            }

            taxonomyManager.addDomain(domain);
            await saveTaxonomyManager(taxonomyManager, taxonomyPath);
            logger.success(`Added domain '${domain}' and saved to ${taxonomyPath}`);
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
        handler: async (argv) => {
          try {
            const { domain, subdomain } = argv as { domain: string; subdomain: string; taxonomy?: string };
            const taxonomyPath = getTaxonomyPath(argv as { taxonomy?: string });
            const taxonomyManager = await loadTaxonomyManager(taxonomyPath);

            if (!taxonomyManager.hasDomain(domain)) {
              logger.error(`Domain '${domain}' does not exist`);
              process.exit(1);
            }

            if (taxonomyManager.hasSubdomain(domain, subdomain)) {
              logger.warn(`Subdomain '${subdomain}' already exists in domain '${domain}'`);
              return;
            }

            taxonomyManager.addSubdomain(domain, subdomain);
            await saveTaxonomyManager(taxonomyManager, taxonomyPath);
            logger.success(`Added subdomain '${subdomain}' to domain '${domain}' and saved to ${taxonomyPath}`);
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
        handler: async (argv) => {
          try {
            const { tag } = argv as { tag: string; taxonomy?: string };
            const taxonomyPath = getTaxonomyPath(argv as { taxonomy?: string });
            const taxonomyManager = await loadTaxonomyManager(taxonomyPath);

            taxonomyManager.addContextualTag(tag);
            await saveTaxonomyManager(taxonomyManager, taxonomyPath);
            logger.success(`Added contextual tag '${tag}' and saved to ${taxonomyPath}`);
          } catch (error) {
            logger.error(`Failed to add contextual tag: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
          }
        },
      });
  },
  handler: () => {
    console.log(chalk.bold.cyan('🏷️  Magus Mark Taxonomy Manager'));
    console.log();
    console.log('Manage your conversation taxonomy with these commands:');
    console.log();
    console.log(chalk.yellow('Available Commands:'));
    console.log('  list                           📋 List all taxonomy categories');
    console.log('  add-domain <domain>            ➕ Add a new domain');
    console.log('  add-subdomain <domain> <sub>   🔗 Add subdomain to domain');
    console.log('  add-tag <tag>                  🏷️  Add contextual tag');
    console.log();
    console.log(chalk.yellow('Examples:'));
    console.log('  magus-mark taxonomy list');
    console.log('  magus-mark taxonomy add-domain "machine-learning"');
    console.log('  magus-mark taxonomy add-subdomain "ai" "transformers"');
    console.log('  magus-mark taxonomy add-tag "experimental"');
    console.log();
    console.log(chalk.gray('Use --taxonomy <file> to specify a custom taxonomy file'));
  },
};
