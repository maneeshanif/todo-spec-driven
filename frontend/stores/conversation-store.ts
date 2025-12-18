/**
 * Conversation store for Phase 3 AI Chatbot.
 *
 * Manages:
 * - Conversation list
 * - Current conversation and messages
 * - Streaming state with hybrid UI support
 * - Send message actions
 * - Mobile sidebar state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { chatApi } from '@/lib/api/chat';
import { streamChatMessage } from '@/lib/sse/client';
import type { Conversation, Message, ToolCall, ActiveToolCall, ToolLifecyclePhase } from '@/types/chat';

interface ConversationState {
  // Data
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];

  // Streaming state for hybrid UI
  streamingContent: string;
  streamingToolCalls: ActiveToolCall[];
  isThinking: boolean;
  thinkingMessage: string;
  currentAgent: string;

  // RunItem state for hybrid UI (reasoning, handoff)
  reasoning: string;
  isHandingOff: boolean;
  handoffFromAgent: string;
  handoffToAgent: string;

  // Loading states
  isLoading: boolean;
  isStreaming: boolean;
  isSending: boolean;

  // Error
  error: string | null;

  // UI state (mobile)
  isSidebarOpen: boolean;

  // Hydration
  _hasHydrated: boolean;
}

interface ConversationActions {
  // Conversation management
  fetchConversations: () => Promise<void>;
  refreshConversationsSilently: () => Promise<void>;
  selectConversation: (id: number) => Promise<void>;
  createNewConversation: () => void;
  deleteConversation: (id: number) => Promise<void>;
  renameConversation: (id: number, title: string) => Promise<void>;

  // Messaging
  sendMessage: (content: string) => Promise<void>;
  sendMessageStreaming: (content: string, verboseCallbacks?: Partial<import('@/lib/sse/client').StreamCallbacks>) => Promise<void>;

  // Streaming state updates (for hybrid UI)
  appendStreamToken: (token: string) => void;
  setThinking: (thinking: boolean, message?: string, agent?: string) => void;
  addStreamToolCall: (toolCall: ToolCall, agentName?: string, model?: string) => void;
  updateToolCallResult: (callId: string, output: unknown) => void;
  updateToolCallPhase: (callId: string, phase: ToolLifecyclePhase) => void;
  updateAgent: (agent: string) => void;
  finishStreaming: (conversationId: number, messageId: number) => void;

  // RunItem state updates (for hybrid UI - reasoning, handoff)
  setReasoning: (reasoning: string) => void;
  appendReasoning: (text: string) => void;
  setHandoff: (isHandingOff: boolean, fromAgent?: string, toAgent?: string) => void;

  // State management
  setStreaming: (streaming: boolean) => void;
  clearError: () => void;
  reset: () => void;
  setHydrated: () => void;

  // UI state (mobile)
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

type ConversationStore = ConversationState & ConversationActions;

const initialState: ConversationState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  streamingContent: '',
  streamingToolCalls: [],
  isThinking: false,
  thinkingMessage: '',
  currentAgent: 'TodoBot',
  // RunItem state
  reasoning: '',
  isHandingOff: false,
  handoffFromAgent: '',
  handoffToAgent: '',
  // Loading states
  isLoading: false,
  isStreaming: false,
  isSending: false,
  error: null,
  isSidebarOpen: false,
  _hasHydrated: false,
};

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Fetch all conversations (with loading state - for initial load)
      fetchConversations: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await chatApi.getConversations();
          set({
            conversations: response.conversations,
            isLoading: false,
          });
        } catch (error) {
          console.error('[ConversationStore] Failed to fetch conversations:', error);
          set({
            error: 'Failed to load conversations',
            isLoading: false,
          });
        }
      },

      // Refresh conversations silently (no loading state - for background updates)
      refreshConversationsSilently: async () => {
        try {
          const response = await chatApi.getConversations();
          set({ conversations: response.conversations });
        } catch (error) {
          console.error('[ConversationStore] Silent refresh failed:', error);
          // Don't set error for silent refresh
        }
      },

      // Select and load a conversation
      selectConversation: async (id: number) => {
        set({ isLoading: true, error: null, isSidebarOpen: false });
        try {
          const conversation = await chatApi.getConversation(id);
          set({
            currentConversation: conversation,
            messages: conversation.messages || [],
            isLoading: false,
            streamingContent: '',
            streamingToolCalls: [],
            isThinking: false,
            thinkingMessage: '',
          });
        } catch (error) {
          console.error('[ConversationStore] Failed to load conversation:', error);
          set({
            error: 'Failed to load conversation',
            isLoading: false,
          });
        }
      },

      // Create a new empty conversation
      createNewConversation: () => {
        set({
          currentConversation: null,
          messages: [],
          streamingContent: '',
          streamingToolCalls: [],
          isThinking: false,
          thinkingMessage: '',
          error: null,
          isSidebarOpen: false,
        });
      },

      // Delete a conversation
      deleteConversation: async (id: number) => {
        try {
          await chatApi.deleteConversation(id);
          const { currentConversation, conversations } = get();

          set({
            conversations: conversations.filter((c) => c.id !== id),
            // Clear current if it was deleted
            ...(currentConversation?.id === id
              ? {
                  currentConversation: null,
                  messages: [],
                }
              : {}),
          });
        } catch (error) {
          console.error('[ConversationStore] Failed to delete conversation:', error);
          set({ error: 'Failed to delete conversation' });
        }
      },

      // Rename a conversation
      renameConversation: async (id: number, title: string) => {
        try {
          const updated = await chatApi.updateConversation(id, { title });
          const { conversations, currentConversation } = get();

          set({
            conversations: conversations.map((c) =>
              c.id === id ? { ...c, title: updated.title } : c
            ),
            ...(currentConversation?.id === id
              ? { currentConversation: { ...currentConversation, title: updated.title } }
              : {}),
          });
        } catch (error) {
          console.error('[ConversationStore] Failed to rename conversation:', error);
          set({ error: 'Failed to rename conversation' });
        }
      },

      // Send a message (non-streaming for MVP)
      sendMessage: async (content: string) => {
        const { currentConversation, messages } = get();

        // Create optimistic user message
        const userMessage: Message = {
          id: Date.now(), // Temporary ID
          conversation_id: currentConversation?.id || 0,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        };

        set({
          messages: [...messages, userMessage],
          isSending: true,
          error: null,
          streamingContent: '',
          streamingToolCalls: [],
        });

        try {
          const response = await chatApi.sendMessage({
            conversation_id: currentConversation?.id || undefined,
            message: content,
          });

          // Create assistant message from response
          const assistantMessage: Message = {
            id: response.message_id,
            conversation_id: response.conversation_id,
            role: 'assistant',
            content: response.response,
            tool_calls: response.tool_calls || undefined,
            created_at: new Date().toISOString(),
          };

          // Update conversation if new
          const newConversation: Conversation | null =
            !currentConversation
              ? {
                  id: response.conversation_id,
                  user_id: '', // Will be filled from server
                  title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }
              : null;

          set((state) => ({
            messages: [...state.messages, assistantMessage],
            currentConversation: newConversation || state.currentConversation,
            isSending: false,
          }));

          // Refresh conversations list silently (no loading state)
          get().refreshConversationsSilently();
        } catch (error) {
          console.error('[ConversationStore] Failed to send message:', error);
          set({
            error: 'Failed to send message. Please try again.',
            isSending: false,
          });
        }
      },

      // Send a message with SSE streaming (hybrid UI)
      sendMessageStreaming: async (content: string) => {
        const { currentConversation, messages, appendStreamToken, setThinking, addStreamToolCall, updateToolCallResult, updateAgent, finishStreaming, setReasoning, appendReasoning, setHandoff } = get();

        // Create optimistic user message
        const userMessage: Message = {
          id: Date.now(),
          conversation_id: currentConversation?.id || 0,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        };

        set({
          messages: [...messages, userMessage],
          isStreaming: true,
          isSending: true,
          error: null,
          streamingContent: '',
          streamingToolCalls: [],
          // Show thinking immediately with "Sending request" message
          isThinking: true,
          thinkingMessage: 'Sending your request to the server...',
          currentAgent: 'TodoBot',
          // Reset RunItem state
          reasoning: '',
          isHandingOff: false,
          handoffFromAgent: '',
          handoffToAgent: '',
        });

        try {
          await streamChatMessage(
            currentConversation?.id ?? null,
            content,
            {
              // Thinking event - update thinking message (already showing from initial state)
              onThinking: (message, agent) => {
                // Update the thinking message to show progress
                setThinking(true, message || 'Processing your request...', agent);
              },
              // Token event - append to content
              onToken: (token) => {
                setThinking(false); // Stop thinking when we get tokens
                setHandoff(false); // Stop handoff indicator when we get tokens
                appendStreamToken(token);
              },
              // Tool call event - show tool indicator
              onToolCall: (toolCall) => {
                setThinking(false); // Stop thinking when tool is called
                addStreamToolCall(toolCall);
              },
              // Tool result event - update tool indicator
              onToolResult: (callId, output) => {
                updateToolCallResult(callId, output);
              },
              // Agent updated event - update agent name
              onAgentUpdated: (agent) => {
                updateAgent(agent);
              },
              // Done event - finalize message
              onDone: (conversationId, messageId) => {
                finishStreaming(conversationId, messageId);
                set({ isSending: false });
              },
              // Error event - show error
              onError: (error) => {
                console.error('[ConversationStore] Streaming error:', error);
                set({
                  error: error.message || 'Streaming failed. Please try again.',
                  isStreaming: false,
                  isSending: false,
                  isThinking: false,
                  isHandingOff: false,
                });
              },
              // =====================================================
              // RunItem events - Reasoning, Handoff
              // =====================================================
              // Reasoning event - LLM's internal thinking process
              onReasoning: (reasoningText) => {
                appendReasoning(reasoningText);
              },
              // Handoff call event - LLM is calling handoff tool
              onHandoffCall: (tool, callId) => {
                setHandoff(true);
              },
              // Handoff event - Agent handoff occurred
              onHandoff: (fromAgent, toAgent) => {
                setHandoff(true, fromAgent, toAgent);
                // Update current agent after handoff
                updateAgent(toAgent);
              },
            }
          );
        } catch (error) {
          console.error('[ConversationStore] Failed to start streaming:', error);
          set({
            error: 'Failed to send message. Please try again.',
            isStreaming: false,
            isSending: false,
            isThinking: false,
            isHandingOff: false,
          });
        }
      },

      // Append a token during streaming
      appendStreamToken: (token: string) => {
        set((state) => ({
          streamingContent: state.streamingContent + token,
        }));
      },

      // Set thinking state with optional message and agent
      setThinking: (thinking: boolean, message?: string, agent?: string) => {
        set((state) => ({
          isThinking: thinking,
          thinkingMessage: message || state.thinkingMessage,
          currentAgent: agent || state.currentAgent,
        }));
      },

      // Add a tool call during streaming with lifecycle tracking
      addStreamToolCall: (toolCall: ToolCall, agentName?: string, model?: string) => {
        const { currentAgent } = get();
        const activeToolCall: ActiveToolCall = {
          callId: toolCall.id,
          tool: toolCall.tool,
          args: toolCall.arguments,
          status: 'executing',
          // Lifecycle tracking
          lifecyclePhase: 'tool_running',
          lifecycleHistory: ['agent_start', 'llm_calling', 'mcp_requesting', 'tool_running'],
          agentName: agentName || currentAgent,
          model: model || 'gemini-2.5-flash',
        };
        set((state) => ({
          streamingToolCalls: [...state.streamingToolCalls, activeToolCall],
        }));
      },

      // Update tool call lifecycle phase
      updateToolCallPhase: (callId: string, phase: ToolLifecyclePhase) => {
        set((state) => ({
          streamingToolCalls: state.streamingToolCalls.map((tc) => {
            if (tc.callId === callId) {
              const history = tc.lifecycleHistory || [];
              return {
                ...tc,
                lifecyclePhase: phase,
                lifecycleHistory: history.includes(phase) ? history : [...history, phase],
              };
            }
            return tc;
          }),
        }));
      },

      // Update tool call with result and complete lifecycle
      updateToolCallResult: (callId: string, output: unknown) => {
        set((state) => ({
          streamingToolCalls: state.streamingToolCalls.map((tc) => {
            if (tc.callId === callId) {
              const history = tc.lifecycleHistory || [];
              return {
                ...tc,
                status: 'completed' as const,
                result: output,
                lifecyclePhase: 'completed' as ToolLifecyclePhase,
                lifecycleHistory: [...history, 'mcp_responded', 'completed'] as ToolLifecyclePhase[],
              };
            }
            return tc;
          }),
        }));
      },

      // Update current agent name
      updateAgent: (agent: string) => {
        set({ currentAgent: agent });
      },

      // Set reasoning text
      setReasoning: (reasoning: string) => {
        set({ reasoning });
      },

      // Append to reasoning text
      appendReasoning: (text: string) => {
        set((state) => ({
          reasoning: state.reasoning + text,
        }));
      },

      // Set handoff state
      setHandoff: (isHandingOff: boolean, fromAgent?: string, toAgent?: string) => {
        set({
          isHandingOff,
          handoffFromAgent: fromAgent || '',
          handoffToAgent: toAgent || '',
        });
      },

      // Finish streaming and create final message
      finishStreaming: (conversationId: number, messageId: number) => {
        const { streamingContent, streamingToolCalls, currentConversation } = get();

        // Convert ActiveToolCall[] to ToolCall[] for storage
        const toolCallsForStorage: ToolCall[] = streamingToolCalls.map((tc) => ({
          id: tc.callId,
          tool: tc.tool,
          arguments: tc.args,
          result: tc.result as Record<string, unknown> | undefined,
        }));

        const assistantMessage: Message = {
          id: messageId,
          conversation_id: conversationId,
          role: 'assistant',
          content: streamingContent,
          tool_calls: toolCallsForStorage.length > 0 ? toolCallsForStorage : undefined,
          created_at: new Date().toISOString(),
        };

        // Update conversation if new
        const newConversation: Conversation | null =
          !currentConversation
            ? {
                id: conversationId,
                user_id: '',
                title: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : null;

        set((state) => ({
          messages: [...state.messages, assistantMessage],
          currentConversation: newConversation || state.currentConversation,
          streamingContent: '',
          streamingToolCalls: [],
          isStreaming: false,
          isThinking: false,
          thinkingMessage: '',
          // Reset RunItem state
          reasoning: '',
          isHandingOff: false,
          handoffFromAgent: '',
          handoffToAgent: '',
        }));

        // Refresh conversations list silently (no loading state)
        get().refreshConversationsSilently();
      },

      // Set streaming state
      setStreaming: (streaming: boolean) => {
        set({ isStreaming: streaming });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Reset store
      reset: () => {
        set(initialState);
      },

      // Set hydration complete
      setHydrated: () => {
        set({ _hasHydrated: true });
      },

      // Toggle sidebar (for mobile)
      toggleSidebar: () => {
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
      },

      // Set sidebar open state
      setSidebarOpen: (open: boolean) => {
        set({ isSidebarOpen: open });
      },
    }),
    {
      name: 'conversation-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist conversation list, not messages or streaming state
      partialize: (state) => ({
        conversations: state.conversations,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

// Selector hooks for optimized re-renders
export const useConversations = () =>
  useConversationStore((state) => state.conversations);

export const useCurrentConversation = () =>
  useConversationStore((state) => state.currentConversation);

export const useMessages = () => useConversationStore((state) => state.messages);

export const useIsStreaming = () =>
  useConversationStore((state) => state.isStreaming);

export const useStreamingContent = () =>
  useConversationStore((state) => state.streamingContent);

export const useStreamingToolCalls = () =>
  useConversationStore((state) => state.streamingToolCalls);

export const useIsThinking = () =>
  useConversationStore((state) => state.isThinking);

export const useThinkingMessage = () =>
  useConversationStore((state) => state.thinkingMessage);

export const useCurrentAgent = () =>
  useConversationStore((state) => state.currentAgent);

export const useChatError = () => useConversationStore((state) => state.error);

export const useIsSidebarOpen = () =>
  useConversationStore((state) => state.isSidebarOpen);

// RunItem state selectors
export const useReasoning = () =>
  useConversationStore((state) => state.reasoning);

export const useIsHandingOff = () =>
  useConversationStore((state) => state.isHandingOff);

export const useHandoffFromAgent = () =>
  useConversationStore((state) => state.handoffFromAgent);

export const useHandoffToAgent = () =>
  useConversationStore((state) => state.handoffToAgent);
