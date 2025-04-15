import type { PredefinedContextualTag } from './PredefinedContextualTag';

/**
 * Contextual tag type that allows both predefined values and custom extensions
 */

export type ContextualTag = PredefinedContextualTag | (string & {});
