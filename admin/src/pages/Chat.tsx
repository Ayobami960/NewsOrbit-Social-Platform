import { useState, useCallback } from "react";
// old code
import Layout from "../components/layout/Layout";
import { useChatSocket, type ChatMessage, type TypingPayload, type InboxUpdate, type PresencePayload } from "../hooks/useChatSocket";
import InboxList, { type ConversationSummary } from "../components/chat/InboxList";
import SupportChatWindow from "../components/chat/SupportChatWindow";
import { authFetch } from "../lib/apiFetch";
import { MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Message() {
  const { user } = useAuth();

  const [active, setActive]              = useState<ConversationSummary | null>(null);
  const [mobileView, setMobileView]      = useState<"list" | "chat">("list");
  const [onlineUsers, setOnlineUsers]    = useState<Record<string, boolean>>({});
  const [latestUpdate, setLatestUpdate]  = useState<InboxUpdate | null>(null);
  const [incomingMessage, setIncoming]   = useState<ChatMessage | null>(null);
  const [typingPayload, setTyping]       = useState<TypingPayload | null>(null);
  const [readReceiptFor, setReadReceipt] = useState<string | null>(null);

  // ── Socket ────────────────────────────────────────────────────────────────
  const socket = useChatSocket({
    onNewMessage: (msg: ChatMessage, conversationId: string) =>
      setIncoming({ ...msg, conversation: conversationId }),
    onInboxUpdate: (u: InboxUpdate) => setLatestUpdate(u),
    onTyping: (p: TypingPayload) => setTyping(p),
    onReadReceipt: (p: { conversationId: string; readBy: string; readAt: string }) =>
      setReadReceipt(p.conversationId),
    onPresence: ({ userId, online }: PresencePayload) =>
      setOnlineUsers((prev: Record<string, boolean>) => ({ ...prev, [userId]: online })),
  });

  // ── Wrap joinConversation to merge the presenceMap snapshot ──────────────
  // When the admin opens a conversation, the server returns who's currently
  // online. We merge that into onlineUsers so the UI is correct immediately,
  // without waiting for a presence event.
  const handleJoin = useCallback(
    async (conversationId: string) => {
      const result = await socket.joinConversation(conversationId);
      setOnlineUsers((prev) => ({ ...prev, ...result.presenceMap }));
      return result;
    },
    [socket]
  );

  // ── Select conversation ───────────────────────────────────────────────────
  const handleSelect = useCallback((convo: ConversationSummary) => {
    setActive(convo);
    setMobileView("chat");

    // Eagerly query online status for this user (before joining the room)
    // so the InboxList dot and the chat header are already correct.
    socket.getOnlineStatus([convo.user._id]).then((status) => {
      setOnlineUsers((prev) => ({ ...prev, ...status }));
    });
  }, [socket]);

  // ── Assign to self ────────────────────────────────────────────────────────
  const handleAssign = useCallback(async (conversationId: string) => {
    const res = await authFetch<{ conversation: ConversationSummary }>(
      `/chat/inbox/${conversationId}/assign`,
      { method: "PATCH", body: {} }
    );
    if (res.success) {
      setActive((prev: ConversationSummary | null) =>
        prev?._id === conversationId
          ? { ...prev, assignedTo: res.data.conversation.assignedTo }
          : prev
      );
    }
  }, []);

  // ── Close conversation ────────────────────────────────────────────────────
  const handleClose = useCallback(async (conversationId: string) => {
    const res = await authFetch(`/chat/inbox/${conversationId}/close`, { method: "PATCH" });
    if (res.success) {
      setActive((prev: ConversationSummary | null) =>
        prev?._id === conversationId ? { ...prev, status: "closed" } : prev
      );
    }
  }, []);

  if (!user) return null;

  return (
    <Layout title="Messages">
      <div className="-m-4 sm:-m-6 flex overflow-hidden" style={{ height: "calc(100vh - 3.5rem)" }}>

        {/* ── Left: inbox list ─────────────────────────────────────────── */}
        <div className={`
          flex-shrink-0 border-r border-zinc-800/60 flex flex-col
          w-full lg:w-[320px]
          ${mobileView === "chat" ? "hidden lg:flex" : "flex"}
        `}>
          <InboxList
            activeId={active?._id ?? null}
            onSelect={handleSelect}
            latestUpdate={latestUpdate}
            onlineUsers={onlineUsers}
            currentUserId={user._id}
          />
        </div>

        {/* ── Right: chat window ────────────────────────────────────────── */}
        <div className={`
          flex-1 flex flex-col overflow-hidden
          ${mobileView === "list" ? "hidden lg:flex" : "flex"}
        `}>
          {active ? (
            <SupportChatWindow
              key={active._id}
              conversation={active}
              currentUser={{ _id: user._id, name: user.name, role: user.role }}
              onBack={() => { setActive(null); setMobileView("list"); }}
              isUserOnline={onlineUsers[active.user._id] ?? false}
              onJoin={handleJoin}
              onSend={socket.sendMessage}
              onTyping={socket.sendTyping}
              onMarkRead={socket.markRead}
              incomingMessage={incomingMessage}
              typingPayload={typingPayload}
              readReceiptFor={readReceiptFor}
              onAssign={handleAssign}
              onClose={handleClose}
              onlineUsers={onlineUsers}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-600">
              <MessageSquare size={48} strokeWidth={1.2} />
              <p className="text-sm">Select a conversation to start replying</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}