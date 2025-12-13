"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";

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
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Welcome. I'm your AI task assistant. I can help you create tasks, organize your schedule, and answer questions about your productivity. Try saying something like 'Create a task to review project proposal by Friday' or 'What tasks do I have today?'",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I understand you want to: "${input}". This is a demo response. In production, this would connect to an AI service like OpenAI or Claude to process your request and create tasks automatically.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colors.bg }}>
      <Sidebar />

      <main className="flex-1 ml-[280px] flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-sm border-b" style={{ backgroundColor: `${colors.bgAlt}cc`, borderColor: colors.border }}>
          <div className="px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="p-3" style={{ backgroundColor: `${colors.goldDark}15` }}>
                <Sparkles className="w-6 h-6" style={{ color: colors.goldDark }} />
              </div>
              <div>
                <h1 className="text-3xl font-light" style={{ color: colors.text, fontFamily: "serif" }}>AI Chat Assistant</h1>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  Natural language task management
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center" style={{ backgroundColor: colors.goldDark }}>
                    <Bot className="w-5 h-5" style={{ color: colors.textLight }} />
                  </div>
                )}

                <div
                  className="max-w-2xl px-6 py-4"
                  style={{
                    backgroundColor: message.role === "user" ? colors.goldDark : colors.bgAlt,
                    color: message.role === "user" ? colors.textLight : colors.text,
                    borderColor: colors.border,
                    border: message.role === "assistant" ? `1px solid ${colors.border}` : "none",
                  }}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs mt-2 opacity-60" style={{ fontStyle: "italic" }}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>

                {message.role === "user" && (
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center" style={{ backgroundColor: colors.bgAlt, border: `1px solid ${colors.border}` }}>
                    <User className="w-5 h-5" style={{ color: colors.text }} />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center" style={{ backgroundColor: colors.goldDark }}>
                <Bot className="w-5 h-5" style={{ color: colors.textLight }} />
              </div>
              <div className="px-6 py-4" style={{ backgroundColor: colors.bgAlt, border: `1px solid ${colors.border}` }}>
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.goldDark }} />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-0 border-t backdrop-blur-sm p-6" style={{ backgroundColor: `${colors.bgAlt}cc`, borderColor: colors.border }}>
          <div className="max-w-4xl mx-auto flex gap-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message... (e.g., 'Create a task to review project proposal')"
              className="flex-1 px-4 py-3 border focus:outline-none"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-6 py-3 transition-all duration-300 hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: colors.goldDark, color: colors.textLight }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
