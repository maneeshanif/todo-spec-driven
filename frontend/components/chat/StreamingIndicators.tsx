'use client';

/**
 * StreamingIndicators component displays real-time AI processing states.
 *
 * This provides a hybrid UI experience similar to Grok, showing:
 * - Thinking/processing state with agent name
 * - Active tool calls with execution status
 * - Tool results with success/error indicators
 *
 * Events are received from the SSE stream and rendered in real-time.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getToolEmoji, getToolDescription } from '@/lib/sse/client';
import type { ActiveToolCall, ToolLifecyclePhase } from '@/types/chat';
import {
  Bot,
  Loader2,
  Wrench,
  CheckCircle2,
  XCircle,
  Sparkles,
  Brain,
  ArrowRight,
  Send,
  Cog,
  Download,
  Server,
  Zap,
  ChevronRight,
} from 'lucide-react';
import {
  VerboseLifecycleIndicator,
  type LifecycleStep,
} from './VerboseLifecycleIndicator';

interface StreamingIndicatorsProps {
  /** Whether the agent is thinking/processing */
  isThinking: boolean;
  /** Message shown during thinking state */
  thinkingMessage?: string;
  /** Current agent name (for multi-agent scenarios) */
  currentAgent?: string;
  /** List of active tool calls with their status */
  activeToolCalls: ActiveToolCall[];
  /** Whether tokens are currently streaming */
  isStreaming: boolean;
  /** Current reasoning text from the LLM */
  reasoning?: string;
  /** Whether a handoff is in progress */
  isHandingOff?: boolean;
  /** Source agent for handoff */
  handoffFromAgent?: string;
  /** Target agent for handoff */
  handoffToAgent?: string;
  /** Verbose lifecycle steps (for full lifecycle display) */
  lifecycleSteps?: LifecycleStep[];
  /** Whether to show lifecycle in compact mode */
  compactLifecycle?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Get the icon and status text based on the thinking message
 */
function getThinkingState(message: string): {
  icon: typeof Send;
  statusText: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
} {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('sending') || lowerMessage.includes('request to')) {
    return {
      icon: Send,
      statusText: 'Sending request',
      bgColor: 'bg-blue-500/5',
      borderColor: 'border-blue-500/20',
      iconColor: 'text-blue-500',
    };
  }
  if (lowerMessage.includes('connecting') || lowerMessage.includes('server')) {
    return {
      icon: Server,
      statusText: 'Connecting to server',
      bgColor: 'bg-orange-500/5',
      borderColor: 'border-orange-500/20',
      iconColor: 'text-orange-500',
    };
  }
  if (lowerMessage.includes('processing')) {
    return {
      icon: Brain,
      statusText: 'Processing',
      bgColor: 'bg-purple-500/5',
      borderColor: 'border-purple-500/20',
      iconColor: 'text-purple-500',
    };
  }
  // Default thinking state
  return {
    icon: Bot,
    statusText: 'Thinking',
    bgColor: 'bg-primary/5',
    borderColor: 'border-primary/20',
    iconColor: 'text-primary',
  };
}

/**
 * Thinking indicator - shows when agent is processing/reasoning
 * Shows different states: Sending → Connecting → Processing → Thinking
 */
const ThinkingIndicator = memo(function ThinkingIndicator({
  message,
  agent,
}: {
  message: string;
  agent: string;
}) {
  const state = getThinkingState(message);
  const StateIcon = state.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-3 p-3 sm:p-4 rounded-lg ${state.bgColor} border ${state.borderColor}`}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="shrink-0"
      >
        <Loader2 className={`h-4 w-4 sm:h-5 sm:w-5 ${state.iconColor}`} />
      </motion.div>
      <div className="flex-1 min-w-0">
        <div className={`flex items-center gap-2 text-xs sm:text-sm ${state.iconColor} font-medium`}>
          <StateIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span>{state.statusText}</span>
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            ...
          </motion.span>
        </div>
        {message && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {message}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
            <Bot className="h-2.5 w-2.5 inline mr-1" />
            {agent}
          </span>
        </div>
      </div>
    </motion.div>
  );
});

/**
 * Lifecycle phase configuration with icons, colors, and descriptions
 */
const lifecyclePhaseConfig: Record<
  ToolLifecyclePhase,
  { icon: typeof Bot; color: string; bgColor: string; label: string; description: string }
> = {
  idle: { icon: Bot, color: 'text-gray-400', bgColor: 'bg-gray-400/20', label: 'Idle', description: 'Waiting for input' },
  agent_start: { icon: Bot, color: 'text-blue-500', bgColor: 'bg-blue-500/20', label: 'Agent', description: 'AI agent initialized' },
  llm_thinking: { icon: Brain, color: 'text-purple-500', bgColor: 'bg-purple-500/20', label: 'Thinking', description: 'AI is processing your request' },
  llm_calling: { icon: Brain, color: 'text-purple-500', bgColor: 'bg-purple-500/20', label: 'Calling AI', description: 'Sending request to Gemini' },
  llm_responding: { icon: Sparkles, color: 'text-violet-500', bgColor: 'bg-violet-500/20', label: 'AI Responding', description: 'Receiving AI response' },
  llm_done: { icon: Sparkles, color: 'text-violet-500', bgColor: 'bg-violet-500/20', label: 'AI Done', description: 'AI finished responding' },
  mcp_requesting: { icon: Send, color: 'text-orange-500', bgColor: 'bg-orange-500/20', label: 'Requesting', description: 'Sending tool request to server' },
  tool_running: { icon: Cog, color: 'text-amber-500', bgColor: 'bg-amber-500/20', label: 'Running', description: 'Executing the action' },
  mcp_responded: { icon: Download, color: 'text-green-500', bgColor: 'bg-green-500/20', label: 'Result', description: 'Received tool result' },
  streaming: { icon: Sparkles, color: 'text-cyan-500', bgColor: 'bg-cyan-500/20', label: 'Streaming', description: 'Generating response' },
  completed: { icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-500/20', label: 'Done', description: 'Action completed successfully' },
  error: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-500/20', label: 'Error', description: 'Something went wrong' },
};

/**
 * Get config for a phase with fallback to agent_start
 */
function getPhaseConfig(phase: ToolLifecyclePhase | string) {
  return lifecyclePhaseConfig[phase as ToolLifecyclePhase] || lifecyclePhaseConfig.agent_start;
}

/**
 * Small lifecycle step icon
 */
const LifecycleStepIcon = memo(function LifecycleStepIcon({
  phase,
  isActive,
  isCompleted,
  size = 'sm',
}: {
  phase: ToolLifecyclePhase;
  isActive: boolean;
  isCompleted: boolean;
  size?: 'xs' | 'sm';
}) {
  const config = getPhaseConfig(phase);
  const Icon = config.icon;
  const sizeClasses = size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const containerClasses = size === 'xs' ? 'h-5 w-5' : 'h-6 w-6';

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center transition-all',
        containerClasses,
        isCompleted || isActive ? config.bgColor : 'bg-muted/50',
        isActive && 'ring-2 ring-offset-1 ring-offset-background',
        isActive && config.color.replace('text-', 'ring-')
      )}
    >
      {isActive ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <Loader2 className={cn(sizeClasses, config.color)} />
        </motion.div>
      ) : (
        <Icon
          className={cn(
            sizeClasses,
            isCompleted ? config.color : 'text-muted-foreground/50'
          )}
        />
      )}
    </div>
  );
});

/**
 * Lifecycle progress bar showing all steps with tooltips
 */
const LifecycleProgressBar = memo(function LifecycleProgressBar({
  currentPhase,
  history,
}: {
  currentPhase?: ToolLifecyclePhase;
  history?: ToolLifecyclePhase[];
}) {
  // Default lifecycle order
  const phases: ToolLifecyclePhase[] = [
    'agent_start',
    'llm_calling',
    'mcp_requesting',
    'tool_running',
    'mcp_responded',
    'completed',
  ];

  const completedPhases = new Set(history || []);
  if (currentPhase === 'completed') {
    phases.forEach((p) => completedPhases.add(p));
  }

  return (
    <div className="flex items-center gap-0.5">
      {phases.map((phase, index) => {
        const isActive = phase === currentPhase;
        const isCompleted = completedPhases.has(phase) && phase !== currentPhase;
        const config = getPhaseConfig(phase);

        return (
          <div key={phase} className="flex items-center">
            <div className="relative group">
              <LifecycleStepIcon
                phase={phase}
                isActive={isActive}
                isCompleted={isCompleted}
                size="xs"
              />
              {/* Tooltip with description */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-popover border rounded-md shadow-md text-[10px] text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                <div className={cn('font-medium', config.color)}>{config.label}</div>
                <div className="text-muted-foreground">{config.description}</div>
                {isActive && <div className="text-primary mt-0.5">⏳ In progress...</div>}
                {isCompleted && <div className="text-emerald-500 mt-0.5">✓ Done</div>}
              </div>
            </div>
            {index < phases.length - 1 && (
              <ChevronRight
                className={cn(
                  'h-2.5 w-2.5 mx-0.5',
                  isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/30'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
});

/**
 * Tool call indicator - shows active tool executions with full lifecycle
 */
const ToolCallIndicator = memo(function ToolCallIndicator({
  toolCall,
  showLifecycle = true,
}: {
  toolCall: ActiveToolCall;
  showLifecycle?: boolean;
}) {
  const isExecuting = toolCall.status === 'executing';
  const isCompleted = toolCall.status === 'completed';
  const hasError = Boolean(
    toolCall.result && typeof toolCall.result === 'object' && 'error' in toolCall.result
  );

  // Get result preview
  const resultPreview = toolCall.result
    ? typeof toolCall.result === 'string'
      ? toolCall.result.slice(0, 100)
      : JSON.stringify(toolCall.result).slice(0, 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      {/* Main row with tool info */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Tool emoji */}
        <span className="text-base sm:text-lg shrink-0">
          {getToolEmoji(toolCall.tool)}
        </span>

        {/* Tool info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium text-foreground">
              {getToolDescription(toolCall.tool)}
            </span>
            {toolCall.agentName && (
              <span className="text-[10px] text-muted-foreground">
                via {toolCall.agentName}
              </span>
            )}
          </div>
          {toolCall.model && (
            <div className="flex items-center gap-1 mt-0.5">
              <Zap className="h-2.5 w-2.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{toolCall.model}</span>
            </div>
          )}
        </div>

        {/* Status badge */}
        <div className="shrink-0">
          {isExecuting && !hasError && (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400"
            >
              <Loader2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" />
              <span className="hidden sm:inline">Running</span>
            </motion.span>
          )}
          {isCompleted && !hasError && (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span className="hidden sm:inline">Done</span>
            </span>
          )}
          {hasError && (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400">
              <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span className="hidden sm:inline">Failed</span>
            </span>
          )}
        </div>
      </div>

      {/* Lifecycle progress bar */}
      {showLifecycle && (
        <div className="pl-7 sm:pl-9">
          <LifecycleProgressBar
            currentPhase={
              hasError
                ? 'error'
                : isCompleted
                  ? 'completed'
                  : toolCall.lifecyclePhase || 'tool_running'
            }
            history={toolCall.lifecycleHistory}
          />
        </div>
      )}

      {/* Result preview */}
      {resultPreview && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="pl-7 sm:pl-9"
        >
          <div className="p-2 rounded bg-muted/30 border border-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Server className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">Response</span>
            </div>
            <pre className="text-[10px] sm:text-xs text-muted-foreground font-mono overflow-hidden text-ellipsis whitespace-nowrap">
              {resultPreview}{resultPreview.length >= 100 ? '...' : ''}
            </pre>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});

/**
 * Tool calls container - groups multiple tool call indicators
 */
const ToolCallsContainer = memo(function ToolCallsContainer({
  toolCalls,
}: {
  toolCalls: ActiveToolCall[];
}) {
  if (toolCalls.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border"
    >
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
        <span className="text-xs sm:text-sm font-medium text-muted-foreground">
          Actions
        </span>
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        {toolCalls.map((tc) => (
          <ToolCallIndicator key={tc.callId} toolCall={tc} />
        ))}
      </div>
    </motion.div>
  );
});

/**
 * Streaming content indicator - shows when response is being generated
 */
const StreamingContentIndicator = memo(function StreamingContentIndicator({
  agent,
}: {
  agent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"
    >
      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
      <span>{agent} is responding</span>
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ repeat: Infinity, duration: 0.5 }}
        className="inline-block w-1.5 h-3.5 sm:w-2 sm:h-4 bg-primary/50 rounded-sm"
      />
    </motion.div>
  );
});

/**
 * Reasoning indicator - shows LLM's internal thinking process
 */
const ReasoningIndicator = memo(function ReasoningIndicator({
  content,
}: {
  content: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-3 sm:p-4 rounded-lg bg-violet-500/5 border border-violet-500/20"
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="shrink-0 mt-0.5"
        >
          <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="text-xs sm:text-sm font-medium text-violet-600 dark:text-violet-400 mb-1">
            Reasoning
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">
            {content}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

/**
 * Handoff indicator - shows when agent is handing off to another agent
 */
const HandoffIndicator = memo(function HandoffIndicator({
  fromAgent,
  toAgent,
}: {
  fromAgent: string;
  toAgent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-blue-500/5 border border-blue-500/20"
    >
      <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 shrink-0" />
      <span className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
        {fromAgent}
      </span>
      <motion.div
        animate={{ x: [0, 4, 0] }}
        transition={{ repeat: Infinity, duration: 1 }}
      >
        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
      </motion.div>
      <span className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
        {toAgent}
      </span>
    </motion.div>
  );
});

/**
 * Main StreamingIndicators component
 */
export function StreamingIndicators({
  isThinking,
  thinkingMessage = 'Processing your request...',
  currentAgent = 'TodoBot',
  activeToolCalls,
  isStreaming,
  reasoning,
  isHandingOff,
  handoffFromAgent,
  handoffToAgent,
  lifecycleSteps,
  compactLifecycle = false,
  className,
}: StreamingIndicatorsProps) {
  // Don't render if nothing is happening
  const hasActivity = isThinking ||
    activeToolCalls.length > 0 ||
    isStreaming ||
    !!reasoning ||
    isHandingOff ||
    (lifecycleSteps && lifecycleSteps.length > 0);

  if (!hasActivity) {
    return null;
  }

  return (
    <div className={cn('space-y-2 sm:space-y-3', className)}>
      <AnimatePresence mode="wait">
        {/* Verbose Lifecycle Indicator (full lifecycle view) */}
        {lifecycleSteps && lifecycleSteps.length > 0 && (
          <VerboseLifecycleIndicator
            key="lifecycle"
            steps={lifecycleSteps}
            compact={compactLifecycle}
          />
        )}

        {/* Handoff indicator (highest priority) - shown when no lifecycle */}
        {!lifecycleSteps?.length && isHandingOff && handoffFromAgent && handoffToAgent && (
          <HandoffIndicator
            key="handoff"
            fromAgent={handoffFromAgent}
            toAgent={handoffToAgent}
          />
        )}

        {/* Thinking state - shown when no lifecycle */}
        {!lifecycleSteps?.length && isThinking && !isHandingOff && (
          <ThinkingIndicator
            key="thinking"
            message={thinkingMessage}
            agent={currentAgent}
          />
        )}

        {/* Reasoning indicator - shown when no lifecycle */}
        {!lifecycleSteps?.length && reasoning && !isThinking && !isHandingOff && (
          <ReasoningIndicator key="reasoning" content={reasoning} />
        )}

        {/* Tool calls - always show even with lifecycle */}
        {activeToolCalls.length > 0 && (
          <ToolCallsContainer key="tools" toolCalls={activeToolCalls} />
        )}

        {/* Streaming indicator (only when not thinking, not reasoning, and not showing tool calls) */}
        {!lifecycleSteps?.length && isStreaming && !isThinking && !reasoning && activeToolCalls.length === 0 && !isHandingOff && (
          <StreamingContentIndicator key="streaming" agent={currentAgent} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Re-export VerboseLifecycleIndicator for direct use
export { VerboseLifecycleIndicator, type LifecycleStep };

export default StreamingIndicators;
