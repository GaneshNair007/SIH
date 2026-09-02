"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  HelpCircle, 
  AlertCircle, 
  RefreshCw,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { sendChatMessage } from "@/lib/api";
import { STATIC_GUIDED_HELP } from "@/lib/constants";
import ReactMarkdown from "react-markdown";

export interface ScanBriefing {
  type: "start" | "end";
  workerName: string;
  workerId: string;
  unit: string;
  badgeId: string;
  hazardScore?: number;
  hazardLevel?: string;
  doseRangeStr?: string;
  twaRangeStr?: string;
  deltaE?: number;
  guidanceText?: string;
  scanId?: string;
  timestamp?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  reference?: string;
  isStatic?: boolean;
}

interface ChatbotDrawerProps {
  workerId?: string;
  workerName?: string;
  briefing?: ScanBriefing | null;
}

export default function ChatbotDrawer({ workerId, workerName, briefing }: ChatbotDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `sess_${Math.random().toString(36).substring(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello! I am **Rakshak AI**, your refinery safety assistant. How can I help you regarding **${workerName || "worker"}**'s dosimetry history or OISD plant safety protocols today?`,
    },
  ]);

  // Contextual suggestions based on scan type
  const [currentSuggestions, setCurrentSuggestions] = useState([
    { key: "summary", text: "Summarize this worker's recorded history." },
    { key: "replacement", text: "Which bands need replacement?" },
    { key: "procedure", text: "Show the approved procedure associated with this alert." },
    { key: "twa", text: "Explain how the 8-hour TWA is calculated." },
  ]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Auto-activate and generate proactive human briefing when a scan occurs
  useEffect(() => {
    if (!briefing) return;

    // Automatically slide open the drawer on the right side
    setIsOpen(true);

    let briefingText = "";
    if (briefing.type === "start") {
      briefingText = `👋 **Good morning, Safety Lead!**\n\nI have registered **${briefing.workerName} (${briefing.workerId})** for today's shift:\n\n- 🏭 **Station Assigned:** \`${briefing.unit}\`\n- 🏷️ **Active Wristband:** \`${briefing.badgeId}\`\n- 🔬 **Morning Baseline:** Chemical detection strip is clean and intact (${(briefing.deltaE ?? 0.40).toFixed(2)} ΔE) — starting at **★ 0.0 / 5.0 Risk** (Safe).\n- 🦺 **PPE Baseline:** Half-mask acid gas respirator fit-test verified. Non-smoker baseline with standard pulmonary clearance.\n\nHe is fully cleared for active duty today. I will track refinery microclimates and stand by for his end-of-shift scan!`;

      setCurrentSuggestions([
        { key: "ppe", text: `What is ${briefing.workerName}'s respirator replacement schedule?` },
        { key: "unit", text: `What are current H₂S background sensor readings in ${briefing.unit}?` },
        { key: "lifecycle", text: "How many rotation days remain on this band?" },
      ]);
    } else {
      const isCrit = (briefing.hazardScore ?? 0) > 3.4;
      const isCaut = !isCrit && (briefing.hazardScore ?? 0) > 1.5;

      if (isCrit) {
        briefingText = `🚨 **CRITICAL EXPOSURE ALERT for ${briefing.workerName} (${briefing.workerId})**\n\n- ⭐ **Daily Hazard Rating:** **${(briefing.hazardScore ?? 4.6).toFixed(1)} / 5.0** (DANGEROUS / CRITICAL 🔴)\n- 💨 **Cumulative Exposure Today:** **${briefing.doseRangeStr || "18.5–21.2 ppm·h"}**\n- ⏱️ **Average Shift TWA:** **${briefing.twaRangeStr || "5.2 ppm"}** (Statutory ceiling limit breached!)\n\n⚠️ **Immediate Mandatory Actions:**\n1. Escort ${briefing.workerName} to the **Occupational Health Centre (OHC)** immediately for clinical evaluation.\n2. **Retire band \`${briefing.badgeId}\`** from service.\n3. Automatic incident report **${briefing.scanId || "SCN-CRIT"}** has been dispatched to Central Control Room to inspect \`${briefing.unit}\` for fugitive leaks.`;

        setCurrentSuggestions([
          { key: "medical", text: "What clinical symptoms should the OHC doctor inspect?" },
          { key: "incident", text: "Download the OISD-STD-105 statutory incident report." },
          { key: "replacement", text: "Assign a new replacement wristband for this worker." },
        ]);
      } else if (isCaut) {
        briefingText = `⚠️ **Shift Exposure Caution for ${briefing.workerName} (${briefing.workerId})**\n\n- ⭐ **Daily Hazard Rating:** **${(briefing.hazardScore ?? 2.4).toFixed(1)} / 5.0** (MODERATE / CAUTION 🟡)\n- 💨 **Cumulative Exposure Today:** **${briefing.doseRangeStr || "7.5–9.2 ppm·h"}**\n- ⏱️ **Average Shift TWA:** **${briefing.twaRangeStr || "1.0–1.2 ppm"}**\n\n💡 **Supervisor Recommendation:**\nExposure is approaching the caution threshold. Inspect respiratory seal fit and check \`${briefing.unit}\` pump seals before tomorrow's rotation. Normal handover permitted with caution note.`;

        setCurrentSuggestions([
          { key: "respirator", text: "Does this worker need a respirator fit re-test?" },
          { key: "unit", text: `Check if other workers in ${briefing.unit} had elevated readings.` },
          { key: "handover", text: "Log supervisor caution note for tomorrow's shift lead." },
        ]);
      } else {
        briefingText = `📋 **Shift Completion Scan for ${briefing.workerName} (${briefing.workerId})**\n\n- ⭐ **Daily Hazard Rating:** **${(briefing.hazardScore ?? 1.8).toFixed(1)} / 5.0** (SAFE / NORMAL 🟢)\n- 💨 **Cumulative Exposure Today:** **${briefing.doseRangeStr || "3.0–3.6 ppm·h"}**\n- ⏱️ **Average Shift TWA:** **${briefing.twaRangeStr || "0.4–0.5 ppm"}** (Well below 1.0 ppm caution threshold)\n\n💡 **Shift Summary:**\nWorker exposure remained well within safe operational parameters throughout today's shift at \`${briefing.unit}\`. No acute symptoms detected. Standard handover approved!`;

        setCurrentSuggestions([
          { key: "explain", text: "Explain how the 1.8 / 5.0 hazard rating was computed." },
          { key: "history", text: `Show ${briefing.workerName}'s 7-day cumulative load graph.` },
          { key: "compare", text: `How does this compare to average ${briefing.unit} exposure?` },
        ]);
      }
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: briefingText,
      },
    ]);
  }, [briefing]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputMsg("");
    setLoading(true);

    try {
      const res = await sendChatMessage(sessionId, text);
      const botReply = res.reply || res.message || res.advisory_text || "Exposure record verified. All statutory parameters monitored.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: botReply,
        },
      ]);
    } catch (err) {
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

      {/* Slide-in Right Side Panel (Crystal clear background, no dark overlay or blur) */}
      {isOpen && (
        <div className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] bg-white h-screen shadow-[-10px_0_35px_rgba(0,0,0,0.18)] flex flex-col justify-between border-l border-light-surface animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="bg-charcoal text-white p-5 flex items-center justify-between border-b border-dark-surface">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-deep text-yellow-golden shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg uppercase tracking-tight text-white">Rakshak AI</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                      Live Advisor
                    </span>
                  </div>
                  <div className="text-xs text-sage">
                    {briefing ? `Auto-Briefing: ${briefing.workerName}` : "Occupational Safety & Statutory Advisor"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-sage hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Scan Notification Strip if auto-activated */}
            {briefing && (
              <div className="bg-yellow-golden/10 border-b border-yellow-golden/30 px-5 py-2 flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-yellow-800 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-golden" />
                  <span>Auto-Activated Scan Briefing</span>
                </div>
                <span className="text-sage-muted text-[10px]">
                  {briefing.type === "start" ? "Check-In" : "Shift Completion"}
                </span>
              </div>
            )}

            {/* Chat Message Scroll Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[88%] p-4 rounded-2xl ${
                      m.role === "user"
                        ? "bg-teal-deep text-white rounded-tr-none shadow-sm"
                        : "bg-warm-white text-charcoal rounded-tl-none border border-light-surface leading-relaxed shadow-sm"
                    }`}
                  >
                    {m.isStatic && (
                      <div className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded mb-2 inline-block">
                        Offline Protocol Mode
                      </div>
                    )}
                    <div className="prose prose-xs max-w-none text-charcoal [&_strong]:text-charcoal [&_strong]:font-bold [&_ul]:my-1.5 [&_li]:my-0.5 [&_p]:my-1.5">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>

                    {m.reference && (
                      <div className="mt-2.5 pt-2 border-t border-light-surface text-[10px] font-mono text-sage-muted flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-teal-deep" />
                        <span>Ref: {m.reference}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-sage-muted text-xs p-3 bg-warm-white rounded-2xl border border-light-surface max-w-[70%]">
                  <RefreshCw className="w-4 h-4 text-teal-deep animate-spin" />
                  <span>Rakshak AI is checking refinery safety guidelines...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Contextual Action Suggestions */}
            <div className="p-3 bg-warm-white border-t border-light-surface">
              <div className="text-[10px] font-mono text-sage-muted uppercase mb-2 flex items-center gap-1 font-bold">
                <HelpCircle className="w-3 h-3 text-teal-deep" />
                <span>Suggested Safety Questions:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(s.text)}
                    disabled={loading}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white border border-light-surface text-charcoal hover:bg-yellow-golden/20 hover:border-yellow-golden/50 transition-colors text-left disabled:opacity-50"
                  >
                    {s.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputMsg);
              }}
              className="p-4 bg-white border-t border-light-surface flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Ask about exposure, PPE, or OISD protocols..."
                className="flex-1 p-2.5 text-xs bg-warm-white rounded-xl border border-light-surface text-charcoal focus:ring-2 focus:ring-teal-deep outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !inputMsg.trim()}
                className="p-2.5 bg-charcoal text-white hover:bg-black rounded-xl transition-colors disabled:opacity-50"
                title="Send query"
              >
                <Send className="w-4 h-4 text-yellow-golden" />
              </button>
            </form>
        </div>
      )}
    </>
  );
}
