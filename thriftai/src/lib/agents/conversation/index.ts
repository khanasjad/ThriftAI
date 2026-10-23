/**
 * Conversation Manager - Main Exports
 *
 * Manages multi-turn conversations for product search and Q&A.
 */

// Types
export type {
  ConversationState,
  ConversationResponse
} from './conversation-manager'

// Manager class and singleton
export {
  ConversationManager,
  conversationManager
} from './conversation-manager'
