/**
 * useVerboseLifecycle - Hook for managing agent lifecycle state.
 *
 * Tracks the full agent execution lifecycle:
 * Agent Start → LLM Start → LLM End → MCP Request → Tool Running → MCP Response → Agent End
 *
 * Usage:
 * ```tsx
 * const { steps, addStep, completeLastStep, reset, callbacks } = useVerboseLifecycle();
 *
 * // Use callbacks directly with SSE client
 * streamChatMessage(conversationId, message, {
 *   ...callbacks,
 *   onToken: (token) => { ... },
 *   onDone: () => { ... },
 * });
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import type { StreamCallbacks } from '@/lib/sse/client';
import type {
  LifecycleStep,
  LifecycleStepType,
} from '@/components/chat/VerboseLifecycleIndicator';
import {
  createLifecycleStep,
  completeStep,
} from '@/components/chat/VerboseLifecycleIndicator';

interface UseVerboseLifecycleReturn {
  /** Current lifecycle steps */
  steps: LifecycleStep[];
  /** Add a new step to the lifecycle */
  addStep: (
    type: LifecycleStepType,
    message: string,
    options?: Partial<LifecycleStep>
  ) => void;
  /** Complete the last active step */
  completeLastStep: () => void;
  /** Complete a specific step by type */
  completeStepByType: (type: LifecycleStepType) => void;
  /** Reset lifecycle state */
  reset: () => void;
  /** Pre-built callbacks for SSE streaming */
  callbacks: Partial<StreamCallbacks>;
  /** Whether lifecycle is currently active */
  isActive: boolean;
}

/**
 * Hook for managing verbose agent lifecycle state
 */
export function useVerboseLifecycle(): UseVerboseLifecycleReturn {
  const [steps, setSteps] = useState<LifecycleStep[]>([]);

  /**
   * Add a new step to the lifecycle
   */
  const addStep = useCallback(
    (
      type: LifecycleStepType,
      message: string,
      options?: Partial<LifecycleStep>
    ) => {
      const newStep = createLifecycleStep(type, message, options);
      setSteps((prev) => {
        // Complete the previous active step if exists
        const updated = prev.map((s) =>
          s.status === 'active' ? completeStep(s) : s
        );
        return [...updated, newStep];
      });
    },
    []
  );

  /**
   * Complete the last active step
   */
  const completeLastStep = useCallback(() => {
    setSteps((prev) => {
      const lastActiveIndex = prev.findLastIndex((s) => s.status === 'active');
      if (lastActiveIndex === -1) return prev;
      return prev.map((s, i) =>
        i === lastActiveIndex ? completeStep(s) : s
      );
    });
  }, []);

  /**
   * Complete a specific step by type
   */
  const completeStepByType = useCallback((type: LifecycleStepType) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.type === type && s.status === 'active' ? completeStep(s) : s
      )
    );
  }, []);

  /**
   * Reset lifecycle state
   */
  const reset = useCallback(() => {
    setSteps([]);
  }, []);

  /**
   * Pre-built callbacks for SSE streaming with verbose events
   */
  const callbacks = useMemo<Partial<StreamCallbacks>>(
    () => ({
      // Agent lifecycle events
      onAgentStart: (agentName, message) => {
        addStep('agent_start', message, { agentName });
      },
      onAgentEnd: (agentName, message) => {
        completeLastStep();
        addStep('agent_end', message, { agentName, status: 'completed' });
      },

      // LLM events
      onLLMStart: (agentName, model) => {
        completeLastStep();
        addStep('llm_start', `Calling ${model}...`, { agentName, model });
      },
      onLLMEnd: (agentName) => {
        completeStepByType('llm_start');
        addStep('llm_end', 'Response received', {
          agentName,
          status: 'completed',
        });
      },

      // MCP events
      onMCPRequest: (toolName, callId, agentName) => {
        completeLastStep();
        addStep('mcp_request', `Requesting ${toolName}`, {
          toolName,
          agentName,
        });
      },
      onMCPResponse: (toolName, callId, agentName) => {
        completeStepByType('mcp_request');
        completeStepByType('tool_running');
        addStep('mcp_response', `${toolName} responded`, {
          toolName,
          agentName,
          status: 'completed',
        });
      },

      // Tool call events (from RunItem)
      onToolCall: (toolCall) => {
        completeLastStep();
        addStep('tool_running', `Running ${toolCall.tool}`, {
          toolName: toolCall.tool,
        });
      },
      onToolResult: (callId, output) => {
        completeStepByType('tool_running');
      },

      // Handoff events
      onHandoffCall: (tool, callId) => {
        addStep('handoff', `Initiating handoff...`);
      },
      onHandoff: (fromAgent, toAgent) => {
        completeLastStep();
        addStep('handoff', `${fromAgent} → ${toAgent}`, {
          fromAgent,
          toAgent,
          status: 'completed',
        });
      },
    }),
    [addStep, completeLastStep, completeStepByType]
  );

  const isActive = steps.some((s) => s.status === 'active');

  return {
    steps,
    addStep,
    completeLastStep,
    completeStepByType,
    reset,
    callbacks,
    isActive,
  };
}

export default useVerboseLifecycle;
