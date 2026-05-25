import type { ArticleFilters, BlogFilters } from "@/types";

export const queryKeys = {
  articles: {
    list:     (f: ArticleFilters) => ["articles", "list", f] as const,
    detail:   (slug: string)      => ["articles", "detail", slug] as const,
    breaking: ()                  => ["articles", "breaking"] as const,
    featured: ()                  => ["articles", "featured"] as const,
  },
  blogs: {
    list:   (f: BlogFilters) => ["blogs", "list", f] as const,
    detail: (slug: string)   => ["blogs", "detail", slug] as const,
  },
  categories: {
    list: () => ["categories", "list"] as const,
  },
  users: {
    public:       (id: string) => ["users", "public", id] as const,
    followStatus: (id: string) => ["follow-status", id] as const,
  },
  comments: {
    article: (id: string) => ["comments", "article", id] as const,
    blog:    (id: string) => ["comments", "blog", id] as const,
  },
  notifications: {
    list: () => ["notifications"] as const,
  },
  me: () => ["auth", "me"] as const,
} as const;
