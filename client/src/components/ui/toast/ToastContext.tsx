"use client";

import {
  createContext, useCallback, useContext,
  useRef, useState, type ReactNode,
} from "react";
import type { ToastItem, ToastOptions, ToastPosition } from "../../../types";
import { ToastViewport } from "./ToastViewport";

interface ToastCtx {
  toast: (opts: ToastOptions) => void;
  success: (title: string, message?: string) => void;
  error:   (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info:    (title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

const DEFAULT_DURATION = 4000;
const DEFAULT_POSITION: ToastPosition = "top-right";

export function ToastProvider({
  children,
  defaultPosition = DEFAULT_POSITION,
  defaultDuration = DEFAULT_DURATION,
}: {
  children: ReactNode;
  defaultPosition?: ToastPosition;
  defaultDuration?: number;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const toast = useCallback((opts: ToastOptions) => {
    const id = `toast-${++counter.current}`;
    const item: ToastItem = {
      id,
      type:     opts.type     ?? "info",
      title:    opts.title,
      message:  opts.message  ?? "",
      duration: opts.duration ?? defaultDuration,
      position: opts.position ?? defaultPosition,
    };
    setToasts(prev => [...prev, item]);
  }, [defaultDuration, defaultPosition]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string) => toast({ type: "success", title, message }), [toast]);
  const error   = useCallback((title: string, message?: string) => toast({ type: "error",   title, message }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ type: "warning", title, message }), [toast]);
  const info    = useCallback((title: string, message?: string) => toast({ type: "info",    title, message }), [toast]);

  // Group toasts by position so each viewport only renders its own
  const groups = toasts.reduce<Record<string, ToastItem[]>>((acc, t) => {
    (acc[t.position] ??= []).push(t);
    return acc;
  }, {});

  return (
    <Ctx.Provider value={{ toast, success, error, warning, info, dismiss }}>
      {children}
      {Object.entries(groups).map(([position, items]) => (
        <ToastViewport
          key={position}
          position={position as ToastPosition}
          toasts={items}
          onDismiss={dismiss}
        />
      ))}
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be inside <ToastProvider>");
  return ctx;
}