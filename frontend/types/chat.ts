/**
 * Chat types for Phase 3 AI Chatbot functionality.
 */

/**
 * Conversation represents a chat thread between user and assistant.
 */
export interface Conversation {
  id: number;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  message_count?: number;
  /** Preview text showing the last message snippet (optional) */
  preview?: string;
}

/**
 * Message represents a single message in a conversation.
 */
export interface Message {
  id: number;
  conversation_id: number;
  role: MessageRole;
  content: string;
  tool_calls?: ToolCall[] | null;
  created_at: string;
}

/**
 * MessageRole defines the types of message senders.
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * ToolCall represents an MCP tool invocation by the AI agent.
 */
export interface ToolCall {
  id: string;
  tool: string;
  arguments: Record<string, unknown>;
  result?: ToolCallResult;
}

/**
 * ToolCallResult represents the result of an MCP tool execution.
 */
export interface ToolCallResult {
  task_id?: number;
  status?: string;
  title?: string;
  error?: string;
  [key: string]: unknown;
}

/**
 * ChatRequest is the payload for sending a message to the chat API.
 */
export interface ChatRequest {
  conversation_id?: number | null;
  message: string;
}

/**
 * ChatResponse is the response from the non-streaming chat API.
 */
export interface ChatResponse {
  conversation_id: number;
  message_id: number;
  response: string;
  tool_calls?: ToolCall[] | null;
}

/**
 * SSE Event types for streaming chat responses.
 * These events enable a hybrid UI experience similar to Grok.
 */

/** Agent is thinking/processing */
export interface SSEThinkingEvent {
  event: 'thinking';
  content: string;
  agent: string;
}

/** Text content chunk from the assistant */
export interface SSETokenEvent {
  event: 'token';
  content: string;
}

/** Tool is being called with arguments */
export interface SSEToolCallEvent {
  event: 'tool_call';
  tool: string;
  args: Record<string, unknown>;
  call_id: string;
}

/** Tool execution returned result */
export interface SSEToolResultEvent {
  event: 'tool_result';
  call_id: string;
  output: unknown;
}

/** Agent changed (multi-agent scenarios) */
export interface SSEAgentUpdatedEvent {
  event: 'agent_updated';
  agent: string;
  content: string;
}

/** Stream completed */
export interface SSEDoneEvent {
  event: 'done';
  conversation_id: number;
  message_id: number;
}

/** Error occurred */
export interface SSEErrorEvent {
  event: 'error';
  message: string;
  code?: string;
}

export type SSEEvent =
  | SSEThinkingEvent
  | SSETokenEvent
  | SSEToolCallEvent
  | SSEToolResultEvent
  | SSEAgentUpdatedEvent
  | SSEDoneEvent
  | SSEErrorEvent;

/**
 * StreamingState tracks the current state of a streaming response.
 * Used to display hybrid UI elements like thinking indicators and tool calls.
 */
export interface StreamingState {
  isThinking: boolean;
  thinkingMessage: string;
  currentAgent: string;
  activeToolCalls: ActiveToolCall[];
  content: string;
}

/**
 * ActiveToolCall tracks a tool call in progress.
 */
export interface ActiveToolCall {
  callId: string;
  tool: string;
  args: Record<string, unknown>;
  status: 'pending' | 'executing' | 'completed' | 'error';
  result?: unknown;
}

/**
 * ConversationCreate is the payload for creating a new conversation.
 */
export interface ConversationCreate {
  title?: string;
}

/**
 * ConversationUpdate is the payload for updating a conversation.
 */
export interface ConversationUpdate {
  title: string;
}

/**
 * ConversationWithMessages includes the conversation and its messages.
 */
export interface ConversationWithMessages {
  conversation: Conversation;
  messages: Message[];
}
