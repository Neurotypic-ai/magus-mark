import type { SubdomainTypes } from './SubdomainTypes';

/**
 * Subdomains by primary domain
 */

export interface SubdomainMap extends SubdomainTypes, Record<string, string | string[] | readonly string[]> {}
