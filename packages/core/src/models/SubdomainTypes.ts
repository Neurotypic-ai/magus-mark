import type { SUBDOMAIN_TAGS } from '../tagging/taxonomy';

/**
 * Generate the subdomain types for each domain
 */

export type SubdomainTypes = {
  [K in keyof typeof SUBDOMAIN_TAGS]: (typeof SUBDOMAIN_TAGS)[K][number] | string[] | readonly string[];
};
