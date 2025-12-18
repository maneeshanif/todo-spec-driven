'use client';

/**
 * VerboseLifecycleIndicator - Shows the full agent lifecycle with icons.
 *
 * Displays a visual timeline of agent execution steps:
 * 1. Agent Start (🤖) - Agent initialized
 * 2. LLM Start (🧠) - Calling Gemini
 * 3. LLM End (✨) - Response received
 * 4. MCP Request (📤) - Tool request sent
 * 5. Tool Running (⚙️) - Tool executing
 * 6. MCP Response (📥) - Tool response received
 * 7. Handoff (🔄) - Agent handoff (multi-agent)
 * 8. Agent End (✅) - Agent finished
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Bot,
  Brain,
  Sparkles,
  Send,
  Cog,
  Download,
  RefreshCw,
  CheckCircle,
  Loader2,
  Server,
  Zap,
} from 'lucide-react';

/** Lifecycle step type */
export type LifecycleStepType =
  | 'agent_start'
  | 'llm_start'
  | 'llm_end'
  | 'mcp_request'
  | 'tool_running'
  | 'mcp_response'
  | 'handoff'
  | 'agent_end';

/** A single lifecycle step */
export interface LifecycleStep {
  id: string;
  type: LifecycleStepType;
  message: string;
  timestamp: Date;
  agentName?: string;
  toolName?: string;
  model?: string;
  fromAgent?: string;
  toAgent?: string;
  status: 'active' | 'completed' | 'pending';
}

/** Props for VerboseLifecycleIndicator */
interface VerboseLifecycleIndicatorProps {
  /** List of lifecycle steps to display */
  steps: LifecycleStep[];
  /** Whether to show in compact mode (single line) */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

/** Icon configuration for each step type with descriptive info */
const stepConfig: Record<
  LifecycleStepType,
  {
    icon: typeof Bot;
    label: string;
    description: string;
    color: string;
    bgColor: string;
  }
> = {
  agent_start: {
    icon: Bot,
    label: 'Agent Started',
    description: 'Initializing AI agent to process your request',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  llm_start: {
    icon: Brain,
    label: 'Thinking',
    description: 'Sending request to Gemini AI model',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  llm_end: {
    icon: Sparkles,
    label: 'AI Response',
    description: 'Received response from the AI model',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
  },
  mcp_request: {
    icon: Send,
    label: 'Tool Request',
    description: 'Sending request to MCP server for task operation',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  tool_running: {
    icon: Cog,
    label: 'Executing',
    description: 'Running the tool to perform the requested action',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  mcp_response: {
    icon: Download,
    label: 'Tool Result',
    description: 'Received result from the MCP server',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  handoff: {
    icon: RefreshCw,
    label: 'Handoff',
    description: 'Transferring control to another agent',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  agent_end: {
    icon: CheckCircle,
    label: 'Complete',
    description: 'Agent finished processing your request',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
};

/**
 * Single lifecycle step icon
 */
const StepIcon = memo(function StepIcon({
  step,
  size = 'sm',
}: {
  step: LifecycleStep;
  size?: 'sm' | 'md';
}) {
  const config = stepConfig[step.type];
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const containerClasses =
    size === 'sm' ? 'h-6 w-6 sm:h-7 sm:w-7' : 'h-8 w-8 sm:h-9 sm:w-9';

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        'rounded-full flex items-center justify-center',
        config.bgColor,
        containerClasses
      )}
    >
      {step.status === 'active' ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <Loader2 className={cn(sizeClasses, config.color)} />
        </motion.div>
      ) : (
        <Icon className={cn(sizeClasses, config.color)} />
      )}
    </motion.div>
  );
});

/**
 * Compact view - horizontal icons with connector lines and tooltips
 */
const CompactView = memo(function CompactView({
  steps,
  className,
}: {
  steps: LifecycleStep[];
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1 flex-wrap', className)}>
      {steps.map((step, index) => {
        const config = stepConfig[step.type];
        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.15 }}
            className="flex items-center"
          >
            <div className="relative group">
              <StepIcon step={step} size="sm" />
              {/* Tooltip with description */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-popover border rounded-md shadow-md text-[10px] text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 max-w-[200px]">
                <div className={cn('font-medium', config.color)}>{config.label}</div>
                <div className="text-muted-foreground">{config.description}</div>
                {step.status === 'active' && (
                  <div className="text-primary mt-0.5">⏳ In progress...</div>
                )}
                {step.status === 'completed' && (
                  <div className="text-emerald-500 mt-0.5">✓ Completed</div>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 16 }}
                transition={{ delay: index * 0.05 + 0.1, duration: 0.1 }}
                className="h-0.5 bg-muted-foreground/30 mx-0.5"
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
});

/**
 * Detailed step item with message
 */
const DetailedStepItem = memo(function DetailedStepItem({
  step,
  isLast,
  index,
}: {
  step: LifecycleStep;
  isLast: boolean;
  index: number;
}) {
  const config = stepConfig[step.type];
  // Use the step's custom message if provided, otherwise use the default description
  const displayMessage = step.message || config.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05, // Stagger animation from top
        duration: 0.2,
        ease: 'easeOut'
      }}
      className="flex items-start gap-2 sm:gap-3"
    >
      {/* Icon with vertical connector */}
      <div className="flex flex-col items-center">
        <StepIcon step={step} size="md" />
        {!isLast && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 20 }}
            transition={{ delay: index * 0.05 + 0.1, duration: 0.15 }}
            className="w-0.5 bg-muted-foreground/20 mt-1"
          />
        )}
      </div>

      {/* Step details */}
      <div className="flex-1 min-w-0 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn('text-xs sm:text-sm font-medium', config.color)}
          >
            {config.label}
          </span>
          {step.status === 'active' && (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary"
            >
              Running
            </motion.span>
          )}
          {step.status === 'completed' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              ✓ Done
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {displayMessage}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {step.toolName && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
              <Server className="h-2.5 w-2.5" />
              {step.toolName}
            </span>
          )}
          {step.model && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
              <Zap className="h-2.5 w-2.5" />
              {step.model}
            </span>
          )}
          {step.agentName && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
              <Bot className="h-2.5 w-2.5" />
              {step.agentName}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

/**
 * Detailed view - vertical list with full info
 */
const DetailedView = memo(function DetailedView({
  steps,
  className,
}: {
  steps: LifecycleStep[];
  className?: string;
}) {
  return (
    <div className={cn('space-y-0', className)}>
      {steps.map((step, index) => (
        <DetailedStepItem
          key={step.id}
          step={step}
          isLast={index === steps.length - 1}
          index={index}
        />
      ))}
    </div>
  );
});

/**
 * Main VerboseLifecycleIndicator component
 */
export function VerboseLifecycleIndicator({
  steps,
  compact = false,
  className,
}: VerboseLifecycleIndicatorProps) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'p-3 sm:p-4 rounded-lg border',
        'bg-gradient-to-br from-muted/30 to-muted/10',
        'border-border/50',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-xs sm:text-sm font-medium text-muted-foreground">
          Agent Lifecycle
        </span>
      </div>

      {/* Steps */}
      <AnimatePresence mode="sync">
        {compact ? (
          <CompactView steps={steps} />
        ) : (
          <DetailedView steps={steps} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Helper to create a lifecycle step
 */
export function createLifecycleStep(
  type: LifecycleStepType,
  message: string,
  options?: Partial<Omit<LifecycleStep, 'id' | 'type' | 'message' | 'timestamp'>>
): LifecycleStep {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    message,
    timestamp: new Date(),
    status: 'active',
    ...options,
  };
}

/**
 * Helper to mark a step as completed
 */
export function completeStep(step: LifecycleStep): LifecycleStep {
  return { ...step, status: 'completed' };
}

export default VerboseLifecycleIndicator;
