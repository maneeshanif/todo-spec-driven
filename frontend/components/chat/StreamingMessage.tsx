'use client';

/**
 * StreamingMessage component - displays a message being streamed from the AI.
 *
 * Features:
 * - Animated cursor while streaming
 * - Tool call indicators with full lifecycle icons and timing
 * - Thinking indicator with agent name
 * - Tool result display with response preview
 * - Smooth text appearance with staggered animations
 * - Duration tracking for each lifecycle phase
 * - Responsive design (mobile-friendly sizing)
 */

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Bot,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Brain,
  Send,
  Cog,
  Download,
  Server,
  Zap,
  ChevronRight,
  Clock,
  Play,
  Timer,
} from 'lucide-react';
import type { ActiveToolCall, ToolLifecyclePhase, LifecycleStepInfo } from '@/types/chat';
import { getToolEmoji, getToolDescription } from '@/lib/sse/client';

interface StreamingMessageProps {
  content: string;
  toolCalls?: ActiveToolCall[];
  isThinking?: boolean;
  thinkingMessage?: string;
  agentName?: string;
  className?: string;
}

export function StreamingMessage({
  content,
  toolCalls = [],
  isThinking = false,
  thinkingMessage = 'Processing your request...',
  agentName = 'TodoBot',
  className,
}: StreamingMessageProps) {
  const hasContent = content.length > 0;
  const hasToolCalls = toolCalls.length > 0;

  return (
    <div className={cn('flex gap-2 sm:gap-3', className)}>
      {/* Bot avatar */}
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 relative">
        <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
        {/* Online indicator when processing */}
        {(isThinking || hasToolCalls) && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
        )}
      </div>

      <div className="flex-1 max-w-[90%] sm:max-w-[80%] space-y-2">
        {/* Agent name badge when thinking */}
        {isThinking && !hasContent && !hasToolCalls && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Sparkles className="h-3 w-3" />
            <span>{agentName}</span>
          </div>
        )}

        {/* Thinking indicator */}
        {isThinking && !hasContent && !hasToolCalls && (
          <ThinkingIndicator message={thinkingMessage} />
        )}

        {/* Tool calls in progress */}
        {hasToolCalls && (
          <div className="space-y-1.5">
            {toolCalls.map((toolCall, index) => (
              <ToolCallIndicator
                key={toolCall.callId || index}
                toolCall={toolCall}
              />
            ))}
          </div>
        )}

        {/* Streaming content */}
        {hasContent && (
          <div className="bg-muted rounded-lg px-3 py-2 sm:px-4 sm:py-3">
            <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">
              {content}
              {/* Animated cursor */}
              <span className="inline-block w-1.5 h-3.5 sm:w-2 sm:h-4 bg-primary/50 animate-pulse ml-0.5 align-middle" />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ThinkingIndicatorProps {
  message: string;
}

function ThinkingIndicator({ message }: ThinkingIndicatorProps) {
  return (
    <div className="bg-muted rounded-lg px-3 py-2 sm:px-4 sm:py-3">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span>{message}</span>
      </div>
    </div>
  );
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Lifecycle phase configuration with icons, colors, and labels
 */
const lifecyclePhaseConfig: Record<
  ToolLifecyclePhase,
  {
    icon: typeof Bot;
    color: string;
    bgColor: string;
    borderColor: string;
    glowColor: string;
    label: string;
    description: string;
  }
> = {
  idle: {
    icon: Clock,
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
    borderColor: 'border-gray-400/30',
    glowColor: 'shadow-gray-400/20',
    label: 'Idle',
    description: 'Waiting to start'
  },
  agent_start: {
    icon: Bot,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/40',
    glowColor: 'shadow-blue-500/30',
    label: 'Agent',
    description: 'Agent initialized'
  },
  llm_thinking: {
    icon: Brain,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/40',
    glowColor: 'shadow-purple-500/30',
    label: 'Thinking',
    description: 'LLM processing'
  },
  llm_calling: {
    icon: Brain,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/40',
    glowColor: 'shadow-purple-500/30',
    label: 'Calling',
    description: 'LLM calling'
  },
  llm_responding: {
    icon: Sparkles,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/15',
    borderColor: 'border-violet-500/40',
    glowColor: 'shadow-violet-500/30',
    label: 'Responding',
    description: 'Generating response'
  },
  llm_done: {
    icon: Sparkles,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/15',
    borderColor: 'border-violet-500/40',
    glowColor: 'shadow-violet-500/30',
    label: 'Done',
    description: 'LLM response received'
  },
  mcp_requesting: {
    icon: Send,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/15',
    borderColor: 'border-orange-500/40',
    glowColor: 'shadow-orange-500/30',
    label: 'MCP Req',
    description: 'Sending MCP request'
  },
  tool_running: {
    icon: Cog,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/40',
    glowColor: 'shadow-amber-500/30',
    label: 'Running',
    description: 'Tool executing'
  },
  mcp_responded: {
    icon: Download,
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/15',
    borderColor: 'border-teal-500/40',
    glowColor: 'shadow-teal-500/30',
    label: 'MCP Res',
    description: 'Response received'
  },
  streaming: {
    icon: Play,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/40',
    glowColor: 'shadow-cyan-500/30',
    label: 'Streaming',
    description: 'Streaming response'
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/40',
    glowColor: 'shadow-emerald-500/30',
    label: 'Done',
    description: 'Completed successfully'
  },
  error: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/15',
    borderColor: 'border-red-500/40',
    glowColor: 'shadow-red-500/30',
    label: 'Error',
    description: 'An error occurred'
  },
};

// Backward compatibility alias
const lifecyclePhaseLegacy: Record<string, ToolLifecyclePhase> = {
  llm_calling: 'llm_thinking',
  llm_done: 'llm_responding',
};

/**
 * Get config for a phase, with fallback for legacy phase names
 */
function getPhaseConfig(phase: ToolLifecyclePhase | string) {
  const normalizedPhase = lifecyclePhaseLegacy[phase] || phase;
  return lifecyclePhaseConfig[normalizedPhase as ToolLifecyclePhase] || lifecyclePhaseConfig.idle;
}

/**
 * Small lifecycle step icon
 */
const LifecycleStepIcon = memo(function LifecycleStepIcon({
  phase,
  isActive,
  isCompleted,
}: {
  phase: ToolLifecyclePhase;
  isActive: boolean;
  isCompleted: boolean;
}) {
  const config = getPhaseConfig(phase);
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'h-5 w-5 rounded-full flex items-center justify-center transition-all',
        isCompleted || isActive ? config.bgColor : 'bg-muted/50',
        isActive && 'ring-2 ring-offset-1 ring-offset-background',
        isActive && config.color.replace('text-', 'ring-')
      )}
      title={config.label}
    >
      {isActive ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <Loader2 className={cn('h-3 w-3', config.color)} />
        </motion.div>
      ) : (
        <Icon
          className={cn(
            'h-3 w-3',
            isCompleted ? config.color : 'text-muted-foreground/40'
          )}
        />
      )}
    </div>
  );
});

/**
 * Lifecycle progress bar with all steps
 */
const LifecycleProgressBar = memo(function LifecycleProgressBar({
  currentPhase,
  history,
}: {
  currentPhase?: ToolLifecyclePhase;
  history?: ToolLifecyclePhase[];
}) {
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
    <div className="flex items-center gap-0.5 mt-2">
      {phases.map((phase, index) => {
        const isActive = phase === currentPhase;
        const isCompleted = completedPhases.has(phase) && phase !== currentPhase;

        return (
          <div key={phase} className="flex items-center">
            <LifecycleStepIcon
              phase={phase}
              isActive={isActive}
              isCompleted={isCompleted}
            />
            {index < phases.length - 1 && (
              <ChevronRight
                className={cn(
                  'h-3 w-3 mx-0.5',
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

interface ToolCallIndicatorProps {
  toolCall: ActiveToolCall;
}

function ToolCallIndicator({ toolCall }: ToolCallIndicatorProps) {
  const emoji = getToolEmoji(toolCall.tool);
  const description = getToolDescription(toolCall.tool);
  const isExecuting = toolCall.status === 'pending' || toolCall.status === 'executing';
  const isCompleted = toolCall.status === 'completed';
  const isError = toolCall.status === 'error';

  // Determine current lifecycle phase
  const currentPhase: ToolLifecyclePhase = isError
    ? 'error'
    : isCompleted
      ? 'completed'
      : toolCall.lifecyclePhase || 'tool_running';

  // Get result preview
  const resultPreview = toolCall.result
    ? typeof toolCall.result === 'string'
      ? toolCall.result
      : JSON.stringify(toolCall.result)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-background border rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 transition-all duration-200',
        isExecuting && 'border-primary/40 bg-primary/5',
        isCompleted && 'border-green-500/30 bg-green-500/5',
        isError && 'border-red-500/30 bg-red-500/5'
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Tool emoji */}
        <span className="text-lg sm:text-xl shrink-0">{emoji}</span>

        {/* Tool info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{description}</span>
            {toolCall.agentName && (
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
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
          {isExecuting && (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="hidden sm:inline">Running</span>
            </motion.span>
          )}
          {isCompleted && !isError && (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3" />
              <span className="hidden sm:inline">Done</span>
            </span>
          )}
          {isError && (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400">
              <XCircle className="h-3 w-3" />
              <span className="hidden sm:inline">Failed</span>
            </span>
          )}
        </div>
      </div>

      {/* Lifecycle progress icons */}
      <LifecycleProgressBar
        currentPhase={currentPhase}
        history={toolCall.lifecycleHistory}
      />

      {/* Result preview */}
      <AnimatePresence>
        {resultPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2"
          >
            <div className="p-2 rounded bg-muted/50 border border-border/50">
              <div className="flex items-center gap-1.5 mb-1">
                <Server className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Response</span>
              </div>
              <pre className="text-[10px] sm:text-xs text-muted-foreground font-mono overflow-hidden whitespace-pre-wrap break-all max-h-20 overflow-y-auto">
                {resultPreview.length > 200 ? resultPreview.slice(0, 200) + '...' : resultPreview}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function formatArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args);
  if (entries.length === 0) return '';

  return entries
    .slice(0, 2)
    .map(([key, value]) => {
      const strValue = typeof value === 'string' ? value : JSON.stringify(value);
      const truncated = strValue.length > 20 ? strValue.slice(0, 20) + '...' : strValue;
      return `${key}: ${truncated}`;
    })
    .join(', ');
}

function formatResult(result: unknown): string {
  if (typeof result === 'string') {
    return result.length > 50 ? result.slice(0, 50) + '...' : result;
  }

  if (typeof result === 'object' && result !== null) {
    const obj = result as Record<string, unknown>;

    // Common result patterns
    if (obj.status === 'created' && obj.title) {
      return `Created: "${obj.title}"`;
    }
    if (obj.status === 'completed' && obj.title) {
      return `Completed: "${obj.title}"`;
    }
    if (obj.status === 'deleted') {
      return 'Task deleted';
    }
    if (obj.status === 'updated' && obj.title) {
      return `Updated: "${obj.title}"`;
    }
    if (Array.isArray(obj.tasks)) {
      return `Found ${obj.tasks.length} task(s)`;
    }
    if (obj.count !== undefined) {
      return `${obj.count} task(s)`;
    }

    return 'Done';
  }

  return String(result);
}
