import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { base, getStoredToken } from "../lib/apiFetch";

// Socket.io mounts on the server root — strip /api/v1 from the REST base
const SOCKET_URL = base.replace(/\/api\/v1\/?$/, "");

// ── Types ─────────────────────────────────────────────────────────────────────

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
  supportUnread: number;
  userId: string;
}

export interface TypingPayload {
  conversationId: string;
  userId: string;
  name: string;
  isTyping: boolean;
  senderType: "user" | "support";
}

export interface PresencePayload {
  userId: string;
  online: boolean;
}

interface Handlers {
  onNewMessage?:  (msg: ChatMessage, conversationId: string) => void;
  onInboxUpdate?: (update: InboxUpdate) => void;
  onTyping?:      (payload: TypingPayload) => void;
  onReadReceipt?: (p: { conversationId: string; readBy: string; readAt: string }) => void;
  onPresence?:    (p: PresencePayload) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useChatSocket(handlers: Handlers = {}) {
  const socketRef    = useRef<Socket | null>(null);
  const handlersRef  = useRef(handlers);
  handlersRef.current = handlers;

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
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
    socket.on("inbox_update",     (d: InboxUpdate)   => handlersRef.current.onInboxUpdate?.(d));
    socket.on("typing_indicator", (d: TypingPayload) => handlersRef.current.onTyping?.(d));
    socket.on("read_receipt",     (d: { conversationId: string; readBy: string; readAt: string }) =>
      handlersRef.current.onReadReceipt?.(d)
    );
    // presence fires whenever any user connects or disconnects
    socket.on("presence", (d: PresencePayload) => handlersRef.current.onPresence?.(d));

    return () => { socket.disconnect(); };
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Joins a conversation room. Matches the server ack shape from
   * socket.js's join_conversation handler: { success, isUserOnline, presenceMap }.
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

  /** Ask the server for the current online status of a list of userIds */
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

  return { connected, joinConversation, getOnlineStatus, sendMessage, sendTyping, markRead };
}