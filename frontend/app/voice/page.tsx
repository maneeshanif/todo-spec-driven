"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Volume2, Sparkles, Loader2, Bot, Wrench, CheckCircle2, Clock, AlertCircle, MessageSquarePlus, History, X } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { useTaskStore } from "@/stores/task-store";
import { toast } from "sonner";
import { streamChatMessage, getToolEmoji, getToolDescription } from "@/lib/sse/client";
import type { ToolCall, ActiveToolCall } from "@/types/chat";

// Luxury color palette
const colors = {
  bg: "#f8f5f0",
  bgAlt: "#f0ebe3",
  goldDark: "#a08339",
  gold: "#c9a962",
  text: "#1a1a1a",
  textMuted: "#666666",
  border: "#e5dfd5",
  textLight: "#ffffff",
  red: "#8b2635",
  green: "#2d5a27",
  blue: "#1e40af",
};

/**
 * Clean text for speech synthesis - removes markdown, emojis, and formatting
 */
function cleanTextForSpeech(text: string): string {
  return text
    // Remove markdown tables
    .replace(/\|[^\n]*\|/g, '')
    .replace(/\|-+\|/g, '')
    // Remove markdown bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove markdown headers
    .replace(/#{1,6}\s*/g, '')
    // Remove emojis (common ranges)
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]/gu, '')
    // Remove special symbols like ✓ ⏳ etc
    .replace(/[✓✅⏳🔴🟡🟢📋➕🎉⚠️❌]/g, '')
    // Remove markdown links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove code blocks
    .replace(/```[^`]*```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Clean up multiple spaces and newlines
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    // Remove leading/trailing spaces
    .trim();
}

/**
 * Parse markdown response into structured data for better UI display
 */
interface ParsedTask {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  due?: string;
  status: 'pending' | 'completed';
}

interface ParsedResponse {
  type: 'task_list' | 'task_created' | 'task_completed' | 'question' | 'general';
  message: string;
  tasks?: ParsedTask[];
  summary?: string;
}

function parseAIResponse(text: string): ParsedResponse {
  // Check if it's a task list (contains table)
  if (text.includes('| #') || text.includes('|---|')) {
    const tasks: ParsedTask[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      // Parse table rows (skip header and separator)
      if (line.includes('|') && !line.includes('| #') && !line.includes('|---')) {
        const cells = line.split('|').map(c => c.trim()).filter(Boolean);
        if (cells.length >= 4) {
          const priorityCell = cells[2]?.toLowerCase() || '';
          let priority: 'high' | 'medium' | 'low' = 'medium';
          if (priorityCell.includes('high') || priorityCell.includes('🔴')) priority = 'high';
          else if (priorityCell.includes('low') || priorityCell.includes('🟢')) priority = 'low';

          const statusCell = cells[4]?.toLowerCase() || '';
          const status: 'pending' | 'completed' =
            statusCell.includes('done') || statusCell.includes('completed') || statusCell.includes('✅')
              ? 'completed' : 'pending';

          tasks.push({
            id: cells[0] || String(tasks.length + 1),
            title: cells[1]?.replace(/\*\*/g, '') || 'Unknown task',
            priority,
            due: cells[3] || undefined,
            status,
          });
        }
      }
    }

    // Extract summary (text after the table)
    const summaryMatch = text.match(/You have[^!]+!/i);
    const summary = summaryMatch ? cleanTextForSpeech(summaryMatch[0]) : undefined;

    // Build a speech-friendly message that includes task names
    let spokenMessage = summary || '';

    if (tasks.length > 0) {
      const pendingTasks = tasks.filter(t => t.status === 'pending');
      const completedTasks = tasks.filter(t => t.status === 'completed');

      if (pendingTasks.length > 0) {
        spokenMessage += ` Your pending tasks are: ${pendingTasks.map(t => t.title).join(', ')}.`;
      }

      if (completedTasks.length > 0) {
        spokenMessage += ` Completed tasks: ${completedTasks.map(t => t.title).join(', ')}.`;
      }
    } else {
      spokenMessage = "You don't have any tasks yet.";
    }

    return {
      type: 'task_list',
      message: spokenMessage.trim(),
      tasks,
      summary,
    };
  }

  // Check if it's a task creation confirmation
  if (text.toLowerCase().includes('created') || text.toLowerCase().includes('added')) {
    return {
      type: 'task_created',
      message: cleanTextForSpeech(text),
    };
  }

  // Check if it's a task completion
  if (text.toLowerCase().includes('completed') || text.toLowerCase().includes('marked as done')) {
    return {
      type: 'task_completed',
      message: cleanTextForSpeech(text),
    };
  }

  // Check if it's a question/clarification
  if (text.includes('?') && (
    text.toLowerCase().includes('which') ||
    text.toLowerCase().includes('what') ||
    text.toLowerCase().includes('could you') ||
    text.toLowerCase().includes('can you') ||
    text.toLowerCase().includes('please specify')
  )) {
    return {
      type: 'question',
      message: cleanTextForSpeech(text),
    };
  }

  return {
    type: 'general',
    message: cleanTextForSpeech(text),
  };
}

/**
 * Get priority color
 */
function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high': return colors.red;
    case 'low': return colors.green;
    default: return colors.gold;
  }
}

// Conversation message type for history
interface ConversationMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function VoiceAssistantPage() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [parsedResponse, setParsedResponse] = useState<ParsedResponse | null>(null);
  const [supported, setSupported] = useState(true);

  // AI Streaming state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState("");
  const [currentAgent, setCurrentAgent] = useState("TodoBot");
  const [streamingContent, setStreamingContent] = useState("");
  const [activeToolCalls, setActiveToolCalls] = useState<ActiveToolCall[]>([]);
  const [workflowComplete, setWorkflowComplete] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);

  // Conversation history
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Track what we've already spoken to avoid repeating
  const spokenToolsRef = useRef<Set<string>>(new Set());
  const hasSpokenThinkingRef = useRef(false);

  // Ref for abort controller
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchTasks = useTaskStore((s) => s.fetchTasks);

  // Start a new conversation
  const startNewConversation = () => {
    setConversationId(null);
    setConversationHistory([]);
    setTranscript("");
    setResponse("");
    setParsedResponse(null);
    setStreamingContent("");
    setActiveToolCalls([]);
    setWorkflowComplete(false);
    setIsThinking(false);
    setThinkingMessage("");
    speak("Starting a new conversation. How can I help you?");
    toast.success("New conversation started");
  };

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setSupported(false);
    }
    // Fetch tasks on mount so AI has task data
    fetchTasks();

    // Cleanup on unmount
    return () => {
      abortControllerRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, [fetchTasks]);

  const startListening = () => {
    if (!supported) {
      alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    // Reset spoken tracking
    spokenToolsRef.current.clear();
    hasSpokenThinkingRef.current = false;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setResponse("");
      setParsedResponse(null);
      setStreamingContent("");
      setActiveToolCalls([]);
      setIsThinking(false);
      setThinkingMessage("");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTranscript(transcript);
      // Acknowledge the user's input
      speak("Got it. Let me help you with that.");
      processWithAI(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === 'no-speech') {
        speak("I didn't hear anything. Please try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const processWithAI = async (message: string) => {
    setIsProcessing(true);
    setStreamingContent("");
    setActiveToolCalls([]);
    setWorkflowComplete(false);
    setResponse("");
    setParsedResponse(null);

    // Add user message to history
    const userMessage: ConversationMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setConversationHistory((prev) => [...prev, userMessage]);

    try {
      abortControllerRef.current = await streamChatMessage(
        conversationId,
        message,
        {
          // Thinking event - show spinner with message and speak
          onThinking: (content, agent) => {
            setIsThinking(true);
            setThinkingMessage(content);
            setCurrentAgent(agent);

            // Speak thinking state only once
            if (!hasSpokenThinkingRef.current) {
              hasSpokenThinkingRef.current = true;
              speak("Let me think about that...");
            }
          },
          // Token event - append to streaming content
          onToken: (token) => {
            setIsThinking(false);
            setStreamingContent((prev) => prev + token);
          },
          // Tool call event - show tool indicator and speak
          onToolCall: (toolCall: ToolCall) => {
            setIsThinking(false);
            const activeToolCall: ActiveToolCall = {
              callId: toolCall.id,
              tool: toolCall.tool,
              args: toolCall.arguments,
              status: 'executing',
            };
            setActiveToolCalls((prev) => [...prev, activeToolCall]);

            // Speak what tool is being used (only once per tool)
            if (!spokenToolsRef.current.has(toolCall.id)) {
              spokenToolsRef.current.add(toolCall.id);
              const toolSpeech = getToolSpeech(toolCall.tool, toolCall.arguments);
              speak(toolSpeech);
            }
          },
          // Tool result event - update tool status and speak result
          onToolResult: (callId, output) => {
            setActiveToolCalls((prev) =>
              prev.map((tc) =>
                tc.callId === callId
                  ? { ...tc, status: 'completed' as const, result: output }
                  : tc
              )
            );

            // Brief confirmation
            // speak("Done.");
          },
          // Agent updated event
          onAgentUpdated: (agent) => {
            setCurrentAgent(agent);
          },
          // Done event - finalize and speak cleaned response
          onDone: (newConversationId, _messageId) => {
            setConversationId(newConversationId);
            setIsProcessing(false);
            setIsThinking(false);
            setWorkflowComplete(true);

            // Get the final response, parse it, and speak clean version
            setStreamingContent((finalContent) => {
              if (finalContent) {
                setResponse(finalContent);
                const parsed = parseAIResponse(finalContent);
                setParsedResponse(parsed);

                // Add assistant message to history
                const assistantMessage: ConversationMessage = {
                  id: Date.now(),
                  role: 'assistant',
                  content: parsed.message,
                  timestamp: new Date(),
                };
                setConversationHistory((prev) => [...prev, assistantMessage]);

                // Speak the cleaned message
                speak(parsed.message);
              }
              return finalContent;
            });

            // Refresh tasks to reflect any changes
            fetchTasks();
          },
          // Error event
          onError: (error) => {
            console.error("AI processing error:", error);
            setIsProcessing(false);
            setIsThinking(false);
            const errorMessage = "Sorry, I encountered an error. Please try again.";
            setResponse(errorMessage);
            setParsedResponse({ type: 'general', message: errorMessage });
            speak(errorMessage);
            toast.error(error?.message || "AI processing failed");
          },
        }
      );
    } catch (error: any) {
      console.error("Failed to start AI processing:", error);
      setIsProcessing(false);
      setIsThinking(false);
      const errorMessage = "Sorry, I couldn't connect to the AI. Please try again.";
      setResponse(errorMessage);
      setParsedResponse({ type: 'general', message: errorMessage });
      speak(errorMessage);
      toast.error(error?.message || "Voice command failed");
    }
  };

  /**
   * Get speech text for a tool being executed
   */
  const getToolSpeech = (tool: string, args: Record<string, unknown>): string => {
    switch (tool) {
      case 'add_task':
        return `Creating a new task: ${args.title || 'your task'}`;
      case 'list_tasks':
        return "Fetching your tasks...";
      case 'complete_task':
        return `Marking task as complete`;
      case 'delete_task':
        return `Deleting the task`;
      case 'update_task':
        return `Updating the task`;
      case 'get_task':
        return `Looking up task details`;
      default:
        return `Running ${tool}`;
    }
  };

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  /**
   * Render task list in a nice card format
   */
  const renderTaskList = (tasks: ParsedTask[]) => (
    <div className="space-y-2 mt-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-3 p-3 rounded-lg border"
          style={{ backgroundColor: colors.bg, borderColor: colors.border }}
        >
          {task.status === 'completed' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: colors.green }} />
          ) : (
            <Clock className="w-5 h-5 shrink-0" style={{ color: colors.gold }} />
          )}
          <div className="flex-1 min-w-0">
            <p
              className={`font-medium truncate ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}
              style={{ color: colors.text }}
            >
              {task.title}
            </p>
            {task.due && (
              <p className="text-xs" style={{ color: colors.textMuted }}>
                Due: {task.due}
              </p>
            )}
          </div>
          <span
            className="text-xs px-2 py-1 rounded-full font-medium"
            style={{
              backgroundColor: `${getPriorityColor(task.priority)}15`,
              color: getPriorityColor(task.priority)
            }}
          >
            {task.priority}
          </span>
        </div>
      ))}
    </div>
  );

  /**
   * Render the response based on its type
   */
  const renderResponse = () => {
    if (!parsedResponse) {
      // Fallback to raw response if not parsed
      return <p style={{ color: colors.text }}>{response}</p>;
    }

    switch (parsedResponse.type) {
      case 'task_list':
        return (
          <div>
            {parsedResponse.summary && (
              <p className="font-medium mb-2" style={{ color: colors.text }}>
                {parsedResponse.summary}
              </p>
            )}
            {parsedResponse.tasks && parsedResponse.tasks.length > 0 &&
              renderTaskList(parsedResponse.tasks)
            }
            {(!parsedResponse.tasks || parsedResponse.tasks.length === 0) && (
              <p style={{ color: colors.textMuted }}>No tasks found.</p>
            )}
          </div>
        );

      case 'task_created':
        return (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6" style={{ color: colors.green }} />
            <p style={{ color: colors.text }}>{parsedResponse.message}</p>
          </div>
        );

      case 'task_completed':
        return (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6" style={{ color: colors.green }} />
            <p style={{ color: colors.text }}>{parsedResponse.message}</p>
          </div>
        );

      case 'question':
        return (
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" style={{ color: colors.blue }} />
            <p style={{ color: colors.text }}>{parsedResponse.message}</p>
          </div>
        );

      default:
        return <p style={{ color: colors.text }}>{parsedResponse.message}</p>;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colors.bg }}>
      <Sidebar />

      <main className="flex-1 ml-[280px]">
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-sm border-b" style={{ backgroundColor: `${colors.bgAlt}cc`, borderColor: colors.border }}>
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3" style={{ backgroundColor: `${colors.goldDark}15` }}>
                  <Mic className="w-6 h-6" style={{ color: colors.goldDark }} />
                </div>
                <div>
                  <h1 className="text-3xl font-light" style={{ color: colors.text, fontFamily: "serif" }}>Voice Assistant</h1>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    AI-powered task management with natural conversation
                    {conversationId && (
                      <span className="ml-2 px-2 py-0.5 rounded text-xs" style={{ backgroundColor: `${colors.gold}20`, color: colors.goldDark }}>
                        Conversation active
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {/* History button */}
                {conversationHistory.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover:opacity-80"
                    style={{
                      backgroundColor: showHistory ? `${colors.goldDark}15` : 'transparent',
                      borderColor: colors.border,
                      color: colors.text
                    }}
                  >
                    <History className="w-4 h-4" />
                    <span className="text-sm">History ({conversationHistory.length})</span>
                  </button>
                )}

                {/* New conversation button */}
                <button
                  onClick={startNewConversation}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: colors.goldDark, color: colors.textLight }}
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  <span className="text-sm">New Chat</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Conversation History Panel */}
        {showHistory && conversationHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b overflow-hidden"
            style={{ backgroundColor: colors.bgAlt, borderColor: colors.border }}
          >
            <div className="px-8 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium" style={{ color: colors.text }}>
                  Conversation History
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 rounded hover:bg-black/5"
                >
                  <X className="w-4 h-4" style={{ color: colors.textMuted }} />
                </button>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {conversationHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className="max-w-[80%] p-3 rounded-lg"
                      style={{
                        backgroundColor: msg.role === 'user' ? colors.goldDark : colors.bg,
                        color: msg.role === 'user' ? colors.textLight : colors.text,
                      }}
                    >
                      <p className="text-xs mb-1 opacity-70">
                        {msg.role === 'user' ? 'You' : 'Assistant'} • {msg.timestamp.toLocaleTimeString()}
                      </p>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Content */}
        <div className="p-8 flex items-center justify-center min-h-[calc(100vh-120px)]">
          <div className="max-w-2xl w-full text-center space-y-8">
            {/* Microphone Button */}
            <motion.div
              animate={isListening ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
              className="relative inline-block"
            >
              <button
                onClick={startListening}
                disabled={isListening || isProcessing || !supported}
                className="w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: isListening ? colors.red : isProcessing ? colors.gold : colors.goldDark,
                  color: colors.textLight
                }}
              >
                {isListening ? (
                  <MicOff className="w-12 h-12" />
                ) : isProcessing ? (
                  <Loader2 className="w-12 h-12 animate-spin" />
                ) : (
                  <Mic className="w-12 h-12" />
                )}
              </button>

              {isListening && (
                <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: colors.goldDark }}
                />
              )}
            </motion.div>

            {/* Status */}
            <div className="space-y-2">
              <p className="text-xl font-light" style={{ color: colors.text, fontFamily: "serif" }}>
                {isListening
                  ? "Listening..."
                  : isProcessing
                  ? "Processing your request..."
                  : "Tap to speak"}
              </p>
              <p className="text-sm" style={{ color: colors.textMuted, fontStyle: "italic" }}>
                {supported
                  ? "Just speak naturally - I'll understand what you need"
                  : "Speech recognition is not supported in your browser"}
              </p>
            </div>

            {/* Transcript */}
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 border rounded-lg"
                style={{ backgroundColor: colors.bgAlt, borderColor: colors.border }}
              >
                <div className="flex items-start gap-3">
                  <Volume2 className="w-5 h-5 shrink-0 mt-1" style={{ color: colors.goldDark }} />
                  <div className="flex-1 text-left">
                    <p className="text-xs tracking-wider uppercase mb-1" style={{ color: colors.textMuted }}>You said:</p>
                    <p style={{ color: colors.text }}>{transcript}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Thinking Indicator - Keep visible even when tools start */}
            {(isThinking || activeToolCalls.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 border rounded-lg"
                style={{ backgroundColor: `${colors.gold}15`, borderColor: colors.gold }}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Loader2 className="w-5 h-5" style={{ color: colors.goldDark }} />
                  </motion.div>
                  <div className="flex-1 text-left">
                    <p className="text-xs tracking-wider uppercase mb-1" style={{ color: colors.goldDark }}>
                      <Bot className="w-3 h-3 inline mr-1" />
                      {currentAgent} is {isThinking ? 'thinking' : 'working'}...
                    </p>
                    {thinkingMessage && (
                      <p className="text-sm" style={{ color: colors.textMuted }}>{thinkingMessage}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tool Calls Indicator - Hybrid Workflow Display */}
            {activeToolCalls.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 border rounded-lg"
                style={{ backgroundColor: `${colors.gold}10`, borderColor: workflowComplete ? colors.green : colors.gold }}
              >
                <div className="flex items-start gap-3">
                  <Wrench className="w-5 h-5 shrink-0 mt-1" style={{ color: workflowComplete ? colors.green : colors.goldDark }} />
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs tracking-wider uppercase" style={{ color: workflowComplete ? colors.green : colors.goldDark }}>
                        🔗 Hybrid Workflow - Tool Execution
                      </p>
                      {workflowComplete && (
                        <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: `${colors.green}20`, color: colors.green }}>
                          <CheckCircle2 className="w-3 h-3" />
                          Workflow Complete
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {activeToolCalls.map((tc) => (
                        <div
                          key={tc.callId}
                          className="flex items-center gap-2 text-sm p-2 rounded-lg"
                          style={{ 
                            backgroundColor: tc.status === 'completed' ? `${colors.green}10` : `${colors.background}50`,
                            borderLeft: `3px solid ${tc.status === 'completed' ? colors.green : colors.goldDark}`
                          }}
                        >
                          <span>{getToolEmoji(tc.tool)}</span>
                          <span className="flex-1">{getToolDescription(tc.tool)}</span>
                          {tc.status === 'executing' && (
                            <motion.span
                              animate={{ opacity: [1, 0.5, 1] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                              className="text-xs px-2 py-0.5 rounded flex items-center gap-1"
                              style={{ backgroundColor: `${colors.gold}30`, color: colors.goldDark }}
                            >
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Running...
                            </motion.span>
                          )}
                          {tc.status === 'completed' && (
                            <span
                              className="text-xs px-2 py-0.5 rounded flex items-center gap-1"
                              style={{ backgroundColor: `${colors.green}20`, color: colors.green }}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Done
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Streaming Content (raw, while processing) */}
            {streamingContent && !response && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 border rounded-lg"
                style={{ backgroundColor: `${colors.goldDark}10`, borderColor: colors.gold }}
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 shrink-0 mt-1" style={{ color: colors.goldDark }} />
                  <div className="flex-1 text-left">
                    <p className="text-xs tracking-wider uppercase mb-1" style={{ color: colors.goldDark }}>
                      ✨ Generating Response from {currentAgent}:
                    </p>
                    <p className="text-sm" style={{ color: colors.textMuted }}>Processing your request with hybrid AI...</p>
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                      className="inline-block w-2 h-4 ml-1"
                      style={{ backgroundColor: colors.goldDark }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Final Response - Nicely Formatted */}
            {response && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 border rounded-lg"
                style={{ backgroundColor: `${colors.goldDark}10`, borderColor: colors.gold }}
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 shrink-0 mt-1" style={{ color: colors.goldDark }} />
                  <div className="flex-1 text-left">
                    <p className="text-xs tracking-wider uppercase mb-2" style={{ color: colors.goldDark }}>
                      AI Response:
                    </p>
                    {renderResponse()}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Examples */}
            <div className="pt-8 border-t" style={{ borderColor: colors.border }}>
              <p className="text-xs tracking-wider uppercase mb-4" style={{ color: colors.textMuted }}>Try saying:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Add a task to buy groceries",
                  "What are my pending tasks?",
                  "Complete the groceries task",
                  "Show all my tasks",
                ].map((example, i) => (
                  <div
                    key={i}
                    className="p-3 border rounded-lg text-sm italic cursor-pointer hover:border-gold transition-colors"
                    style={{ backgroundColor: colors.bgAlt, borderColor: colors.border, color: colors.textMuted }}
                    onClick={() => {
                      setTranscript(example);
                      speak("Got it. Let me help you with that.");
                      processWithAI(example);
                    }}
                  >
                    "{example}"
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
