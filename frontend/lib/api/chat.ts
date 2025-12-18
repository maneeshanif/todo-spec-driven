/**
 * Chat API module for Phase 3 AI Chatbot functionality.
 *
 * This module provides:
 * - sendMessage: Send a message to the chat API (non-streaming)
 * - getConversations: List user's conversations
 * - getConversation: Get a conversation with messages
 * - updateConversation: Rename a conversation
 * - deleteConversation: Delete a conversation
 */

import { apiClient } from './client';
import type {
  ChatRequest,
  ChatResponse,
  Conversation,
  ConversationUpdate,
  Message,
} from '@/types/chat';

interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  page_size: number;
}

interface ConversationWithMessages extends Conversation {
  messages?: Message[];
}

/**
 * Send a message to the chat API (non-streaming).
 *
 * @param request - Chat request with message and optional conversation_id
 * @returns Chat response with assistant's reply
 */
export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await apiClient.post('/api/chat', request);
  return response.data;
}

/**
 * Get all conversations for the current user.
 *
 * @param page - Page number (default 1)
 * @param pageSize - Items per page (default 20)
 * @returns Paginated list of conversations
 */
export async function getConversations(
  page: number = 1,
  pageSize: number = 20
): Promise<ConversationListResponse> {
  const response = await apiClient.get('/api/chat/conversations', {
    params: { page, page_size: pageSize },
  });
  return response.data;
}

/**
 * Get a single conversation with its messages.
 *
 * @param conversationId - The conversation ID
 * @returns Conversation with messages
 */
export async function getConversation(
  conversationId: number
): Promise<ConversationWithMessages> {
  const response = await apiClient.get(
    `/api/chat/conversations/${conversationId}`
  );
  return response.data;
}

/**
 * Update a conversation (rename).
 *
 * @param conversationId - The conversation ID
 * @param update - Update payload with new title
 * @returns Updated conversation
 */
export async function updateConversation(
  conversationId: number,
  update: ConversationUpdate
): Promise<Conversation> {
  const response = await apiClient.put(
    `/api/chat/conversations/${conversationId}`,
    update
  );
  return response.data;
}

/**
 * Delete a conversation.
 *
 * @param conversationId - The conversation ID
 */
export async function deleteConversation(conversationId: number): Promise<void> {
  await apiClient.delete(`/api/chat/conversations/${conversationId}`);
}

/**
 * Get the most recent conversation for the current user.
 *
 * @returns Most recent conversation or null if none exists
 */
export async function getMostRecentConversation(): Promise<Conversation | null> {
  const { conversations } = await getConversations(1, 1);
  return conversations.length > 0 ? conversations[0] : null;
}

// Export all functions as a chatApi object for convenience
export const chatApi = {
  sendMessage,
  getConversations,
  getConversation,
  updateConversation,
  deleteConversation,
  getMostRecentConversation,
};
