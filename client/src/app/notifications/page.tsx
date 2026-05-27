"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from "@/hooks/useData";
import { timeAgo, cn } from "@/lib/utils";
import { Bell, BellOff, CheckCheck, Newspaper, Users, MessageCircle, Radio } from "lucide-react";
import type { Notification, NotificationType } from "@/types";
import { useEffect } from "react";

const ICON_MAP: Record<NotificationType, React.ElementType> = {
  new_article:   Newspaper,
  new_blog:      Radio,
  new_comment:   MessageCircle,
  new_follower:  Users,
  comment_reply: MessageCircle,
  breaking_news: Radio,
  newsletter:    Bell,
};

const COLOR_MAP: Record<NotificationType, string> = {
  new_article:   "bg-ember-600/10 text-ember-600",
  new_blog:      "bg-blue-600/10 text-blue-600",
  new_comment:   "bg-amber-600/10 text-amber-600",
  new_follower:  "bg-green-600/10 text-green-600",
  comment_reply: "bg-purple-600/10 text-purple-600",
  breaking_news: "bg-red-600/10 text-red-600",
  newsletter:    "bg-ink-600/10 text-ink-600",
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router                         = useRouter();

  const { data, isLoading }    = useNotifications();
  const markRead  = useMarkNotificationRead();
  const markAllRead   = useMarkAllRead();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const notifications = data?.notifications ?? [];
  const unreadCount   = data?.unreadCount   ?? 0;

  const handleClick = (n: Notification) => {
    if (!n.isRead) markRead.mutate(n._id);
    if (n.link)    router.push(n.link);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="max-w-2xl mx-auto px-6 py-10">
            <div className="skeleton h-8 w-48 mb-6 rounded" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-ink-500 font-sans mt-0.5">
                  {unreadCount} unread
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-(--color-border) text-ink-600 hover:bg-ink-50 font-sans font-medium text-sm transition-colors disabled:opacity-50"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* Notifications */}
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-ink-100 rounded-full flex items-center justify-center mb-4">
                <BellOff size={28} className="text-ink-400" />
              </div>
              <h3 className="font-display text-lg font-bold text-ink-700 mb-1">All caught up!</h3>
              <p className="text-sm text-ink-500 font-body">No notifications yet. Follow writers to get updates.</p>
              <Link href="/writers"
                className="mt-6 px-5 py-2.5 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold text-sm rounded-xl transition-colors">
                Discover Writers
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => {
                const Icon  = ICON_MAP[n.type] ?? Bell;
                const color = COLOR_MAP[n.type] ?? "bg-ink-100 text-ink-600";

                return (
                  <button
                    key={n._id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      "w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left",
                      n.isRead
                        ? "border-(--color-border) bg-white hover:bg-ink-50"
                        : "border-ember-200 bg-ember-50 hover:bg-ember-100"
                    )}
                  >
                    {/* Sender avatar or type icon */}
                    <div className="shrink-0 relative">
                      {n.sender?.avatar?.url ? (
                        <img src={n.sender.avatar.url} alt={n.sender.name}
                          className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", color)}>
                          <Icon size={18} />
                        </div>
                      )}
                      {!n.isRead && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-ember-600 rounded-full border-2 border-white" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm leading-snug", n.isRead ? "text-ink-700 font-body" : "text-ink-900 font-semibold font-sans")}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs text-ink-500 font-body mt-0.5 line-clamp-2">{n.body}</p>
                      )}
                      <p className="text-[11px] text-ink-400 font-sans mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
