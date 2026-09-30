"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BASE } from "@/lib/api";
import {
  MessageSquare, Send, Trash2, Bot, User, Loader2,
  Database, Sparkles, ChevronDown, Copy, Check, RotateCcw
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolCalls?: { reason: string; sql: string }[];
}

interface SSEEvent {
  type: "chunk" | "done" | "error" | "tool_call";
  content?: string;
  reason?: string;
  sql?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_KEY = "kolam_chat_session_id";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "default";
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

const STARTER_PROMPTS = [
  "How many calls were logged today?",
  "Show me all lost bookings this week and why they were lost",
  "Which leads have the highest intent score right now?",
  "What's our conversion rate for Gandhi property this month?",
  "Show me all pending follow-ups sorted by priority",
  "Which agent gaps are appearing most frequently?",
];

// ─── Markdown Renderer ────────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^### (.+)$/gm, '<h3 style="font-size:13px;font-weight:700;margin:10px 0 4px;color:#1e293b">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:14px;font-weight:700;margin:12px 0 6px;color:#1e293b">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:15px;font-weight:700;margin:14px 0 8px;color:#1e293b">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:3px;padding:1px 5px;font-size:11px;font-family:monospace">$1</code>')
    // Tables (basic)
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.slice(1, -1).split('|').map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) return ''; // separator row
      const isHeader = match.includes('---');
      const tag = 'td';
      return `<tr>${cells.map(c => `<${tag} style="border:1px solid #e2e8f0;padding:5px 10px;font-size:12px">${c}</${tag}>`).join('')}</tr>`;
    })
    // Bullet lists
    .replace(/^- (.+)$/gm, '<li style="margin:2px 0;padding-left:4px">$1</li>')
    .replace(/^• (.+)$/gm, '<li style="margin:2px 0;padding-left:4px">$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li style="margin:2px 0;padding-left:4px">$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li[^>]*>.*?<\/li>\n?)+/gs, (match) => `<ul style="padding-left:16px;margin:6px 0">${match}</ul>`)
    // Horizontal rules
    .replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:10px 0"/>')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p style="margin:6px 0">')
    // Single newlines
    .replace(/\n/g, '<br/>');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToolCallBadge({ calls }: { calls: { reason: string; sql: string }[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ marginBottom: 8 }}>
      {calls.map((tc, i) => (
        <div key={i} style={{
          background: "rgba(59,130,246,0.08)",
          border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: 8, padding: "6px 10px", marginBottom: 4, fontSize: 11
        }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "#3b82f6" }}
            onClick={() => setExpanded(!expanded)}
          >
            <Database size={11} />
            <span style={{ fontWeight: 600 }}>Querying database</span>
            <span style={{ color: "#64748b", flex: 1 }}>— {tc.reason}</span>
            <ChevronDown size={11} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "0.2s" }} />
          </div>
          {expanded && (
            <pre style={{
              marginTop: 6, background: "#0f172a", color: "#7dd3fc", padding: "8px 10px",
              borderRadius: 6, fontSize: 10.5, overflowX: "auto", lineHeight: 1.5,
              whiteSpace: "pre-wrap", wordBreak: "break-all"
            }}>
              {tc.sql}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      title="Copy response"
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: "#94a3b8", padding: "2px 4px", borderRadius: 4,
        display: "flex", alignItems: "center", gap: 3, fontSize: 10,
        transition: "color 0.15s"
      }}
      onMouseEnter={e => (e.currentTarget.style.color = "#64748b")}
      onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
    >
      {copied ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      gap: 10, marginBottom: 16, alignItems: "flex-start"
    }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isUser ? "#1e40af" : "linear-gradient(135deg, #0f766e, #0891b2)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
      }}>
        {isUser
          ? <User size={15} color="white" />
          : <Sparkles size={15} color="white" />
        }
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: "75%", minWidth: 80 }}>
        {/* Tool calls (for assistant) */}
        {!isUser && msg.toolCalls && msg.toolCalls.length > 0 && (
          <ToolCallBadge calls={msg.toolCalls} />
        )}

        <div style={{
          background: isUser
            ? "linear-gradient(135deg, #1e40af, #2563eb)"
            : "#ffffff",
          color: isUser ? "#ffffff" : "#1e293b",
          borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
          padding: "10px 14px",
          fontSize: 13,
          lineHeight: 1.6,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          border: isUser ? "none" : "1px solid #e2e8f0"
        }}>
          {msg.isStreaming ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Loader2 size={14} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ color: "#64748b", fontSize: 12 }}>Thinking…</span>
            </div>
          ) : isUser ? (
            <span>{msg.content}</span>
          ) : (
            <div
              dangerouslySetInnerHTML={{
                __html: `<p style="margin:0">${renderMarkdown(msg.content)}</p>`
              }}
            />
          )}
        </div>

        {/* Footer: timestamp + copy */}
        <div style={{
          display: "flex",
          justifyContent: isUser ? "flex-end" : "flex-start",
          alignItems: "center",
          gap: 8, marginTop: 3
        }}>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>
            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {!isUser && !msg.isStreaming && msg.content && (
            <CopyButton text={msg.content} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AskOasisPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(getOrCreateSessionId);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showStarterPrompts, setShowStarterPrompts] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Load history on mount ──
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`${BASE}/api/chat/session/${sessionId}`, {
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            const restored: Message[] = data.messages.map((m: { role: string; content: string }, i: number) => ({
              id: `restored_${i}`,
              role: m.role as "user" | "assistant",
              content: m.content,
              timestamp: new Date(),
            }));
            setMessages(restored);
            setShowStarterPrompts(false);
          }
        }
      } catch (e) {
        console.error("Failed to load chat history", e);
      } finally {
        setHistoryLoaded(true);
      }
    }
    loadHistory();
  }, [sessionId]);

  // ── Auto-scroll ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ──
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    setShowStarterPrompts(false);

    // Add user message
    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date()
    };

    // Add placeholder assistant message (streaming)
    const assistantId = `assistant_${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
      toolCalls: []
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch(`${BASE}/api/chat/message`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: trimmed }),
        signal: abort.signal
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let toolCalls: { reason: string; sql: string }[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const event: SSEEvent = JSON.parse(raw);

            if (event.type === "chunk" && event.content) {
              fullContent += event.content;
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: fullContent, isStreaming: true }
                  : m
              ));
            } else if (event.type === "tool_call") {
              toolCalls = [...toolCalls, { reason: event.reason || "", sql: event.sql || "" }];
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, toolCalls, isStreaming: true }
                  : m
              ));
            } else if (event.type === "done") {
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, isStreaming: false, content: fullContent, toolCalls }
                  : m
              ));
            } else if (event.type === "error") {
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, isStreaming: false, content: event.content || "An error occurred.", toolCalls }
                  : m
              ));
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const errorText = `Sorry, I couldn't connect to the server. Please try again.`;
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, isStreaming: false, content: errorText }
          : m
      ));
    } finally {
      setIsLoading(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }, [isLoading, sessionId]);

  // ── Clear chat ──
  const clearChat = async () => {
    try {
      await fetch(`${BASE}/api/chat/session/${sessionId}`, {
        method: "DELETE",
        credentials: "include"
      });
    } catch (e) {
      console.error("Failed to clear session", e);
    }
    setMessages([]);
    setShowStarterPrompts(true);
  };

  // ── Keyboard handler ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Auto-resize textarea ──
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "#f8fafc", overflow: "hidden"
    }}>

      {/* ── Header ── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "14px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, #0f766e, #0891b2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(8,145,178,0.3)"
          }}>
            <Sparkles size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Ask Oasis</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              AI intelligence — powered by live data
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              title="Clear chat"
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 7,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s"
              }}
            >
              <Trash2 size={12} /> Clear Chat
            </button>
          )}
        </div>
      </div>

      {/* ── Messages Area ── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "20px 24px",
        display: "flex", flexDirection: "column"
      }}>

        {/* Welcome / Starter */}
        {historyLoaded && messages.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 40 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18, margin: "0 auto 16px",
              background: "linear-gradient(135deg, #0f766e, #0891b2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 20px rgba(8,145,178,0.25)"
            }}>
              <Sparkles size={28} color="white" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 20, color: "#0f172a", marginBottom: 6 }}>
              Ask me anything about Oasis Grand Reservation
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 32, maxWidth: 420, margin: "0 auto 32px" }}>
              I have access to all your call analytics, bookings, guest profiles, and agent performance data. Ask me in plain English.
            </div>

            {/* Starter prompts */}
            {showStarterPrompts && (
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10, maxWidth: 700, margin: "0 auto"
              }}>
                {STARTER_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    style={{
                      textAlign: "left", padding: "10px 14px",
                      background: "#fff", border: "1px solid #e2e8f0",
                      borderRadius: 10, cursor: "pointer", fontSize: 12.5,
                      color: "#334155", lineHeight: 1.4,
                      transition: "all 0.15s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#3b82f6";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                    }}
                  >
                    <MessageSquare size={11} color="#3b82f6" style={{ marginBottom: 4 }} />
                    <div>{prompt}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message thread */}
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* ── Input Bar ── */}
      <div style={{
        borderTop: "1px solid #e2e8f0", background: "#fff",
        padding: "12px 20px", flexShrink: 0
      }}>
        <div style={{
          display: "flex", gap: 10, alignItems: "flex-end",
          background: "#f8fafc", border: "1.5px solid #e2e8f0",
          borderRadius: 14, padding: "8px 12px",
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}
          onFocus={() => {}}
        >
          <Bot size={16} color="#94a3b8" style={{ marginBottom: 6, flexShrink: 0 }} />
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your bookings, calls, agents…"
            rows={1}
            disabled={isLoading}
            style={{
              flex: 1, border: "none", background: "transparent",
              resize: "none", outline: "none", fontSize: 13,
              color: "#1e293b", lineHeight: 1.5, overflowY: "hidden",
              fontFamily: "inherit", minHeight: 22, maxHeight: 120
            }}
          />
          <button
            id="chat-send-btn"
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            style={{
              width: 34, height: 34, borderRadius: 9,
              background: isLoading || !input.trim()
                ? "#e2e8f0"
                : "linear-gradient(135deg, #0f766e, #0891b2)",
              border: "none", cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s", flexShrink: 0,
              boxShadow: isLoading || !input.trim() ? "none" : "0 2px 8px rgba(8,145,178,0.3)"
            }}
          >
            {isLoading
              ? <Loader2 size={15} color="#94a3b8" style={{ animation: "spin 1s linear infinite" }} />
              : <Send size={15} color={input.trim() ? "white" : "#94a3b8"} />
            }
          </button>
        </div>
        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 5, textAlign: "center" }}>
          Enter to send · Shift+Enter for new line · Ask anything about your call data
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}
