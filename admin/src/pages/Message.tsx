import { useState, useEffect, useRef } from "react";
import Layout from "../components/layout/Layout";
import { authFetch } from "../lib/apiFetch";
import {
  Search, Archive, Send, X, MessageSquare,
  CornerDownRight, Inbox, CheckCircle, Clock, ArrowLeft,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "unread" | "read" | "replied" | "archived";
type Topic = "general" | "editorial" | "bug" | "partnership" | "press" | "other";

interface Reply {
  body: string;
  repliedBy: { name: string; avatar?: string };
  repliedAt: string;
}

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  topic: Topic;
  status: Status;
  createdAt: string;
  reply: Reply | null;
  user?: { name: string; email: string; avatar?: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const STATUS_STYLES: Record<Status, string> = {
  unread:   "bg-red-500/15 text-red-400 border border-red-500/25",
  read:     "bg-zinc-500/15 text-zinc-400 border border-zinc-500/20",
  replied:  "bg-green-500/12 text-green-400 border border-green-500/20",
  archived: "bg-zinc-800/50 text-zinc-600 border border-zinc-700/30",
};

const TOPIC_STYLES = "bg-purple-500/12 text-purple-400 border border-purple-500/20";

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`text-[10px] font-semibold px-[7px] py-[2px] rounded uppercase tracking-wide ${className}`}>
      {label}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center font-bold text-[11px] text-red-400 flex-shrink-0">
      {initials(name)}
    </div>
  );
}

function EmptyDetail() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-600">
      <Inbox size={48} strokeWidth={1.2} />
      <p className="text-sm">Select a message to view</p>
    </div>
  );
}

// ─── Message List Item ────────────────────────────────────────────────────────

function MessageItem({
  msg,
  active,
  onClick,
}: {
  msg: ContactMessage;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-zinc-800/60 hover:bg-zinc-900 transition-colors relative ${
        active ? "bg-zinc-900 border-l-2 border-l-red-500 pl-[14px]" : ""
      }`}
    >
      {msg.status === "unread" && (
        <span className="absolute top-[14px] right-3 w-[6px] h-[6px] rounded-full bg-red-500" />
      )}
      <div className="flex justify-between items-start mb-1">
        <span className="text-[12.5px] font-semibold text-zinc-100 truncate pr-4">
          {msg.name}
        </span>
        <span className="text-[10.5px] text-zinc-600 flex-shrink-0">
          {timeAgo(msg.createdAt)}
        </span>
      </div>
      <div className="text-[12px] text-zinc-500 truncate mb-0.5">{msg.subject}</div>
      <div className="text-[11.5px] text-zinc-600 truncate mb-2">
        {msg.message.slice(0, 65)}…
      </div>
      <div className="flex gap-1.5 flex-wrap">
        <Badge label={msg.status} className={STATUS_STYLES[msg.status]} />
        <Badge label={msg.topic} className={TOPIC_STYLES} />
      </div>
    </button>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  msg,
  onArchive,
  onReply,
  onBack,
}: {
  msg: ContactMessage;
  onArchive: (id: string) => void;
  onReply: (id: string, body: string) => Promise<void>;
  onBack: () => void;
}) {
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setReplyBody(""); }, [msg._id]);

  const handleSend = async () => {
    if (!replyBody.trim() || sending) return;
    setSending(true);
    try {
      await onReply(msg._id, replyBody.trim());
      setReplyBody("");
    } finally {
      setSending(false);
    }
  };

  const isArchived = msg.status === "archived";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 lg:px-5 py-4 border-b border-zinc-800/60 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            {/* Back button — mobile only */}
            <button
              onClick={onBack}
              className="lg:hidden flex-shrink-0 mt-0.5 text-zinc-500 hover:text-zinc-200 transition-colors"
              aria-label="Back to list"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <h3 className="text-[14px] lg:text-[15px] font-semibold text-zinc-100 mb-1.5 leading-snug">
                {msg.subject}
              </h3>
              <div className="flex gap-2 flex-wrap items-center">
                <Badge label={msg.status} className={STATUS_STYLES[msg.status]} />
                <Badge label={msg.topic} className={TOPIC_STYLES} />
                <span className="text-[11px] text-zinc-600">{timeAgo(msg.createdAt)}</span>
              </div>
            </div>
          </div>
          {!isArchived && (
            <button
              onClick={() => onArchive(msg._id)}
              className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-md text-[11px] lg:text-[11.5px] font-medium text-zinc-500 border border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800 transition-all flex-shrink-0"
            >
              <Archive size={13} />
              <span className="hidden sm:inline">Archive</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2.5 mt-3 ml-0 lg:ml-0">
          <Avatar name={msg.name} />
          <div>
            <p className="text-[12.5px] font-semibold text-zinc-200">{msg.name}</p>
            <p className="text-[11px] lg:text-[11.5px] text-zinc-500 break-all">{msg.email}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-4"
      >
        <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-zinc-600 uppercase tracking-wider mb-3">
            <MessageSquare size={13} />
            Message
          </div>
          <p className="text-[13px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {msg.message}
          </p>
        </div>

        {msg.reply && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-red-400/80 uppercase tracking-wider mb-3">
              <Send size={13} />
              Your Reply
            </div>
            <p className="text-[13px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {msg.reply.body}
            </p>
            <p className="text-[11px] text-zinc-600 mt-3 pt-3 border-t border-zinc-800/60">
              Replied by {msg.reply.repliedBy.name} · {timeAgo(msg.reply.repliedAt)}
            </p>
          </div>
        )}
      </div>

      {/* Reply composer */}
      {!isArchived ? (
        <div className="border-t border-zinc-800/60 px-4 lg:px-5 py-4 bg-zinc-950 shrink-0">
          <p className="text-[11.5px] font-semibold text-zinc-600 flex items-center gap-1.5 mb-2">
            <CornerDownRight size={13} />
            Reply to {msg.name}
          </p>
          <textarea
            rows={3}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder={`Write your reply… sent to ${msg.email}`}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-500/40 rounded-lg px-3 py-2.5 text-[13px] text-zinc-200 placeholder-zinc-600 resize-none outline-none transition-colors font-[inherit] leading-relaxed"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setReplyBody("")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] text-zinc-500 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-300 transition-all"
            >
              <X size={12} /> Clear
            </button>
            <button
              onClick={handleSend}
              disabled={!replyBody.trim() || sending}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[12px] font-semibold bg-red-600 text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {sending ? (
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="animate-spin" /> Sending…
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Send size={13} /> Send Reply
                </span>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-zinc-800/60 px-5 py-3 text-center text-[12px] text-zinc-600">
          This message is archived
        </div>
      )}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, show }: { msg: string; show: boolean }) {
  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-[12.5px] text-zinc-200 shadow-xl transition-all duration-200 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      }`}
    >
      <CheckCircle size={15} className="text-green-400" />
      {msg}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Message() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ show: false, msg: "" });
  const [page, setPage] = useState(1);

  // Mobile: track which "pane" is visible — "list" or "detail"
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  function showToast(msg: string) {
    setToast({ show: true, msg });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  }

  async function fetchMessages(p = page) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (filter !== "all") params.set("status", filter);

      const json = await authFetch<{ messages: ContactMessage[]; pagination: Pagination }>(
        `/contact?${params}`
      );

      if (json.success) {
        setMessages(json.data.messages);
        setPagination(json.data.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchMessages(1); setPage(1); }, [filter]);

  async function selectMessage(msg: ContactMessage) {
    setActive(msg);
    setMobileView("detail"); // slide to detail on mobile
    if (msg.status === "unread") {
      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? { ...m, status: "read" } : m))
      );
      setActive({ ...msg, status: "read" });
      authFetch(`/contact/${msg._id}`).catch(() => {});
    }
  }

  async function handleArchive(id: string) {
    try {
      await authFetch(`/contact/${id}/archive`, { method: "PATCH" });
      setMessages((prev) =>
        prev.map((m) => (m._id === id ? { ...m, status: "archived" } : m))
      );
      setActive((a) => (a?._id === id ? { ...a, status: "archived" } : a));
      showToast("Message archived");
    } catch (e) {
      console.error(e);
    }
  }

  async function handleReply(id: string, body: string) {
    await authFetch(`/contact/${id}/reply`, {
      method: "POST",
      body: { body },
    });

    const reply: Reply = {
      body,
      repliedBy: { name: "Admin" },
      repliedAt: new Date().toISOString(),
    };
    setMessages((prev) =>
      prev.map((m) => (m._id === id ? { ...m, reply, status: "replied" } : m))
    );
    setActive((a) => (a?._id === id ? { ...a, reply, status: "replied" } : a));
    showToast("Reply sent to user's inbox");
  }

  const visible = messages.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  });

  const stats = {
    unread:  messages.filter((m) => m.status === "unread").length,
    replied: messages.filter((m) => m.status === "replied").length,
    total:   pagination?.total ?? messages.length,
  };

  const FILTERS: { key: Status | "all"; label: string }[] = [
    { key: "all",      label: "All" },
    { key: "unread",   label: "Unread" },
    { key: "read",     label: "Read" },
    { key: "replied",  label: "Replied" },
    { key: "archived", label: "Archived" },
  ];

  // ── List panel ───────────────────────────────────────────────────────────────
  const ListPanel = (
    <div
      className={`
        flex flex-col flex-shrink-0 bg-zinc-950
        border-r border-zinc-800/60
        /* Mobile: full width, shown only when mobileView === "list" */
        w-full lg:w-[320px]
        ${mobileView === "list" ? "flex" : "hidden"}
        lg:flex
      `}
    >
      {/* Stats bar */}
      <div className="grid grid-cols-3 border-b border-zinc-800/60">
        {[
          { label: "Unread",  value: stats.unread,  color: "text-red-400"   },
          { label: "Total",   value: stats.total,   color: "text-zinc-200"  },
          { label: "Replied", value: stats.replied, color: "text-green-400" },
        ].map((s, i) => (
          <div key={i} className={`py-2.5 text-center ${i < 2 ? "border-r border-zinc-800/60" : ""}`}>
            <p className={`text-[18px] font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="p-3 border-b border-zinc-800/60">
        <h2 className="text-[14px] font-semibold text-zinc-100 mb-2.5">Messages</h2>
        <div className="relative mb-2.5">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, subject…"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 pl-8 pr-3 text-[12px] text-zinc-300 placeholder-zinc-600 outline-none focus:border-zinc-700"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all ${
                filter === f.key
                  ? "bg-red-500/15 border-red-500/30 text-red-400"
                  : "border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-zinc-600 text-sm">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="p-8 text-center text-zinc-600 text-sm">
            <Inbox size={28} className="mx-auto mb-2 text-zinc-700" />
            No messages found
          </div>
        ) : (
          visible.map((m) => (
            <MessageItem
              key={m._id}
              msg={m}
              active={active?._id === m._id}
              onClick={() => selectMessage(m)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="border-t border-zinc-800/60 px-4 py-2.5 flex items-center justify-between">
          <span className="text-[11px] text-zinc-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => { const p = page - 1; setPage(p); fetchMessages(p); }}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded text-[11px] border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => { const p = page + 1; setPage(p); fetchMessages(p); }}
              disabled={!pagination || page >= pagination.pages}
              className="px-2.5 py-1 rounded text-[11px] border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── Detail panel ─────────────────────────────────────────────────────────────
  const DetailPanelWrapper = (
    <div
      className={`
        flex-1 flex flex-col overflow-hidden bg-zinc-950/50
        /* Mobile: full width, shown only when mobileView === "detail" */
        w-full
        ${mobileView === "detail" ? "flex" : "hidden"}
        lg:flex
      `}
    >
      {active ? (
        <DetailPanel
          key={active._id}
          msg={active}
          onArchive={handleArchive}
          onReply={handleReply}
          onBack={() => setMobileView("list")}
        />
      ) : (
        <EmptyDetail />
      )}
    </div>
  );

  return (
    <Layout title="Contact Messages">
      <div className="flex h-[calc(100vh-0px)] overflow-hidden">
        {ListPanel}
        {DetailPanelWrapper}
      </div>
      <Toast show={toast.show} msg={toast.msg} />
    </Layout>
  );
}