"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, authFetch, getStoredToken } from "@/lib/apiFetch";
import { queryKeys } from "@/lib/queryKeys";
import type { Article, ArticleFilters, ArticlesResponse } from "@/types";
import { toast } from "react-toastify";

interface LikeResponse {
  likes: number;
  isLiked: boolean;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

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

export function useArticle(slug: string) {
  return useQuery({
    queryKey: queryKeys.articles.detail(slug),
    queryFn:  () =>
      apiFetch<{ article: Article }>(`/articles/${slug}`).then(
        (r) => r.data.article
      ),
    enabled: !!slug,
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

// ─── useLikeArticle ───────────────────────────────────────────────────────────

export function useLikeArticle() {
  const queryClient = useQueryClient();

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
      // Cancel ALL in-flight article queries to prevent stale overwrites
      await queryClient.cancelQueries({ queryKey: queryKeys.articles.all });

      // Snapshot for rollback
      const snapshots = queryClient.getQueriesData<unknown>({
        queryKey: queryKeys.articles.all,
      });

      // ── Patch detail cache (Article stored directly) ───────────────────────
      queryClient.setQueriesData<Article>(
        { queryKey: queryKeys.articles.details() },
        (cached) => {
          if (!cached || cached._id !== articleId) return cached;
          const wasLiked = Boolean(cached.isLiked);
          return {
            ...cached,
            isLiked: !wasLiked,
            likes:    wasLiked
              ? Math.max(0, cached.likes - 1)
              : cached.likes + 1,
          };
        }
      );

      // ── Patch all list caches ({ articles: Article[] }) ───────────────────
      // Covers: useArticles, useBreakingArticles, useFeaturedArticles
      queryClient.setQueriesData<ArticlesResponse>(
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
                likes:    wasLiked
                  ? Math.max(0, a.likes - 1)
                  : a.likes + 1,
              };
            }),
          };
        }
      );

      return { snapshots };
    },

    // Write server truth — no refetch, no flicker
    onSuccess: ({ articleId, likes, isLiked }) => {
      // Reconcile detail cache
      queryClient.setQueriesData<Article>(
        { queryKey: queryKeys.articles.details() },
        (cached) => {
          if (!cached || cached._id !== articleId) return cached;
          return { ...cached, likes, isLiked };
        }
      );

      // Reconcile list caches
      queryClient.setQueriesData<ArticlesResponse>(
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

    // Full rollback on error
    onError: (_err, _articleId, context) => {
      context?.snapshots?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error("Could not update like. Please try again.");
    },
  });
}