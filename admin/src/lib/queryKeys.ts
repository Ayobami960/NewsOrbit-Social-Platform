import type {
  ArticleFilters,
  UserFilters,
  BlogFilters,
  ActivityFilters,
} from "../types";

export const queryKeys = {
  // ───────────────────────────────────────────────────────────────────────────
  // AUTH
  // ───────────────────────────────────────────────────────────────────────────

  me: () => ["auth", "me"] as const,

  // ───────────────────────────────────────────────────────────────────────────
  // ANALYTICS
  // ───────────────────────────────────────────────────────────────────────────

  analytics: {
    overview: () =>
      ["analytics", "overview"] as const,

    topArticles: () =>
      ["analytics", "top-articles"] as const,

    byDay: (days: number) =>
      ["analytics", "by-day", days] as const,

    activity: (filters: ActivityFilters) =>
      ["analytics", "activity", filters] as const,

    usersByRole: () =>
      ["analytics", "users-by-role"] as const,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // ARTICLES
  // ───────────────────────────────────────────────────────────────────────────

  articles: {
    list: (filters: ArticleFilters) =>
      ["articles", "list", filters] as const,

    // slug-based route
    detail: (slug: string) =>
      ["articles", "detail", slug] as const,

    mine: () =>
      ["articles", "mine"] as const,

    myStats: () =>
      ["articles", "my-stats"] as const,

    breaking: () =>
      ["articles", "breaking"] as const,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // BLOGS
  // ───────────────────────────────────────────────────────────────────────────

  blogs: {
    list: (filters: BlogFilters) =>
      ["blogs", "list", filters] as const,

    moderation: (filters: BlogFilters) =>
      ["blogs", "moderation", filters] as const,

    mine: () =>
      ["blogs", "mine"] as const,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // COMMENTS
  // ───────────────────────────────────────────────────────────────────────────

  comments: {
    list: (articleId?: string, blogId?: string) =>
      [
        "comments",
        "list",
        articleId ?? null,
        blogId ?? null,
      ] as const,

    pending: () =>
      ["comments", "pending"] as const,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // USERS
  // ───────────────────────────────────────────────────────────────────────────

  users: {
    list: (filters: UserFilters) =>
      ["users", "list", filters] as const,

    detail: (id: string) =>
      ["users", "detail", id] as const,

    // ✅ FIXED
    public: (id: string) =>
      ["users", "public", id] as const,

    activity: (id: string) =>
      ["users", "activity", id] as const,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORIES
  // ───────────────────────────────────────────────────────────────────────────

  categories: {
    list: () =>
      ["categories", "list"] as const,

    detail: (slug: string) =>
      ["categories", "detail", slug] as const,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // NEWSLETTER
  // ───────────────────────────────────────────────────────────────────────────

  newsletter: {
    subscribers: (page: number) =>
      ["newsletter", "subscribers", page] as const,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ───────────────────────────────────────────────────────────────────────────

  notifications: {
    list: (unreadOnly: boolean) =>
      ["notifications", "list", unreadOnly] as const,
  },
} as const;