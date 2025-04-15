import type { CONVERSATION_TYPE_TAGS } from '../tagging/taxonomy';

/**
 * Conversation type tags taxonomy
 */

export type ConversationTypeTag = (typeof CONVERSATION_TYPE_TAGS)[number];
