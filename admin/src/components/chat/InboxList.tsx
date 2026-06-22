// frontend-admin/src/components/chat/InboxList.tsx
import { useEffect, useState, useCallback } from "react";
import { authFetch } from "../../lib/apiFetch";
import type { InboxUpdate } from "../../hooks/useChatSocket";
import { Search, Circle, CheckCircle2 } from "lucide-react";

export interface ConversationSummary {
  _id: string;
  user: { _id: string; name: string; email: string; avatar?: { url: string }; role: string };
  lastMessage: { body: string; senderName: string; createdAt: string } | null;
  supportUnread: number;
  userUnread: number;
  status: "open" | "closed";
  assignedTo?: { _id: string; name: string; avatar?: { url: string } } | null;
  updatedAt: string;
}

interface Props {
  activeId: string | null;
  onSelect: (convo: ConversationSummary) => void;
  latestUpdate: InboxUpdate | null;
  onlineUsers: Record<string, boolean>;
  currentUserId: string;
}

function timeLabel(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso), now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60)    return "now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function InboxList({ activeId, onSelect, latestUpdate, onlineUsers, currentUserId }: Props) {
  const [convos, setConvos]   = useState<ConversationSummary[]>([]);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<"all" | "open" | "closed">("open");
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchInbox = useCallback(async (p = 1, reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (filter !== "all") params.set("status", filter);
      if (search) params.set("search", search);

      const res = await authFetch<{ conversations: ConversationSummary[]; pagination: any }>(
        `/chat/inbox?${params}`
      );

      if (res.success) {
        setConvos((prev) => reset ? res.data.conversations : [...prev, ...res.data.conversations]);
        setHasMore(p < res.data.pagination.pages);
        setPage(p);
      }
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  // Re-fetch when filter/search changes
  useEffect(() => { fetchInbox(1, true); }, [filter, search]);

  // Apply live socket updates to the list
  useEffect(() => {
    if (!latestUpdate) return;
    setConvos((prev) => {
      const idx = prev.findIndex((c) => c._id === latestUpdate.conversationId);
      if (idx === -1) {
        // New conversation — re-fetch to get full data
        fetchInbox(1, true);
        return prev;
      }
      const updated = {
        ...prev[idx],
        lastMessage: { ...latestUpdate.lastMessage },
        supportUnread: latestUpdate.supportUnread,
        updatedAt: new Date().toISOString(),
      };
      const rest = prev.filter((_, i) => i !== idx);
      return [updated, ...rest]; // bubble to top
    });
  }, [latestUpdate]);

  const totalUnread = convos.reduce((acc, c) => acc + c.supportUnread, 0);

  const FILTERS = [
    { key: "open",   label: "Open" },
    { key: "closed", label: "Closed" },
    { key: "all",    label: "All" },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800/60 w-full">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-800/60 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-zinc-100">Support Inbox</h2>
          {totalUnread > 0 && (
            <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-2 py-0.5">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 pl-8 pr-3 text-[12px] text-zinc-300 placeholder-zinc-600 outline-none focus:border-zinc-700"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5">
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

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && convos.length === 0 ? (
          <div className="p-8 text-center text-zinc-600 text-sm">Loading…</div>
        ) : convos.length === 0 ? (
          <div className="p-8 text-center text-zinc-600 text-sm">No conversations</div>
        ) : (
          <>
            {convos.map((convo) => {
              const isActive  = convo._id === activeId;
              const isOnline  = onlineUsers[convo.user._id] ?? false;
              const unread    = convo.supportUnread;
              const isMine    = convo.assignedTo?._id === currentUserId;

              return (
                <button
                  key={convo._id}
                  onClick={() => onSelect(convo)}
                  className={`w-full text-left px-4 py-3 border-b border-zinc-800/40 transition-colors hover:bg-zinc-900 flex items-start gap-3 ${
                    isActive ? "bg-zinc-900 border-l-2 border-l-red-500 pl-[14px]" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0 mt-0.5">
                    {convo.user.avatar?.url ? (
                      <img src={convo.user.avatar.url} className="w-9 h-9 rounded-full object-cover" alt={convo.user.name} />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-[11px] font-bold text-red-400">
                        {initials(convo.user.name)}
                      </div>
                    )}
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${isOnline ? "bg-green-500" : "bg-zinc-700"}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className={`text-[12.5px] font-semibold truncate ${unread > 0 ? "text-zinc-100" : "text-zinc-300"}`}>
                        {convo.user.name}
                      </span>
                      <span className="text-[10px] text-zinc-600 flex-shrink-0 ml-1">
                        {timeLabel(convo.lastMessage?.createdAt ?? convo.updatedAt)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[11.5px] text-zinc-600 truncate pr-2">
                        {convo.lastMessage?.body ?? "No messages yet"}
                      </span>
                      {unread > 0 && (
                        <span className="flex-shrink-0 min-w-[18px] h-[18px] text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center px-1">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-2">
                      {convo.status === "closed" ? (
                        <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                          <CheckCircle2 size={10} className="text-green-500" /> Closed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                          <Circle size={10} className="text-yellow-500" /> Open
                        </span>
                      )}
                      {convo.assignedTo && (
                        <span className={`text-[10px] ${isMine ? "text-red-400" : "text-zinc-600"}`}>
                          {isMine ? "Assigned to you" : `→ ${convo.assignedTo.name}`}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {hasMore && (
              <button
                onClick={() => fetchInbox(page + 1)}
                className="w-full py-3 text-[11.5px] text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Load more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
