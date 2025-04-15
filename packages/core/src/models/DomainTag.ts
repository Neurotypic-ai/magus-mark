import type { PredefinedDomainTag } from './PredefinedDomainTag';

/**
 * Domain tag type that allows both predefined values and custom extensions
 */

export type DomainTag = PredefinedDomainTag | (string & {});
