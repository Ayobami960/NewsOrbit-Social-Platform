// import type { ArticleFilters, BlogFilters } from "@/types";

// export const queryKeys = {
//   articles: {
//     list:     (f: ArticleFilters) => ["articles", "list", f] as const,
//     detail:   (slug: string)      => ["articles", "detail", slug] as const,
//     breaking: ()                  => ["articles", "breaking"] as const,
//     featured: ()                  => ["articles", "featured"] as const,
//   },
//   blogs: {
//     list:   (f: BlogFilters) => ["blogs", "list", f] as const,
//     detail: (slug: string)   => ["blogs", "detail", slug] as const,
//   },
//   categories: {
//     list: () => ["categories", "list"] as const,
//   },
//   users: {
//     public:       (id: string) => ["users", "public", id] as const,
//     followStatus: (id: string) => ["follow-status", id] as const,
//   },
//   comments: {
//     article: (id: string) => ["comments", "article", id] as const,
//     blog:    (id: string) => ["comments", "blog", id] as const,
//   },
//   notifications: {
//     list: () => ["notifications"] as const,
//   },
//   me: () => ["auth", "me"] as const,
// } as const;


/**
 * Centralised React Query key factory.
 * Every key lives here so invalidation is consistent across the app.
 */

import type { ArticleFilters, BlogFilters } from "@/types";

export const queryKeys = {
  // ── Articles (staff-written news) ──────────────────────────────────────────
  articles: {
    all:      () => ["articles"] as const,
    lists:    () => ["articles", "list"] as const,
     list:     (f: ArticleFilters) => ["articles", "list", f] as const,
    detail:   (slug: string)    => ["articles", "detail", slug] as const,
    breaking: ()                => ["articles", "breaking"] as const,
    featured: ()                => ["articles", "featured"] as const,
  },

  // ── Blogs (user-generated content) ─────────────────────────────────────────
  blogs: {
    all:    ()                => ["blogs"] as const,
    /** Matches ALL list variants — use for broad invalidation */
    lists:  ()                => ["blogs", "list"] as const,
    list:   (f: BlogFilters) => ["blogs", "list", f] as const,
    detail: (slugOrId: string)=> ["blogs", "detail", slugOrId] as const,
    /** The current user's own blogs (/blog/mine) */
    mine:   ()                => ["blogs", "mine"] as const,
  },

  // ── Categories ─────────────────────────────────────────────────────────────
  categories: {
    all:  () => ["categories"] as const,
    list: () => ["categories", "list"] as const,
  },

  // ── Comments ───────────────────────────────────────────────────────────────
  comments: {
    all:     ()           => ["comments"] as const,
    article: (id: string) => ["comments", "article", id] as const,
    blog:    (id: string) => ["comments", "blog", id] as const,
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  users: {
    all:          ()           => ["users"] as const,
    public:       (id: string) => ["users", "public", id] as const,
    followStatus: (id: string) => ["users", "followStatus", id] as const,
    writers:      (search: string) => ["writers", "list", search] as const,
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  notifications: {
    all:  () => ["notifications"] as const,
    list: () => ["notifications", "list"] as const,
  },
};