import type { ContextualTag } from './ContextualTag';
import type { ConversationTypeTag } from './ConversationTypeTag';
import type { DomainTag } from './DomainTag';
import type { LifeAreaTag } from './LifeAreaTag';
import type { SubdomainMap } from './SubdomainMap';

/**
 * Taxonomy constants - single source of truth for tag values
 *
 * These constants define all possible values for the tagging system
 * and are used to generate both TypeScript types and runtime values.
 */
/**
 * Complete taxonomy for the tagging system
 */

export interface Taxonomy {
  domains: DomainTag[];
  subdomains: SubdomainMap;
  lifeAreas: LifeAreaTag[];
  conversationTypes: ConversationTypeTag[];
  contextualTags: ContextualTag[];
}
