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
  /** Enable verbose mode to emit detailed agent lifecycle events */
  verbose?: boolean;
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

/** Handoff call event - LLM calling handoff to another agent */
export interface SSEHandoffCallEvent {
  event: 'handoff_call';
  tool: string;
  call_id: string;
}

/** Handoff event - Agent handoff occurred */
export interface SSEHandoffEvent {
  event: 'handoff';
  from_agent: string;
  to_agent: string;
}

/** Reasoning event - LLM's internal reasoning */
export interface SSEReasoningEvent {
  event: 'reasoning';
  content: string;
}

export type SSEEvent =
  | SSEThinkingEvent
  | SSETokenEvent
  | SSEToolCallEvent
  | SSEToolResultEvent
  | SSEAgentUpdatedEvent
  | SSEDoneEvent
  | SSEErrorEvent
  | SSEVerboseEvent
  | SSEHandoffCallEvent
  | SSEHandoffEvent
  | SSEReasoningEvent;

/**
 * Verbose SSE events for detailed agent lifecycle visibility.
 * Only emitted when verbose=true in the chat request.
 */
export interface SSEVerboseEvent {
  event:
    | 'agent_start'
    | 'agent_end'
    | 'llm_start'
    | 'llm_end'
    | 'mcp_request'
    | 'mcp_response'
    | 'handoff';
  message: string;
  agent_name?: string;
  tool_name?: string;
  call_id?: string;
  model?: string;
  from_agent?: string;
  to_agent?: string;
}

/**
 * Verbose lifecycle state for UI display.
 */
export interface VerboseLifecycleState {
  /** Current lifecycle phase */
  phase:
    | 'idle'
    | 'agent_starting'
    | 'llm_calling'
    | 'llm_responding'
    | 'mcp_requesting'
    | 'mcp_responding'
    | 'agent_ending';
  /** Human-readable message */
  message: string;
  /** Agent name */
  agentName?: string;
  /** Tool name (for MCP events) */
  toolName?: string;
  /** LLM model name */
  model?: string;
  /** Timestamp */
  timestamp: Date;
}

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
  /** Current reasoning text from the LLM (reasoning_item) */
  reasoning: string;
  /** Whether a handoff is in progress */
  isHandingOff: boolean;
  /** Source agent for handoff */
  handoffFromAgent: string;
  /** Target agent for handoff */
  handoffToAgent: string;
}

/**
 * Lifecycle phase for tool execution.
 * Shows the full agent lifecycle with detailed steps.
 */
export type ToolLifecyclePhase =
  | 'idle'             // ⏸️ Not started
  | 'agent_start'      // 🤖 Agent initialized
  | 'llm_thinking'     // 🧠 LLM processing/thinking (alias: llm_calling)
  | 'llm_calling'      // 🧠 LLM processing/thinking (legacy alias)
  | 'llm_responding'   // 💭 LLM generating response (alias: llm_done)
  | 'llm_done'         // 💭 LLM done generating (legacy alias)
  | 'mcp_requesting'   // 📤 MCP request sent
  | 'tool_running'     // ⚙️ Tool executing
  | 'mcp_responded'    // 📥 MCP response received
  | 'streaming'        // 📝 Streaming tokens
  | 'completed'        // ✅ All done
  | 'error';           // ❌ Error occurred

/**
 * Lifecycle step with timing information.
 */
export interface LifecycleStepInfo {
  phase: ToolLifecyclePhase;
  startTime: number;      // timestamp ms
  endTime?: number;       // timestamp ms (undefined if still running)
  duration?: number;      // calculated duration in ms
  message?: string;       // optional message
}

/**
 * ActiveToolCall tracks a tool call in progress with full lifecycle and timing.
 */
export interface ActiveToolCall {
  callId: string;
  tool: string;
  args: Record<string, unknown>;
  status: 'pending' | 'executing' | 'completed' | 'error';
  result?: unknown;
  /** Current lifecycle phase for detailed UI */
  lifecyclePhase?: ToolLifecyclePhase;
  /** Lifecycle steps with timing */
  lifecycleSteps?: LifecycleStepInfo[];
  /** Lifecycle history (phases only - for backward compat) */
  lifecycleHistory?: ToolLifecyclePhase[];
  /** Model name (from LLM) */
  model?: string;
  /** Agent name */
  agentName?: string;
  /** Start time of the entire tool call */
  startTime?: number;
  /** Total duration in ms */
  totalDuration?: number;
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
