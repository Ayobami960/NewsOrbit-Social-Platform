import type { ArticleFilters, BlogFilters } from "@/types";

export const queryKeys = {
  // ── Articles ───────────────────────────────────────────────────────────────
  articles: {
    all: ["articles"] as const,
    lists: () => ["articles", "list"] as const,
    list: (f: ArticleFilters) => ["articles", "list", f] as const,
    details: () => ["articles", "detail"] as const,
    detail: (id: string) => ["articles", "detail", id] as const,
    bySlug: (slug: string) => ["articles", "slug", slug] as const,
    breaking: () => ["articles", "list", { isBreaking: true }] as const,
    featured: () => ["articles", "list", { isFeatured: true }] as const,
  },

  // ── Blogs ──────────────────────────────────────────────────────────────────
  blogs: {
    all: () => ["blogs"] as const,
    lists: () => ["blogs", "list"] as const,
    list: (filters: object) => ["blogs", "list", filters] as const,
    detail: (id: string) => ["blogs", "detail", id] as const,
    bySlug: (slug: string) => ["blogs", "slug", slug] as const,
    byUser: (userId: string, page: number) => ["blogs", "byUser", userId, page] as const,
    mine: () => ["blogs", "mine"] as const,
  },

  // ── Categories ─────────────────────────────────────────────────────────────
  categories: {
    all: () => ["categories"] as const,
    list: () => ["categories", "list"] as const,
  },

  // ── Comments ───────────────────────────────────────────────────────────────
  comments: {
    all: () => ["comments"] as const,
    article: (id: string) => ["comments", "article", id] as const,
    blog: (id: string) => ["comments", "blog", id] as const,
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  users: {
    all: () => ["users"] as const,
    public: (id: string) => ["users", "public", id] as const,
    followStatus: (id: string) => ["users", "followStatus", id] as const,
    writers: (search: string) => ["writers", "list", search] as const,
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  notifications: {
    all: () => ["notifications"] as const,
    list: () => ["notifications", "list"] as const,
  },
} as const;