import type { CommandModule } from 'yargs';
import chalk from 'chalk';
import fs from 'fs-extra';
import { logger } from '../utils/logger.js';

export const taxonomyCommand: CommandModule = {
  command: 'taxonomy <command>',
  describe: 'Manage taxonomy',
  builder: (yargs) => {
    return yargs
      .command({
        command: 'list [domain]',
        describe: 'List domains or tags',
        builder: (yargs) => 
          yargs.positional('domain', {
            describe: 'Domain to list tags for',
            type: 'string'
          }),
        handler: (argv) => {
          const { domain } = argv as any;
          
          // Mock taxonomy data
          const mockTaxonomy = {
            domains: {
              'technology': {
                description: 'Technology-related topics',
                tags: ['javascript', 'react', 'nodejs', 'typescript', 'python']
              },
              'design': {
                description: 'Design-related topics',
                tags: ['ui', 'ux', 'graphics', 'figma', 'sketch']
              },
              'business': {
                description: 'Business-related topics',
                tags: ['startups', 'marketing', 'sales', 'strategy', 'finance']
              }
            }
          };
          
          if (domain) {
            // Show tags for specific domain
            const domainData = mockTaxonomy.domains[domain as keyof typeof mockTaxonomy.domains];
            if (domainData) {
              logger.box(`
Domain: ${domain}
Description: ${domainData.description}

Tags:
${domainData.tags.map(tag => `- ${tag}`).join('\n')}
              `.trim(), `${domain} Domain`);
            } else {
              logger.warn(`Domain not found: ${domain}`);
            }
          } else {
            // Show all domains
            const domains = Object.keys(mockTaxonomy.domains);
            logger.box(`
Available Domains:
${domains.map(d => {
  const domain = mockTaxonomy.domains[d as keyof typeof mockTaxonomy.domains];
  return `- ${d}: ${domain.description} (${domain.tags.length} tags)`;
}).join('\n')}
            `.trim(), 'Taxonomy Domains');
          }
        }
      })
      .command({
        command: 'add domain <name>',
        describe: 'Add new domain',
        builder: (yargs) => 
          yargs
            .positional('name', {
              describe: 'Domain name',
              type: 'string',
              demandOption: true
            })
            .option('description', {
              describe: 'Domain description',
              type: 'string',
              demandOption: true
            }),
        handler: (argv) => {
          const { name, description } = argv as any;
          logger.info(`Added domain '${name}' with description: ${description}`);
          // In a real implementation, this would save to a configuration file
        }
      })
      .command({
        command: 'add tag <domain> <tag>',
        describe: 'Add tag to domain',
        builder: (yargs) => 
          yargs
            .positional('domain', {
              describe: 'Domain name',
              type: 'string',
              demandOption: true
            })
            .positional('tag', {
              describe: 'Tag name',
              type: 'string',
              demandOption: true
            })
            .option('description', {
              describe: 'Tag description',
              type: 'string'
            }),
        handler: (argv) => {
          const { domain, tag, description } = argv as any;
          logger.info(`Added tag '${tag}' to domain '${domain}'${description ? ` with description: ${description}` : ''}`);
          // In a real implementation, this would save to a configuration file
        }
      })
      .command({
        command: 'import <file>',
        describe: 'Import taxonomy from file',
        builder: (yargs) => 
          yargs.positional('file', {
            describe: 'Path to taxonomy file',
            type: 'string',
            demandOption: true
          }),
        handler: async (argv) => {
          const { file } = argv as any;
          
          if (!fs.existsSync(file as string)) {
            logger.error(`File not found: ${file}`);
            return;
          }
          
          logger.info(`Importing taxonomy from ${file}...`);
          // In a real implementation, this would parse and save the taxonomy
          await new Promise(resolve => setTimeout(resolve, 1000));
          logger.info(chalk.green('Taxonomy imported successfully!'));
        }
      })
      .command({
        command: 'export',
        describe: 'Export taxonomy to file',
        builder: (yargs) => 
          yargs.option('output', {
            describe: 'Output file path',
            type: 'string',
            default: './taxonomy.json',
            alias: 'o'
          }),
        handler: async (argv) => {
          const { output } = argv as any;
          
          // Mock taxonomy data
          const mockTaxonomy = {
            domains: {
              'technology': {
                description: 'Technology-related topics',
                tags: ['javascript', 'react', 'nodejs', 'typescript', 'python']
              },
              'design': {
                description: 'Design-related topics',
                tags: ['ui', 'ux', 'graphics', 'figma', 'sketch']
              },
              'business': {
                description: 'Business-related topics',
                tags: ['startups', 'marketing', 'sales', 'strategy', 'finance']
              }
            }
          };
          
          await fs.writeJSON(output as string, mockTaxonomy, { spaces: 2 });
          logger.info(`Taxonomy exported to ${output}`);
        }
      })
      .demandCommand(1, 'You must specify a command')
      .help();
  },
  handler: () => {} // Main handler doesn't do anything, subcommands are used instead
}; 