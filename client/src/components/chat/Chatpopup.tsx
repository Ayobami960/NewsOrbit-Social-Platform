"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Minimize2, ChevronDown } from "lucide-react";
import type { ChatMessage, TypingPayload } from "@/hooks/useChatSocket";

interface ChatPopupProps {
  user: { name: string; avatarUrl?: string };
  currentUserId: string;
  messages: ChatMessage[];
  loading: boolean;
  hasMore: boolean;
  unreadCount: number;
  isSupportOnline: boolean;
  typingPayload: TypingPayload | null;
  readReceiptFor: string | null;
  onOpen: () => Promise<void>;
  onSend: (body: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  onMarkRead: () => void;
  onLoadMore: () => void;
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function dateDivider(iso: string) {
  const d = new Date(iso), today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "short" });
}

function buildGroups(msgs: ChatMessage[]) {
  const result: Array<{ type: "divider"; label: string } | { type: "msg"; msg: ChatMessage }> = [];
  let lastDate = "";
  msgs.forEach((m) => {
    const date = new Date(m.createdAt).toDateString();
    if (date !== lastDate) {
      result.push({ type: "divider", label: dateDivider(m.createdAt) });
      lastDate = date;
    }
    result.push({ type: "msg", msg: m });
  });
  return result;
}

// ── Animated presence dot ─────────────────────────────────────────────────────
function SupportPresence({ online }: { online: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        {online && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${online ? "bg-green-400" : "bg-zinc-500"}`} />
      </span>
      <span className={`text-[11px] ${online ? "text-green-300" : "text-white/60"}`}>
        {online ? "Online" : "We'll reply soon"}
      </span>
    </span>
  );
}

export default function ChatPopup({
  user, currentUserId,
  messages, loading, hasMore, unreadCount,
  isSupportOnline, typingPayload, readReceiptFor,
  onOpen, onSend, onTyping, onMarkRead, onLoadMore,
}: ChatPopupProps) {
  const [open, setOpen]               = useState(false);
  const [minimised, setMinimised]     = useState(false);
  const [input, setInput]             = useState("");
  const [sending, setSending]         = useState(false);
  const [supportTyping, setSupportTyping] = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const isFirstLoad = useRef(true);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Scroll to bottom on first load
  useEffect(() => {
    if (!loading && isFirstLoad.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
      isFirstLoad.current = false;
      onMarkRead();
    }
  }, [loading, messages.length]);

  // Scroll on new support message
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.senderType === "support") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      if (open && !minimised) onMarkRead();
    }
  }, [messages.length]);

  // Support typing indicator
  useEffect(() => {
    if (!typingPayload || typingPayload.senderType !== "support") return;
    setSupportTyping(typingPayload.isTyping);
    if (typingPayload.isTyping) {
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setSupportTyping(false), 3000);
    }
  }, [typingPayload]);

  // Focus input when chat opens
  useEffect(() => {
    if (open && !minimised) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open, minimised]);

  async function handleOpen() {
    setOpen(true);
    setMinimised(false);
    isFirstLoad.current = true;
    await onOpen();
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    onTyping(false);
    clearTimeout(typingTimer.current);
    await onSend(text);
    setSending(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    onTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => onTyping(false), 2000);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const grouped = buildGroups(messages);

  // ── Floating trigger button ───────────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={handleOpen}
        aria-label="Open chat"
        style={{ position: "fixed", bottom: 24, right: 24, zIndex: 99999 }}
        className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-xl hover:bg-red-500 transition-all hover:scale-105 active:scale-95"
      >
        <MessageSquare size={22} className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-white text-red-600 text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {/* Pulse ring when support is online */}
        {isSupportOnline && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
        )}
      </button>
    );
  }

  // ── Chat window ───────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 99999,
        width: 360,
        height: minimised ? 56 : 520,
        transition: "height 0.25s ease",
      }}
      className="rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 flex flex-col overflow-hidden"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-red-600 flex-shrink-0">
        {/* NewsOrbit avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-[11px]">NS</span>
          </div>
          {/* Presence dot on avatar */}
          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-red-600 transition-all duration-500 ${
            isSupportOnline
              ? "bg-green-400 shadow-[0_0_6px_1px_rgba(74,222,128,0.7)]"
              : "bg-zinc-400"
          }`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white">NewsOrbit Support</p>
          <div>
            {supportTyping
              ? <span className="text-[11px] text-white/80 animate-pulse">Support is typing…</span>
              : <SupportPresence online={isSupportOnline} />
            }
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimised((v) => !v)}
            aria-label={minimised ? "Expand" : "Minimise"}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            {minimised ? <ChevronDown size={15} /> : <Minimize2 size={14} />}
          </button>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      {!minimised && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-zinc-50 dark:bg-zinc-900/50">
            {hasMore && (
              <div className="text-center py-2">
                <button onClick={onLoadMore} className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                  Load earlier messages
                </button>
              </div>
            )}

            {loading ? (
              <div className="py-20 text-center text-zinc-400 text-sm">Loading…</div>
            ) : messages.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-zinc-400 text-sm mb-1">👋 Hi there!</p>
                <p className="text-zinc-500 text-xs">Send us a message and we'll get back to you shortly.</p>
              </div>
            ) : (
              grouped.map((item, i) => {
                if (item.type === "divider") {
                  return (
                    <div key={`d${i}`} className="flex items-center gap-3 py-3">
                      <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                      <span className="text-[10px] text-zinc-400 font-medium">{item.label}</span>
                      <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                  );
                }

                const msg    = item.msg;
                const isMine = msg.senderType === "user";

                return (
                  <div key={msg._id} className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Support avatar */}
                    {!isMine && (
                      <div className="relative w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mb-1">
                        NS
                        {/* Live dot on support avatar inside messages */}
                        {isSupportOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border border-white dark:border-zinc-900" />
                        )}
                      </div>
                    )}
                    {/* User avatar */}
                    {isMine && (
                      <div className="w-6 h-6 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 mb-1 overflow-hidden">
                        {user.avatarUrl
                          ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                          : <span className="text-[9px] font-bold text-zinc-600 dark:text-zinc-300">{user.name[0]?.toUpperCase()}</span>
                        }
                      </div>
                    )}

                    <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}>
                      {!isMine && (
                        <span className="text-[10px] text-zinc-500 mb-0.5 px-1">{msg.sender.name}</span>
                      )}
                      <div className={`px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed break-words ${
                        isMine
                          ? "bg-red-600 text-white rounded-br-sm"
                          : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-sm shadow-sm border border-zinc-100 dark:border-zinc-700"
                      }`}>
                        {msg.body}
                      </div>
                      <div className={`flex items-center gap-1 px-1 ${isMine ? "flex-row-reverse" : ""}`}>
                        <span className="text-[10px] text-zinc-400">{timeLabel(msg.createdAt)}</span>
                        {isMine && (
                          <span className={`text-[10px] ${msg.readAt ? "text-blue-500" : "text-zinc-400"}`}>
                            {msg.readAt ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Support typing indicator */}
            {supportTyping && (
              <div className="flex items-end gap-2">
                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">OG</div>
                <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1 shadow-sm">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
           className="px-3 py-3 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0 bg-white dark:bg-zinc-950"
           
           >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                // className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-red-400 dark:focus:border-red-500/50 rounded-xl px-3 py-2 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 resize-none outline-none transition-colors leading-relaxed max-h-28 overflow-y-auto"
                className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-red-400 dark:focus:border-red-500/50 rounded-xl  px-2 py-1.5 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 resize-none outline-none transition-colors leading-relaxed max-h-28 overflow-y-auto" 
                style={{ height: "38px" }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = "38px";
                  t.style.height = Math.min(t.scrollHeight, 112) + "px";
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="w-9 h-9 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
            <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-600 mt-2">
              Powered by <span className="text-red-500 font-medium">NewsOrbit</span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
