import type { ContextualTag } from './ContextualTag';
import type { DomainTag } from './DomainTag';
import type { SubdomainTag } from './SubdomainTag';

/**
 * Topical tag structure combining domain, subdomain, and contextual elements
 */

export interface TopicalTag {
  domain: DomainTag;
  subdomain?: SubdomainTag | undefined;
  contextual?: ContextualTag | undefined;
}
