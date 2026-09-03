"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Hello! I am the Rakshak AI Platform Assistant. How can I help you with H₂S dosimetry records today?" }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isManager = user.role === "MANAGER" || user.role === "HSE_OFFICER";

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Pipeline", href: "/working" },
    ...(isManager
      ? [
          { name: "Manager Workspace", href: "/manager" },
          { name: "Control Room", href: "/control-room" },
          { name: "Incidents", href: "/incidents" },
        ]
      : [
          { name: "Scan Check-in", href: "/scan" },
          { name: "My History", href: "/history" },
        ]),
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSendingChat) return;

    const userText = inputMessage;
    setInputMessage("");
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setIsSendingChat(true);

    try {
      const { data } = await apiClient.post("/chat", {
        session_id: user.user_id || "demo-session",
        message: userText,
      });
      setChatMessages((prev) => [...prev, { sender: "ai", text: data.reply || data.response || "Received response." }]);
    } catch {
      // Fallback to guided answer if AI backend endpoint fails or is unconfigured
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "[Guided Help Mode]: The live LLM provider is not configured. For standard operating procedures, please refer to the suggested topic cards below.",
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-background relative">
      {/* Top Navbar */}
      <header className="bg-surface border-b border-border shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Wordmark */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-primary text-white rounded flex items-center justify-center font-bold text-xs group-hover:bg-primary-hover transition-colors">
                  H₂S
                </div>
                <span className="font-medium text-text-primary text-base sm:text-lg hover:text-primary transition-colors">
                  H₂S Dose Wristband
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-primary-light text-primary"
                        : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right User Status & Actions */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex flex-col text-right">
                <span className="text-sm font-medium text-text-primary">{user.full_name}</span>
                <span className="text-xs text-text-secondary">{user.plant_unit} • {user.role.replace("_", " ")}</span>
              </div>
              <button onClick={handleLogout} className="btn-ghost text-sm">
                Sign out
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                aria-label="Toggle Menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {isMobileMenuOpen ? (
                    <path d="M18 6L6 18M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-surface px-4 pt-2 pb-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-text-primary hover:bg-surface-hover"
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-border flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-text-primary">{user.full_name}</div>
                <div className="text-xs text-text-secondary">{user.role}</div>
              </div>
              <button onClick={handleLogout} className="btn-secondary text-xs px-3 py-1">
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Floating Assistant Button */}
      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-elevation-3 flex items-center justify-center hover:bg-primary-hover transition-transform hover:scale-105 z-40"
        aria-label="Open Platform Assistant"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </button>

      {/* Assistant Drawer */}
      {isAssistantOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsAssistantOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-surface border-l border-border shadow-elevation-3 z-50 flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-border flex justify-between items-center bg-surface-background">
              <div>
                <h3 className="font-medium text-text-primary">Platform Assistant</h3>
                <p className="text-xs text-text-secondary">AI & Operational SOP Advisor</p>
              </div>
              <button onClick={() => setIsAssistantOpen(false)} className="text-text-secondary hover:text-text-primary p-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-primary text-white"
                        : "bg-surface-background border border-border text-text-primary"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isSendingChat && (
                <div className="flex items-center gap-2 text-text-secondary text-xs">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  Assistant is processing...
                </div>
              )}
            </div>
            
            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-surface-background">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask about band scanning, exposure SOPs..."
                  className="input-field flex-1"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isSendingChat}
                />
                <button type="submit" disabled={isSendingChat || !inputMessage.trim()} className="btn-primary">
                  Send
                </button>
              </div>
            </form>

          </div>
        </>
      )}
    </div>
  );
}
