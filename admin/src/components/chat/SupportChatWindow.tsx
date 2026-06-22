import { useEffect, useRef, useState } from "react";
import { authFetch } from "../../lib/apiFetch";
import type { ChatMessage, TypingPayload } from "../../hooks/useChatSocket";
import type { ConversationSummary } from "./InboxList";
import { Send, ArrowLeft, UserCheck, X, CheckCircle2, Wifi, WifiOff } from "lucide-react";

interface Props {
  conversation: ConversationSummary;
  currentUser: { _id: string; name: string; role: string };
  onBack?: () => void;
  isUserOnline: boolean;
  onJoin: (conversationId: string) => Promise<{ isUserOnline: boolean; presenceMap: Record<string, boolean> }>;
  onSend: (conversationId: string, body: string) => Promise<ChatMessage | null>;
  onTyping: (conversationId: string, isTyping: boolean) => void;
  onMarkRead: (conversationId: string) => void;
  incomingMessage: ChatMessage | null;
  typingPayload: TypingPayload | null;
  readReceiptFor: string | null;
  onAssign: (conversationId: string) => void;
  onClose: (conversationId: string) => void;
  // Live presence pushed from parent (from socket "presence" event)
  onlineUsers: Record<string, boolean>;
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function dateDivider(iso: string) {
  const d = new Date(iso), today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "short" });
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function buildGroups(msgs: ChatMessage[]) {
  const result: Array<{ type: "divider"; label: string } | { type: "msg"; msg: ChatMessage }> = [];
  let lastDate = "";
  msgs.forEach((m) => {
    const date = new Date(m.createdAt).toDateString();
    if (date !== lastDate) { result.push({ type: "divider", label: dateDivider(m.createdAt) }); lastDate = date; }
    result.push({ type: "msg", msg: m });
  });
  return result;
}

// ── Presence dot ─────────────────────────────────────────────────────────────

function PresenceDot({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 transition-colors duration-500 ${
        online ? "bg-green-500 shadow-[0_0_6px_1px_rgba(34,197,94,0.6)]" : "bg-zinc-600"
      }`}
    />
  );
}

export default function SupportChatWindow({
  conversation, currentUser, onBack,
  onJoin, onSend, onTyping, onMarkRead,
  incomingMessage, typingPayload, readReceiptFor,
  onAssign, onClose,
  onlineUsers,
}: Props) {
  const [messages, setMessages]         = useState<ChatMessage[]>([]);
  const [input, setInput]               = useState("");
  const [sending, setSending]           = useState(false);
  const [loading, setLoading]           = useState(true);
  const [page, setPage]                 = useState(1);
  const [hasMore, setHasMore]           = useState(false);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [typing, setTyping]             = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const convoId     = conversation._id;
  const user        = conversation.user;
  const isClosed    = conversation.status === "closed";
  const isAssignedToMe = conversation.assignedTo?._id === currentUser._id;

  // Derive online status from the shared onlineUsers map (kept live by parent)
  const isUserOnline = onlineUsers[user._id] ?? false;

  // ── Load history + join socket room ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setMessages([]); setLoading(true); setPage(1);

    (async () => {
      const [, historyRes] = await Promise.all([
        onJoin(convoId),
        authFetch<{ messages: ChatMessage[]; pagination: { pages: number } }>(
          `/chat/inbox/${convoId}/messages?page=1&limit=30`
        ),
      ]);

      if (cancelled) return;

      // presenceMap from join gives us the snapshot at join time;
      // from here, live updates come via the parent's onlineUsers prop.
      // (parent merges presenceMap into its onlineUsers state)

      if (historyRes.success) {
        setMessages(historyRes.data.messages);
        setHasMore(historyRes.data.pagination.pages > 1);
      }
      setLoading(false);

      onMarkRead(convoId);
      authFetch(`/chat/inbox/${convoId}/read`, { method: "PATCH" }).catch(() => {});
    })();

    return () => { cancelled = true; };
  }, [convoId]);

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [loading]);

  // ── Incoming messages ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!incomingMessage || incomingMessage.conversation !== convoId) return;
    setMessages((prev) =>
      prev.some((m) => m._id === incomingMessage._id) ? prev : [...prev, incomingMessage]
    );
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    onMarkRead(convoId);
    authFetch(`/chat/inbox/${convoId}/read`, { method: "PATCH" }).catch(() => {});
  }, [incomingMessage]);

  // ── Typing indicator ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!typingPayload || typingPayload.conversationId !== convoId) return;
    setTyping(typingPayload.isTyping);
    if (typingPayload.isTyping) {
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 3000);
    }
  }, [typingPayload]);

  // ── Read receipts ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (readReceiptFor !== convoId) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.senderType === "support" && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m
      )
    );
  }, [readReceiptFor]);

  // ── Load more ─────────────────────────────────────────────────────────────
  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const savedHeight = bottomRef.current?.parentElement?.scrollHeight ?? 0;
    const nextPage = page + 1;
    const res = await authFetch<{ messages: ChatMessage[]; pagination: { pages: number } }>(
      `/chat/inbox/${convoId}/messages?page=${nextPage}&limit=30`
    );
    if (res.success) {
      setMessages((prev) => [...res.data.messages, ...prev]);
      setPage(nextPage);
      setHasMore(nextPage < res.data.pagination.pages);
      requestAnimationFrame(() => {
        const container = bottomRef.current?.parentElement;
        if (container) container.scrollTop = container.scrollHeight - savedHeight;
      });
    }
    setLoadingMore(false);
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  async function handleSend() {
    const text = input.trim();
    if (!text || sending || isClosed) return;
    setSending(true);
    setInput("");
    onTyping(convoId, false);
    const msg = await onSend(convoId, text);
    if (msg) {
      setMessages((prev) => prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
    setSending(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    onTyping(convoId, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => onTyping(convoId, false), 2000);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const grouped = buildGroups(messages);

  return (
    <div className="flex flex-col h-full bg-zinc-950/50">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-zinc-800/60 flex items-center gap-3 shrink-0 bg-zinc-950">
        {onBack && (
          <button onClick={onBack} className="lg:hidden text-zinc-500 hover:text-zinc-200 transition-colors">
            <ArrowLeft size={18} />
          </button>
        )}

        {/* Avatar with presence ring */}
        <div className="relative shrink-0">
          {user.avatar?.url ? (
            <img
              src={user.avatar.url}
              className={`w-9 h-9 rounded-full object-cover ring-2 transition-all duration-500 ${
                isUserOnline ? "ring-green-500/70" : "ring-zinc-700"
              }`}
              alt={user.name}
            />
          ) : (
            <div className={`w-9 h-9 rounded-full bg-red-500/15 border-2 flex items-center justify-center text-[11px] font-bold text-red-400 transition-all duration-500 ${
              isUserOnline ? "border-green-500/70" : "border-red-500/30"
            }`}>
              {initials(user.name)}
            </div>
          )}
          {/* Presence dot — bottom right of avatar */}
          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-950 transition-all duration-500 ${
            isUserOnline
              ? "bg-green-500 shadow-[0_0_6px_2px_rgba(34,197,94,0.5)]"
              : "bg-zinc-600"
          }`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-zinc-100 truncate">{user.name}</p>
          <div className="flex items-center gap-1.5">
            <PresenceDot online={isUserOnline} />
            <p className="text-[11px] text-zinc-500">
              {typing
                ? <span className="text-green-400 animate-pulse">typing…</span>
                : isUserOnline
                  ? <span className="text-green-400">Active now</span>
                  : <span className="text-zinc-600">Offline · {user.email}</span>
              }
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Live connection indicator for support agent */}
          <span title={isUserOnline ? "User is online" : "User is offline"}>
            {isUserOnline
              ? <Wifi size={13} className="text-green-500" />
              : <WifiOff size={13} className="text-zinc-600" />
            }
          </span>

          {!isAssignedToMe && !isClosed && (
            <button
              onClick={() => onAssign(convoId)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-zinc-500 border border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
            >
              <UserCheck size={13} /> Assign to me
            </button>
          )}
          {!isClosed && (
            <button
              onClick={() => onClose(convoId)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-zinc-500 border border-zinc-800 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all"
            >
              <X size={13} /> Close
            </button>
          )}
          {isClosed && (
            <span className="flex items-center gap-1.5 text-[11px] text-green-500">
              <CheckCircle2 size={13} /> Closed
            </span>
          )}
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {hasMore && (
          <div className="text-center py-2">
            <button onClick={loadMore} disabled={loadingMore} className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">
              {loadingMore ? "Loading…" : "Load earlier messages"}
            </button>
          </div>
        )}
        {loading ? (
          <div className="py-20 text-center text-zinc-600 text-sm">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="py-20 text-center text-zinc-600 text-sm">No messages yet. Say hello!</div>
        ) : (
          grouped.map((item, i) => {
            if (item.type === "divider") {
              return (
                <div key={`d${i}`} className="flex items-center gap-3 py-3">
                  <div className="flex-1 h-px bg-zinc-800/60" />
                  <span className="text-[10.5px] text-zinc-600 font-medium">{item.label}</span>
                  <div className="flex-1 h-px bg-zinc-800/60" />
                </div>
              );
            }
            const msg    = item.msg;
            const isMine = msg.senderType === "support";
            return (
              <div key={msg._id} className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                {!isMine && (
                  <div className="shrink-0 mb-1">
                    {user.avatar?.url ? (
                      <img src={user.avatar.url} className="w-6 h-6 rounded-full object-cover" alt={user.name} />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center text-[9px] font-bold text-red-400">
                        {initials(user.name)}
                      </div>
                    )}
                  </div>
                )}
                <div className={`max-w-[72%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                  {isMine && (
                    <span className="text-[10px] text-zinc-600 mb-0.5 px-1">{msg.sender.name}</span>
                  )}
                  <div className={`px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed wrap-break-word ${
                    isMine
                      ? "bg-red-600 text-white rounded-br-sm"
                      : "bg-zinc-800 text-zinc-200 rounded-bl-sm"
                  }`}>
                    {msg.body}
                  </div>
                  <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? "flex-row-reverse" : ""}`}>
                    <span className="text-[10px] text-zinc-700">{timeLabel(msg.createdAt)}</span>
                    {isMine && (
                      <span className={`text-[10px] ${msg.readAt ? "text-blue-400" : "text-zinc-600"}`}>
                        {msg.readAt ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {typing && (
          <div className="flex items-end gap-2">
            <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ──────────────────────────────────────────────────────── */}
      {isClosed ? (
        <div className="border-t border-zinc-800/60 px-4 py-3 text-center text-[12px] text-zinc-600 bg-zinc-950">
          This conversation is closed.
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-zinc-800/60 shrink-0 bg-zinc-950">
          <div className="flex items-end gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isUserOnline ? `Reply to ${user.name} (online)…` : "Reply as support…"}
              className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-xl px-3.5 py-2.5 text-[13px] text-zinc-200 placeholder-zinc-600 resize-none outline-none transition-colors leading-relaxed max-h-32 overflow-y-auto"
              style={{ height: "42px" }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "42px";
                t.style.height = Math.min(t.scrollHeight, 128) + "px";
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
          <p className="text-[10px] text-zinc-700 mt-1.5 pl-1">Enter to send · Shift+Enter for new line</p>
        </div>
      )}
    </div>
  );
}
