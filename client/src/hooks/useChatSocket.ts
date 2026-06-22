"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { base, authFetch } from "@/lib/apiFetch";

// Socket.io connects to the server root — strip /api/v1 from the REST base
const SOCKET_URL = base.replace(/\/api\/v1\/?$/, "");

export interface ChatMessage {
  _id: string;
  conversation: string;
  sender: { _id: string; name: string; avatar?: { url: string }; role: string };
  senderType: "user" | "support";
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface InboxUpdate {
  conversationId: string;
  lastMessage: { body: string; senderName: string; createdAt: string };
  userUnread: number;
}

export interface TypingPayload {
  conversationId: string;
  userId: string;
  name: string;
  isTyping: boolean;
  senderType: "user" | "support";
}

interface Handlers {
  onNewMessage?:  (msg: ChatMessage, conversationId: string) => void;
  onInboxUpdate?: (u: InboxUpdate) => void;
  onTyping?:      (p: TypingPayload) => void;
  onReadReceipt?: (p: { conversationId: string; readBy: string; readAt: string }) => void;
  onPresence?:    (p: { userId: string; online: boolean }) => void;
}

export function useChatSocket(token: string | null, handlers: Handlers = {}) {
  const socketRef   = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 8,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;
    socket.on("connect",    () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("new_message", ({ message, conversationId }: { message: ChatMessage; conversationId: string }) =>
      handlersRef.current.onNewMessage?.(message, conversationId)
    );
    socket.on("inbox_update",     (d: InboxUpdate)  => handlersRef.current.onInboxUpdate?.(d));
    socket.on("typing_indicator", (d: TypingPayload) => handlersRef.current.onTyping?.(d));
    socket.on("read_receipt",     (d: { conversationId: string; readBy: string; readAt: string }) =>
      handlersRef.current.onReadReceipt?.(d)
    );
    socket.on("presence", (d: { userId: string; online: boolean }) => handlersRef.current.onPresence?.(d));

    return () => { socket.disconnect(); };
  }, [token]);

  // ── REST via apiFetch(/chat/...) ─────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    const res = await authFetch<{ conversations: any[] }>("/chat/conversations");
    return res.data?.conversations ?? [];
  }, []);

  const fetchMessages = useCallback(async (
    conversationId: string,
    page = 1,
    limit = 30
  ) => {
    const res = await authFetch<{ messages: ChatMessage[]; hasMore: boolean }>(
      `/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
    );
    return res.data ?? { messages: [], hasMore: false };
  }, []);

  const startConversation = useCallback(async () => {
    const res = await authFetch<{ conversation: any }>("/chat/conversations", {
      method: "POST",
    });
    return res.data?.conversation ?? null;
  }, []);

  const markReadRest = useCallback(async (conversationId: string) => {
    await authFetch(`/chat/conversations/${conversationId}/read`, {
      method: "PATCH",
    });
  }, []);

  // ── Socket emits ─────────────────────────────────────────────────────────

  /**
   * Joins a conversation room. Restored from the old logic: resolves with
   * both the target user's online state and a presence map for everyone
   * currently relevant to the conversation, instead of a plain boolean.
   */
  const joinConversation = useCallback(
    (conversationId: string): Promise<{ isUserOnline: boolean; presenceMap: Record<string, boolean> }> =>
      new Promise((resolve) => {
        socketRef.current?.emit(
          "join_conversation",
          { conversationId },
          (res: any) => resolve({
            isUserOnline: res?.isUserOnline ?? false,
            presenceMap:  res?.presenceMap  ?? {},
          })
        );
      }),
    []
  );

  /** Restored from the old logic — batch presence lookup for a list of user ids. */
  const getOnlineStatus = useCallback(
    (userIds: string[]): Promise<Record<string, boolean>> =>
      new Promise((resolve) => {
        if (!socketRef.current?.connected) return resolve({});
        socketRef.current.emit("get_online_status", { userIds }, (res: Record<string, boolean>) =>
          resolve(res ?? {})
        );
      }),
    []
  );

  const sendMessage = useCallback(
    (conversationId: string, body: string): Promise<ChatMessage | null> =>
      new Promise((resolve) => {
        socketRef.current?.emit("send_message", { conversationId, body }, (res: any) =>
          resolve(res?.success ? res.message : null)
        );
      }),
    []
  );

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    socketRef.current?.emit("typing", { conversationId, isTyping });
  }, []);

  const markRead = useCallback((conversationId: string) => {
    socketRef.current?.emit("message_read", { conversationId });
  }, []);

  return {
    connected,
    // socket
    joinConversation,
    getOnlineStatus,
    sendMessage,
    sendTyping,
    markRead,
    // REST
    fetchConversations,
    fetchMessages,
    startConversation,
    markReadRest,
  };
}