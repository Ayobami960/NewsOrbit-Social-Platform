
import type { ArticleFilters, BlogFilters } from "@/types";

export const queryKeys = {
  // ── Articles (staff-written news) ──────────────────────────────────────────
    articles: {
    all:      ["articles"] as const,
    lists:    () => ["articles", "list"] as const,
    list:     (f: ArticleFilters) => ["articles", "list", f] as const,
    details:  () => ["articles", "detail"] as const,
    detail:   (slug: string) => ["articles", "detail", slug] as const,
    breaking: () => ["articles", "list", { isBreaking: true }] as const,
    featured: () => ["articles", "list", { isFeatured: true }] as const,
  },

  // ── Blogs (user-generated content) ─────────────────────────────────────────
  blogs: {
    all:    ()                  => ["blogs"] as const,
    /** Matches ALL list variants — broad invalidation */
    lists:  ()                  => ["blogs", "list"] as const,
    list:   (filters: object)   => ["blogs", "list", filters] as const,
    /** Lookup by mongo _id — used by the edit page */
    detail: (id: string)        => ["blogs", "detail", id] as const,
    /** Lookup by slug — used by the public detail/reader page */
    bySlug: (slug: string)      => ["blogs", "slug", slug] as const,
    /** All blogs belonging to a specific user — used by user profile page */
    byUser: (userId: string, page: number) =>
      ["blogs", "byUser", userId, page] as const,
    /** Current authenticated user's own blogs */
    mine:   ()                  => ["blogs", "mine"] as const,
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
    all:          ()               => ["users"] as const,
    public:       (id: string)     => ["users", "public", id] as const,
    followStatus: (id: string)     => ["users", "followStatus", id] as const,
    writers:      (search: string) => ["writers", "list", search] as const,
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  notifications: {
    all:  () => ["notifications"] as const,
    list: () => ["notifications", "list"] as const,
  },
} as const;