"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, authFetch, getStoredToken } from "@/lib/apiFetch";
import { queryKeys } from "@/lib/queryKeys";
import type { Article, ArticleFilters, ArticlesResponse } from "@/types";
import { useToast } from "@/components/ui/toast";

interface LikeResponse {
  likes: number;
  isLiked: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLES — read
// ─────────────────────────────────────────────────────────────────────────────

export function useArticles(filters: ArticleFilters = {}) {
  const params = new URLSearchParams();
  const merged = { status: "published", ...filters };
  Object.entries(merged).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params.set(k, String(v));
  });
  return useQuery({
    queryKey: queryKeys.articles.list(filters),
    queryFn:  () =>
      apiFetch<ArticlesResponse>(`/articles?${params}`).then((r) => r.data),
  });
}

/** Public reader — GET /articles/:slug (by slug) */
export function useArticle(slug: string) {
  return useQuery<Article>({
    queryKey: queryKeys.articles.bySlug(slug),
    queryFn:  async () => {
      const res = await apiFetch<{ article: Article }>(`/articles/${slug}`);
      return res.data.article;
    },
    enabled: !!slug,
  });
}

/** Public reader — GET /articles/slug/:slug */
export function useArticleBySlug(slug: string) {
  return useArticle(slug);
}

/** Writer/admin edit view — GET /articles/edit/:id (protected) */
export function useArticleById(id: string) {
  return useQuery({
    queryKey: queryKeys.articles.detail(id),
    queryFn:  () =>
      authFetch<{ article: Article }>(`/articles/edit/${id}`).then((r) => r.data.article),
    enabled: !!id,
  });
}

export function useBreakingArticles() {
  return useQuery({
    queryKey: queryKeys.articles.breaking(),
    queryFn:  () =>
      apiFetch<ArticlesResponse>(
        "/articles?isBreaking=true&status=published&limit=5"
      ).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useFeaturedArticles() {
  return useQuery({
    queryKey: queryKeys.articles.featured(),
    queryFn:  () =>
      apiFetch<ArticlesResponse>(
        "/articles?isFeatured=true&status=published&limit=6"
      ).then((r) => r.data),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLES — like (optimistic)
// ─────────────────────────────────────────────────────────────────────────────

export function useLikeArticle() {
  const qc = useQueryClient();
  const { error: showError } = useToast();

  return useMutation({
    mutationFn: async (articleId: string) => {
      const token = getStoredToken();
      if (!token) throw new Error("Not authenticated");
      const res = await authFetch<LikeResponse>(
        `/articles/${articleId}/like`,
        { method: "POST" }
      );
      return { articleId, likes: res.data.likes, isLiked: res.data.isLiked };
    },

    onMutate: async (articleId: string) => {
      await qc.cancelQueries({ queryKey: queryKeys.articles.all });

      const snapshots = qc.getQueriesData<unknown>({
        queryKey: queryKeys.articles.all,
      });

      // Patch detail cache
      qc.setQueriesData<{ article: Article }>(
        { queryKey: queryKeys.articles.details() },
        (cached) => {
          if (!cached?.article || cached.article._id !== articleId) return cached;
          const wasLiked = Boolean(cached.article.isLiked);
          return {
            ...cached,
            article: {
              ...cached.article,
              isLiked: !wasLiked,
              likes: wasLiked
                ? Math.max(0, cached.article.likes - 1)
                : cached.article.likes + 1,
            },
          };
        }
      );

      // Patch list caches
      qc.setQueriesData<ArticlesResponse>(
        { queryKey: queryKeys.articles.lists() },
        (cached) => {
          if (!cached?.articles) return cached;
          return {
            ...cached,
            articles: cached.articles.map((a) => {
              if (a._id !== articleId) return a;
              const wasLiked = Boolean(a.isLiked);
              return {
                ...a,
                isLiked: !wasLiked,
                likes: wasLiked ? Math.max(0, a.likes - 1) : a.likes + 1,
              };
            }),
          };
        }
      );

      return { snapshots };
    },

    onSuccess: ({ articleId, likes, isLiked }) => {
      // Reconcile detail cache with server truth
      qc.setQueriesData<{ article: Article }>(
        { queryKey: queryKeys.articles.details() },
        (cached) => {
          if (!cached?.article || cached.article._id !== articleId) return cached;
          return { ...cached, article: { ...cached.article, likes, isLiked } };
        }
      );

      // Reconcile list caches with server truth
      qc.setQueriesData<ArticlesResponse>(
        { queryKey: queryKeys.articles.lists() },
        (cached) => {
          if (!cached?.articles) return cached;
          return {
            ...cached,
            articles: cached.articles.map((a) =>
              a._id === articleId ? { ...a, likes, isLiked } : a
            ),
          };
        }
      );
    },

    onError: (_err, _articleId, context) => {
      context?.snapshots?.forEach(([queryKey, data]: [readonly unknown[], unknown]) => {
        qc.setQueryData(queryKey, data);
      });
      showError("Update failed", "Could not update like. Please try again.");
    },
  });
}