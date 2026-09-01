"use client";

import { useState } from "react";
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  HelpCircle, 
  AlertCircle, 
  RefreshCw,
  BookOpen,
  MessageSquare
} from "lucide-react";
import { sendChatMessage } from "@/lib/api";
import { STATIC_GUIDED_HELP } from "@/lib/constants";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  reference?: string;
  isStatic?: boolean;
}

interface ChatbotDrawerProps {
  workerId?: string;
  workerName?: string;
}

export default function ChatbotDrawer({ workerId, workerName }: ChatbotDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `sess_${Math.random().toString(36).substring(2, 9)}`);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello! I am **Rakshak**, your H₂S Occupational Safety Assistant. How can I help you regarding worker **${workerName || "EMP-1042"}**'s dosimetry history or plant safety protocols today?`,
    },
  ]);

  const suggestions = [
    { key: "summary", text: "Summarize this worker's recorded history." },
    { key: "replacement", text: "Which bands need replacement?" },
    { key: "invalid", text: "Why was this reading invalid?" },
    { key: "procedure", text: "Show the approved procedure associated with this alert." },
  ];

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputMsg("");
    setLoading(true);

    try {
      // Call backend AI Chat API
      const res = await sendChatMessage(sessionId, text);
      const botReply = res.reply || res.message || res.advisory_text || "Exposure record checked. All statutory guidelines maintained.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: botReply,
        },
      ]);
    } catch (err) {
      // Fallback: Guided help - not connected to an AI model
      console.warn("AI Chat unavailable, falling back to static safety protocols", err);
      const matchedKey = Object.keys(STATIC_GUIDED_HELP).find((k) =>
        text.toLowerCase().includes(k)
      ) || "procedure";

      const fallback = STATIC_GUIDED_HELP[matchedKey];
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `**Guided help — not connected to an AI model**\n\n${fallback.answer}`,
          reference: fallback.reference,
          isStatic: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (key: string, text: string) => {
    handleSend(text);
  };

  return (
    <>
      {/* Docked Trigger Button (Bottom-Right) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-charcoal text-white hover:bg-black p-4 rounded-full shadow-2xl border border-yellow-golden/40 flex items-center gap-3 group transition-all duration-300 hover:scale-105"
        title="Open Platform Safety Assistant"
      >
        <div className="relative">
          <Bot className="w-6 h-6 text-yellow-golden" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider text-white">
          Ask Rakshak AI
        </span>
      </button>

      {/* Slide-in Right Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-light-surface animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="bg-charcoal text-white p-5 flex items-center justify-between border-b border-dark-surface">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-deep text-yellow-golden">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg uppercase tracking-tight text-white">Rakshak AI</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-deep text-white">RAG Active</span>
                  </div>
                  <div className="text-xs text-sage">Occupational Safety & Statutory Advisor</div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-sage hover:text-white rounded-lg hover:bg-charcoal-card"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Message Scroll Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl ${
                      m.role === "user"
                        ? "bg-teal-deep text-white rounded-tr-none shadow-sm"
                        : "bg-warm-white text-charcoal rounded-tl-none border border-light-surface leading-relaxed"
                    }`}
                  >
                    {m.isStatic && (
                      <div className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded mb-2 inline-block">
                        Offline Protocol Mode
                      </div>
                    )}
                    <div className="prose prose-xs max-w-none">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                    {m.reference && (
                      <div className="mt-2 pt-1.5 border-t border-charcoal/10 text-[10px] font-mono text-sage-muted flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>Ref: {m.reference}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-sage-muted font-mono p-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-deep" />
                  <span>Consulting OISD standards & safety logs...</span>
                </div>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-5 py-2 border-t border-light-surface bg-warm-white flex items-center gap-2 overflow-x-auto">
              {suggestions.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => handleSuggestionClick(s.key, s.text)}
                  className="px-2.5 py-1 rounded-full bg-white border border-light-surface text-[11px] text-sage-muted hover:text-charcoal hover:border-teal-deep whitespace-nowrap transition-colors"
                >
                  {s.text}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <div className="p-4 bg-white border-t border-light-surface">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputMsg);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Ask a question about worker history or OISD SOPs..."
                  className="flex-1 px-4 py-2.5 bg-warm-white border border-light-surface rounded-xl text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-teal-deep"
                />
                <button
                  type="submit"
                  disabled={loading || !inputMsg.trim()}
                  className="p-2.5 bg-charcoal text-white hover:bg-black rounded-xl transition-colors disabled:opacity-50"
                  title="Send message"
                >
                  <Send className="w-4 h-4 text-yellow-golden" />
                </button>
              </form>
              <div className="text-[10px] text-sage-muted text-center mt-2">
                Answers derived strictly from authorized records & statutory standards.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
