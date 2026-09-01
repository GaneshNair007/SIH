"use client";

import { useState } from "react";

const SUGGESTED_QUESTIONS = [
  "How do I scan a band?",
  "Why was this reading marked invalid?",
  "Which bands need replacement?",
  "How is shift dose calculated?",
  "What does Patch C condition mean?",
  "How do I register a new worker?",
];

const GUIDED_ANSWERS: Record<string, string> = {
  "How do I scan a band?":
    "1. Tap 'Scan' in the navigation bar.\n2. Point your phone camera at the QR code on the wristband housing.\n3. The system resolves the worker and band identity automatically.\n4. Choose 'Start Shift' or 'End Shift' based on the band's current state.\n5. Follow the stepper: select work location → photograph the badge → mark patch regions → review the analysis.\n\nTip: Use the phone's torch/flash for consistent illumination.",
  "Why was this reading marked invalid?":
    "A reading can be marked invalid for several reasons:\n• Image too dark or blurred (retake under controlled lighting)\n• Patch B baseline has drifted (possible seal compromise — the band should be flagged)\n• Patch C shows humidity compromise\n• Patch regions couldn't be reliably sampled\n• Saturation detected (ΔE beyond calibration range)\n\nCheck the 'reasons' field on the reading detail page for the specific cause.",
  "Which bands need replacement?":
    "Bands should be replaced when:\n• 5 working days have been reached (automatic retirement)\n• The strip is saturated (colour change beyond calibration range)\n• Patch B integrity check fails\n• Patch C shows compromise\n• The printed expiry date has passed\n\nGo to the Bands page and filter by status 'WARNING' or check the 'working_day_count' column.",
  "How is shift dose calculated?":
    "Shift exposure = (End reading dose estimate) − (Start reading dose estimate).\n\nBecause the colour change is cumulative and permanent, the end-of-shift reading already contains the total band exposure. The shift's own contribution is the differential.\n\nImportant: This is an estimate shown as a range (low–high), not a single precise number. If no calibration is available, only raw ΔE is shown.",
  "What does Patch C condition mean?":
    "Patch C is a cobalt-free humidity-indicator card:\n• NORMAL — storage and wear conditions acceptable\n• WARNING — elevated humidity detected; widen uncertainty on dose estimate\n• COMPROMISED — storage pouch was breached or extreme humidity; the reading may not be reliable\n\nPatch C is independent of the H₂S measurement — it monitors badge condition, not exposure.",
  "How do I register a new worker?":
    "1. Navigate to Workers → New Worker.\n2. Fill in: Worker Code, Full Name, Department, Designation, Plant/Region/Work Area, Shift Group.\n3. Submit the form.\n4. Issue a band to the worker from the Bands page.\n\nNote: Worker Code must be unique within your company.",
};

interface AssistantDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function AssistantDrawer({ open, onClose }: AssistantDrawerProps) {
  const [query, setQuery] = useState("");
  const [activeAnswer, setActiveAnswer] = useState<string | null>(null);

  if (!open) return null;

  const handleQuestion = (q: string) => {
    setQuery(q);
    setActiveAnswer(GUIDED_ANSWERS[q] || null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const match = Object.keys(GUIDED_ANSWERS).find(
      (k) => k.toLowerCase().includes(query.toLowerCase()) || query.toLowerCase().includes(k.toLowerCase())
    );
    if (match) {
      setActiveAnswer(GUIDED_ANSWERS[match]);
    } else {
      setActiveAnswer("I can help with common questions about the platform. Try one of the suggested questions below, or rephrase your query.\n\n(AI-powered analytical responses require a configured language model. This is currently in Guided Help mode.)");
    }
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="Platform assistant">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-canvas-white border-l border-border flex flex-col shadow-elevated">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-heading-3 text-charcoal">Platform assistant</h2>
            <span className="badge-neutral text-[10px] mt-1">Guided Help Mode</span>
          </div>
          <button onClick={onClose} className="text-muted hover:text-charcoal p-1" aria-label="Close assistant">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="5" y1="5" x2="15" y2="15" /><line x1="15" y1="5" x2="5" y2="15" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Answer area */}
          {activeAnswer && (
            <div className="card bg-teal-pale border-teal/20">
              <div className="text-xs font-semibold text-teal uppercase tracking-wider mb-2">Answer</div>
              <div className="text-sm text-charcoal whitespace-pre-line leading-relaxed">{activeAnswer}</div>
            </div>
          )}

          {/* Suggested questions */}
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Suggested questions</div>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleQuestion(q)}
                  className="w-full text-left p-3 rounded-lg border border-border text-sm text-charcoal hover:bg-canvas-subtle hover:border-border-strong transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <strong>Guided Help mode:</strong> Answers come from documented platform knowledge. AI-powered analytical queries (e.g. &ldquo;summarize this worker&apos;s history&rdquo;) require a configured language model and are currently unavailable.
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question..."
              className="input text-sm"
            />
            <button type="submit" className="btn-primary px-4 py-2 text-sm shrink-0">
              Ask
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
