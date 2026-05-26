"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, authFetch } from "@/lib/apiFetch";
import { queryKeys } from "@/lib/queryKeys";
import type { Article, ArticleFilters, ArticlesResponse } from "@/types";
import { toast } from "react-toastify";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LikeResponse {
  likes: number;
  isLiked: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Patch a single article object if its _id matches */
function patchArticle(
  article: Article,
  id: string,
  patch: Partial<Article>
): Article {
  return article._id === id ? { ...article, ...patch } : article;
}

/** Apply a like patch to any cached shape (single article or paginated list) */
function applyLikePatch(
  cached: unknown,
  articleId: string,
  patch: Partial<Article>
): unknown {
  if (!cached || typeof cached !== "object") return cached;

  const obj = cached as Record<string, unknown>;

  // Single article cache (useArticle returns the article object directly)
  if ("_id" in obj && obj._id === articleId) {
    return { ...obj, ...patch };
  }

  // List cache ({ articles: Article[], pagination: … })
  if ("articles" in obj && Array.isArray(obj.articles)) {
    return {
      ...obj,
      articles: (obj.articles as Article[]).map((a) =>
        patchArticle(a, articleId, patch)
      ),
    };
  }

  return cached;
}

// ─── Queries ───────────────────────────────────────────────────────────────────

export function useArticles(filters: ArticleFilters = {}) {
  const params = new URLSearchParams();
  const merged = { status: "published", ...filters };
  Object.entries(merged).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params.set(k, String(v));
  });

  return useQuery({
    queryKey: queryKeys.articles.list(filters),
    queryFn: () =>
      apiFetch<ArticlesResponse>(`/articles?${params}`).then((r) => r.data),
  });
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: queryKeys.articles.detail(slug),
    queryFn: () =>
      apiFetch<{ article: Article }>(`/articles/${slug}`).then(
        (r) => r.data.article
      ),
    enabled: !!slug,
  });
}

export function useBreakingArticles() {
  return useQuery({
    queryKey: queryKeys.articles.breaking(),
    queryFn: () =>
      apiFetch<ArticlesResponse>(
        "/articles?isBreaking=true&status=published&limit=5"
      ).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useFeaturedArticles() {
  return useQuery({
    queryKey: queryKeys.articles.featured(),
    queryFn: () =>
      apiFetch<ArticlesResponse>(
        "/articles?isFeatured=true&status=published&limit=6"
      ).then((r) => r.data),
  });
}

// ─── useLikeArticle ────────────────────────────────────────────────────────────
//
// Strategy:
//   1. onMutate  → optimistic update (instant icon flip)
//   2. onSuccess → reconcile with server truth (correct counts without refetch)
//   3. onError   → roll back every snapshot
//   4. NO onSettled / invalidateQueries → prevents the refetch that caused flicker
//
export function useLikeArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    // Returns { articleId, likes, isLiked } so onSuccess can reconcile
    mutationFn: async (articleId: string) => {
      const res = await authFetch<LikeResponse>(
        `/articles/${articleId}/like`,
        { method: "POST" }
      );
      return { articleId, likes: res.data.likes, isLiked: res.data.isLiked };
    },

    // ── Step 1: optimistic flip ────────────────────────────────────────────
    onMutate: async (articleId: string) => {
      // Stop any in-flight refetches so they can't stomp the optimistic state
      await queryClient.cancelQueries({
        predicate: (q) =>
          JSON.stringify(q.queryKey).toLowerCase().includes("article"),
      });

      // Snapshot everything so we can roll back
      const snapshots = queryClient.getQueriesData<unknown>({
        predicate: (q) =>
          JSON.stringify(q.queryKey).toLowerCase().includes("article"),
      });

      // Read current isLiked from the detail cache for an accurate toggle
      // (list caches may not have isLiked populated, so we fall back to toggling)
      queryClient.setQueriesData<unknown>(
        {
          predicate: (q) =>
            JSON.stringify(q.queryKey).toLowerCase().includes("article"),
        },
        (cached: any) => {
          if (!cached || typeof cached !== "object") return cached;
          const obj = cached as Record<string, unknown>;

          // Single article
          if ("_id" in obj && obj._id === articleId) {
            const wasLiked = Boolean(obj.isLiked);
            return applyLikePatch(cached, articleId, {
              isLiked: !wasLiked,
              likes: wasLiked
                ? Math.max(0, Number(obj.likes) - 1)
                : Number(obj.likes) + 1,
            });
          }

          // List
          if ("articles" in obj && Array.isArray(obj.articles)) {
            return applyLikePatch(cached, articleId, {}); // handled inside helper
          }

          return cached;
        }
      );

      // More precise list patch (needs per-article isLiked)
      queryClient.setQueriesData<unknown>(
        {
          predicate: (q) =>
            JSON.stringify(q.queryKey).toLowerCase().includes("article"),
        },
        (cached: any) => {
          if (!cached || typeof cached !== "object") return cached;
          const obj = cached as Record<string, unknown>;

          if ("articles" in obj && Array.isArray(obj.articles)) {
            return {
              ...obj,
              articles: (obj.articles as Article[]).map((a) => {
                if (a._id !== articleId) return a;
                const wasLiked = Boolean(a.isLiked);
                return {
                  ...a,
                  isLiked: !wasLiked,
                  likes: wasLiked
                    ? Math.max(0, a.likes - 1)
                    : a.likes + 1,
                };
              }),
            };
          }

          return cached;
        }
      );

      return { snapshots };
    },

    // ── Step 2: reconcile with server truth (no refetch needed) ───────────
    onSuccess: ({ articleId, likes, isLiked }) => {
      queryClient.setQueriesData<unknown>(
        {
          predicate: (q) =>
            JSON.stringify(q.queryKey).toLowerCase().includes("article"),
        },
        (cached : any) => applyLikePatch(cached, articleId, { likes, isLiked })
      );
    },

    // ── Step 3: roll back on network/server error ──────────────────────────
    onError: (_err, _articleId, context) => {
      context?.snapshots?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error("Could not update like. Please try again.");
    },

    // ── No onSettled / invalidateQueries ─────────────────────────────────
    // Invalidating would trigger a background refetch that temporarily resets
    // isLiked to the pre-click value, causing the red→white→red flicker.
    // The onSuccess reconcile above keeps the cache accurate without a round-trip.
  });
}