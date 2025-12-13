"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Volume2, Sparkles } from "lucide-react";
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
  red: "#8b2635",
};

export default function VoiceAssistantPage() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setSupported(false);
    }
  }, []);

  const startListening = () => {
    if (!supported) {
      alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setResponse("");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTranscript(transcript);
      processCommand(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const processCommand = (command: string) => {
    setTimeout(() => {
      const lowerCommand = command.toLowerCase();
      let responseText = "";

      if (lowerCommand.includes("create") || lowerCommand.includes("add")) {
        responseText = `I'll create that task for you: "${command}". Task created successfully!`;
      } else if (lowerCommand.includes("show") || lowerCommand.includes("list")) {
        responseText = "Here are your tasks for today. You have 5 pending tasks.";
      } else if (lowerCommand.includes("complete") || lowerCommand.includes("done")) {
        responseText = "Task marked as complete!";
      } else {
        responseText = `I heard: "${command}". In production, this would be processed by an AI to understand your intent and perform the appropriate action.`;
      }

      setResponse(responseText);
      speak(responseText);
    }, 500);
  };

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colors.bg }}>
      <Sidebar />

      <main className="flex-1 ml-[280px]">
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-sm border-b" style={{ backgroundColor: `${colors.bgAlt}cc`, borderColor: colors.border }}>
          <div className="px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="p-3" style={{ backgroundColor: `${colors.goldDark}15` }}>
                <Mic className="w-6 h-6" style={{ color: colors.goldDark }} />
              </div>
              <div>
                <h1 className="text-3xl font-light" style={{ color: colors.text, fontFamily: "serif" }}>Voice Assistant</h1>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  Hands-free task management
                </p>
              </div>
            </div>
          </div>
        </header>

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
                disabled={isListening || !supported}
                className="w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: isListening ? colors.red : colors.goldDark, color: colors.textLight }}
              >
                {isListening ? (
                  <MicOff className="w-12 h-12" />
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
                {isListening ? "Listening..." : "Tap to speak"}
              </p>
              <p className="text-sm" style={{ color: colors.textMuted, fontStyle: "italic" }}>
                {supported
                  ? "Try: 'Create a task to review project proposal' or 'Show my tasks for today'"
                  : "Speech recognition is not supported in your browser"}
              </p>
            </div>

            {/* Transcript */}
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 border"
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

            {/* Response */}
            {response && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 border"
                style={{ backgroundColor: `${colors.goldDark}10`, borderColor: colors.gold }}
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 shrink-0 mt-1" style={{ color: colors.goldDark }} />
                  <div className="flex-1 text-left">
                    <p className="text-xs tracking-wider uppercase mb-1" style={{ color: colors.goldDark }}>AI Response:</p>
                    <p style={{ color: colors.text }}>{response}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Examples */}
            <div className="pt-8 border-t" style={{ borderColor: colors.border }}>
              <p className="text-xs tracking-wider uppercase mb-4" style={{ color: colors.textMuted }}>Example commands:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Create a task to review project proposal",
                  "Show my tasks for today",
                  "Mark task as complete",
                  "What's my schedule tomorrow?",
                ].map((example, i) => (
                  <div
                    key={i}
                    className="p-3 border text-sm italic"
                    style={{ backgroundColor: colors.bgAlt, borderColor: colors.border, color: colors.textMuted }}
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
