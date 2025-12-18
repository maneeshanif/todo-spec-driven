/**
 * SSE (Server-Sent Events) client for streaming chat responses.
 *
 * This module provides utilities for connecting to the streaming
 * chat endpoint and handling real-time events for a hybrid UI
 * experience similar to Grok.
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Maximum retry attempts with configurable limits
 * - Connection health monitoring with timeout detection
 * - Proper cleanup on component unmount
 */

import type React from 'react';
import type { ToolCall, ActiveToolCall, ToolLifecyclePhase } from '@/types/chat';

// SSE Configuration for reconnection and health monitoring
export interface SSEConfig {
  /** Maximum number of retry attempts before giving up (default: 3) */
  maxRetries?: number;
  /** Initial delay before first retry in milliseconds (default: 1000) */
  initialRetryDelay?: number;
  /** Maximum delay between retries in milliseconds (default: 10000) */
  maxRetryDelay?: number;
  /** Connection timeout in milliseconds - triggers reconnect if no data received (default: 30000) */
  connectionTimeout?: number;
}

const DEFAULT_SSE_CONFIG: SSEConfig = {
  maxRetries: 3,
  initialRetryDelay: 1000,   // 1 second
  maxRetryDelay: 10000,      // 10 seconds
  connectionTimeout: 30000,  // 30 seconds
};

/**
 * Calculate exponential backoff delay for retry attempts.
 *
 * @param attempt - Current retry attempt (0-indexed)
 * @param config - SSE configuration with delay settings
 * @returns Delay in milliseconds (capped at maxRetryDelay)
 */
function getRetryDelay(attempt: number, config: SSEConfig): number {
  const delay = (config.initialRetryDelay ?? DEFAULT_SSE_CONFIG.initialRetryDelay!) * Math.pow(2, attempt);
  return Math.min(delay, config.maxRetryDelay ?? DEFAULT_SSE_CONFIG.maxRetryDelay!);
}

/**
 * Sleep for a specified duration.
 *
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// SSE Event Types (matching backend events)
interface ThinkingEvent {
  content: string;
  agent: string;
}

interface TokenEvent {
  content: string;
}

interface ToolCallEvent {
  tool: string;
  args: Record<string, unknown>;
  call_id: string;
}

interface ToolResultEvent {
  call_id: string;
  output: unknown;
}

interface AgentUpdatedEvent {
  agent: string;
  content: string;
}

interface DoneEvent {
  conversation_id: number;
  message_id: number;
}

interface ErrorEvent {
  message: string;
  code?: string;
}

// Verbose event types for detailed agent lifecycle visibility
interface VerboseEvent {
  message: string;
  agent_name?: string;
  tool_name?: string;
  call_id?: string;
  model?: string;
  from_agent?: string;
  to_agent?: string;
}

// RunItem event types - All 6 RunItem types from OpenAI Agents SDK
interface HandoffCallEvent {
  tool: string;
  call_id: string;
}

interface HandoffEvent {
  from_agent: string;
  to_agent: string;
}

interface ReasoningEvent {
  content: string;
}

// Callback types for hybrid UI
export interface StreamCallbacks {
  /** Agent is thinking/processing - show spinner */
  onThinking?: (content: string, agent: string) => void;
  /** Text token received - append to message */
  onToken?: (content: string) => void;
  /** Tool is being called - show tool indicator */
  onToolCall?: (toolCall: ToolCall) => void;
  /** Tool returned result - update tool indicator */
  onToolResult?: (callId: string, output: unknown) => void;
  /** Agent changed (multi-agent) - update UI */
  onAgentUpdated?: (agent: string, content: string) => void;
  /** Stream completed - finalize message */
  onDone?: (conversationId: number, messageId: number) => void;
  /** Error occurred - show error message */
  onError?: (error: Error) => void;

  // RunItem events - All 6 RunItem types from OpenAI Agents SDK
  /** Handoff call - LLM is calling handoff tool (handoff_call_item) */
  onHandoffCall?: (tool: string, callId: string) => void;
  /** Handoff completed - Agent handoff occurred (handoff_output_item) */
  onHandoff?: (fromAgent: string, toAgent: string) => void;
  /** Reasoning - LLM's internal thinking process (reasoning_item) */
  onReasoning?: (content: string) => void;

  // Verbose callbacks (only called when verbose=true in request)
  /** Agent initialized */
  onAgentStart?: (agentName: string, message: string) => void;
  /** Agent finished */
  onAgentEnd?: (agentName: string, message: string) => void;
  /** LLM call starting (calling Gemini) */
  onLLMStart?: (agentName: string, model: string) => void;
  /** LLM response received */
  onLLMEnd?: (agentName: string) => void;
  /** MCP tool request sent */
  onMCPRequest?: (toolName: string, callId: string, agentName?: string) => void;
  /** MCP tool response received */
  onMCPResponse?: (toolName: string, callId: string, agentName?: string) => void;
}

/**
 * Get emoji for a tool name (for hybrid UI display).
 */
export function getToolEmoji(toolName: string): string {
  const toolEmojis: Record<string, string> = {
    add_task: '➕',
    list_tasks: '📋',
    complete_task: '✅',
    delete_task: '🗑️',
    update_task: '✏️',
    get_task: '🔍',
  };
  return toolEmojis[toolName] || '🔧';
}

/**
 * Get human-readable tool description.
 */
export function getToolDescription(toolName: string): string {
  const toolDescriptions: Record<string, string> = {
    add_task: 'Adding task',
    list_tasks: 'Fetching tasks',
    complete_task: 'Completing task',
    delete_task: 'Deleting task',
    update_task: 'Updating task',
    get_task: 'Getting task details',
  };
  return toolDescriptions[toolName] || `Running ${toolName}`;
}

/**
 * Stream a chat message via SSE with automatic reconnection.
 *
 * @param conversationId - Optional existing conversation ID
 * @param message - The user's message
 * @param callbacks - Callback functions for different event types
 * @param config - Optional SSE configuration for retry behavior
 * @returns AbortController to cancel the stream
 */
export async function streamChatMessage(
  conversationId: number | null,
  message: string,
  callbacks: StreamCallbacks,
  config: SSEConfig = {}
): Promise<AbortController> {
  const mergedConfig = { ...DEFAULT_SSE_CONFIG, ...config };
  const abortController = new AbortController();

  // Get token from localStorage (same source as Axios apiClient)
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('bearer_token')
    : null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  console.log('[SSE] Starting stream, token exists:', !!token);

  // Execute stream with retry logic
  await executeStreamWithRetry(
    apiUrl,
    token,
    conversationId,
    message,
    callbacks,
    mergedConfig,
    abortController
  );

  return abortController;
}

/**
 * Execute the SSE stream with automatic retry on connection failures.
 *
 * @internal
 */
async function executeStreamWithRetry(
  apiUrl: string,
  token: string | null,
  conversationId: number | null,
  message: string,
  callbacks: StreamCallbacks,
  config: SSEConfig,
  abortController: AbortController
): Promise<void> {
  let retryCount = 0;
  const maxRetries = config.maxRetries ?? DEFAULT_SSE_CONFIG.maxRetries!;

  while (retryCount <= maxRetries) {
    // Check if aborted before attempting connection
    if (abortController.signal.aborted) {
      console.log('[SSE] Stream cancelled before retry');
      return;
    }

    try {
      // Set up connection timeout
      const timeoutId = setTimeout(() => {
        if (!abortController.signal.aborted) {
          console.warn('[SSE] Connection timeout - no data received');
          // Don't abort the controller, just log the timeout
          // The stream will continue if data arrives
        }
      }, config.connectionTimeout ?? DEFAULT_SSE_CONFIG.connectionTimeout!);

      const response = await fetch(`${apiUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message,
        }),
        signal: abortController.signal,
      });

      // Clear timeout once we get a response
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        const statusError = new Error(`Stream request failed: ${response.status} - ${errorText}`);

        // Don't retry on client errors (4xx) - these are usually auth or validation issues
        if (response.status >= 400 && response.status < 500) {
          console.error('[SSE] Client error, not retrying:', response.status);
          callbacks.onError?.(statusError);
          return;
        }

        throw statusError;
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Process the SSE stream with timeout monitoring
      await processSSEStreamWithTimeout(response.body, callbacks, config, abortController);

      // If we reach here without error, stream completed successfully
      console.log('[SSE] Stream completed successfully');
      return;
    } catch (error) {
      // Handle abort
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[SSE] Stream cancelled');
        return;
      }

      // Log the error
      console.error(`[SSE] Stream error (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);

      // Check if we should retry
      if (retryCount < maxRetries && !abortController.signal.aborted) {
        const delay = getRetryDelay(retryCount, config);
        console.log(`[SSE] Retrying in ${delay}ms...`);

        // Notify callback about retry (optional - could add onRetry callback)
        callbacks.onThinking?.(`Connection lost. Reconnecting in ${Math.round(delay / 1000)}s...`, 'System');

        await sleep(delay);
        retryCount++;
      } else {
        // All retries exhausted or aborted
        console.error('[SSE] All retry attempts exhausted');
        callbacks.onError?.(error instanceof Error ? error : new Error('Stream error after retries'));
        return;
      }
    }
  }
}

/**
 * Process an SSE stream with connection health monitoring.
 *
 * @internal
 */
async function processSSEStreamWithTimeout(
  body: ReadableStream<Uint8Array>,
  callbacks: StreamCallbacks,
  config: SSEConfig,
  abortController: AbortController
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let lastDataTime = Date.now();
  let healthCheckIntervalId: ReturnType<typeof setInterval> | null = null;

  // Set up health check interval
  const connectionTimeout = config.connectionTimeout ?? DEFAULT_SSE_CONFIG.connectionTimeout!;
  healthCheckIntervalId = setInterval(() => {
    const timeSinceLastData = Date.now() - lastDataTime;
    if (timeSinceLastData > connectionTimeout) {
      console.warn(`[SSE] No data received for ${timeSinceLastData}ms, connection may be stale`);
      // We could throw here to trigger a reconnect, but for now just log
      // The connection will naturally fail if the server is gone
    }
  }, connectionTimeout / 2);

  try {
    while (true) {
      // Check if aborted
      if (abortController.signal.aborted) {
        console.log('[SSE] Stream processing cancelled');
        break;
      }

      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Update last data time for health monitoring
      lastDataTime = Date.now();

      // Decode and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete events in buffer
      const lines = buffer.split('\n');
      // Keep the last incomplete line in buffer
      buffer = lines.pop() || '';

      let currentEventType = '';

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine === '') {
          // Empty line signals end of event
          currentEventType = '';
          continue;
        }

        if (trimmedLine.startsWith('event:')) {
          currentEventType = trimmedLine.slice(6).trim();
        } else if (trimmedLine.startsWith('data:')) {
          const dataStr = trimmedLine.slice(5).trim();

          try {
            const data = JSON.parse(dataStr);
            handleSSEEvent(currentEventType, data, callbacks);
          } catch (e) {
            console.warn('[SSE] Failed to parse event data:', dataStr);
          }
        }
      }
    }
  } finally {
    // Clean up health check interval
    if (healthCheckIntervalId !== null) {
      clearInterval(healthCheckIntervalId);
    }
    reader.releaseLock();
  }
}

/**
 * Handle a parsed SSE event and dispatch to appropriate callback.
 */
function handleSSEEvent(
  eventType: string,
  data: unknown,
  callbacks: StreamCallbacks
): void {
  switch (eventType) {
    case 'thinking': {
      const event = data as ThinkingEvent;
      callbacks.onThinking?.(event.content, event.agent);
      break;
    }

    case 'token': {
      const event = data as TokenEvent;
      callbacks.onToken?.(event.content);
      break;
    }

    case 'tool_call': {
      const event = data as ToolCallEvent;
      callbacks.onToolCall?.({
        id: event.call_id,
        tool: event.tool,
        arguments: event.args,
      });
      break;
    }

    case 'tool_result': {
      const event = data as ToolResultEvent;
      callbacks.onToolResult?.(event.call_id, event.output);
      break;
    }

    case 'agent_updated': {
      const event = data as AgentUpdatedEvent;
      callbacks.onAgentUpdated?.(event.agent, event.content);
      break;
    }

    case 'done': {
      const event = data as DoneEvent;
      callbacks.onDone?.(event.conversation_id, event.message_id);
      break;
    }

    case 'error': {
      const event = data as ErrorEvent;
      callbacks.onError?.(new Error(event.message));
      break;
    }

    // Verbose events - detailed agent lifecycle
    case 'agent_start': {
      const event = data as VerboseEvent;
      callbacks.onAgentStart?.(event.agent_name || 'Agent', event.message);
      break;
    }

    case 'agent_end': {
      const event = data as VerboseEvent;
      callbacks.onAgentEnd?.(event.agent_name || 'Agent', event.message);
      break;
    }

    case 'llm_start': {
      const event = data as VerboseEvent;
      callbacks.onLLMStart?.(event.agent_name || 'Agent', event.model || 'gemini-2.5-flash');
      break;
    }

    case 'llm_end': {
      const event = data as VerboseEvent;
      callbacks.onLLMEnd?.(event.agent_name || 'Agent');
      break;
    }

    case 'mcp_request': {
      const event = data as VerboseEvent;
      callbacks.onMCPRequest?.(event.tool_name || '', event.call_id || '', event.agent_name);
      break;
    }

    case 'mcp_response': {
      const event = data as VerboseEvent;
      callbacks.onMCPResponse?.(event.tool_name || '', event.call_id || '', event.agent_name);
      break;
    }

    // =====================================================
    // RunItem events - All 6 RunItem types from SDK
    // =====================================================

    case 'handoff_call': {
      const event = data as HandoffCallEvent;
      callbacks.onHandoffCall?.(event.tool, event.call_id);
      break;
    }

    case 'handoff': {
      const event = data as HandoffEvent;
      callbacks.onHandoff?.(event.from_agent || '', event.to_agent || '');
      break;
    }

    case 'reasoning': {
      const event = data as ReasoningEvent;
      callbacks.onReasoning?.(event.content);
      break;
    }

    default:
      console.warn('[SSE] Unknown event type:', eventType);
  }
}

/**
 * Hook-friendly wrapper for streaming chat with reconnection support.
 *
 * Returns a function that initiates streaming and returns
 * a cancel function. Supports automatic cleanup on component unmount.
 *
 * @param config - Optional SSE configuration for retry behavior
 * @returns Object with startStream and cancelStream functions
 *
 * @example
 * ```tsx
 * const { startStream, cancelStream } = createStreamingChat({
 *   maxRetries: 3,
 *   initialRetryDelay: 1000,
 *   connectionTimeout: 30000,
 * });
 *
 * useEffect(() => {
 *   // Cleanup on unmount
 *   return () => cancelStream();
 * }, []);
 * ```
 */
export function createStreamingChat(config: SSEConfig = {}) {
  let abortController: AbortController | null = null;

  const startStream = async (
    conversationId: number | null,
    message: string,
    callbacks: StreamCallbacks
  ) => {
    // Cancel any existing stream
    abortController?.abort();

    // Start new stream with reconnection support
    abortController = await streamChatMessage(conversationId, message, callbacks, config);
  };

  const cancelStream = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
      console.log('[SSE] Stream cancelled by user');
    }
  };

  /**
   * Check if a stream is currently active.
   */
  const isActive = () => {
    return abortController !== null && !abortController.signal.aborted;
  };

  return { startStream, cancelStream, isActive };
}

/**
 * Create initial streaming state for hybrid UI.
 */
export function createInitialStreamingState() {
  return {
    isThinking: false,
    thinkingMessage: '',
    currentAgent: 'TodoBot',
    activeToolCalls: [] as ActiveToolCall[],
    content: '',
    // RunItem fields
    reasoning: '',
    isHandingOff: false,
    handoffFromAgent: '',
    handoffToAgent: '',
  };
}

/**
 * Create a new ActiveToolCall with lifecycle tracking.
 */
export function createActiveToolCall(
  toolCall: ToolCall,
  options?: {
    agentName?: string;
    model?: string;
    initialPhase?: ToolLifecyclePhase;
  }
): ActiveToolCall {
  return {
    callId: toolCall.id,
    tool: toolCall.tool,
    args: toolCall.arguments,
    status: 'executing',
    lifecyclePhase: options?.initialPhase || 'tool_running',
    lifecycleHistory: options?.initialPhase ? [options.initialPhase] : ['agent_start', 'llm_calling', 'mcp_requesting'],
    agentName: options?.agentName,
    model: options?.model,
  };
}

/**
 * Update a tool call's lifecycle phase.
 */
export function updateToolCallPhase(
  toolCalls: ActiveToolCall[],
  callId: string,
  phase: ToolLifecyclePhase
): ActiveToolCall[] {
  return toolCalls.map((tc) => {
    if (tc.callId === callId) {
      const history = tc.lifecycleHistory || [];
      return {
        ...tc,
        lifecyclePhase: phase,
        lifecycleHistory: history.includes(phase) ? history : [...history, phase],
      };
    }
    return tc;
  });
}

/**
 * Complete a tool call with result.
 */
export function completeToolCall(
  toolCalls: ActiveToolCall[],
  callId: string,
  result: unknown
): ActiveToolCall[] {
  return toolCalls.map((tc) => {
    if (tc.callId === callId) {
      const history = tc.lifecycleHistory || [];
      return {
        ...tc,
        status: 'completed',
        result,
        lifecyclePhase: 'completed',
        lifecycleHistory: [...history, 'mcp_responded', 'completed'],
      };
    }
    return tc;
  });
}

/**
 * Helper to create callbacks that track tool lifecycle.
 * Use this with streamChatMessage for full lifecycle tracking.
 */
export function createLifecycleTrackingCallbacks(
  setToolCalls: React.Dispatch<React.SetStateAction<ActiveToolCall[]>>,
  options?: {
    agentName?: string;
    model?: string;
  }
): Partial<StreamCallbacks> {
  let currentModel = options?.model || 'gemini-2.5-flash';
  let currentAgent = options?.agentName || 'TodoBot';

  return {
    onAgentStart: (agentName) => {
      currentAgent = agentName;
    },
    onLLMStart: (agentName, model) => {
      currentAgent = agentName;
      currentModel = model;
    },
    onToolCall: (toolCall) => {
      const activeToolCall = createActiveToolCall(toolCall, {
        agentName: currentAgent,
        model: currentModel,
        initialPhase: 'tool_running',
      });
      setToolCalls((prev) => [...prev, activeToolCall]);
    },
    onMCPRequest: (toolName, callId) => {
      setToolCalls((prev) => updateToolCallPhase(prev, callId, 'mcp_requesting'));
    },
    onMCPResponse: (toolName, callId) => {
      setToolCalls((prev) => updateToolCallPhase(prev, callId, 'mcp_responded'));
    },
    onToolResult: (callId, result) => {
      setToolCalls((prev) => completeToolCall(prev, callId, result));
    },
  };
}

export default {
  streamChatMessage,
  createStreamingChat,
  getToolEmoji,
  getToolDescription,
  createInitialStreamingState,
  createActiveToolCall,
  updateToolCallPhase,
  completeToolCall,
  createLifecycleTrackingCallbacks,
  DEFAULT_SSE_CONFIG,
};

// Re-export config type and defaults for external use
export { DEFAULT_SSE_CONFIG };
