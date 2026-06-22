"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";
import { useChatSocket, type ChatMessage, type TypingPayload } from "@/hooks/useChatSocket";
import { authFetch } from "@/lib/apiFetch";
import ChatPopup from "./Chatpopup";

export default function ChatPopupWrapper() {
  const { user, isLoggedIn } = useAuth();
  const currentUserId = user?._id ?? null;

  const [mounted, setMounted] = useState(false);
  const [conId, setConId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isSupportOnline, setSupportOnline] = useState(false);
  const [typingPayload, setTypingPayload] = useState<TypingPayload | null>(null);
  const [readReceiptFor, setReadReceipt]  = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  // Track which userIds are support staff so we can derive isSupportOnline
  const supportUserIdsRef = useRef<Set<string>>(new Set());
  const joinedRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  const token = typeof window !== "undefined"
    ? localStorage.getItem("accessToken") ?? sessionStorage.getItem("accessToken") ?? null
    : null;

  // ── Socket ────────────────────────────────────────────────────────────────
  const socket = useChatSocket(token, {
    onNewMessage: (msg) => {
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
      );
      if (msg.senderType === "support" && conId) {
        socket.markRead(conId);
        authFetch("/chat/my/read", { method: "PATCH" });
      }
    },
    onInboxUpdate: (u) => {
      if (conId && u.conversationId === conId) {
        setUnread(u.userUnread);
      }
    },
    onTyping: (p) => setTypingPayload(p),
    onReadReceipt: (p) => setReadReceipt(p.conversationId),
    // When any user changes presence, check if it's a support agent
    onPresence: ({ userId, online }) => {
      if (supportUserIdsRef.current.has(userId)) {
        // At least one support agent is online
        if (online) {
          setSupportOnline(true);
        } else {
          // Re-query: are any OTHER support agents still online?
          const remaining = [...supportUserIdsRef.current].filter((id) => id !== userId);
          socket.getOnlineStatus(remaining).then((status) => {
            setSupportOnline(Object.values(status).some(Boolean));
          });
        }
      }
    },
  });

  // ── Init: get/create conversation + unread count ──────────────────────────
  useEffect(() => {
    if (!isLoggedIn || !currentUserId) return;

    (async () => {
      try {
        const res = await authFetch<{ conversation: { _id: string; userUnread: number } }>("/chat/my");
        const conversation = res.data?.conversation;
        if (conversation) {
          setConId(conversation._id);
          setUnread(conversation.userUnread ?? 0);
        }
      } catch {
        // No conversation yet — created on first open
      }
    })();
  }, [isLoggedIn, currentUserId]);

  // ── Once connected, query if any support staff are online ────────────────
  useEffect(() => {
    if (!socket.connected) return;

    // We don't know support user IDs upfront, so we use a convention:
    // emit a special "get_support_status" event. For now we use getOnlineStatus
    // with an empty array and handle via the presence events above.
    // The first time a support agent comes online, onPresence fires and
    // we set isSupportOnline. To get the initial state, we join the conversation
    // and receive presenceMap from the server.
  }, [socket.connected]);

  // ── Open: join room + load history ───────────────────────────────────────
  const handleOpen = useCallback(async () => {
    if (!currentUserId) return;
    setUnread(0);

    let cid = conId;
    if (!cid) {
      try {
        const res = await authFetch<{ conversation: { _id: string } }>("/chat/my");
        const newConvo = res.data?.conversation;
        if (!newConvo) return;
        cid = newConvo._id;
        setConId(cid);
      } catch { return; }
    }

    const safeCid = cid!;

    if (!joinedRef.current) {
      const { presenceMap } = await socket.joinConversation(safeCid);

      // From presenceMap, figure out which participants are support staff.
      // We know the current user is not support, so any other online user is.
      // Store their IDs so we can track them in onPresence.
      Object.entries(presenceMap).forEach(([uid, isOnline]) => {
        if (uid !== currentUserId) {
          supportUserIdsRef.current.add(uid);
          if (isOnline) setSupportOnline(true);
        }
      });

      joinedRef.current = true;
    }

    setLoading(true);
    const histRes = await authFetch<{ messages: ChatMessage[]; pagination: { pages: number } }>(
      `/chat/my/messages?page=1&limit=30`
    );
    setMessages(histRes.data?.messages ?? []);
    setHasMore((histRes.data?.pagination.pages ?? 1) > 1);
    setPage(1);
    setLoading(false);

    socket.markRead(safeCid);
    authFetch("/chat/my/read", { method: "PATCH" });
  }, [currentUserId, conId, socket]);

  // ── Load more ─────────────────────────────────────────────────────────────
  const handleLoadMore = useCallback(async () => {
    if (!conId || !hasMore) return;
    const nextPage = page + 1;
    const res = await authFetch<{ messages: ChatMessage[]; pagination: { pages: number } }>(
      `/chat/my/messages?page=${nextPage}&limit=30`
    );
    const older = res.data?.messages ?? [];
    setMessages((prev) => [...older, ...prev]);
    setPage(nextPage);
    setHasMore(nextPage < (res.data?.pagination.pages ?? 1));
  }, [conId, page, hasMore]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async (body: string) => {
    if (!conId) return;
    const msg = await socket.sendMessage(conId, body);
    if (msg) {
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
      );
    }
  }, [conId, socket]);

  const handleTyping = useCallback((isTyping: boolean) => {
    if (conId) socket.sendTyping(conId, isTyping);
  }, [conId, socket]);

  const handleMarkRead = useCallback(() => {
    if (conId) {
      socket.markRead(conId);
      authFetch("/chat/my/read", { method: "PATCH" });
      setUnread(0);
    }
  }, [conId, socket]);

  if (!mounted || !isLoggedIn || !user) return null;

  return createPortal(
    <ChatPopup
      user={{ name: user.name, avatarUrl: user.avatar?.url }}
      currentUserId={currentUserId!}
      messages={messages}
      loading={loading}
      hasMore={hasMore}
      unreadCount={unread}
      isSupportOnline={isSupportOnline}
      typingPayload={typingPayload}
      readReceiptFor={readReceiptFor}
      onOpen={handleOpen}
      onSend={handleSend}
      onTyping={handleTyping}
      onMarkRead={handleMarkRead}
      onLoadMore={handleLoadMore}
    />,
    document.body
  );
}
